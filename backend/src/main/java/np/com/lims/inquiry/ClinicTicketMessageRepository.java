package np.com.lims.inquiry;

import np.com.lims.inquiry.entity.ClinicTicketMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClinicTicketMessageRepository extends JpaRepository<ClinicTicketMessage, Long> {

    @Query("SELECT m FROM ClinicTicketMessage m WHERE m.ticket.id = :ticketId ORDER BY m.createdAt ASC")
    List<ClinicTicketMessage> findAllForPlatform(@Param("ticketId") Long ticketId);

    @Query("SELECT m FROM ClinicTicketMessage m WHERE m.ticket.id = :ticketId AND m.internalNote = false ORDER BY m.createdAt ASC")
    List<ClinicTicketMessage> findAllForClinic(@Param("ticketId") Long ticketId);
}
