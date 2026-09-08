package np.com.lims.result;

import np.com.lims.result.entity.ResultStatus;
import np.com.lims.result.entity.TestResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    boolean existsBySampleId(Long sampleId);

    long countByStatus(ResultStatus status);

    long countByHasCriticalTrueAndStatusNot(ResultStatus status);

    @Query("SELECT r.departmentName, COUNT(r) FROM TestResult r WHERE r.createdAt >= :from "
            + "GROUP BY r.departmentName ORDER BY COUNT(r) DESC")
    java.util.List<Object[]> countByDepartmentSince(@Param("from") java.time.Instant from);

    @Query("SELECT r.testName, COUNT(r) FROM TestResult r WHERE r.createdAt >= :from "
            + "GROUP BY r.testName ORDER BY COUNT(r) DESC")
    java.util.List<Object[]> topTestsSince(@Param("from") java.time.Instant from, Pageable pageable);

    @EntityGraph(attributePaths = {"patient", "values", "sample", "order"})
    Optional<TestResult> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"patient", "sample"})
    List<TestResult> findByOrderIdOrderByIdAsc(Long orderId);

    @EntityGraph(attributePaths = {"patient", "sample", "values"})
    List<TestResult> findByOrderIdAndStatusOrderByDepartmentNameAscIdAsc(Long orderId, ResultStatus status);

    @Query("""
            SELECT r FROM TestResult r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:departmentId IS NULL OR r.departmentId = :departmentId)
              AND (:sampleId IS NULL OR r.sample.id = :sampleId)
              AND (:orderId IS NULL OR r.order.id = :orderId)
              AND (:patientId IS NULL OR r.patient.id = :patientId)
              AND (:critical = FALSE OR r.hasCritical = TRUE)
              AND (:overdueOnly = FALSE OR (r.dueAt IS NOT NULL AND r.dueAt < CURRENT_TIMESTAMP
                   AND r.status <> np.com.lims.result.entity.ResultStatus.APPROVED))
              AND (:criticalPendingOnly = FALSE OR r.criticalAckRequired = TRUE)
              AND (:search IS NULL
                   OR LOWER(r.testName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.testCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(r.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<TestResult> search(@Param("status") ResultStatus status,
                            @Param("departmentId") Long departmentId,
                            @Param("sampleId") Long sampleId,
                            @Param("orderId") Long orderId,
                            @Param("patientId") Long patientId,
                            @Param("critical") boolean criticalOnly,
                            @Param("overdueOnly") boolean overdueOnly,
                            @Param("criticalPendingOnly") boolean criticalPendingOnly,
                            @Param("search") String search,
                            Pageable pageable);

    @Query("SELECT r.status AS status, COUNT(r) AS count FROM TestResult r "
            + "WHERE (:departmentId IS NULL OR r.departmentId = :departmentId) GROUP BY r.status")
    List<StatusCount> countByStatus(@Param("departmentId") Long departmentId);

    @Query("""
            SELECT COUNT(r) FROM TestResult r
            WHERE r.status <> np.com.lims.result.entity.ResultStatus.APPROVED
              AND r.dueAt IS NOT NULL AND r.dueAt < CURRENT_TIMESTAMP
              AND (:departmentId IS NULL OR r.departmentId = :departmentId)
            """)
    long countOverdue(@Param("departmentId") Long departmentId);

    @Query("""
            SELECT COUNT(r) FROM TestResult r
            WHERE r.criticalAckRequired = TRUE
              AND (:departmentId IS NULL OR r.departmentId = :departmentId)
            """)
    long countCriticalPending(@Param("departmentId") Long departmentId);

    /** The patient's most recent approved numeric value for the same test + parameter, for delta checks. */
    @Query("""
            SELECT rv.valueNumeric FROM ResultValue rv JOIN rv.result r
            WHERE r.patient.id = :patientId AND r.testId = :testId
              AND rv.parameterName = :parameterName
              AND r.status = np.com.lims.result.entity.ResultStatus.APPROVED
              AND r.id <> :excludeResultId
              AND rv.valueNumeric IS NOT NULL
            ORDER BY r.approvedAt DESC
            """)
    List<java.math.BigDecimal> previousNumericValues(@Param("patientId") Long patientId,
                                                     @Param("testId") Long testId,
                                                     @Param("parameterName") String parameterName,
                                                     @Param("excludeResultId") Long excludeResultId,
                                                     Pageable limit);

    interface StatusCount {
        ResultStatus getStatus();
        long getCount();
    }
}
