package np.com.lims.department.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

@Entity
@Table(name = "department")
public class Department extends BaseEntity {

    @Column(nullable = false, length = 24, unique = true)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    protected Department() {
    }

    public static Department create(String code, String name) {
        Department d = new Department();
        d.code = code;
        d.name = name;
        d.active = true;
        return d;
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }
}
