package np.com.lims.patientimport;

import np.com.lims.patientimport.entity.ImportJobStatus;
import np.com.lims.patientimport.entity.PatientImportJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PatientImportJobRepository extends JpaRepository<PatientImportJob, Long> {

    /** The history list. Scoped explicitly because it is also read outside a tenant-filtered request. */
    @Query("SELECT j FROM PatientImportJob j WHERE j.organizationId = :orgId ORDER BY j.createdAt DESC")
    Page<PatientImportJob> history(@Param("orgId") Long orgId, Pageable pageable);

    @Query("SELECT j FROM PatientImportJob j WHERE j.id = :id AND j.organizationId = :orgId")
    Optional<PatientImportJob> findOwned(@Param("id") Long id, @Param("orgId") Long orgId);

    /**
     * Jobs this worker should pick up, which is any of three things:
     *
     * <ul>
     *   <li>unclaimed — nobody has started it;</li>
     *   <li>already claimed by this same worker — a long import does a bounded amount of work per
     *       tick and then comes back for more, so it must be able to re-take its own lease. Without
     *       this it would hold a lease nobody could act on and stall until the lease expired;</li>
     *   <li>claimed by a worker that has stopped saying so — this is how a server killed mid-import
     *       gets resumed instead of leaving the job stuck for good.</li>
     * </ul>
     *
     * <p>Deliberately NOT tenant-scoped: the worker serves every clinic, which is why it reads the
     * organization off the job it picks and sets the tenant context from that.
     */
    @Query("""
            SELECT j FROM PatientImportJob j
            WHERE j.status IN :statuses
              AND (j.claimedBy IS NULL
                   OR j.claimedBy = :worker
                   OR j.heartbeatAt IS NULL
                   OR j.heartbeatAt < :staleBefore)
            ORDER BY j.createdAt ASC
            """)
    List<PatientImportJob> findClaimable(@Param("statuses") List<ImportJobStatus> statuses,
                                         @Param("worker") String worker,
                                         @Param("staleBefore") Instant staleBefore,
                                         Pageable limit);

    /** An earlier upload of the same bytes by the same clinic — the usual shape of an accidental repeat. */
    @Query("""
            SELECT j FROM PatientImportJob j
            WHERE j.organizationId = :orgId AND j.fileChecksum = :checksum AND j.id <> :excludeId
            ORDER BY j.createdAt DESC
            """)
    List<PatientImportJob> findSameFile(@Param("orgId") Long orgId, @Param("checksum") String checksum,
                                        @Param("excludeId") Long excludeId, Pageable limit);

    /** Finished jobs whose uploaded file is still on disk and older than the retention window. */
    @Query("""
            SELECT j FROM PatientImportJob j
            WHERE j.fileDeletedAt IS NULL
              AND j.completedAt IS NOT NULL AND j.completedAt < :before
            """)
    List<PatientImportJob> findFilesToPurge(@Param("before") Instant before, Pageable limit);

    /** Whether this clinic already has an import running, so two cannot fight over the same patients. */
    @Query("""
            SELECT COUNT(j) FROM PatientImportJob j
            WHERE j.organizationId = :orgId AND j.status IN :statuses
            """)
    long countByStatus(@Param("orgId") Long orgId, @Param("statuses") List<ImportJobStatus> statuses);
}
