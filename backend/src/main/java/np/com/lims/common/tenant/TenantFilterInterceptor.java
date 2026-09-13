package np.com.lims.common.tenant;

import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.platform.OrganizationRepository;
import np.com.lims.platform.entity.OrganizationStatus;
import np.com.lims.security.AppUserDetails;
import org.hibernate.Session;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Resolves the authenticated user's organization and enables the Hibernate {@code tenantFilter}
 * for the request — the single place every tenant-scoped query gets its
 * {@code WHERE organization_id = ?} added, rather than relying on every repository method to add
 * it correctly by hand. Runs as an MVC {@code HandlerInterceptor} (not a servlet {@code Filter})
 * deliberately: by the time {@code preHandle} runs, both Spring Security (authentication) and
 * {@code OpenEntityManagerInViewFilter} (the request-bound {@link EntityManager}) have already
 * done their work, so the Hibernate {@link Session} obtained here is the same one every
 * repository call in this request will use.
 *
 * <p>Unauthenticated requests (login, public landing/verify endpoints) and platform-admin-only
 * endpoints under {@code /platform/**} are left with no tenant filter enabled — the platform
 * registry (Organization/Plan/Subscription) is deliberately NOT tenant-owned data.
 *
 * <p>Also the single enforcement point for {@link OrganizationStatus#SUSPENDED} (non-payment —
 * see {@code np.com.lims.platform.SubscriptionBillingService}): every request for a suspended
 * organization is rejected except its own {@code /billing/subscription/**} (so it can see and pay
 * its own bill) and {@code /auth/**} (so login/logout/refresh/"who am I" keep working — a
 * suspended clinic's admin must still be able to LOG IN to pay their way back in; blocking login
 * entirely, as an earlier version of this did, is a dead end). Checked per-request rather than
 * only at login specifically so it takes effect immediately, not after an already-issued access
 * token's own TTL expires.
 */
@Component
public class TenantFilterInterceptor implements HandlerInterceptor {

    private final EntityManager entityManager;
    private final OrganizationRepository organizationRepository;

    public TenantFilterInterceptor(EntityManager entityManager, OrganizationRepository organizationRepository) {
        this.entityManager = entityManager;
        this.organizationRepository = organizationRepository;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        Long organizationId = currentOrganizationId();
        if (organizationId != null) {
            assertNotSuspended(organizationId, request);
            TenantContext.set(organizationId);
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter("tenantFilter").setParameter("tenantId", organizationId);
        }
        return true;
    }

    private void assertNotSuspended(Long organizationId, HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.contains("/billing/subscription") || path.contains("/auth/")) {
            return;
        }
        organizationRepository.findById(organizationId).ifPresent(org -> {
            if (org.getStatus() == OrganizationStatus.SUSPENDED) {
                throw new ApiException(ErrorCode.SUBSCRIPTION_SUSPENDED,
                        "This clinic's account is suspended for non-payment. Pay the outstanding subscription "
                                + "invoice from Settings → Subscription & billing to reactivate.");
            }
        });
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                @NonNull Object handler, Exception ex) {
        TenantContext.clear();
    }

    private Long currentOrganizationId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AppUserDetails principal)) {
            return null;
        }
        return principal.getOrganizationId();
    }
}
