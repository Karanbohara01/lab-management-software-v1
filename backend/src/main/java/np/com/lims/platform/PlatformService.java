package np.com.lims.platform;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.platform.dto.PlatformDtos.CancelSubscriptionRequest;
import np.com.lims.platform.dto.PlatformDtos.ChangeOrganizationStatusRequest;
import np.com.lims.platform.dto.PlatformDtos.ChangeSubscriptionRequest;
import np.com.lims.platform.dto.PlatformDtos.CreateOrganizationRequest;
import np.com.lims.platform.dto.PlatformDtos.DashboardResponse;
import np.com.lims.platform.dto.PlatformDtos.IntegrationAdoption;
import np.com.lims.platform.dto.PlatformDtos.OrganizationDetail;
import np.com.lims.platform.dto.PlatformDtos.OrganizationListItem;
import np.com.lims.platform.dto.PlatformDtos.PlanDistributionPoint;
import np.com.lims.platform.dto.PlatformDtos.PlanDto;
import np.com.lims.platform.dto.PlatformDtos.PlatformSummary;
import np.com.lims.platform.dto.PlatformDtos.RecentClinic;
import np.com.lims.platform.dto.PlatformDtos.SignupPoint;
import np.com.lims.platform.dto.PlatformDtos.SubscriptionDto;
import np.com.lims.platform.dto.PlatformDtos.UpcomingRenewal;
import np.com.lims.platform.dto.PlatformDtos.UpdateOrganizationRequest;
import np.com.lims.platform.dto.PlatformDtos.UpsertPlanRequest;
import np.com.lims.platform.entity.Organization;
import np.com.lims.platform.entity.OrganizationStatus;
import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionPlan;
import np.com.lims.platform.entity.SubscriptionStatus;
import np.com.lims.rbac.entity.Role;
import np.com.lims.rbac.entity.RoleName;
import np.com.lims.rbac.repository.RoleRepository;
import np.com.lims.settings.LaboratoryProfileService;
import np.com.lims.user.entity.User;
import np.com.lims.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.List;

/**
 * Platform-level clinic (organization) and subscription registry. Creating an organization here
 * establishes a real tenant boundary — every table isolated so far (see
 * {@code np.com.lims.common.tenant.TenantContext}) keeps this clinic's data fully separate from
 * every other's — and provisions its own default {@link np.com.lims.settings.entity.LaboratoryProfile}
 * and first {@code LAB_ADMINISTRATOR} login in the same call, whether created by a platform admin
 * ({@link #create}) or by the clinic itself via the public signup flow ({@link #selfSignup}).
 * IRD/payment/SMS/WhatsApp credentials default to this deployment's shared configuration but each
 * clinic can override with its own from Settings → Laboratory profile.
 */
@Service
public class PlatformService {

    private static final String MODULE = "PLATFORM";

    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LaboratoryProfileService laboratoryProfileService;
    private final np.com.lims.catalog.ParameterMasterService parameterMasterService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final jakarta.persistence.EntityManager entityManager;

    public PlatformService(OrganizationRepository organizationRepository,
                           SubscriptionPlanRepository planRepository,
                           SubscriptionRepository subscriptionRepository,
                           LaboratoryProfileService laboratoryProfileService,
                           np.com.lims.catalog.ParameterMasterService parameterMasterService,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService,
                           jakarta.persistence.EntityManager entityManager) {
        this.organizationRepository = organizationRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.laboratoryProfileService = laboratoryProfileService;
        this.parameterMasterService = parameterMasterService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.entityManager = entityManager;
    }

    /**
     * Patient/user counts per organization, for the platform admin's cross-tenant view. Uses a
     * plain native SQL query, deliberately NOT a JPQL/Criteria query through the entity classes —
     * {@code Patient}/{@code User} both carry the {@code tenantFilter} Hibernate filter, which
     * (correctly, for every other caller) would silently restrict any entity-level query to only
     * the CALLING platform admin's own organization. Native SQL bypasses that filter entirely,
     * which is exactly what a genuinely cross-tenant admin read needs — every other query in this
     * codebase must stay entity-level precisely so the filter DOES apply; this is the one
     * deliberate, narrow exception, restricted to the platform module only.
     */
    @SuppressWarnings("unchecked")
    private Map<Long, long[]> usageCounts() {
        Map<Long, long[]> counts = new java.util.HashMap<>();
        List<Object[]> patientRows = entityManager
                .createNativeQuery("SELECT organization_id, COUNT(*) FROM patient GROUP BY organization_id")
                .getResultList();
        for (Object[] row : patientRows) {
            counts.computeIfAbsent(((Number) row[0]).longValue(), k -> new long[2])[0] = ((Number) row[1]).longValue();
        }
        List<Object[]> userRows = entityManager
                .createNativeQuery("SELECT organization_id, COUNT(*) FROM app_user GROUP BY organization_id")
                .getResultList();
        for (Object[] row : userRows) {
            counts.computeIfAbsent(((Number) row[0]).longValue(), k -> new long[2])[1] = ((Number) row[1]).longValue();
        }
        return counts;
    }

    /**
     * How many clinics have their own fully-configured payment/IRD/SMS credentials (as opposed to
     * relying on this deployment's shared application.yml fallback). Same native-SQL rationale as
     * {@link #usageCounts()} — these credential entities also carry the tenant filter.
     */
    private IntegrationAdoption integrationAdoption(long totalOrganizations) {
        long payment = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM payment_credentials WHERE " +
                        "(esewa_enabled = 1 AND esewa_merchant_code IS NOT NULL AND esewa_secret_key_enc IS NOT NULL) OR " +
                        "(khalti_enabled = 1 AND khalti_secret_key_enc IS NOT NULL)")
                .getSingleResult()).longValue();
        long ird = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM ird_credentials WHERE ird_enabled = 1 AND ird_username IS NOT NULL " +
                        "AND ird_password_enc IS NOT NULL AND ird_seller_pan IS NOT NULL")
                .getSingleResult()).longValue();
        long sms = ((Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM sms_credentials WHERE sms_enabled = 1 AND sms_from IS NOT NULL AND sms_token_enc IS NOT NULL")
                .getSingleResult()).longValue();
        return new IntegrationAdoption(totalOrganizations, payment, ird, sms);
    }

    // ===== summary ================================================

    @Transactional(readOnly = true)
    public PlatformSummary summary() {
        List<Organization> all = organizationRepository.findAll();
        long trial = all.stream().filter(o -> o.getStatus() == OrganizationStatus.TRIAL).count();
        long active = all.stream().filter(o -> o.getStatus() == OrganizationStatus.ACTIVE).count();
        long suspended = all.stream().filter(o -> o.getStatus() == OrganizationStatus.SUSPENDED).count();
        long activeSubs = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        long pastDue = subscriptionRepository.countByStatus(SubscriptionStatus.PAST_DUE);

        BigDecimal mrr = all.stream()
                .map(o -> subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(o.getId()).orElse(null))
                .filter(s -> s != null && s.getStatus().isBillable())
                .map(s -> s.getPlan().getPriceMonthly())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PlatformSummary(all.size(), trial, active, suspended, activeSubs, pastDue, mrr);
    }

    /**
     * Every figure here is a real count from real timestamps — no fabricated trend line, no
     * interpolation. On a young/small deployment several of these will legitimately be sparse or
     * empty (e.g. a signups chart with only 1-2 months of real data) — that's the honest picture,
     * not a bug to paper over with synthetic history.
     */
    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        List<Organization> all = organizationRepository.findAll();
        Map<Long, Subscription> currentByOrgId = all.stream()
                .collect(java.util.stream.Collectors.toMap(Organization::getId,
                        o -> subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(o.getId()).orElse(null),
                        (a, b) -> a));

        // Real monthly signup counts for the last 6 months, oldest first.
        java.time.YearMonth thisMonth = java.time.YearMonth.now(java.time.ZoneOffset.UTC);
        List<SignupPoint> signups = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            java.time.YearMonth ym = thisMonth.minusMonths(i);
            long count = all.stream()
                    .filter(o -> java.time.YearMonth.from(o.getCreatedAt().atZone(java.time.ZoneOffset.UTC)).equals(ym))
                    .count();
            signups.add(new SignupPoint(ym.toString(), count));
        }

        List<PlanDistributionPoint> planDistribution = currentByOrgId.values().stream()
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.groupingBy(s -> s.getPlan(), java.util.stream.Collectors.counting()))
                .entrySet().stream()
                .map(e -> new PlanDistributionPoint(e.getKey().getCode(), e.getKey().getName(), e.getValue()))
                .sorted(java.util.Comparator.comparing(PlanDistributionPoint::planCode))
                .toList();

        Instant now = Instant.now();
        Instant in30Days = now.plus(java.time.Duration.ofDays(30));
        List<UpcomingRenewal> upcomingRenewals = all.stream()
                .map(o -> Map.entry(o, currentByOrgId.get(o.getId())))
                .filter(e -> e.getValue() != null && e.getValue().getCurrentPeriodEnd() != null
                        && e.getValue().getStatus().isBillable()
                        && !e.getValue().getCurrentPeriodEnd().isBefore(now)
                        && e.getValue().getCurrentPeriodEnd().isBefore(in30Days))
                .sorted(java.util.Comparator.comparing(e -> e.getValue().getCurrentPeriodEnd()))
                .map(e -> new UpcomingRenewal(e.getKey().getId(), e.getKey().getName(), e.getValue().getPlan().getName(),
                        e.getValue().getStatus(), e.getValue().getCurrentPeriodEnd()))
                .toList();

        List<RecentClinic> recentClinics = all.stream()
                .sorted(java.util.Comparator.comparing(Organization::getCreatedAt).reversed())
                .limit(5)
                .map(o -> RecentClinic.from(o, currentByOrgId.get(o.getId())))
                .toList();

        IntegrationAdoption adoption = integrationAdoption(all.size());

        return new DashboardResponse(signups, planDistribution, upcomingRenewals, recentClinics, adoption);
    }

    // ===== plans ===================================================

    @Transactional(readOnly = true)
    public List<PlanDto> plans() {
        return planRepository.findAllByOrderByDisplayOrderAsc().stream().map(PlanDto::from).toList();
    }

    @Transactional
    public PlanDto upsertPlan(UpsertPlanRequest request) {
        SubscriptionPlan plan = planRepository.findByCodeIgnoreCase(request.code()).orElse(null);
        if (plan == null) {
            plan = SubscriptionPlan.create(request.code().trim().toUpperCase(), request.name().trim(),
                    request.priceMonthly(), request.maxUsers(), request.maxBranches(),
                    trimToNull(request.description()), request.displayOrder());
            plan = planRepository.save(plan);
            auditService.record(MODULE, "PLAN_CREATE", "SubscriptionPlan", plan.getId(),
                    "Created plan " + plan.getName(), null, PlanDto.from(plan));
        } else {
            plan.update(request.name().trim(), request.priceMonthly(), request.maxUsers(), request.maxBranches(),
                    trimToNull(request.description()), request.active(), request.displayOrder());
            auditService.record(MODULE, "PLAN_UPDATE", "SubscriptionPlan", plan.getId(),
                    "Updated plan " + plan.getName(), null, PlanDto.from(plan));
        }
        return PlanDto.from(plan);
    }

    // ===== organizations ============================================

    @Transactional(readOnly = true)
    public Page<OrganizationListItem> search(String query, Pageable pageable) {
        Map<Long, long[]> usage = usageCounts();
        return organizationRepository.search(trimToNull(query), pageable)
                .map(o -> {
                    long[] counts = usage.getOrDefault(o.getId(), new long[2]);
                    return OrganizationListItem.from(o, currentSubscription(o.getId()), counts[0], counts[1]);
                });
    }

    @Transactional(readOnly = true)
    public OrganizationDetail get(Long id) {
        Organization org = load(id);
        List<Subscription> history = subscriptionRepository.findByOrganizationIdOrderByStartedAtDesc(id);
        return OrganizationDetail.from(org, history);
    }

    /** How long a self-signed-up clinic's trial runs before its subscription needs a real plan. */
    private static final int SELF_SIGNUP_TRIAL_DAYS = 14;

    @Transactional
    public OrganizationDetail create(CreateOrganizationRequest request) {
        Provisioned p = provision(request, null);
        auditService.record(MODULE, "ORGANIZATION_CREATE", "Organization", p.organization().getId(),
                "Created clinic " + p.organization().getName() + " on plan " + p.plan().getName(), null,
                OrganizationDetail.from(p.organization(), List.of(p.subscription())));
        return get(p.organization().getId());
    }

    /**
     * The public, unauthenticated signup path — same provisioning as {@link #create}, but always
     * on a fixed {@value #SELF_SIGNUP_TRIAL_DAYS}-day trial (an admin-created clinic's trial is
     * left open-ended, since that path is typically a negotiated/sales-assisted onboarding).
     * Deliberately does NOT record the audit entry itself — {@code audit_log.organization_id} has
     * a foreign key to {@code organization.id}, and {@code AuditService.record} runs in its own
     * {@code REQUIRES_NEW} transaction (its own DB connection); writing an audit row that
     * references the brand-new organization while THIS transaction (which inserted that
     * organization) is still open makes the FK check block on this transaction's own uncommitted
     * row from a different connection — a guaranteed lock-wait timeout, confirmed live. The
     * caller ({@link np.com.lims.platform.web.PublicSignupController}) records the audit entry in
     * a second, separate call after this transaction has committed, once the organization row is
     * durably there for the FK check to see immediately.
     */
    @Transactional
    public OrganizationDetail selfSignup(CreateOrganizationRequest request) {
        Instant trialEnd = Instant.now().plus(SELF_SIGNUP_TRIAL_DAYS, java.time.temporal.ChronoUnit.DAYS);
        Provisioned p = provision(request, trialEnd);
        return get(p.organization().getId());
    }

    /**
     * Second half of self-signup — see {@link #selfSignup}'s javadoc for why this is a separate
     * transaction. Sets {@code TenantContext} explicitly (there is no authenticated operator on
     * this path for {@code TenantFilterInterceptor} to have set it from) and clears it straight
     * after, exactly the way it's normally set/cleared per-request by that interceptor.
     */
    @Transactional
    public void recordSelfSignupAudit(Long organizationId) {
        Organization org = load(organizationId);
        Subscription subscription = currentSubscription(organizationId);
        np.com.lims.common.tenant.TenantContext.set(organizationId);
        try {
            auditService.record(MODULE, "ORGANIZATION_SELF_SIGNUP", "Organization", organizationId,
                    "Clinic " + org.getName() + " self-signed-up"
                            + (subscription == null ? "" : " on plan " + subscription.getPlan().getName())
                            + " (" + SELF_SIGNUP_TRIAL_DAYS + "-day trial)", null, null);
        } finally {
            np.com.lims.common.tenant.TenantContext.clear();
        }
    }

    private record Provisioned(Organization organization, SubscriptionPlan plan, Subscription subscription) {
    }

    private Provisioned provision(CreateOrganizationRequest request, Instant trialPeriodEnd) {
        String slug = request.slug().trim().toLowerCase();
        if (organizationRepository.existsBySlugIgnoreCase(slug)) {
            throw ApiException.conflict("A clinic with slug \"" + slug + "\" already exists");
        }
        SubscriptionPlan plan = planRepository.findByCodeIgnoreCase(request.planCode())
                .orElseThrow(() -> ApiException.notFound("Subscription plan", request.planCode()));
        if (!plan.isActive()) {
            throw ApiException.conflict("Plan " + plan.getName() + " is not active and can't be offered to a new clinic");
        }

        Organization org = Organization.create(slug, request.name().trim());
        org.update(request.name().trim(), trimToNull(request.contactName()), trimToNull(request.contactEmail()),
                trimToNull(request.contactPhone()), trimToNull(request.city()), trimToNull(request.notes()));
        Organization saved = organizationRepository.save(org);

        Subscription subscription = Subscription.start(saved, plan, SubscriptionStatus.TRIALING, trialPeriodEnd,
                "Initial subscription on clinic creation");
        subscriptionRepository.save(subscription);
        laboratoryProfileService.ensureProvisioned(saved.getId(), saved.getName());
        parameterMasterService.seedDefaults(saved.getId());

        // No need to pre-check username uniqueness here: this new organization has no users yet,
        // and app_user's uniqueness is (organization_id, username) — a duplicate is only possible
        // within the SAME org, which the DB constraint itself enforces on save.
        Role adminRole = roleRepository.findByName(RoleName.LAB_ADMINISTRATOR)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "LAB_ADMINISTRATOR role is not seeded"));
        User adminUser = User.createForOrganization(saved.getId(), request.adminUsername().trim(),
                request.adminEmail().trim().toLowerCase(), passwordEncoder.encode(request.adminPassword()),
                request.adminFullName().trim(), null);
        adminUser.addRole(adminRole);
        userRepository.save(adminUser);

        return new Provisioned(saved, plan, subscription);
    }

    /** Active plans only, for the public pricing/signup page — never expose a deactivated plan there. */
    @Transactional(readOnly = true)
    public List<PlanDto> publicPlans() {
        return planRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(SubscriptionPlan::isActive)
                .map(PlanDto::from)
                .toList();
    }

    @Transactional
    public OrganizationDetail update(Long id, UpdateOrganizationRequest request) {
        Organization org = load(id);
        org.update(request.name().trim(), trimToNull(request.contactName()), trimToNull(request.contactEmail()),
                trimToNull(request.contactPhone()), trimToNull(request.city()), trimToNull(request.notes()));
        auditService.record(MODULE, "ORGANIZATION_UPDATE", "Organization", id,
                "Updated clinic " + org.getName(), null, null);
        return get(id);
    }

    @Transactional
    public OrganizationDetail changeStatus(Long id, ChangeOrganizationStatusRequest request) {
        Organization org = load(id);
        OrganizationStatus before = org.getStatus();
        org.setStatus(request.status());
        auditService.record(MODULE, "ORGANIZATION_STATUS_CHANGE", "Organization", id,
                "Changed clinic " + org.getName() + " status " + before + " -> " + request.status(), null, null);
        return get(id);
    }

    // ===== subscriptions ============================================

    @Transactional
    public SubscriptionDto changeSubscription(Long organizationId, ChangeSubscriptionRequest request) {
        Organization org = load(organizationId);
        SubscriptionPlan plan = planRepository.findByCodeIgnoreCase(request.planCode())
                .orElseThrow(() -> ApiException.notFound("Subscription plan", request.planCode()));

        Subscription current = subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(organizationId)
                .orElse(null);
        Subscription subscription;
        if (current != null && current.getStatus() != SubscriptionStatus.CANCELLED) {
            current.changePlan(plan);
            current.changeStatus(request.status());
            if (request.currentPeriodEnd() != null) {
                current.renewUntil(request.currentPeriodEnd());
                current.changeStatus(request.status());
            }
            subscription = current;
        } else {
            subscription = Subscription.start(org, plan, request.status(), request.currentPeriodEnd(),
                    trimToNull(request.note()));
            subscriptionRepository.save(subscription);
        }
        auditService.record(MODULE, "SUBSCRIPTION_CHANGE", "Organization", organizationId,
                "Set " + org.getName() + " to plan " + plan.getName() + " (" + request.status() + ")", null, null);
        return SubscriptionDto.from(subscription);
    }

    @Transactional
    public SubscriptionDto cancelSubscription(Long organizationId, CancelSubscriptionRequest request) {
        Organization org = load(organizationId);
        Subscription current = subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(organizationId)
                .orElseThrow(() -> ApiException.conflict("This clinic has no subscription to cancel"));
        current.cancel(request.reason().trim());
        auditService.record(MODULE, "SUBSCRIPTION_CANCEL", "Organization", organizationId,
                "Cancelled subscription for " + org.getName() + ": " + request.reason(), null, null);
        return SubscriptionDto.from(current);
    }

    // ===== helpers ===================================================

    private Subscription currentSubscription(Long organizationId) {
        return subscriptionRepository.findFirstByOrganizationIdOrderByStartedAtDesc(organizationId).orElse(null);
    }

    private Organization load(Long id) {
        return organizationRepository.findById(id).orElseThrow(() -> ApiException.notFound("Organization", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
