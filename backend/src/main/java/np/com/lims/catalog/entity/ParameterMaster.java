package np.com.lims.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;

/**
 * A clinic's own reusable analyte dictionary — pick "Haemoglobin" once here and every test's
 * parameter editor can prefill from it (unit, typical adult reference range, method, LOINC code),
 * rather than re-typing the same analyte's details from scratch on every test that includes it.
 * Deliberately NOT a live link to {@link TestParameter} — picking a preset copies its values onto
 * a NEW, independently-owned {@code TestParameter} row exactly once; editing this master entry
 * later does not retroactively change any test that already used it. Wiring an actual shared,
 * always-in-sync master (so one edit here updates every test at once) would mean
 * {@code TestParameter}/{@code ReferenceRange} referencing this table directly instead of owning
 * their own data — a much deeper change to the live result-entry/report pipeline, deliberately
 * out of scope here.
 */
@Entity
@Table(name = "parameter_master")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class ParameterMaster extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 32)
    private String code;

    @Column(length = 32)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 32)
    private ParameterDataType dataType = ParameterDataType.NUMERIC;

    @Column(name = "decimal_places")
    private Integer decimalPlaces;

    @Column(length = 120)
    private String method;

    @Column(name = "loinc_code", length = 20)
    private String loincCode;

    @Column(name = "group_heading", length = 120)
    private String groupHeading;

    /** Pipe-separated picklist for CATEGORICAL parameters — same convention as {@link TestParameter#getAllowedValues()}. */
    @Column(name = "allowed_values", length = 500)
    private String allowedValues;

    @Column(name = "low_value", precision = 14, scale = 4)
    private BigDecimal lowValue;

    @Column(name = "high_value", precision = 14, scale = 4)
    private BigDecimal highValue;

    @Column(name = "critical_low", precision = 14, scale = 4)
    private BigDecimal criticalLow;

    @Column(name = "critical_high", precision = 14, scale = 4)
    private BigDecimal criticalHigh;

    @Column(nullable = false)
    private boolean active = true;

    protected ParameterMaster() {
    }

    public static ParameterMaster create(String name) {
        ParameterMaster p = new ParameterMaster();
        p.name = name;
        p.active = true;
        return p;
    }

    /**
     * For provisioning a NEW organization's starter dictionary — same reason
     * {@code LaboratoryProfile.createDefault} and {@code User.createForOrganization} take an
     * explicit organization id instead of relying on {@link #assignTenant()}: whoever is doing
     * the provisioning (a platform admin, or nobody at all on the public self-signup path) is
     * acting on behalf of a DIFFERENT org than their own current tenant context, if any.
     */
    public static ParameterMaster createFor(Long organizationId, String name) {
        ParameterMaster p = create(name);
        p.organizationId = organizationId;
        return p;
    }

    public void update(String name, String code, String unit, ParameterDataType dataType, Integer decimalPlaces,
                       String method, String loincCode, String groupHeading, String allowedValues,
                       BigDecimal lowValue, BigDecimal highValue, BigDecimal criticalLow, BigDecimal criticalHigh) {
        this.name = name;
        this.code = code;
        this.unit = unit;
        this.dataType = dataType == null ? ParameterDataType.NUMERIC : dataType;
        this.decimalPlaces = decimalPlaces;
        this.method = method;
        this.loincCode = loincCode;
        this.groupHeading = groupHeading;
        this.allowedValues = allowedValues;
        this.lowValue = lowValue;
        this.highValue = highValue;
        this.criticalLow = criticalLow;
        this.criticalHigh = criticalHigh;
    }

    public void setActive(boolean active) {
        this.active = active;
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

    public String getName() {
        return name;
    }

    public String getCode() {
        return code;
    }

    public String getUnit() {
        return unit;
    }

    public ParameterDataType getDataType() {
        return dataType;
    }

    public Integer getDecimalPlaces() {
        return decimalPlaces;
    }

    public String getMethod() {
        return method;
    }

    public String getLoincCode() {
        return loincCode;
    }

    public String getGroupHeading() {
        return groupHeading;
    }

    public String getAllowedValues() {
        return allowedValues;
    }

    public BigDecimal getLowValue() {
        return lowValue;
    }

    public BigDecimal getHighValue() {
        return highValue;
    }

    public BigDecimal getCriticalLow() {
        return criticalLow;
    }

    public BigDecimal getCriticalHigh() {
        return criticalHigh;
    }

    public boolean isActive() {
        return active;
    }
}
