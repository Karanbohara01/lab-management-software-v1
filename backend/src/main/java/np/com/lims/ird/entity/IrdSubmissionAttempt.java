package np.com.lims.ird.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/** Immutable record of one submission attempt (or manual/cancel action) against a bill. */
@Entity
@Table(name = "ird_submission_attempt")
public class IrdSubmissionAttempt {

    public enum Action { SUBMIT, RETRY, MANUAL, CANCEL, CREDIT_NOTE, CREDIT_NOTE_RETRY }

    /** What we did with the outbound request. */
    public enum RequestStatus { PREPARED, SENT, SKIPPED }

    public enum ResponseStatus { ACCEPTED, DUPLICATE, REJECTED, TRANSPORT_ERROR, NOT_APPLICABLE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private IrdSubmission submission;

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(nullable = false, length = 24)
    private Action action;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "request_status", nullable = false, length = 24)
    private RequestStatus requestStatus;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "response_status", length = 24)
    private ResponseStatus responseStatus;

    @Column(name = "provider_reference", length = 120)
    private String providerReference;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_snapshot")
    private String requestSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_snapshot")
    private String responseSnapshot;

    protected IrdSubmissionAttempt() {
    }

    IrdSubmissionAttempt(IrdSubmission submission, int attemptNo, Action action, RequestStatus requestStatus,
                         ResponseStatus responseStatus, String providerReference, String errorCode,
                         String errorMessage, String actor, String requestSnapshot, String responseSnapshot) {
        this.submission = submission;
        this.attemptNo = attemptNo;
        this.action = action;
        this.requestStatus = requestStatus;
        this.responseStatus = responseStatus;
        this.providerReference = providerReference;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.actor = actor;
        this.occurredAt = Instant.now();
        this.requestSnapshot = requestSnapshot;
        this.responseSnapshot = responseSnapshot;
    }

    void complete(RequestStatus requestStatus, ResponseStatus responseStatus, String providerReference,
                  String errorCode, String errorMessage, String responseSnapshot) {
        this.requestStatus = requestStatus;
        this.responseStatus = responseStatus;
        this.providerReference = providerReference;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.responseSnapshot = responseSnapshot;
    }

    public Long getId() {
        return id;
    }

    public int getAttemptNo() {
        return attemptNo;
    }

    public Action getAction() {
        return action;
    }

    public RequestStatus getRequestStatus() {
        return requestStatus;
    }

    public ResponseStatus getResponseStatus() {
        return responseStatus;
    }

    public String getProviderReference() {
        return providerReference;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public String getActor() {
        return actor;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }
}
