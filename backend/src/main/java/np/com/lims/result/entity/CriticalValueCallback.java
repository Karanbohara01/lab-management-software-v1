package np.com.lims.result.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.time.Instant;

/** A logged read-back notification of a critical result to the treating clinician / ward. */
@Entity
@Table(name = "critical_value_callback")
public class CriticalValueCallback extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "test_result_id", nullable = false)
    private TestResult result;

    @Column(name = "notified_name", length = 120)
    private String notifiedName;

    @Column(name = "notified_role", length = 60)
    private String notifiedRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "contact_method", nullable = false, length = 20)
    private ContactMethod contactMethod = ContactMethod.PHONE;

    @Column(name = "read_back_confirmed", nullable = false)
    private boolean readBackConfirmed;

    @Column(length = 500)
    private String remarks;

    @Column(nullable = false)
    private boolean waived;

    @Column(name = "waived_reason", length = 300)
    private String waivedReason;

    @Column(name = "notified_at", nullable = false)
    private Instant notifiedAt = Instant.now();

    protected CriticalValueCallback() {
    }

    public static CriticalValueCallback logged(TestResult result, String notifiedName, String notifiedRole,
                                               ContactMethod method, boolean readBack, String remarks) {
        CriticalValueCallback c = new CriticalValueCallback();
        c.result = result;
        c.notifiedName = notifiedName;
        c.notifiedRole = notifiedRole;
        c.contactMethod = method == null ? ContactMethod.PHONE : method;
        c.readBackConfirmed = readBack;
        c.remarks = remarks;
        c.notifiedAt = Instant.now();
        return c;
    }

    public static CriticalValueCallback waivedFor(TestResult result, String reason) {
        CriticalValueCallback c = new CriticalValueCallback();
        c.result = result;
        c.waived = true;
        c.waivedReason = reason;
        c.contactMethod = ContactMethod.OTHER;
        c.notifiedAt = Instant.now();
        return c;
    }

    public String getNotifiedName() { return notifiedName; }
    public String getNotifiedRole() { return notifiedRole; }
    public ContactMethod getContactMethod() { return contactMethod; }
    public boolean isReadBackConfirmed() { return readBackConfirmed; }
    public String getRemarks() { return remarks; }
    public boolean isWaived() { return waived; }
    public String getWaivedReason() { return waivedReason; }
    public Instant getNotifiedAt() { return notifiedAt; }
}
