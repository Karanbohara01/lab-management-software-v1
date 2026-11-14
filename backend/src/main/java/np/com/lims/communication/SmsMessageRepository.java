package np.com.lims.communication;

import np.com.lims.communication.entity.SmsCategory;
import np.com.lims.communication.entity.SmsMessage;
import np.com.lims.communication.entity.SmsMessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface SmsMessageRepository extends JpaRepository<SmsMessage, Long> {

    @Query("""
            SELECT m FROM SmsMessage m WHERE
            (:from IS NULL OR m.createdAt >= :from) AND
            (:to IS NULL OR m.createdAt <= :to) AND
            (:patientId IS NULL OR m.patientId = :patientId) AND
            (:phone IS NULL OR m.recipientPhone LIKE CONCAT('%', :phone, '%')) AND
            (:category IS NULL OR m.category = :category) AND
            (:status IS NULL OR m.status = :status) AND
            (:campaignId IS NULL OR m.campaign.id = :campaignId) AND
            (:sentBy IS NULL OR m.sentBy = :sentBy)
            ORDER BY m.createdAt DESC
            """)
    Page<SmsMessage> search(@Param("from") Instant from, @Param("to") Instant to, @Param("patientId") Long patientId,
                            @Param("phone") String phone, @Param("category") SmsCategory category,
                            @Param("status") SmsMessageStatus status, @Param("campaignId") Long campaignId,
                            @Param("sentBy") String sentBy, Pageable pageable);

    List<SmsMessage> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByStatus(SmsMessageStatus status);

    long countByCreatedAtAfter(Instant since);

    long countByAutomationRuleId(Long automationRuleId);

    long countByAutomationRuleIdAndStatus(Long automationRuleId, SmsMessageStatus status);

    @Query("SELECT COALESCE(SUM(m.segmentCount), 0) FROM SmsMessage m WHERE m.status <> 'FAILED' AND m.createdAt >= :since")
    long sumSegmentsSentSince(@Param("since") Instant since);

    @Query("SELECT COALESCE(SUM(m.segmentCount), 0) FROM SmsMessage m WHERE m.status <> 'FAILED'")
    long sumSegmentsSentAllTime();
}
