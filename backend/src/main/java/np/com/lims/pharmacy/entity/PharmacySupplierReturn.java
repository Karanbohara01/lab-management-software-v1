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
@Table(name = "pharmacy_supplier_return")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PharmacySupplierReturn extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(name = "debit_note_number", nullable = false, length = 60)
    private String debitNoteNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wholesaler_id", nullable = false)
    private PharmacyWholesaler wholesaler;

    @Column(name = "wholesaler_name", nullable = false, length = 160)
    private String wholesalerName;

    @Column(name = "return_date", nullable = false)
    private LocalDate returnDate = LocalDate.now();

    @Column(nullable = false, length = 60)
    private String reason;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "supplierReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PharmacySupplierReturnItem> items = new ArrayList<>();

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

    public String getDebitNoteNumber() {
        return debitNoteNumber;
    }

    public void setDebitNoteNumber(String debitNoteNumber) {
        this.debitNoteNumber = debitNoteNumber;
    }

    public PharmacyWholesaler getWholesaler() {
        return wholesaler;
    }

    public void setWholesaler(PharmacyWholesaler wholesaler) {
        this.wholesaler = wholesaler;
    }

    public String getWholesalerName() {
        return wholesalerName;
    }

    public void setWholesalerName(String wholesalerName) {
        this.wholesalerName = wholesalerName;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<PharmacySupplierReturnItem> getItems() {
        return items;
    }

    public void setItems(List<PharmacySupplierReturnItem> items) {
        this.items = items;
    }
}
