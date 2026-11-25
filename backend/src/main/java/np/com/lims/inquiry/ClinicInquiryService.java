package np.com.lims.inquiry;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.inquiry.dto.InquiryDtos.AddMessageRequest;
import np.com.lims.inquiry.dto.InquiryDtos.CreateTicketRequest;
import np.com.lims.inquiry.dto.InquiryDtos.TicketDetailDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketSummaryDto;
import np.com.lims.inquiry.dto.InquiryDtos.UnreadCountDto;
import np.com.lims.inquiry.entity.ClinicTicket;
import np.com.lims.inquiry.entity.ClinicTicketMessage;
import np.com.lims.inquiry.entity.TicketCategory;
import np.com.lims.inquiry.entity.TicketSenderType;
import np.com.lims.inquiry.entity.TicketStatus;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@Transactional
public class ClinicInquiryService {

    public static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

    private final ClinicTicketRepository ticketRepository;
    private final ClinicTicketMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SequenceService sequenceService;

    public ClinicInquiryService(ClinicTicketRepository ticketRepository,
                                ClinicTicketMessageRepository messageRepository,
                                UserRepository userRepository,
                                SequenceService sequenceService) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.sequenceService = sequenceService;
    }

    public TicketDetailDto createTicket(CreateTicketRequest req) {
        return createTicket(req, null);
    }

    public TicketDetailDto createTicket(CreateTicketRequest req, MultipartFile file) {
        Long orgId = TenantContext.require();
        Long userId = CurrentUser.userId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User", userId));

        String ticketNumber = sequenceService.nextGlobalFormatted("TICKET_NUMBER", "TCK-", 6);
        ClinicTicket ticket = ClinicTicket.create(ticketNumber, currentUser, req.subject(), req.category(), req.priority());
        ticket.setClinicHasUnread(false);
        ticket = ticketRepository.save(ticket);

        ClinicTicketMessage message = ClinicTicketMessage.create(ticket, currentUser, TicketSenderType.CLINIC, req.message(), false);
        attachFileIfPresent(message, file);
        ticket.addMessage(message);
        messageRepository.save(message);

        return TicketDetailDto.from(ticket, List.of(message));
    }

    @Transactional(readOnly = true)
    public Page<TicketSummaryDto> listTickets(TicketStatus status, Pageable pageable) {
        return listTickets(status, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<TicketSummaryDto> listTickets(TicketStatus status, TicketCategory category, String query, Pageable pageable) {
        Long orgId = TenantContext.require();
        String q = (query != null && !query.isBlank()) ? query.trim() : null;
        return ticketRepository.findByClinic(orgId, status, category, q, pageable).map(TicketSummaryDto::from);
    }

    public TicketDetailDto getTicket(Long id) {
        Long orgId = TenantContext.require();
        ClinicTicket ticket = ticketRepository.findByIdAndOrganization(id, orgId)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));

        if (ticket.isClinicHasUnread()) {
            ticket.setClinicHasUnread(false);
            ticketRepository.save(ticket);
        }

        List<ClinicTicketMessage> messages = messageRepository.findAllForClinic(id);
        return TicketDetailDto.from(ticket, messages);
    }

    public TicketDetailDto addReply(Long id, AddMessageRequest req) {
        return addReply(id, req, null);
    }

    public TicketDetailDto addReply(Long id, AddMessageRequest req, MultipartFile file) {
        Long orgId = TenantContext.require();
        ClinicTicket ticket = ticketRepository.findByIdAndOrganization(id, orgId)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));

        Long userId = CurrentUser.userId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User", userId));

        // Clinic replies can never be internal notes
        ClinicTicketMessage message = ClinicTicketMessage.create(ticket, currentUser, TicketSenderType.CLINIC, req.message(), false);
        attachFileIfPresent(message, file);
        ticket.addMessage(message);

        // If the ticket was waiting on the clinic or resolved, reopen it to OPEN
        if (ticket.getStatus() == TicketStatus.WAITING_ON_CLINIC || ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            ticket.reopen();
        }

        messageRepository.save(message);
        ticketRepository.save(ticket);

        List<ClinicTicketMessage> messages = messageRepository.findAllForClinic(id);
        return TicketDetailDto.from(ticket, messages);
    }

    public TicketDetailDto closeTicket(Long id) {
        Long orgId = TenantContext.require();
        ClinicTicket ticket = ticketRepository.findByIdAndOrganization(id, orgId)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));

        ticket.markClosed();
        ticketRepository.save(ticket);

        List<ClinicTicketMessage> messages = messageRepository.findAllForClinic(id);
        return TicketDetailDto.from(ticket, messages);
    }

    @Transactional(readOnly = true)
    public UnreadCountDto getUnreadCount() {
        Long orgId = TenantContext.require();
        long count = ticketRepository.countByOrganizationIdAndClinicHasUnreadTrue(orgId);
        return new UnreadCountDto(count);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getAttachment(Long ticketId, Long messageId, boolean inline) {
        Long orgId = TenantContext.require();
        ClinicTicket ticket = ticketRepository.findByIdAndOrganization(ticketId, orgId)
                .orElseThrow(() -> ApiException.notFound("Ticket", ticketId));

        ClinicTicketMessage msg = messageRepository.findById(messageId)
                .filter(m -> m.getTicket().getId().equals(ticket.getId()) && !m.isInternalNote())
                .orElseThrow(() -> ApiException.notFound("Message", messageId));

        if (!msg.hasAttachment()) {
            throw ApiException.notFound("Attachment", messageId);
        }

        return buildAttachmentResponse(msg, inline);
    }

    public static void attachFileIfPresent(ClinicTicketMessage message, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Attachment size exceeds 15 MB limit");
        }
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment");
        String contentType = file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        try {
            byte[] bytes = file.getBytes();
            message.setAttachment(originalName, contentType, file.getSize(), bytes);
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Failed to read attachment contents");
        }
    }

    public static ResponseEntity<Resource> buildAttachmentResponse(ClinicTicketMessage msg, boolean inline) {
        ByteArrayResource resource = new ByteArrayResource(msg.getFileData());
        String disposition = (inline ? "inline" : "attachment") + "; filename*=UTF-8''"
                + URLEncoder.encode(msg.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.parseMediaType(msg.getFileType() != null ? msg.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .contentLength(msg.getFileSizeBytes() != null ? msg.getFileSizeBytes() : msg.getFileData().length)
                .body(resource);
    }
}
