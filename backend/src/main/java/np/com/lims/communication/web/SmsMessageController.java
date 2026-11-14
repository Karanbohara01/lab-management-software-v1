package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.communication.SmsMessageService;
import np.com.lims.communication.SmsSendService;
import np.com.lims.communication.dto.CommunicationDtos.MessageResponse;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsRequest;
import np.com.lims.communication.dto.CommunicationDtos.SendSmsResponse;
import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsMessageStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/communication/messages")
public class SmsMessageController {

    private final SmsSendService sendService;
    private final SmsMessageService messageService;

    public SmsMessageController(SmsSendService sendService, SmsMessageService messageService) {
        this.sendService = sendService;
        this.messageService = messageService;
    }

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
    public SendSmsResponse send(@Valid @RequestBody SendSmsRequest request) {
        return sendService.send(request);
    }

    @PostMapping("/{id}/resend")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_SEND')")
    public SendSmsResponse resend(@PathVariable Long id) {
        return sendService.resend(id);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public PageResponse<MessageResponse> history(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) SmsCategory category,
            @RequestParam(required = false) SmsMessageStatus status,
            @RequestParam(required = false) Long campaignId,
            @RequestParam(required = false) String sentBy,
            Pageable pageable) {
        return messageService.history(from, to, patientId, phone, category, status, campaignId, sentBy, pageable);
    }

    @GetMapping("/by-patient/{patientId}")
    @PreAuthorize("hasAuthority('PERM_COMMUNICATION_READ')")
    public List<MessageResponse> forPatient(@PathVariable Long patientId) {
        return messageService.forPatient(patientId);
    }
}
