package np.com.lims.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.inquiry.entity.ClinicTicket;
import np.com.lims.inquiry.entity.ClinicTicketMessage;
import np.com.lims.inquiry.entity.TicketCategory;
import np.com.lims.inquiry.entity.TicketPriority;
import np.com.lims.inquiry.entity.TicketSenderType;
import np.com.lims.inquiry.entity.TicketStatus;

import java.time.Instant;
import java.util.List;

public final class InquiryDtos {

    private InquiryDtos() {
    }

    public record CreateTicketRequest(
            @NotBlank @Size(max = 255) String subject,
            @NotNull TicketCategory category,
            TicketPriority priority,
            @NotBlank String message
    ) {
    }

    public record AddMessageRequest(
            @NotBlank String message,
            boolean internalNote
    ) {
    }

    public record UpdateTicketStatusRequest(
            @NotNull TicketStatus status,
            TicketPriority priority,
            Long assignedToUserId
    ) {
    }

    public record TicketMessageDto(
            Long id,
            Long senderUserId,
            String senderName,
            TicketSenderType senderType,
            String message,
            boolean internalNote,
            Instant createdAt,
            boolean hasAttachment,
            String fileName,
            String fileType,
            Long fileSizeBytes
    ) {
        public static TicketMessageDto from(ClinicTicketMessage m) {
            return new TicketMessageDto(
                    m.getId(),
                    m.getSenderUser().getId(),
                    m.getSenderUser().getFullName() != null ? m.getSenderUser().getFullName() : m.getSenderUser().getUsername(),
                    m.getSenderType(),
                    m.getMessage(),
                    m.isInternalNote(),
                    m.getCreatedAt(),
                    m.hasAttachment(),
                    m.getFileName(),
                    m.getFileType(),
                    m.getFileSizeBytes()
            );
        }
    }

    public record TicketSummaryDto(
            Long id,
            String ticketNumber,
            Long organizationId,
            String organizationName,
            String createdByName,
            String assignedToName,
            String subject,
            TicketCategory category,
            TicketPriority priority,
            TicketStatus status,
            Instant lastReplyAt,
            Instant createdAt,
            int messageCount,
            boolean clinicHasUnread
    ) {
        public static TicketSummaryDto from(ClinicTicket t) {
            return new TicketSummaryDto(
                    t.getId(),
                    t.getTicketNumber(),
                    t.getOrganizationId(),
                    t.getOrganization() != null ? t.getOrganization().getName() : null,
                    t.getCreatedByUser() != null ? t.getCreatedByUser().getFullName() : "Unknown",
                    t.getAssignedToUser() != null ? t.getAssignedToUser().getFullName() : null,
                    t.getSubject(),
                    t.getCategory(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getLastReplyAt(),
                    t.getCreatedAt(),
                    t.getMessages() != null ? t.getMessages().size() : 0,
                    t.isClinicHasUnread()
            );
        }
    }

    public record TicketDetailDto(
            Long id,
            String ticketNumber,
            Long organizationId,
            String organizationName,
            String organizationPhone,
            String organizationEmail,
            Long createdByUserId,
            String createdByName,
            Long assignedToUserId,
            String assignedToName,
            String subject,
            TicketCategory category,
            TicketPriority priority,
            TicketStatus status,
            Instant lastReplyAt,
            Instant resolvedAt,
            Instant closedAt,
            Instant createdAt,
            boolean clinicHasUnread,
            List<TicketMessageDto> messages
    ) {
        public static TicketDetailDto from(ClinicTicket t, List<ClinicTicketMessage> messages) {
            return new TicketDetailDto(
                    t.getId(),
                    t.getTicketNumber(),
                    t.getOrganizationId(),
                    t.getOrganization() != null ? t.getOrganization().getName() : null,
                    t.getOrganization() != null ? t.getOrganization().getContactPhone() : null,
                    t.getOrganization() != null ? t.getOrganization().getContactEmail() : null,
                    t.getCreatedByUser() != null ? t.getCreatedByUser().getId() : null,
                    t.getCreatedByUser() != null ? t.getCreatedByUser().getFullName() : "Unknown",
                    t.getAssignedToUser() != null ? t.getAssignedToUser().getId() : null,
                    t.getAssignedToUser() != null ? t.getAssignedToUser().getFullName() : null,
                    t.getSubject(),
                    t.getCategory(),
                    t.getPriority(),
                    t.getStatus(),
                    t.getLastReplyAt(),
                    t.getResolvedAt(),
                    t.getClosedAt(),
                    t.getCreatedAt(),
                    t.isClinicHasUnread(),
                    messages.stream().map(TicketMessageDto::from).toList()
            );
        }
    }

    public record UnreadCountDto(
            long count
    ) {
    }

    public record PlatformTicketStatsDto(
            long openTickets,
            long inProgressTickets,
            long urgentTickets,
            long resolvedTickets,
            long totalTickets
    ) {
    }
}

