package np.com.lims.result.comment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.department.entity.Department;

@Entity
@Table(name = "result_comment_template")
public class ResultCommentTemplate extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CommentScope scope = CommentScope.GLOBAL;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lab_test_id")
    private LabTest test;

    @Column(length = 60)
    private String category;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active = true;

    protected ResultCommentTemplate() {
    }

    public void update(CommentScope scope, Department department, LabTest test, String category,
                       String title, String body, int displayOrder, boolean active) {
        this.scope = scope == null ? CommentScope.GLOBAL : scope;
        this.department = this.scope == CommentScope.DEPARTMENT ? department : null;
        this.test = this.scope == CommentScope.TEST ? test : null;
        this.category = category;
        this.title = title;
        this.body = body;
        this.displayOrder = displayOrder;
        this.active = active;
    }

    public static ResultCommentTemplate create() {
        return new ResultCommentTemplate();
    }

    public CommentScope getScope() { return scope; }
    public Department getDepartment() { return department; }
    public LabTest getTest() { return test; }
    public String getCategory() { return category; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isActive() { return active; }
}
