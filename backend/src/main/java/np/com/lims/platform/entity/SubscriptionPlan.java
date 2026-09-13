package np.com.lims.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;

import java.math.BigDecimal;

/** A pricing tier a clinic's subscription can be on. */
@Entity
@Table(name = "subscription_plan")
public class SubscriptionPlan extends BaseEntity {

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "price_monthly", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "max_branches", nullable = false)
    private int maxBranches;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected SubscriptionPlan() {
    }

    public static SubscriptionPlan create(String code, String name, BigDecimal priceMonthly,
                                          int maxUsers, int maxBranches, String description, int displayOrder) {
        SubscriptionPlan p = new SubscriptionPlan();
        p.code = code;
        p.name = name;
        p.priceMonthly = priceMonthly;
        p.maxUsers = maxUsers;
        p.maxBranches = maxBranches;
        p.description = description;
        p.displayOrder = displayOrder;
        p.active = true;
        return p;
    }

    public void update(String name, BigDecimal priceMonthly, int maxUsers, int maxBranches,
                       String description, boolean active, int displayOrder) {
        this.name = name;
        this.priceMonthly = priceMonthly;
        this.maxUsers = maxUsers;
        this.maxBranches = maxBranches;
        this.description = description;
        this.active = active;
        this.displayOrder = displayOrder;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPriceMonthly() {
        return priceMonthly;
    }

    public int getMaxUsers() {
        return maxUsers;
    }

    public int getMaxBranches() {
        return maxBranches;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
