package np.com.lims.inquiry;

import jakarta.persistence.EntityManager;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.inquiry.dto.InquiryDtos.AddMessageRequest;
import np.com.lims.inquiry.dto.InquiryDtos.PlatformTicketStatsDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketDetailDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketSummaryDto;
import np.com.lims.inquiry.dto.InquiryDtos.UpdateTicketStatusRequest;
import np.com.lims.inquiry.entity.ClinicTicket;
import np.com.lims.inquiry.entity.ClinicTicketMessage;
import np.com.lims.inquiry.entity.TicketPriority;
import np.com.lims.inquiry.entity.TicketSenderType;
import np.com.lims.inquiry.entity.TicketStatus;
import np.com.lims.notification.NotificationService;
import np.com.lims.notification.entity.Notification;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.hibernate.Session;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional
public class PlatformInquiryService {

    private final ClinicTicketRepository ticketRepository;
    private final ClinicTicketMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    private final NotificationService notificationService;

    public PlatformInquiryService(ClinicTicketRepository ticketRepository,
                                  ClinicTicketMessageRepository messageRepository,
                                  UserRepository userRepository,
                                  EntityManager entityManager,
                                  NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
        this.notificationService = notificationService;
    }

    private void disableTenantFilterIfActive() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("tenantFilter") != null) {
            session.disableFilter("tenantFilter");
        }
    }

    @Transactional(readOnly = true)
    public Page<TicketSummaryDto> searchTickets(Long organizationId,
                                                TicketStatus status,
                                                TicketPriority priority,
                                                String query,
                                                Pageable pageable) {
        disableTenantFilterIfActive();
        String q = (query != null && !query.isBlank()) ? query.trim() : null;
        return ticketRepository.searchPlatform(organizationId, status, priority, q, pageable)
                .map(TicketSummaryDto::from);
    }

    @Transactional(readOnly = true)
    public TicketDetailDto getTicket(Long id) {
        disableTenantFilterIfActive();
        ClinicTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));
        List<ClinicTicketMessage> messages = messageRepository.findAllForPlatform(id);
        return TicketDetailDto.from(ticket, messages);
    }

    public TicketDetailDto addReply(Long id, AddMessageRequest req) {
        return addReply(id, req, null);
    }

    public TicketDetailDto addReply(Long id, AddMessageRequest req, MultipartFile file) {
        disableTenantFilterIfActive();
        ClinicTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));

        Long userId = CurrentUser.userId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User", userId));

        ClinicTicketMessage message = ClinicTicketMessage.create(
                ticket,
                currentUser,
                TicketSenderType.SUPERADMIN,
                req.message(),
                req.internalNote()
        );
        ClinicInquiryService.attachFileIfPresent(message, file);
        ticket.addMessage(message);

        // If it's a visible message to the clinic, mark the ticket as unread for the clinic and waiting on the clinic
        if (!req.internalNote()) {
            ticket.setClinicHasUnread(true);
            if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
                ticket.markWaitingOnClinic();
            }
            String snippet = req.message().length() > 95 ? req.message().substring(0, 92) + "..." : req.message();
            notificationService.publishForTenant(
                    ticket.getOrganizationId(),
                    Notification.Type.SUPPORT_INQUIRY,
                    Notification.Severity.INFO,
                    "Support Reply: " + ticket.getTicketNumber(),
                    snippet,
                    "/support/" + ticket.getId(),
                    null,
                    "ticket-reply-" + message.getId()
            );
        }

        messageRepository.save(message);
        ticketRepository.save(ticket);

        List<ClinicTicketMessage> messages = messageRepository.findAllForPlatform(id);
        return TicketDetailDto.from(ticket, messages);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getAttachment(Long ticketId, Long messageId, boolean inline) {
        disableTenantFilterIfActive();
        ClinicTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Ticket", ticketId));

        ClinicTicketMessage msg = messageRepository.findById(messageId)
                .filter(m -> m.getTicket().getId().equals(ticket.getId()))
                .orElseThrow(() -> ApiException.notFound("Message", messageId));

        if (!msg.hasAttachment()) {
            throw ApiException.notFound("Attachment", messageId);
        }

        return ClinicInquiryService.buildAttachmentResponse(msg, inline);
    }

    public TicketDetailDto updateStatus(Long id, UpdateTicketStatusRequest req) {
        disableTenantFilterIfActive();
        ClinicTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ticket", id));

        if (req.assignedToUserId() != null) {
            User assignee = userRepository.findById(req.assignedToUserId())
                    .orElseThrow(() -> ApiException.notFound("User", req.assignedToUserId()));
            ticket.assignTo(assignee);
        }

        if (req.priority() != null) {
            ticket.updatePriority(req.priority());
        }

        if (req.status() != null) {
            switch (req.status()) {
                case OPEN -> ticket.reopen();
                case IN_PROGRESS -> ticket.markInProgress(ticket.getAssignedToUser());
                case WAITING_ON_CLINIC -> ticket.markWaitingOnClinic();
                case RESOLVED -> ticket.markResolved();
                case CLOSED -> ticket.markClosed();
            }
        }

        ticketRepository.save(ticket);
        List<ClinicTicketMessage> messages = messageRepository.findAllForPlatform(id);
        return TicketDetailDto.from(ticket, messages);
    }

    @Transactional(readOnly = true)
    public PlatformTicketStatsDto getStats() {
        disableTenantFilterIfActive();
        long open = ticketRepository.countByStatus(TicketStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)
                + ticketRepository.countByStatus(TicketStatus.WAITING_ON_CLINIC);
        long urgent = ticketRepository.countByPriorityAndStatusNot(TicketPriority.URGENT, TicketStatus.CLOSED);
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED);
        long total = ticketRepository.count();

        return new PlatformTicketStatsDto(open, inProgress, urgent, resolved, total);
    }
}
