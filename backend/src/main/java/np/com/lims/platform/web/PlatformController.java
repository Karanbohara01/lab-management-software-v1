package np.com.lims.platform.web;

import jakarta.validation.Valid;
import np.com.lims.common.api.PageResponse;
import np.com.lims.ird.entity.IrdStatus;
import np.com.lims.platform.MasterCatalogService;
import np.com.lims.platform.PlatformIrdCredentialsService;
import np.com.lims.platform.PlatformIrdSubmissionService;
import np.com.lims.platform.PlatformService;
import np.com.lims.platform.SubscriptionBillingService;
import np.com.lims.platform.dto.MasterCatalogDtos;
import np.com.lims.platform.dto.PlatformBillingDtos.CancelInvoiceRequest;
import np.com.lims.platform.dto.PlatformBillingDtos.InvoiceListItem;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdConfigResponse;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdCredentialsResponse;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdCredentialsUpdateRequest;
import np.com.lims.platform.dto.PlatformBillingDtos.IrdSubmissionDetail;
import np.com.lims.platform.dto.PlatformBillingDtos.MarkManualRequest;
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
    private final MasterCatalogService masterCatalogService;
    private final PlatformIrdSubmissionService irdService;
    private final PlatformIrdCredentialsService irdCredentialsService;

    public PlatformController(PlatformService service, SubscriptionBillingService billingService,
                              MasterCatalogService masterCatalogService, PlatformIrdSubmissionService irdService,
                              PlatformIrdCredentialsService irdCredentialsService) {
        this.service = service;
        this.billingService = billingService;
        this.masterCatalogService = masterCatalogService;
        this.irdService = irdService;
        this.irdCredentialsService = irdCredentialsService;
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

    // ===== master lab test catalogue (curation) — clinic-facing browse/import lives on
    // MasterCatalogController under /catalog/master-tests, not here (needs TEST_CATALOG_* only,
    // not PERM_PLATFORM_MANAGE) ============================================================

    @GetMapping("/master-tests")
    public List<MasterCatalogDtos.ListItem> masterTests() {
        return masterCatalogService.listAll();
    }

    @GetMapping("/master-tests/{id}")
    public MasterCatalogDtos.Detail masterTest(@PathVariable Long id) {
        return masterCatalogService.get(id);
    }

    @PostMapping("/master-tests")
    @ResponseStatus(HttpStatus.CREATED)
    public MasterCatalogDtos.Detail createMasterTest(@Valid @RequestBody MasterCatalogDtos.UpsertRequest request) {
        return masterCatalogService.create(request);
    }

    @PutMapping("/master-tests/{id}")
    public MasterCatalogDtos.Detail updateMasterTest(@PathVariable Long id, @Valid @RequestBody MasterCatalogDtos.UpsertRequest request) {
        return masterCatalogService.update(id, request);
    }

    @PostMapping("/master-tests/{id}/active")
    public void setMasterTestActive(@PathVariable Long id, @RequestParam boolean active) {
        masterCatalogService.setActive(id, active);
    }

    // ===== subscription-invoice IRD/CBMS e-billing — what THIS deployment charges a clinic,
    // filed with IRD the same way a clinic files its own patient invoices (see np.com.lims.ird) ==

    @GetMapping("/billing/ird/config")
    public IrdConfigResponse irdConfig() {
        return irdService.config();
    }

    @GetMapping("/billing/ird/credentials")
    public IrdCredentialsResponse irdCredentials() {
        return irdCredentialsService.get();
    }

    @PutMapping("/billing/ird/credentials")
    public IrdCredentialsResponse updateIrdCredentials(@Valid @RequestBody IrdCredentialsUpdateRequest request) {
        return irdCredentialsService.update(request);
    }

    @GetMapping("/subscription-invoices")
    public PageResponse<InvoiceListItem> subscriptionInvoices(
            @RequestParam(required = false) IrdStatus irdStatus,
            @RequestParam(required = false) Long organizationId,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(irdService.list(irdStatus, organizationId, pageable));
    }

    @GetMapping("/subscription-invoices/{id}/ird")
    public IrdSubmissionDetail subscriptionInvoiceIrd(@PathVariable Long id) {
        return irdService.getByInvoice(id);
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/submit")
    public IrdSubmissionDetail submitIrd(@PathVariable Long submissionId) {
        return irdService.submit(submissionId);
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/retry")
    public IrdSubmissionDetail retryIrd(@PathVariable Long submissionId) {
        return irdService.retry(submissionId);
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/manual")
    public IrdSubmissionDetail markIrdManual(@PathVariable Long submissionId, @Valid @RequestBody MarkManualRequest request) {
        return irdService.markManual(submissionId, request.reference(), request.note());
    }

    @PostMapping("/subscription-invoices/{invoiceId}/cancel")
    public IrdSubmissionDetail cancelSubscriptionInvoice(@PathVariable Long invoiceId, @Valid @RequestBody CancelInvoiceRequest request) {
        return irdService.cancelInvoice(invoiceId, request.reason());
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/credit-note/submit")
    public IrdSubmissionDetail submitCreditNote(@PathVariable Long submissionId) {
        return irdService.submitCreditNote(submissionId);
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/credit-note/retry")
    public IrdSubmissionDetail retryCreditNote(@PathVariable Long submissionId) {
        return irdService.retryCreditNote(submissionId);
    }

    @PostMapping("/subscription-invoices/ird/{submissionId}/credit-note/manual")
    public IrdSubmissionDetail markCreditNoteManual(@PathVariable Long submissionId, @Valid @RequestBody MarkManualRequest request) {
        return irdService.markCreditNoteManual(submissionId, request.reference(), request.note());
    }
}
