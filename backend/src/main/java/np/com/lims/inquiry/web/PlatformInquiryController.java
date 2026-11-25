package np.com.lims.inquiry.web;

import jakarta.validation.Valid;
import np.com.lims.inquiry.PlatformInquiryService;
import np.com.lims.inquiry.dto.InquiryDtos.AddMessageRequest;
import np.com.lims.inquiry.dto.InquiryDtos.PlatformTicketStatsDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketDetailDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketSummaryDto;
import np.com.lims.inquiry.dto.InquiryDtos.UpdateTicketStatusRequest;
import np.com.lims.inquiry.entity.TicketPriority;
import np.com.lims.inquiry.entity.TicketStatus;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/platform/inquiries")
@PreAuthorize("hasAuthority('PERM_PLATFORM_MANAGE')")
public class PlatformInquiryController {

    private final PlatformInquiryService service;

    public PlatformInquiryController(PlatformInquiryService service) {
        this.service = service;
    }

    @GetMapping
    public Page<TicketSummaryDto> searchTickets(@RequestParam(required = false) Long organizationId,
                                                @RequestParam(required = false) TicketStatus status,
                                                @RequestParam(required = false) TicketPriority priority,
                                                @RequestParam(required = false) String query,
                                                @PageableDefault(size = 20) Pageable pageable) {
        return service.searchTickets(organizationId, status, priority, query, pageable);
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

    @PatchMapping("/{id}/status")
    public TicketDetailDto updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateTicketStatusRequest req) {
        return service.updateStatus(id, req);
    }

    @GetMapping("/stats")
    public PlatformTicketStatsDto getStats() {
        return service.getStats();
    }
}
