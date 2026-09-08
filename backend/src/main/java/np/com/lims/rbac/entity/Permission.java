package np.com.lims.rbac.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

@Entity
@Table(name = "permission")
public class Permission extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 64)
    private PermissionName name;

    @Column(name = "description", length = 255)
    private String description;

    protected Permission() {
    }

    public PermissionName getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
