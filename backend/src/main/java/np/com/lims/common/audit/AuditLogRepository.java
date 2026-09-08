package np.com.lims.common.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:module IS NULL OR a.module = :module)
              AND (:actor IS NULL OR LOWER(a.actor) LIKE LOWER(CONCAT('%', :actor, '%')))
              AND (:entityType IS NULL OR a.entityType = :entityType)
              AND (:entityId IS NULL OR a.entityId = :entityId)
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt <= :to)
              AND (:search IS NULL OR LOWER(COALESCE(a.summary, '')) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<AuditLog> search(@Param("module") String module,
                          @Param("actor") String actor,
                          @Param("entityType") String entityType,
                          @Param("entityId") String entityId,
                          @Param("from") Instant from,
                          @Param("to") Instant to,
                          @Param("search") String search,
                          Pageable pageable);

    @Query("SELECT DISTINCT a.module FROM AuditLog a ORDER BY a.module")
    List<String> distinctModules();
}
