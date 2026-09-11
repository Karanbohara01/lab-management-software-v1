package np.com.lims.branch.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

/** A physical location (main lab, satellite lab, or collection-only center) run under one account. */
@Entity
@Table(name = "branch")
public class Branch extends BaseEntity {

    @Column(nullable = false, length = 24, unique = true)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "address_line", length = 300)
    private String addressLine;

    @Column(length = 120)
    private String city;

    @Column(length = 64)
    private String phone;

    @Column(length = 160)
    private String email;

    @Column(nullable = false)
    private boolean active = true;

    protected Branch() {
    }

    public static Branch create(String code, String name) {
        Branch b = new Branch();
        b.code = code;
        b.name = name;
        b.active = true;
        return b;
    }

    public void update(String name, String addressLine, String city, String phone, String email) {
        this.name = name;
        this.addressLine = addressLine;
        this.city = city;
        this.phone = phone;
        this.email = email;
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

    public boolean isActive() {
        return active;
    }
}
