package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

/**
 * A clinic in the platform registry — a prospective or onboarded customer of this software as a
 * hosted product. This is a REGISTRY entity only: creating one here does not (yet) provision an
 * isolated dataset for it. Today's application data (patients, orders, results, invoices, users)
 * remains one shared pool; wiring a real per-organization deployment or data partition is a
 * separate, later step for each clinic once it's ready to actually go live.
 */
@Entity
@Table(name = "organization")
public class Organization extends BaseEntity {

    @Column(nullable = false, length = 64, unique = true)
    private String slug;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "contact_name", length = 160)
    private String contactName;

    @Column(name = "contact_email", length = 160)
    private String contactEmail;

    @Column(name = "contact_phone", length = 32)
    private String contactPhone;

    @Column(length = 120)
    private String city;

    /** The clinic's own PAN — used as the buyer PAN when the platform files a subscription invoice with IRD. */
    @Column(length = 20)
    private String pan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrganizationStatus status = OrganizationStatus.TRIAL;

    @Column(length = 1000)
    private String notes;

    protected Organization() {
    }

    public static Organization create(String slug, String name) {
        Organization o = new Organization();
        o.slug = slug;
        o.name = name;
        o.status = OrganizationStatus.TRIAL;
        return o;
    }

    public void update(String name, String contactName, String contactEmail, String contactPhone,
                       String city, String notes, String pan) {
        this.name = name;
        this.contactName = contactName;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.city = city;
        this.notes = notes;
        this.pan = pan;
    }

    public void setStatus(OrganizationStatus status) {
        this.status = status;
    }

    public String getSlug() {
        return slug;
    }

    public String getName() {
        return name;
    }

    public String getContactName() {
        return contactName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getCity() {
        return city;
    }

    public String getPan() {
        return pan;
    }

    public OrganizationStatus getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }
}
