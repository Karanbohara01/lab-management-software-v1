package np.com.lims.patient.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import org.springframework.util.StringUtils;

/** Emergency contact, which for a minor is also the legal guardian. */
@Embeddable
public class EmergencyContact {

    @Column(name = "emergency_name", length = 120)
    private String name;

    @Column(name = "emergency_relationship", length = 40)
    private String relationship;

    @Column(name = "emergency_phone", length = 32)
    private String phone;

    @Column(name = "emergency_is_guardian", nullable = false)
    private boolean guardian;

    public EmergencyContact() {
    }

    public EmergencyContact(String name, String relationship, String phone, boolean guardian) {
        this.name = name;
        this.relationship = relationship;
        this.phone = phone;
        this.guardian = guardian;
    }

    public boolean isEmpty() {
        return !StringUtils.hasText(name) && !StringUtils.hasText(relationship) && !StringUtils.hasText(phone);
    }

    public String getName() {
        return name;
    }

    public String getRelationship() {
        return relationship;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isGuardian() {
        return guardian;
    }
}
