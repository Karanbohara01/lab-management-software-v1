package np.com.lims.platform.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.platform.entity.Organization;
import np.com.lims.platform.entity.OrganizationStatus;
import np.com.lims.platform.entity.Subscription;
import np.com.lims.platform.entity.SubscriptionPlan;
import np.com.lims.platform.entity.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class PlatformDtos {

    private PlatformDtos() {
    }

    // ----- requests ---------------------------------------------------

    public record CreateOrganizationRequest(
            @NotBlank @Size(max = 64) String slug,
            @NotBlank @Size(max = 160) String name,
            @Size(max = 160) String contactName,
            @Email @Size(max = 160) String contactEmail,
            @Size(max = 32) String contactPhone,
            @Size(max = 120) String city,
            @Size(max = 1000) String notes,
            @Size(max = 20) String pan,
            @NotBlank String planCode,
            @NotBlank @Size(max = 64) String adminUsername,
            @NotBlank @Email @Size(max = 160) String adminEmail,
            @NotBlank @Size(max = 160) String adminFullName,
            @NotBlank @Size(min = 8, max = 100) String adminPassword
    ) {
    }

    public record UpdateOrganizationRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 160) String contactName,
            @Email @Size(max = 160) String contactEmail,
            @Size(max = 32) String contactPhone,
            @Size(max = 120) String city,
            @Size(max = 1000) String notes,
            @Size(max = 20) String pan
    ) {
    }

    public record ChangeOrganizationStatusRequest(@NotNull OrganizationStatus status) {
    }

    public record UpsertPlanRequest(
            @NotBlank @Size(max = 40) String code,
            @NotBlank @Size(max = 120) String name,
            @NotNull @DecimalMin("0.0") BigDecimal priceMonthly,
            @Min(1) int maxUsers,
            @Min(1) int maxBranches,
            @Size(max = 500) String description,
            boolean active,
            int displayOrder
    ) {
    }

    public record ChangeSubscriptionRequest(
            @NotBlank String planCode,
            @NotNull SubscriptionStatus status,
            Instant currentPeriodEnd,
            @Size(max = 500) String note
    ) {
    }

    public record CancelSubscriptionRequest(@NotBlank @Size(max = 500) String reason) {
    }

    // ----- responses ------------------------------------------------

    public record PlanDto(Long id, String code, String name, BigDecimal priceMonthly, int maxUsers,
                          int maxBranches, String description, boolean active, int displayOrder) {
        public static PlanDto from(SubscriptionPlan p) {
            return new PlanDto(p.getId(), p.getCode(), p.getName(), p.getPriceMonthly(), p.getMaxUsers(),
                    p.getMaxBranches(), p.getDescription(), p.isActive(), p.getDisplayOrder());
        }
    }

    public record SubscriptionDto(Long id, PlanDto plan, SubscriptionStatus status, Instant startedAt,
                                  Instant currentPeriodEnd, Instant cancelledAt, String cancelReason, String note) {
        public static SubscriptionDto from(Subscription s) {
            return new SubscriptionDto(s.getId(), PlanDto.from(s.getPlan()), s.getStatus(), s.getStartedAt(),
                    s.getCurrentPeriodEnd(), s.getCancelledAt(), s.getCancelReason(), s.getNote());
        }
    }

    public record OrganizationListItem(Long id, String slug, String name, String contactEmail, String city,
                                       OrganizationStatus status, String planName, SubscriptionStatus subscriptionStatus,
                                       Instant createdAt, long patientCount, long userCount) {
        public static OrganizationListItem from(Organization o, Subscription current, long patientCount, long userCount) {
            return new OrganizationListItem(o.getId(), o.getSlug(), o.getName(), o.getContactEmail(), o.getCity(),
                    o.getStatus(), current == null ? null : current.getPlan().getName(),
                    current == null ? null : current.getStatus(), o.getCreatedAt(), patientCount, userCount);
        }
    }

    public record OrganizationDetail(Long id, String slug, String name, String contactName, String contactEmail,
                                     String contactPhone, String city, String pan, OrganizationStatus status,
                                     String notes, Instant createdAt, List<SubscriptionDto> subscriptionHistory) {
        public static OrganizationDetail from(Organization o, List<Subscription> history) {
            return new OrganizationDetail(o.getId(), o.getSlug(), o.getName(), o.getContactName(), o.getContactEmail(),
                    o.getContactPhone(), o.getCity(), o.getPan(), o.getStatus(), o.getNotes(), o.getCreatedAt(),
                    history.stream().map(SubscriptionDto::from).toList());
        }
    }

    public record PlatformSummary(long totalOrganizations, long trialOrganizations, long activeOrganizations,
                                  long suspendedOrganizations, long activeSubscriptions, long pastDueSubscriptions,
                                  BigDecimal monthlyRecurringRevenue) {
    }

    // ----- dashboard ---------------------------------------------------

    /** One calendar month's real signup count — never a fabricated or interpolated trend. */
    public record SignupPoint(String month, long count) {
    }

    public record PlanDistributionPoint(String planCode, String planName, long count) {
    }

    public record UpcomingRenewal(Long organizationId, String organizationName, String planName,
                                  SubscriptionStatus status, Instant currentPeriodEnd) {
    }

    public record RecentClinic(Long id, String name, String slug, OrganizationStatus status,
                               String planName, Instant createdAt) {
        public static RecentClinic from(Organization o, Subscription current) {
            return new RecentClinic(o.getId(), o.getName(), o.getSlug(), o.getStatus(),
                    current == null ? null : current.getPlan().getName(), o.getCreatedAt());
        }
    }

    /**
     * How many clinics have configured their OWN payment/IRD/SMS credentials (Settings page) vs.
     * still relying on this deployment's shared application.yml defaults. {@code totalOrganizations}
     * is the denominator for all three counts.
     */
    public record IntegrationAdoption(long totalOrganizations, long paymentConfigured, long irdConfigured,
                                      long smsConfigured) {
    }

    public record DashboardResponse(List<SignupPoint> signupsByMonth, List<PlanDistributionPoint> planDistribution,
                                    List<UpcomingRenewal> upcomingRenewals, List<RecentClinic> recentClinics,
                                    IntegrationAdoption integrationAdoption) {
    }
}
