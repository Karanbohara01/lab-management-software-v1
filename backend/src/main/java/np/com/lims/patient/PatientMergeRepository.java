package np.com.lims.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import np.com.lims.patient.entity.Patient;

/**
 * Native bulk operations for patient merge. Each repoint moves every child row
 * from the duplicate to the survivor and bumps the row's optimistic-lock version
 * and audit columns so downstream caches and the audit trail stay coherent.
 */
public interface PatientMergeRepository extends JpaRepository<Patient, Long> {

    @Query(value = "SELECT COUNT(*) FROM lab_order WHERE patient_id = :id", nativeQuery = true)
    long countLabOrders(@Param("id") long id);

    @Query(value = "SELECT COUNT(*) FROM sample WHERE patient_id = :id", nativeQuery = true)
    long countSamples(@Param("id") long id);

    @Query(value = "SELECT COUNT(*) FROM test_result WHERE patient_id = :id", nativeQuery = true)
    long countResults(@Param("id") long id);

    @Query(value = "SELECT COUNT(*) FROM report WHERE patient_id = :id", nativeQuery = true)
    long countReports(@Param("id") long id);

    @Query(value = "SELECT COUNT(*) FROM invoice WHERE patient_id = :id", nativeQuery = true)
    long countInvoices(@Param("id") long id);

    @Modifying
    @Query(value = """
            UPDATE lab_order SET patient_id = :survivor, version = version + 1,
                   updated_at = NOW(6), updated_by = :actor
            WHERE patient_id = :duplicate
            """, nativeQuery = true)
    int repointLabOrders(@Param("duplicate") long duplicate, @Param("survivor") long survivor, @Param("actor") String actor);

    @Modifying
    @Query(value = """
            UPDATE sample SET patient_id = :survivor, version = version + 1,
                   updated_at = NOW(6), updated_by = :actor
            WHERE patient_id = :duplicate
            """, nativeQuery = true)
    int repointSamples(@Param("duplicate") long duplicate, @Param("survivor") long survivor, @Param("actor") String actor);

    @Modifying
    @Query(value = """
            UPDATE test_result SET patient_id = :survivor, version = version + 1,
                   updated_at = NOW(6), updated_by = :actor
            WHERE patient_id = :duplicate
            """, nativeQuery = true)
    int repointResults(@Param("duplicate") long duplicate, @Param("survivor") long survivor, @Param("actor") String actor);

    @Modifying
    @Query(value = """
            UPDATE report SET patient_id = :survivor, version = version + 1,
                   updated_at = NOW(6), updated_by = :actor
            WHERE patient_id = :duplicate
            """, nativeQuery = true)
    int repointReports(@Param("duplicate") long duplicate, @Param("survivor") long survivor, @Param("actor") String actor);

    @Modifying
    @Query(value = """
            UPDATE invoice SET patient_id = :survivor, version = version + 1,
                   updated_at = NOW(6), updated_by = :actor
            WHERE patient_id = :duplicate
            """, nativeQuery = true)
    int repointInvoices(@Param("duplicate") long duplicate, @Param("survivor") long survivor, @Param("actor") String actor);
}
