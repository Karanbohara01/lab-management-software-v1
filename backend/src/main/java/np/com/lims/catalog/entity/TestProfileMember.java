package np.com.lims.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "test_profile_member")
public class TestProfileMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_test_id", nullable = false)
    private LabTest profile;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "member_test_id", nullable = false)
    private LabTest member;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected TestProfileMember() {
    }

    TestProfileMember(LabTest profile, LabTest member, int displayOrder) {
        this.profile = profile;
        this.member = member;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public LabTest getMember() {
        return member;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
