package np.com.lims.sample.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.order.entity.LabOrderItem;

/** A single ordered test carried by a sample. One order item maps to exactly one sample item. */
@Entity
@Table(name = "sample_item")
public class SampleItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sample_id", nullable = false)
    private Sample sample;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_order_item_id", nullable = false)
    private LabOrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lab_test_id", nullable = false)
    private LabTest test;

    @Column(name = "test_code", nullable = false, length = 32)
    private String testCode;

    @Column(name = "test_name", nullable = false, length = 160)
    private String testName;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "department_name", nullable = false, length = 120)
    private String departmentName;

    protected SampleItem() {
    }

    SampleItem(Sample sample, LabOrderItem orderItem, LabTest performedTest) {
        this.sample = sample;
        this.orderItem = orderItem;
        this.test = performedTest;
        this.testCode = performedTest.getCode();
        this.testName = performedTest.getName();
        this.departmentId = performedTest.getDepartment().getId();
        this.departmentName = performedTest.getDepartment().getName();
    }

    public Sample getSample() {
        return sample;
    }

    public LabOrderItem getOrderItem() {
        return orderItem;
    }

    public LabTest getTest() {
        return test;
    }

    public String getTestCode() {
        return testCode;
    }

    public String getTestName() {
        return testName;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }
}
