package np.com.lims.communication.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.communication.SmsCampaignService;
import np.com.lims.communication.dto.CommunicationDtos.CampaignConfirmRequest;
import np.com.lims.communication.dto.CommunicationDtos.CampaignCreateRequest;
import np.com.lims.communication.dto.CommunicationDtos.CampaignResponse;
import np.com.lims.communication.dto.CommunicationDtos.RecipientFilterRequest;
import np.com.lims.communication.dto.CommunicationDtos.RecipientPreviewResponse;
import np.com.lims.communication.dto.CommunicationDtos.RecipientResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/communication/campaigns")
@PreAuthorize("hasAuthority('PERM_COMMUNICATION_CAMPAIGN_MANAGE')")
public class SmsCampaignController {

    private final SmsCampaignService service;

    public SmsCampaignController(SmsCampaignService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<CampaignResponse> list(Pageable pageable) {
        return service.list(pageable);
    }

    @GetMapping("/{id}")
    public CampaignResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping("/{id}/recipients")
    public PageResponse<RecipientResponse> recipients(@PathVariable Long id, Pageable pageable) {
        return service.recipients(id, pageable);
    }

    @PostMapping("/preview")
    public RecipientPreviewResponse preview(@Valid @RequestBody PreviewRequest request) {
        return service.preview(request.recipientFilter(), request.messageBody());
    }

    @PostMapping
    public CampaignResponse create(@Valid @RequestBody CampaignCreateRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/confirm")
    public CampaignResponse confirm(@PathVariable Long id, @RequestBody(required = false) CampaignConfirmRequest request) {
        return service.confirm(id, request);
    }

    @PostMapping("/{id}/cancel")
    public CampaignResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    @PostMapping("/{id}/retry-failed")
    public CampaignResponse retryFailed(@PathVariable Long id) {
        return service.retryFailed(id);
    }

    public record PreviewRequest(RecipientFilterRequest recipientFilter, String messageBody) {
    }
}
