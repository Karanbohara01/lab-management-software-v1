package np.com.lims.patientimport;

import np.com.lims.patientimport.entity.ImportRowStatus;
import np.com.lims.patientimport.entity.PatientImportRow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatientImportRowRepository extends JpaRepository<PatientImportRow, Long> {

    @Query("SELECT r FROM PatientImportRow r WHERE r.jobId = :jobId AND r.status IN :statuses ORDER BY r.rowNumber")
    List<PatientImportRow> findBatch(@Param("jobId") Long jobId,
                                     @Param("statuses") List<ImportRowStatus> statuses,
                                     Pageable limit);

    @Query("SELECT r FROM PatientImportRow r WHERE r.jobId = :jobId AND r.status IN :statuses ORDER BY r.rowNumber")
    Page<PatientImportRow> findPage(@Param("jobId") Long jobId,
                                    @Param("statuses") List<ImportRowStatus> statuses,
                                    Pageable pageable);

    @Query("SELECT r FROM PatientImportRow r WHERE r.jobId = :jobId ORDER BY r.rowNumber")
    Page<PatientImportRow> findAllRows(@Param("jobId") Long jobId, Pageable pageable);

    /** Counts per status, for the preview and the progress screen, in one query rather than one per status. */
    @Query("SELECT r.status, COUNT(r) FROM PatientImportRow r WHERE r.jobId = :jobId GROUP BY r.status")
    List<Object[]> countByStatus(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(r) FROM PatientImportRow r WHERE r.jobId = :jobId AND r.status IN :statuses")
    long countIn(@Param("jobId") Long jobId, @Param("statuses") List<ImportRowStatus> statuses);

    /**
     * Rows that repeat a key already used by an earlier row of the same file. Returns the offending
     * row's id with the row number it repeats, so the whole within-file duplicate pass is one query
     * per key rather than a lookup per row.
     *
     * <p>The join is to the first row carrying each key: anything later is the duplicate. Rows the
     * database pass marked as possible matches take part on both sides — a repeat within the file is
     * a firmer fact than a resemblance to a record, and must still be caught.
     */
    @Query("""
            SELECT later.id, MIN(earlier.rowNumber)
            FROM PatientImportRow later
            JOIN PatientImportRow earlier
              ON earlier.jobId = later.jobId
             AND earlier.rowNumber < later.rowNumber
             AND earlier.status IN ('VALID', 'POSSIBLE_DUPLICATE')
            WHERE later.jobId = :jobId
              AND later.status IN ('VALID', 'POSSIBLE_DUPLICATE')
              AND later.dedupPhone IS NOT NULL
              AND earlier.dedupPhone = later.dedupPhone
            GROUP BY later.id
            """)
    List<Object[]> findRepeatedPhones(@Param("jobId") Long jobId);

    @Query("""
            SELECT later.id, MIN(earlier.rowNumber)
            FROM PatientImportRow later
            JOIN PatientImportRow earlier
              ON earlier.jobId = later.jobId
             AND earlier.rowNumber < later.rowNumber
             AND earlier.status IN ('VALID', 'POSSIBLE_DUPLICATE')
            WHERE later.jobId = :jobId
              AND later.status IN ('VALID', 'POSSIBLE_DUPLICATE')
              AND later.dedupExternalId IS NOT NULL
              AND earlier.dedupExternalId = later.dedupExternalId
            GROUP BY later.id
            """)
    List<Object[]> findRepeatedExternalIds(@Param("jobId") Long jobId);

    @Query("""
            SELECT later.id, MIN(earlier.rowNumber)
            FROM PatientImportRow later
            JOIN PatientImportRow earlier
              ON earlier.jobId = later.jobId
             AND earlier.rowNumber < later.rowNumber
             AND earlier.status IN ('VALID', 'POSSIBLE_DUPLICATE')
            WHERE later.jobId = :jobId
              AND later.status IN ('VALID', 'POSSIBLE_DUPLICATE')
              AND later.dedupNameKey IS NOT NULL
              AND later.dedupDob IS NOT NULL
              AND earlier.dedupNameKey = later.dedupNameKey
              AND earlier.dedupDob = later.dedupDob
            GROUP BY later.id
            """)
    List<Object[]> findRepeatedNameAndDob(@Param("jobId") Long jobId);

    /**
     * The next window of still-valid rows after a given line. Paged by row number rather than by
     * offset so the duplicate pass terminates: rows it flags stop being VALID, which would shift an
     * offset-based window under it.
     */
    @Query("""
            SELECT r FROM PatientImportRow r
            WHERE r.jobId = :jobId AND r.status = 'VALID' AND r.rowNumber > :afterRow
            ORDER BY r.rowNumber
            """)
    List<PatientImportRow> findValidAfter(@Param("jobId") Long jobId, @Param("afterRow") int afterRow, Pageable limit);

    @Modifying
    @Query("DELETE FROM PatientImportRow r WHERE r.jobId = :jobId")
    void deleteByJobId(@Param("jobId") Long jobId);

    /** Rows left unprocessed when an import was cancelled, so none is left looking pending forever. */
    @Modifying
    @Query("""
            UPDATE PatientImportRow r SET r.status = 'SKIPPED', r.errorMessage = :reason
            WHERE r.jobId = :jobId AND r.status IN :statuses
            """)
    int markRemaining(@Param("jobId") Long jobId, @Param("statuses") List<ImportRowStatus> statuses,
                      @Param("reason") String reason);
}
