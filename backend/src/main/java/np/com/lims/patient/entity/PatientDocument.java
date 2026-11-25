package np.com.lims.patient.entity;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patient_document")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class PatientDocument extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 40)
    private PatientDocumentType documentType;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "doctor_or_facility", length = 180)
    private String doctorOrFacility;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "file_data", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(name = "uploaded_by", nullable = false, length = 100)
    private String uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by", length = 100)
    private String deletedBy;

    protected PatientDocument() {
    }

    public static PatientDocument create(
            Patient patient,
            String title,
            PatientDocumentType documentType,
            LocalDate documentDate,
            String doctorOrFacility,
            String notes,
            String fileName,
            String fileType,
            long fileSizeBytes,
            byte[] fileData,
            String uploadedBy
    ) {
        PatientDocument doc = new PatientDocument();
        doc.organizationId = TenantContext.require();
        doc.patient = patient;
        doc.title = title;
        doc.documentType = documentType;
        doc.documentDate = documentDate;
        doc.doctorOrFacility = doctorOrFacility;
        doc.notes = notes;
        doc.fileName = fileName;
        doc.fileType = fileType;
        doc.fileSizeBytes = fileSizeBytes;
        doc.fileData = fileData;
        doc.uploadedBy = uploadedBy;
        doc.uploadedAt = Instant.now();
        doc.deleted = false;
        return doc;
    }

    @PrePersist
    void onPrePersist() {
        if (this.organizationId == null) {
            this.organizationId = TenantContext.require();
        }
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
    }

    public void softDelete(String user) {
        this.deleted = true;
        this.deletedAt = Instant.now();
        this.deletedBy = user;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public Patient getPatient() {
        return patient;
    }

    public String getTitle() {
        return title;
    }

    public PatientDocumentType getDocumentType() {
        return documentType;
    }

    public LocalDate getDocumentDate() {
        return documentDate;
    }

    public String getDoctorOrFacility() {
        return doctorOrFacility;
    }

    public String getNotes() {
        return notes;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public String getUploadedBy() {
        return uploadedBy;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public String getDeletedBy() {
        return deletedBy;
    }
}
