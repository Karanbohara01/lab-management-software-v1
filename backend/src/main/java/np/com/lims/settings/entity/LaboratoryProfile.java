package np.com.lims.settings.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

/** Single-row entity (id = 1) holding the laboratory identity used on report letterheads. */
@Entity
@Table(name = "laboratory_profile")
public class LaboratoryProfile extends BaseEntity {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

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

    protected LaboratoryProfile() {
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

    public int getInventoryExpiryAlertDays() {
        return inventoryExpiryAlertDays;
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

    public Long getId() {
        return id;
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
