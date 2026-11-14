package np.com.lims.settings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One named signature line printed on released reports — "Lab Technician", "Consultant
 * Pathologist", or whatever title a lab's own report sign-off actually uses. A lab configures as
 * many of these as its report layout needs, in print order, each with an optional pre-uploaded
 * signature image.
 */
@Entity
@Table(name = "report_signatory")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class ReportSignatory extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(name = "signature_data_uri", columnDefinition = "MEDIUMTEXT")
    private String signatureDataUri;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ReportSignatory() {
    }

    public static ReportSignatory create() {
        return new ReportSignatory();
    }

    public void update(String title, String signatureDataUri, int displayOrder) {
        this.title = title;
        this.signatureDataUri = signatureDataUri;
        this.displayOrder = displayOrder;
    }

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            organizationId = TenantContext.require();
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getTitle() {
        return title;
    }

    public String getSignatureDataUri() {
        return signatureDataUri;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
