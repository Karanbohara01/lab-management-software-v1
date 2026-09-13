package np.com.lims.common.tenant;

import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

/**
 * Closes a real gap in the Hibernate {@code tenantFilter}: filters apply to HQL/Criteria queries
 * (including Spring Data's derived/{@code @Query} finder methods), but NOT to a primary-key load
 * via {@code EntityManager.find()} — which is exactly what {@code JpaRepository.findById()} uses
 * under the hood when a repository has no custom {@code @Query} override. A bare
 * {@code repository.findById(id)} on a tenant-owned entity therefore returns the row regardless
 * of which organization it belongs to — confirmed live: {@code GET /audit-logs/{id}} leaked
 * another clinic's audit entry by numeric ID before this was found and fixed.
 *
 * <p>Use this to wrap any {@code findById} result for a tenant-owned entity:
 * <pre>{@code TenantGuard.owned(repository.findById(id), Branch::getOrganizationId).orElseThrow(...)}</pre>
 * Prefer, where practical, giving the repository its own {@code @Query}-based finder instead
 * (those are filtered correctly) — this is the fallback for the places that don't.
 */
public final class TenantGuard {

    private TenantGuard() {
    }

    public static <T> Optional<T> owned(Optional<T> found, Function<T, Long> organizationIdOf) {
        Long tenantId = TenantContext.get();
        if (tenantId == null) {
            // No tenant context (e.g. platform-admin-only paths) — nothing to guard against.
            return found;
        }
        return found.filter(entity -> Objects.equals(organizationIdOf.apply(entity), tenantId));
    }
}
