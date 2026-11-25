package np.com.lims.inquiry;

import np.com.lims.inquiry.entity.ClinicTicket;
import np.com.lims.inquiry.entity.TicketCategory;
import np.com.lims.inquiry.entity.TicketPriority;
import np.com.lims.inquiry.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClinicTicketRepository extends JpaRepository<ClinicTicket, Long> {

    @Query("SELECT t FROM ClinicTicket t " +
           "WHERE t.organizationId = :orgId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:category IS NULL OR t.category = :category) " +
           "AND (:query IS NULL OR LOWER(t.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY t.lastReplyAt DESC")
    Page<ClinicTicket> findByClinic(@Param("orgId") Long orgId,
                                    @Param("status") TicketStatus status,
                                    @Param("category") TicketCategory category,
                                    @Param("query") String query,
                                    Pageable pageable);

    @Query("SELECT t FROM ClinicTicket t WHERE t.id = :id AND t.organizationId = :orgId")
    Optional<ClinicTicket> findByIdAndOrganization(@Param("id") Long id, @Param("orgId") Long orgId);

    // Platform Superadmin queries (across all clinics)
    @Query("SELECT t FROM ClinicTicket t " +
           "WHERE (:orgId IS NULL OR t.organizationId = :orgId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority) " +
           "AND (:query IS NULL OR LOWER(t.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(t.ticketNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY t.lastReplyAt DESC")
    Page<ClinicTicket> searchPlatform(@Param("orgId") Long orgId,
                                      @Param("status") TicketStatus status,
                                      @Param("priority") TicketPriority priority,
                                      @Param("query") String query,
                                      Pageable pageable);

    long countByStatus(TicketStatus status);

    long countByPriorityAndStatusNot(TicketPriority priority, TicketStatus closedStatus);

    long countByOrganizationIdAndClinicHasUnreadTrue(Long organizationId);
}
