package np.com.lims.pharmacy.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacy_purchase")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacyPurchase extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "purchase_number", nullable = false, length = 60)
    private String purchaseNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "wholesaler_id", nullable = false)
    private PharmacyWholesaler wholesaler;

    @Column(name = "wholesaler_invoice_no", nullable = false, length = 80)
    private String wholesalerInvoiceNo;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "carrier_charges", nullable = false, precision = 12, scale = 2)
    private BigDecimal carrierCharges = BigDecimal.ZERO;

    @Column(name = "other_charges", nullable = false, precision = 12, scale = 2)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(name = "taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "non_taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal nonTaxableAmount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "net_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal netTotal = BigDecimal.ZERO;

    @Column(name = "payment_status", nullable = false, length = 30)
    private String paymentStatus = "UNPAID";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PharmacyPurchaseItem> items = new ArrayList<>();

    @PrePersist
    private void assignTenant() {
        if (organizationId == null) {
            Long tenant = TenantContext.get();
            this.organizationId = tenant != null ? tenant : 1L;
        }
    }

    public void addItem(PharmacyPurchaseItem item) {
        items.add(item);
        item.setPurchase(this);
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getPurchaseNumber() {
        return purchaseNumber;
    }

    public void setPurchaseNumber(String purchaseNumber) {
        this.purchaseNumber = purchaseNumber;
    }

    public PharmacyWholesaler getWholesaler() {
        return wholesaler;
    }

    public void setWholesaler(PharmacyWholesaler wholesaler) {
        this.wholesaler = wholesaler;
    }

    public String getWholesalerInvoiceNo() {
        return wholesalerInvoiceNo;
    }

    public void setWholesalerInvoiceNo(String wholesalerInvoiceNo) {
        this.wholesalerInvoiceNo = wholesalerInvoiceNo;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public LocalDate getReceivedDate() {
        return receivedDate;
    }

    public void setReceivedDate(LocalDate receivedDate) {
        this.receivedDate = receivedDate;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getCarrierCharges() {
        return carrierCharges;
    }

    public void setCarrierCharges(BigDecimal carrierCharges) {
        this.carrierCharges = carrierCharges;
    }

    public BigDecimal getOtherCharges() {
        return otherCharges;
    }

    public void setOtherCharges(BigDecimal otherCharges) {
        this.otherCharges = otherCharges;
    }

    public BigDecimal getTaxableAmount() {
        return taxableAmount;
    }

    public void setTaxableAmount(BigDecimal taxableAmount) {
        this.taxableAmount = taxableAmount;
    }

    public BigDecimal getNonTaxableAmount() {
        return nonTaxableAmount;
    }

    public void setNonTaxableAmount(BigDecimal nonTaxableAmount) {
        this.nonTaxableAmount = nonTaxableAmount;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getNetTotal() {
        return netTotal;
    }

    public void setNetTotal(BigDecimal netTotal) {
        this.netTotal = netTotal;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PharmacyPurchaseItem> getItems() {
        return items;
    }

    public void setItems(List<PharmacyPurchaseItem> items) {
        this.items = items;
    }
}
