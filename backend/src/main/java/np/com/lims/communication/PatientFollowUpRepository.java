package np.com.lims.communication;

import np.com.lims.communication.entity.FollowUpStatus;
import np.com.lims.communication.entity.PatientFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PatientFollowUpRepository extends JpaRepository<PatientFollowUp, Long> {

    List<PatientFollowUp> findByPatientIdOrderByDueDateDesc(Long patientId);

    List<PatientFollowUp> findByStatusAndDueDateLessThanEqualAndReminderSentAtIsNull(FollowUpStatus status, LocalDate dueDate);
}
