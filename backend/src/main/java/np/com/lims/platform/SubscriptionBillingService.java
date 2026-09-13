package np.com.lims.platform;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.messaging.gateway.SmsGateway;
import np.com.lims.messaging.gateway.WhatsAppGateway;
import np.com.lims.platform.billing.PlatformEsewaClient;
import np.com.lims.platform.dto.SubscriptionBillingDtos.InitiateCheckoutResponse;
import np.com.lims.platform.dto.SubscriptionBillingDtos.MySubscriptionResponse;
import np.com.lims.platform.dto.SubscriptionBillingDtos.SubscriptionInvoiceDto;
import np.com.lims.platform.entity.Organization;
import np.com.lims.platform.entity.OrganizationStatus;
import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionInvoice;
import np.com.lims.platform.entity.SubscriptionInvoiceStatus;
import np.com.lims.platform.entity.SubscriptionPlan;
import np.com.lims.platform.entity.SubscriptionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Recurring platform billing: what a clinic owes THIS deployment for its own subscription, as
 * opposed to {@code np.com.lims.billing}/{@code np.com.lims.payment}, which are entirely about a
 * clinic billing and collecting from ITS OWN patients. Three moving parts:
 * <ol>
 *   <li>{@link #generateDueInvoices()} — a daily sweep that issues the next period's invoice once
 *       a subscription's current period ends, regardless of whether the previous one was paid
 *       (non-payment is handled separately, by invoice status, not by withholding billing).</li>
 *   <li>{@link #processOverdue()} — a daily sweep marking unpaid invoices OVERDUE past their due
 *       date (and the subscription PAST_DUE), then suspending the organization itself
 *       ({@link OrganizationStatus#SUSPENDED}) after a further grace period of continued
 *       non-payment. Suspension is enforced at login (see {@code AuthService}) — an
 *       already-issued access token keeps working for up to its own TTL (30 minutes by default);
 *       that's an accepted trade-off of JWTs being stateless, not an oversight.</li>
 *   <li>{@link #initiateCheckout}/{@link #verifyCheckout} — the clinic admin's side: pay an open
 *       invoice via THIS deployment's own eSewa merchant account ({@link PlatformEsewaClient} —
 *       never the clinic's own, see that class's javadoc for why), verified server-to-server
 *       before anything is marked paid, exactly like {@code OnlinePaymentService} does for patient
 *       payments.</li>
 * </ol>
 */
@Service
public class SubscriptionBillingService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionBillingService.class);
    private static final String MODULE = "SUBSCRIPTION_BILLING";

    /** How long a billing period runs — a fixed 30 days, not calendar-month-aware, to keep every period the same length. */
    private static final int PERIOD_DAYS = 30;
    /** Grace after due_at before an unpaid invoice is marked OVERDUE and the subscription PAST_DUE. */
    private static final int PENDING_GRACE_DAYS = 3;
    /** Further grace after OVERDUE before the organization itself is suspended. */
    private static final int SUSPEND_GRACE_DAYS = 14;

    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final OrganizationRepository organizationRepository;
    private final PlatformEsewaClient esewaClient;
    private final SmsGateway smsGateway;
    private final WhatsAppGateway whatsAppGateway;
    private final AuditService auditService;
    private final String publicUrl;

    public SubscriptionBillingService(SubscriptionInvoiceRepository invoiceRepository,
                                      SubscriptionRepository subscriptionRepository,
                                      SubscriptionPlanRepository planRepository,
                                      OrganizationRepository organizationRepository,
                                      PlatformEsewaClient esewaClient,
                                      SmsGateway smsGateway,
                                      WhatsAppGateway whatsAppGateway,
                                      AuditService auditService,
                                      @org.springframework.beans.factory.annotation.Value("${lims.app.public-url}") String publicUrl) {
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.organizationRepository = organizationRepository;
        this.esewaClient = esewaClient;
        this.smsGateway = smsGateway;
        this.whatsAppGateway = whatsAppGateway;
        this.auditService = auditService;
        this.publicUrl = publicUrl;
    }

    // ===== clinic-facing ============================================

    @Transactional(readOnly = true)
    public MySubscriptionResponse mySubscription() {
        return MySubscriptionResponse.from(currentSubscription());
    }

    /**
     * Self-serve plan change — never applied immediately. Queued on the subscription and picked
     * up by the next billing-period rollover ({@link #generateDueInvoices()}), so it can never
     * retroactively change the price of a period already invoiced, and deliberately keeps this
     * simple (no proration) rather than getting mid-period crediting right in one pass.
     */
    @Transactional
    public MySubscriptionResponse requestPlanChange(String planCode) {
        Subscription sub = currentSubscription();
        SubscriptionPlan newPlan = planRepository.findByCodeIgnoreCase(planCode)
                .orElseThrow(() -> ApiException.notFound("Subscription plan", planCode));
        if (!newPlan.isActive()) {
            throw ApiException.conflict("Plan " + newPlan.getName() + " is not currently available.");
        }
        if (newPlan.getId().equals(sub.getPlan().getId())) {
            sub.cancelPendingPlanChange();
            subscriptionRepository.save(sub);
            return MySubscriptionResponse.from(sub);
        }
        sub.requestPlanChange(newPlan);
        subscriptionRepository.save(sub);
        auditService.record(MODULE, "PLAN_CHANGE_REQUESTED", "Subscription", sub.getId(),
                "Requested plan change to " + newPlan.getName() + ", effective next billing period", null, null);
        return MySubscriptionResponse.from(sub);
    }

    private Subscription currentSubscription() {
        return subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(TenantContext.require())
                .orElseThrow(() -> ApiException.notFound("Subscription", TenantContext.require()));
    }

    @Transactional(readOnly = true)
    public Page<SubscriptionInvoiceDto> myInvoices(Pageable pageable) {
        return invoiceRepository.findByOrganizationIdOrderByPeriodStartDesc(TenantContext.require(), pageable)
                .map(SubscriptionInvoiceDto::from);
    }

    @Transactional(readOnly = true)
    public SubscriptionInvoiceDto get(Long id) {
        return SubscriptionInvoiceDto.from(loadOwn(id));
    }

    @Transactional
    public InitiateCheckoutResponse initiateCheckout(Long invoiceId) {
        SubscriptionInvoice invoice = loadOwn(invoiceId);
        if (invoice.isSettled()) {
            throw ApiException.conflict("This invoice is already " + invoice.getStatus().name().toLowerCase() + " — nothing to pay.");
        }
        if (!esewaClient.isConfigured()) {
            return new InitiateCheckoutResponse(false, null, null,
                    "Online subscription payment is not available right now — contact support to pay this invoice.");
        }

        String transactionUuid = "SUBBILL-" + invoice.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
        String returnBase = trimTrailingSlash(publicUrl) + "/app/settings/billing/" + invoice.getId();
        PlatformEsewaClient.InitiateResult result = esewaClient.initiate(transactionUuid, invoice.getAmount(),
                returnBase + "?gatewayResult=success", returnBase + "?gatewayResult=failure");

        if (!result.success()) {
            auditService.record(MODULE, "CHECKOUT_INITIATE_FAILED", "SubscriptionInvoice", invoice.getId(),
                    "Failed to start subscription payment checkout: " + result.errorMessage(), null, null);
            return new InitiateCheckoutResponse(false, null, null, result.errorMessage());
        }

        invoice.recordCheckoutAttempt(transactionUuid);
        invoiceRepository.save(invoice);
        auditService.record(MODULE, "CHECKOUT_INITIATE", "SubscriptionInvoice", invoice.getId(),
                "Started subscription payment checkout for " + invoice.invoiceNumber() + ", amount " + invoice.getAmount(),
                null, null);
        return new InitiateCheckoutResponse(true, result.formAction(), result.formFields(), null);
    }

    @Transactional
    public SubscriptionInvoiceDto verifyCheckout(Long invoiceId) {
        SubscriptionInvoice invoice = loadOwn(invoiceId);
        if (invoice.isSettled()) {
            return SubscriptionInvoiceDto.from(invoice);
        }
        if (invoice.getPendingTransactionUuid() == null) {
            throw ApiException.conflict("No payment attempt has been started for this invoice yet.");
        }

        PlatformEsewaClient.VerifyResult result = esewaClient.verify(invoice.getPendingTransactionUuid(), invoice.getAmount());
        if (result.verified()) {
            invoice.markPaid("ESEWA " + (result.providerReference() != null ? result.providerReference() : invoice.getPendingTransactionUuid()));
            invoiceRepository.save(invoice);
            Subscription subscription = subscriptionRepository.findById(invoice.getSubscriptionId()).orElse(null);
            if (subscription != null) {
                subscription.renewUntil(invoice.getPeriodEnd());
                subscriptionRepository.save(subscription);
            }
            Organization org = organizationRepository.findById(invoice.getOrganizationId()).orElse(null);
            if (org != null && org.getStatus() == OrganizationStatus.SUSPENDED) {
                org.setStatus(OrganizationStatus.ACTIVE);
                organizationRepository.save(org);
            }
            auditService.record(MODULE, "CHECKOUT_VERIFIED", "SubscriptionInvoice", invoice.getId(),
                    "Subscription invoice " + invoice.invoiceNumber() + " paid, amount " + invoice.getAmount(), null, null);
        } else {
            auditService.record(MODULE, "CHECKOUT_VERIFY_FAILED", "SubscriptionInvoice", invoice.getId(),
                    "Subscription payment NOT verified: " + result.errorMessage(), null, null);
        }
        return SubscriptionInvoiceDto.from(invoice);
    }

    // ===== scheduled sweeps ==========================================

    /**
     * Runs daily. Two separate transactions ({@link #generateDueInvoices()} then
     * {@link #processOverdue()}) rather than one covering the whole sweep, so a failure marking
     * overdue invoices can never roll back invoices that were already successfully issued.
     */
    @Scheduled(cron = "${lims.billing.subscription-cron:0 30 2 * * *}")
    public void scheduledSweep() {
        runDailySweep();
    }

    public record SweepResult(int invoicesIssued, int invoicesOverdue, int organizationsSuspended) {
    }

    /** Also callable on demand by a platform admin ({@code POST /platform/billing/run-sweep}) — not just the cron. */
    public SweepResult runDailySweep() {
        int issued = generateDueInvoices();
        int[] overdue = processOverdue();
        log.info("Subscription billing sweep: {} invoice(s) issued, {} marked overdue, {} organization(s) suspended",
                issued, overdue[0], overdue[1]);
        return new SweepResult(issued, overdue[0], overdue[1]);
    }

    /** Package-private (not {@code private}) purely so a live smoke test can invoke it directly instead of waiting for the cron. */
    @Transactional
    int generateDueInvoices() {
        Instant now = Instant.now();
        int issued = 0;
        for (Organization org : organizationRepository.findAll()) {
            Subscription sub = subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(org.getId()).orElse(null);
            if (sub == null || sub.getStatus() == SubscriptionStatus.CANCELLED || sub.getCurrentPeriodEnd() == null) {
                continue;
            }
            if (sub.getCurrentPeriodEnd().isAfter(now)) {
                continue;
            }
            // Never double-issue for the same period if the sweep re-runs before extendPeriodOnly's
            // new end date takes effect on a re-read (defensive; shouldn't happen given the
            // extend-immediately design below, but a duplicate would be a real billing bug).
            boolean alreadyIssuedForThisPeriod = invoiceRepository.findByOrganizationIdAndStatus(org.getId(), SubscriptionInvoiceStatus.PENDING)
                    .stream().anyMatch(inv -> inv.getPeriodStart().equals(sub.getCurrentPeriodEnd()));
            if (alreadyIssuedForThisPeriod) {
                continue;
            }

            boolean planChanged = sub.applyPendingPlanChangeIfAny();
            if (planChanged) {
                auditService.record(MODULE, "PLAN_CHANGE_APPLIED", "Subscription", sub.getId(),
                        "Applied queued plan change to " + sub.getPlan().getName() + " for the new billing period", null, null);
            }

            Instant periodStart = sub.getCurrentPeriodEnd();
            Instant periodEnd = periodStart.plus(PERIOD_DAYS, ChronoUnit.DAYS);
            Instant dueAt = periodStart.plus(PENDING_GRACE_DAYS, ChronoUnit.DAYS);
            SubscriptionInvoice invoice = SubscriptionInvoice.issue(org.getId(), sub.getId(), sub.getPlan().getCode(),
                    sub.getPlan().getName(), sub.getPlan().getPriceMonthly(), periodStart, periodEnd, dueAt);
            invoiceRepository.save(invoice);
            sub.extendPeriodOnly(periodEnd);
            subscriptionRepository.save(sub);
            notify(org, "INVOICE_ISSUED", "Dear " + org.getName() + ", your LabOS subscription invoice "
                    + invoice.invoiceNumber() + " for NPR " + invoice.getAmount() + " is ready, due "
                    + dueAt.toString().substring(0, 10) + ". Pay: " + trimTrailingSlash(publicUrl)
                    + "/app/settings/billing/" + invoice.getId());
            issued++;
        }
        return issued;
    }

    /** @return {@code [overdueCount, suspendedCount]}. Package-private for the same reason as {@link #generateDueInvoices()}. */
    @Transactional
    int[] processOverdue() {
        Instant now = Instant.now();
        // dueAt already has PENDING_GRACE_DAYS baked in (set at issuance) — no further offset needed here.
        List<SubscriptionInvoice> nowOverdue = invoiceRepository.findByStatusAndDueAtBefore(SubscriptionInvoiceStatus.PENDING, now);
        int overdueCount = 0;
        for (SubscriptionInvoice invoice : nowOverdue) {
            invoice.markOverdue();
            invoiceRepository.save(invoice);
            subscriptionRepository.findById(invoice.getSubscriptionId()).ifPresent(sub -> {
                if (sub.getStatus() != SubscriptionStatus.CANCELLED) {
                    sub.changeStatus(SubscriptionStatus.PAST_DUE);
                    subscriptionRepository.save(sub);
                }
            });
            organizationRepository.findById(invoice.getOrganizationId()).ifPresent(org -> notify(org, "INVOICE_OVERDUE",
                    "Dear " + org.getName() + ", your LabOS subscription invoice " + invoice.invoiceNumber()
                            + " for NPR " + invoice.getAmount() + " is overdue. Pay within " + SUSPEND_GRACE_DAYS
                            + " days to avoid account suspension. Pay: " + trimTrailingSlash(publicUrl)
                            + "/app/settings/billing/" + invoice.getId()));
            overdueCount++;
        }

        Instant suspendCutoff = now.minus(SUSPEND_GRACE_DAYS, ChronoUnit.DAYS);
        List<SubscriptionInvoice> longOverdue = invoiceRepository.findByStatusAndDueAtBefore(SubscriptionInvoiceStatus.OVERDUE, suspendCutoff);
        int suspendedCount = 0;
        for (SubscriptionInvoice invoice : longOverdue) {
            Organization org = organizationRepository.findById(invoice.getOrganizationId()).orElse(null);
            if (org != null && org.getStatus() != OrganizationStatus.SUSPENDED) {
                org.setStatus(OrganizationStatus.SUSPENDED);
                organizationRepository.save(org);
                auditService.record(MODULE, "ORGANIZATION_SUSPENDED", "Organization", org.getId(),
                        "Suspended for non-payment — invoice " + invoice.invoiceNumber() + " overdue since "
                                + invoice.getDueAt(), null, null);
                notify(org, "ORGANIZATION_SUSPENDED", "Dear " + org.getName() + ", your LabOS account has been "
                        + "suspended due to non-payment of invoice " + invoice.invoiceNumber() + ". Pay now to "
                        + "reactivate: " + trimTrailingSlash(publicUrl) + "/app/settings/billing/" + invoice.getId());
                suspendedCount++;
            }
        }
        return new int[] {overdueCount, suspendedCount};
    }

    /**
     * Warns the clinic before/at each dunning step — the whole reason this exists: without it, a
     * clinic previously went from "everything fine" straight to a silent database-only suspension
     * with no warning at all (confirmed as a real gap when this billing engine first shipped).
     * Sent via SMS first, falling back to WhatsApp — never both, to avoid double-messaging over a
     * single event. Uses whichever gateway is configured for THIS deployment's own shared account
     * (no {@code TenantContext} is set during the scheduled sweep, so {@code resolve()} in each
     * gateway correctly falls back to the shared config rather than any clinic's own credentials —
     * this is the platform notifying the clinic, not the clinic messaging itself). Best-effort:
     * a failed or unconfigured send never fails the sweep, only gets logged/audited.
     */
    private void notify(Organization org, String event, String message) {
        String phone = org.getContactPhone();
        if (phone == null || phone.isBlank()) {
            log.warn("Subscription billing: no contact phone on file for organization {} ({}) — could not send {} notice",
                    org.getId(), org.getName(), event);
            return;
        }
        boolean sent;
        String errorMessage;
        if (smsGateway.isConfigured()) {
            SmsGateway.Result result = smsGateway.send(phone, message);
            sent = result.sent();
            errorMessage = result.errorMessage();
        } else if (whatsAppGateway.isConfigured()) {
            WhatsAppGateway.Result result = whatsAppGateway.send(phone, message);
            sent = result.sent();
            errorMessage = result.errorMessage();
        } else {
            log.warn("Subscription billing: neither SMS nor WhatsApp is configured — could not send {} notice to organization {}",
                    event, org.getId());
            return;
        }
        if (!sent) {
            log.warn("Subscription billing: {} notice failed for organization {}: {}", event, org.getId(), errorMessage);
        }
        auditService.record(MODULE, "DUNNING_NOTIFICATION", "Organization", org.getId(),
                event + " notice " + (sent ? "sent" : "failed") + " to " + org.getName(), null, null);
    }

    private SubscriptionInvoice loadOwn(Long id) {
        return invoiceRepository.findByIdAndOrganizationId(id, TenantContext.require())
                .orElseThrow(() -> ApiException.notFound("Subscription invoice", id));
    }

    private static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
