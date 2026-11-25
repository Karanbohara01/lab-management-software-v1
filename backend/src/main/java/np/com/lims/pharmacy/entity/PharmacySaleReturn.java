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
import np.com.lims.patient.entity.Patient;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacy_sale_return")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacySaleReturn extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "credit_note_number", nullable = false, length = 60)
    private String creditNoteNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private PharmacySale sale;

    @Column(name = "original_invoice_number", nullable = false, length = 60)
    private String originalInvoiceNumber;

    @Column(name = "customer_name", nullable = false, length = 160)
    private String customerName;

    @Column(name = "customer_phone", length = 40)
    private String customerPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "return_reason", nullable = false, length = 60)
    private String returnReason;

    @Column(name = "refund_method", nullable = false, length = 30)
    private String refundMethod = "CASH";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "non_taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal nonTaxableAmount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "net_refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netRefundAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "saleReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PharmacySaleReturnItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.organizationId == null) {
            Long tenant = TenantContext.get();
            this.organizationId = tenant != null ? tenant : 1L;
        }
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public String getCreditNoteNumber() {
        return creditNoteNumber;
    }

    public void setCreditNoteNumber(String creditNoteNumber) {
        this.creditNoteNumber = creditNoteNumber;
    }

    public PharmacySale getSale() {
        return sale;
    }

    public void setSale(PharmacySale sale) {
        this.sale = sale;
    }

    public String getOriginalInvoiceNumber() {
        return originalInvoiceNumber;
    }

    public void setOriginalInvoiceNumber(String originalInvoiceNumber) {
        this.originalInvoiceNumber = originalInvoiceNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public String getReturnReason() {
        return returnReason;
    }

    public void setReturnReason(String returnReason) {
        this.returnReason = returnReason;
    }

    public String getRefundMethod() {
        return refundMethod;
    }

    public void setRefundMethod(String refundMethod) {
        this.refundMethod = refundMethod;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
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

    public BigDecimal getNetRefundAmount() {
        return netRefundAmount;
    }

    public void setNetRefundAmount(BigDecimal netRefundAmount) {
        this.netRefundAmount = netRefundAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PharmacySaleReturnItem> getItems() {
        return items;
    }

    public void setItems(List<PharmacySaleReturnItem> items) {
        this.items = items;
    }
}
