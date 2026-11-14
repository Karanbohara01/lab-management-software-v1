package np.com.lims.appointment;

import np.com.lims.appointment.entity.Appointment;
import np.com.lims.appointment.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "branch", "items"})
    Optional<Appointment> findDetailedById(Long id);

    @Query("""
            SELECT a FROM Appointment a
            WHERE (:patientId IS NULL OR a.patient.id = :patientId)
              AND (:status IS NULL OR a.status = :status)
              AND (:branchId IS NULL OR a.branch.id = :branchId)
              AND (:doctorId IS NULL OR a.referringDoctor.id = :doctorId)
              AND (:scheduledFrom IS NULL OR a.scheduledAt >= :scheduledFrom)
              AND (:scheduledTo IS NULL OR a.scheduledAt < :scheduledTo)
              AND (:search IS NULL
                   OR LOWER(a.appointmentNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(a.patient.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(a.patient.mrn) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Appointment> search(@Param("patientId") Long patientId,
                             @Param("status") AppointmentStatus status,
                             @Param("branchId") Long branchId,
                             @Param("doctorId") Long doctorId,
                             @Param("scheduledFrom") Instant scheduledFrom,
                             @Param("scheduledTo") Instant scheduledTo,
                             @Param("search") String search,
                             Pageable pageable);

    List<Appointment> findByPatientIdOrderByScheduledAtDesc(Long patientId);

    long countByScheduledAtBetween(Instant from, Instant to);

    /** Appointments due within a window and not already settled — the reminder sweep's claim pool. */
    List<Appointment> findByStatusInAndScheduledAtBetweenAndReminderSentAtIsNull(
            List<AppointmentStatus> statuses, Instant from, Instant to);

    /** Communication Hub bulk-SMS recipient filter: patients with an upcoming, still-active appointment. */
    @Query("""
            SELECT DISTINCT a.patient FROM Appointment a
            WHERE a.status IN :statuses AND a.scheduledAt >= :from AND a.scheduledAt <= :to
              AND a.patient.active = TRUE AND a.patient.mergedIntoId IS NULL
              AND a.patient.phone IS NOT NULL AND a.patient.phone <> ''
            ORDER BY a.patient.id
            """)
    List<np.com.lims.patient.entity.Patient> findRecipientsWithUpcomingAppointment(
            @Param("statuses") List<AppointmentStatus> statuses, @Param("from") Instant from,
            @Param("to") Instant to, Pageable limit);
}
