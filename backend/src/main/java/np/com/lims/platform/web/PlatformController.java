package np.com.lims.platform.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.platform.PlatformService;
import np.com.lims.platform.SubscriptionBillingService;
import np.com.lims.platform.dto.PlatformDtos.CancelSubscriptionRequest;
import np.com.lims.platform.dto.PlatformDtos.ChangeOrganizationStatusRequest;
import np.com.lims.platform.dto.PlatformDtos.ChangeSubscriptionRequest;
import np.com.lims.platform.dto.PlatformDtos.CreateOrganizationRequest;
import np.com.lims.platform.dto.PlatformDtos.OrganizationDetail;
import np.com.lims.platform.dto.PlatformDtos.OrganizationListItem;
import np.com.lims.platform.dto.PlatformDtos.PlanDto;
import np.com.lims.platform.dto.PlatformDtos.PlatformSummary;
import np.com.lims.platform.dto.PlatformDtos.SubscriptionDto;
import np.com.lims.platform.dto.PlatformDtos.UpdateOrganizationRequest;
import np.com.lims.platform.dto.PlatformDtos.UpsertPlanRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/platform")
@PreAuthorize("hasAuthority('PERM_PLATFORM_MANAGE')")
public class PlatformController {

    private final PlatformService service;
    private final SubscriptionBillingService billingService;

    public PlatformController(PlatformService service, SubscriptionBillingService billingService) {
        this.service = service;
        this.billingService = billingService;
    }

    @PostMapping("/billing/run-sweep")
    public SubscriptionBillingService.SweepResult runBillingSweep() {
        return billingService.runDailySweep();
    }

    @GetMapping("/summary")
    public PlatformSummary summary() {
        return service.summary();
    }

    @GetMapping("/dashboard")
    public np.com.lims.platform.dto.PlatformDtos.DashboardResponse dashboard() {
        return service.dashboard();
    }

    @GetMapping("/plans")
    public List<PlanDto> plans() {
        return service.plans();
    }

    @PostMapping("/plans")
    public PlanDto upsertPlan(@Valid @RequestBody UpsertPlanRequest request) {
        return service.upsertPlan(request);
    }

    @GetMapping("/organizations")
    public PageResponse<OrganizationListItem> organizations(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(service.search(query, pageable));
    }

    @GetMapping("/organizations/{id}")
    public OrganizationDetail organization(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/organizations")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationDetail createOrganization(@Valid @RequestBody CreateOrganizationRequest request) {
        return service.create(request);
    }

    @PutMapping("/organizations/{id}")
    public OrganizationDetail updateOrganization(@PathVariable Long id, @Valid @RequestBody UpdateOrganizationRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/organizations/{id}/status")
    public OrganizationDetail changeStatus(@PathVariable Long id, @Valid @RequestBody ChangeOrganizationStatusRequest request) {
        return service.changeStatus(id, request);
    }

    @PostMapping("/organizations/{id}/subscription")
    public SubscriptionDto changeSubscription(@PathVariable Long id, @Valid @RequestBody ChangeSubscriptionRequest request) {
        return service.changeSubscription(id, request);
    }

    @PostMapping("/organizations/{id}/subscription/cancel")
    public SubscriptionDto cancelSubscription(@PathVariable Long id, @Valid @RequestBody CancelSubscriptionRequest request) {
        return service.cancelSubscription(id, request);
    }
}
