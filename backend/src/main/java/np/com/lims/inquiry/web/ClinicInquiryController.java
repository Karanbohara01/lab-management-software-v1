package np.com.lims.inquiry.web;

import jakarta.validation.Valid;
import np.com.lims.inquiry.ClinicInquiryService;
import np.com.lims.inquiry.dto.InquiryDtos.AddMessageRequest;
import np.com.lims.inquiry.dto.InquiryDtos.CreateTicketRequest;
import np.com.lims.inquiry.dto.InquiryDtos.TicketDetailDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketSummaryDto;
import np.com.lims.inquiry.dto.InquiryDtos.UnreadCountDto;
import np.com.lims.inquiry.entity.TicketCategory;
import np.com.lims.inquiry.entity.TicketStatus;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/inquiries")
public class ClinicInquiryController {

    private final ClinicInquiryService service;

    public ClinicInquiryController(ClinicInquiryService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDetailDto createTicketJson(@Valid @RequestBody CreateTicketRequest req) {
        return service.createTicket(req);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketDetailDto createTicketMultipart(
            @RequestPart("data") @Valid CreateTicketRequest req,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return service.createTicket(req, file);
    }

    @GetMapping
    public Page<TicketSummaryDto> listTickets(@RequestParam(required = false) TicketStatus status,
                                              @RequestParam(required = false) TicketCategory category,
                                              @RequestParam(required = false) String query,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return service.listTickets(status, category, query, pageable);
    }

    @GetMapping("/unread-count")
    public UnreadCountDto getUnreadCount() {
        return service.getUnreadCount();
    }

    @GetMapping("/{id}")
    public TicketDetailDto getTicket(@PathVariable Long id) {
        return service.getTicket(id);
    }

    @PostMapping(path = "/{id}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public TicketDetailDto addReplyJson(@PathVariable Long id, @Valid @RequestBody AddMessageRequest req) {
        return service.addReply(id, req);
    }

    @PostMapping(path = "/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TicketDetailDto addReplyMultipart(
            @PathVariable Long id,
            @RequestPart("data") @Valid AddMessageRequest req,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return service.addReply(id, req, file);
    }

    @GetMapping("/{ticketId}/messages/{messageId}/attachment")
    public ResponseEntity<Resource> getAttachment(
            @PathVariable Long ticketId,
            @PathVariable Long messageId,
            @RequestParam(name = "inline", defaultValue = "false") boolean inline) {
        return service.getAttachment(ticketId, messageId, inline);
    }

    @PatchMapping("/{id}/close")
    public TicketDetailDto closeTicket(@PathVariable Long id) {
        return service.closeTicket(id);
    }
}
