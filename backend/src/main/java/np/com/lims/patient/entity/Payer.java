package np.com.lims.patient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.time.LocalDate;

/** Who settles this patient's bills. Captured at registration, consumed by billing. */
@Embeddable
public class Payer {

    @Enumerated(EnumType.STRING)
    @Column(name = "payer_type", nullable = false, length = 20)
    private PayerType type = PayerType.SELF;

    @Column(name = "payer_name", length = 160)
    private String name;

    @Column(name = "payer_scheme", length = 120)
    private String scheme;

    @Column(name = "payer_member_id", length = 60)
    private String memberId;

    @Column(name = "payer_authorization", length = 60)
    private String authorization;

    @Column(name = "payer_valid_until")
    private LocalDate validUntil;

    @Column(name = "payer_note", length = 300)
    private String note;

    public Payer() {
    }

    public Payer(PayerType type, String name, String scheme, String memberId,
                 String authorization, LocalDate validUntil, String note) {
        this.type = type == null ? PayerType.SELF : type;
        this.name = name;
        this.scheme = scheme;
        this.memberId = memberId;
        this.authorization = authorization;
        this.validUntil = validUntil;
        this.note = note;
    }

    public boolean isThirdParty() {
        return type != PayerType.SELF;
    }

    public PayerType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public String getScheme() {
        return scheme;
    }

    public String getMemberId() {
        return memberId;
    }

    public String getAuthorization() {
        return authorization;
    }

    public LocalDate getValidUntil() {
        return validUntil;
    }

    public String getNote() {
        return note;
    }
}
