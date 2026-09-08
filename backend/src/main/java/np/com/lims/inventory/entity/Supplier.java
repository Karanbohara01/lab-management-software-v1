package np.com.lims.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

@Entity
@Table(name = "supplier")
public class Supplier extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "contact_person", length = 160)
    private String contactPerson;

    @Column(length = 48)
    private String phone;

    @Column(length = 160)
    private String email;

    @Column(length = 300)
    private String address;

    @Column(name = "pan_number", length = 40)
    private String panNumber;

    @Column(nullable = false)
    private boolean active = true;

    protected Supplier() {
    }

    public static Supplier create(String name) {
        Supplier s = new Supplier();
        s.name = name;
        s.active = true;
        return s;
    }

    public void update(String name, String contactPerson, String phone, String email, String address, String panNumber) {
        this.name = name;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.panNumber = panNumber;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getName() {
        return name;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getAddress() {
        return address;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public boolean isActive() {
        return active;
    }
}
