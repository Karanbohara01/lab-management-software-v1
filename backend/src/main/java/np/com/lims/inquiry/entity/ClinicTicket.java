package np.com.lims.inquiry.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.platform.entity.Organization;
import np.com.lims.user.entity.User;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clinic_ticket")
@Filter(name = "tenantFilter", condition = "organization_id = :tenantId")
public class ClinicTicket extends BaseEntity {

    @Column(name = "organization_id", nullable = false, updatable = false)
    private Long organizationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id", insertable = false, updatable = false)
    private Organization organization;

    @Column(name = "ticket_number", nullable = false, length = 32, updatable = false)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_user_id")
    private User assignedToUser;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 40)
    private TicketCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "last_reply_at", nullable = false)
    private Instant lastReplyAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "clinic_has_unread", nullable = false)
    private boolean clinicHasUnread = false;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ClinicTicketMessage> messages = new ArrayList<>();

    protected ClinicTicket() {
    }

    public static ClinicTicket create(String ticketNumber,
                                      User createdByUser,
                                      String subject,
                                      TicketCategory category,
                                      TicketPriority priority) {
        ClinicTicket ticket = new ClinicTicket();
        ticket.ticketNumber = ticketNumber;
        ticket.createdByUser = createdByUser;
        ticket.organizationId = createdByUser.getOrganizationId();
        ticket.subject = subject.trim();
        ticket.category = category;
        ticket.priority = priority != null ? priority : TicketPriority.MEDIUM;
        ticket.status = TicketStatus.OPEN;
        ticket.lastReplyAt = Instant.now();
        return ticket;
    }

    @PrePersist
    public void prePersist() {
        if (this.organizationId == null) {
            this.organizationId = TenantContext.require();
        }
        if (this.lastReplyAt == null) {
            this.lastReplyAt = Instant.now();
        }
    }

    public void addMessage(ClinicTicketMessage message) {
        this.messages.add(message);
        message.setTicket(this);
        this.lastReplyAt = Instant.now();
    }

    public void markInProgress(User assignee) {
        this.status = TicketStatus.IN_PROGRESS;
        if (assignee != null) {
            this.assignedToUser = assignee;
        }
    }

    public void markWaitingOnClinic() {
        this.status = TicketStatus.WAITING_ON_CLINIC;
    }

    public void markResolved() {
        this.status = TicketStatus.RESOLVED;
        this.resolvedAt = Instant.now();
    }

    public void markClosed() {
        this.status = TicketStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    public void reopen() {
        this.status = TicketStatus.OPEN;
        this.resolvedAt = null;
        this.closedAt = null;
        this.lastReplyAt = Instant.now();
    }

    public void updatePriority(TicketPriority priority) {
        if (priority != null) {
            this.priority = priority;
        }
    }

    public void assignTo(User user) {
        this.assignedToUser = user;
    }

    // Getters
    public Long getOrganizationId() {
        return organizationId;
    }

    public Organization getOrganization() {
        return organization;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public User getCreatedByUser() {
        return createdByUser;
    }

    public User getAssignedToUser() {
        return assignedToUser;
    }

    public String getSubject() {
        return subject;
    }

    public TicketCategory getCategory() {
        return category;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public Instant getLastReplyAt() {
        return lastReplyAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public boolean isClinicHasUnread() {
        return clinicHasUnread;
    }

    public void setClinicHasUnread(boolean clinicHasUnread) {
        this.clinicHasUnread = clinicHasUnread;
    }

    public List<ClinicTicketMessage> getMessages() {
        return messages;
    }
}
