package np.com.lims.common.tenant;

/**
 * The organization (clinic/tenant) the current request is acting as — resolved once per request
 * from the authenticated user, in {@code TenantFilterInterceptor}, and read from two places:
 * <ol>
 *   <li>Entities' own {@code @PrePersist} hooks, to auto-stamp a new row's {@code organization_id}
 *       without every service having to remember to set it.</li>
 *   <li>Nowhere else, deliberately — READS are enforced by the Hibernate {@code tenantFilter}
 *       itself (enabled on the Hibernate session for the request), not by application code
 *       re-checking this value. That's what makes it safe to forget to add a
 *       {@code WHERE organization_id = ?} to a new query: the filter adds it for you.</li>
 * </ol>
 * A thread-local, not a request attribute, because entity listeners and repositories don't have
 * access to the {@code HttpServletRequest} — cleared at the end of every request by the
 * interceptor regardless of outcome, since servlet container threads are pooled and reused.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> CURRENT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Long organizationId) {
        CURRENT.set(organizationId);
    }

    public static Long get() {
        return CURRENT.get();
    }

    /** For code that must have a tenant to proceed (e.g. stamping a new tenant-owned row). */
    public static Long require() {
        Long id = CURRENT.get();
        if (id == null) {
            throw new IllegalStateException(
                    "No tenant context set — this operation requires an authenticated, organization-scoped request");
        }
        return id;
    }

    public static void clear() {
        CURRENT.remove();
    }
}
