package np.com.lims.settings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

/**
 * One row per organization — the laboratory identity used on that clinic's report letterheads,
 * billing settings, etc. Used to be a true singleton (fixed id=1, one row for the whole
 * installation); see migration V37 for the switch.
 */
@Entity
@Table(name = "laboratory_profile")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class LaboratoryProfile extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "address_line", length = 300)
    private String addressLine;

    @Column(length = 120)
    private String city;

    @Column(length = 64)
    private String phone;

    @Column(length = 160)
    private String email;

    @Column(name = "pan_number", length = 40)
    private String panNumber;

    @Column(name = "fiscal_year", nullable = false, length = 16)
    private String fiscalYear;

    @Column(name = "invoice_prefix", nullable = false, length = 16)
    private String invoicePrefix;

    @Column(name = "default_tax_rate", nullable = false, precision = 6, scale = 3)
    private java.math.BigDecimal defaultTaxRate = java.math.BigDecimal.ZERO;

    @Column(name = "inventory_expiry_alert_days", nullable = false)
    private int inventoryExpiryAlertDays = 30;

    @Column(name = "report_footer", length = 1000)
    private String reportFooter;

    @Column(name = "logo_data_uri", columnDefinition = "MEDIUMTEXT")
    private String logoDataUri;

    /** When true, a self-pay sample cannot be collected until its order is paid in full. */
    @Column(name = "require_payment_before_collection", nullable = false)
    private boolean requirePaymentBeforeCollection;

    /**
     * Some clinics print on pre-printed letterhead stationery (logo/name/address already
     * physically on the paper) and don't want the software repeating that block digitally —
     * independent per document type since a clinic's report and invoice paper stock commonly
     * differ. Defaults to {@code true} (current behavior: print the full digital letterhead).
     */
    @Column(name = "print_report_letterhead", nullable = false)
    private boolean printReportLetterhead = true;

    @Column(name = "print_invoice_letterhead", nullable = false)
    private boolean printInvoiceLetterhead = true;

    protected LaboratoryProfile() {
    }

    /**
     * Sensible defaults for a newly onboarded clinic that hasn't configured its own letterhead
     * yet. {@code organizationId} is set explicitly (rather than left to the usual
     * {@code TenantContext}-based {@code @PrePersist} stamp) because this is typically created by
     * a platform admin acting on behalf of a *different* organization than their own.
     */
    public static LaboratoryProfile createDefault(String name, Long organizationId) {
        LaboratoryProfile p = new LaboratoryProfile();
        p.organizationId = organizationId;
        p.name = name;
        p.fiscalYear = "2082/83";
        p.invoicePrefix = "INV";
        p.defaultTaxRate = java.math.BigDecimal.ZERO;
        p.inventoryExpiryAlertDays = 30;
        p.reportFooter = "This report is generated electronically. Results relate only to the sample "
                + "tested. Clinical correlation is advised.";
        return p;
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

    public void update(String name, String addressLine, String city, String phone, String email,
                       String panNumber, String reportFooter, String logoDataUri) {
        this.name = name;
        this.addressLine = addressLine;
        this.city = city;
        this.phone = phone;
        this.email = email;
        this.panNumber = panNumber;
        this.reportFooter = reportFooter;
        this.logoDataUri = logoDataUri;
    }

    public void updateBilling(String fiscalYear, String invoicePrefix, java.math.BigDecimal defaultTaxRate) {
        this.fiscalYear = fiscalYear;
        this.invoicePrefix = invoicePrefix;
        this.defaultTaxRate = defaultTaxRate == null ? java.math.BigDecimal.ZERO : defaultTaxRate;
    }

    public void updateInventory(int inventoryExpiryAlertDays) {
        this.inventoryExpiryAlertDays = Math.max(1, inventoryExpiryAlertDays);
    }

    public void updateOperations(boolean requirePaymentBeforeCollection) {
        this.requirePaymentBeforeCollection = requirePaymentBeforeCollection;
    }

    public void updatePrintSettings(boolean printReportLetterhead, boolean printInvoiceLetterhead) {
        this.printReportLetterhead = printReportLetterhead;
        this.printInvoiceLetterhead = printInvoiceLetterhead;
    }

    public boolean isPrintReportLetterhead() {
        return printReportLetterhead;
    }

    public boolean isPrintInvoiceLetterhead() {
        return printInvoiceLetterhead;
    }

    public int getInventoryExpiryAlertDays() {
        return inventoryExpiryAlertDays;
    }

    public boolean isRequirePaymentBeforeCollection() {
        return requirePaymentBeforeCollection;
    }

    public String getFiscalYear() {
        return fiscalYear;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public java.math.BigDecimal getDefaultTaxRate() {
        return defaultTaxRate;
    }

    public String getName() {
        return name;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public String getCity() {
        return city;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public String getReportFooter() {
        return reportFooter;
    }

    public String getLogoDataUri() {
        return logoDataUri;
    }
}
