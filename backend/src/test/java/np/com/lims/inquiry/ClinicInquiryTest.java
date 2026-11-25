package np.com.lims.inquiry;

import np.com.lims.common.tenant.TenantContext;
import np.com.lims.inquiry.dto.InquiryDtos.TicketDetailDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketMessageDto;
import np.com.lims.inquiry.dto.InquiryDtos.TicketSummaryDto;
import np.com.lims.inquiry.entity.ClinicTicket;
import np.com.lims.inquiry.entity.ClinicTicketMessage;
import np.com.lims.inquiry.entity.TicketCategory;
import np.com.lims.inquiry.entity.TicketPriority;
import np.com.lims.inquiry.entity.TicketSenderType;
import np.com.lims.inquiry.entity.TicketStatus;
import np.com.lims.user.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ClinicInquiryTest {

    private User clinicStaff;
    private User superadmin;

    @BeforeEach
    void setUp() {
        TenantContext.set(1L);
        clinicStaff = User.create("reception", "reception@example.com", "Passw0rd!", "Staff User", "9800000001");
        superadmin = User.create("superadmin", "admin@lims.com", "Passw0rd!", "Platform Superadmin", "9800000002");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void ticket_creationAndLifecycle() {
        ClinicTicket ticket = ClinicTicket.create(
                "TCK-000001",
                clinicStaff,
                "Cannot sync Sysmex analyzer results",
                TicketCategory.DEVICE_INTEGRATION,
                TicketPriority.HIGH
        );

        assertThat(ticket.getTicketNumber()).isEqualTo("TCK-000001");
        assertThat(ticket.getSubject()).isEqualTo("Cannot sync Sysmex analyzer results");
        assertThat(ticket.getCategory()).isEqualTo(TicketCategory.DEVICE_INTEGRATION);
        assertThat(ticket.getPriority()).isEqualTo(TicketPriority.HIGH);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.OPEN);
        assertThat(ticket.getCreatedByUser()).isEqualTo(clinicStaff);
        assertThat(ticket.getLastReplyAt()).isNotNull();

        // Clinic initial message
        ClinicTicketMessage initialMessage = ClinicTicketMessage.create(
                ticket,
                clinicStaff,
                TicketSenderType.CLINIC,
                "Getting COM port timeout on baud rate 9600",
                false
        );
        ticket.addMessage(initialMessage);

        assertThat(ticket.getMessages()).hasSize(1);
        assertThat(initialMessage.getTicket()).isEqualTo(ticket);
        assertThat(initialMessage.isInternalNote()).isFalse();

        // Superadmin marks in progress and adds reply
        ticket.markInProgress(superadmin);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(ticket.getAssignedToUser()).isEqualTo(superadmin);

        // Superadmin reply sets status to WAITING_ON_CLINIC
        ClinicTicketMessage supportReply = ClinicTicketMessage.create(
                ticket,
                superadmin,
                TicketSenderType.SUPERADMIN,
                "Please verify parity is set to None and flow control is None.",
                false
        );
        ticket.addMessage(supportReply);
        ticket.markWaitingOnClinic();
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.WAITING_ON_CLINIC);
        assertThat(ticket.getMessages()).hasSize(2);

        // Superadmin internal note (should not change status)
        ClinicTicketMessage internalNote = ClinicTicketMessage.create(
                ticket,
                superadmin,
                TicketSenderType.SUPERADMIN,
                "Known issue with USB-serial adapter driver on Windows 11.",
                true
        );
        ticket.addMessage(internalNote);
        assertThat(ticket.getMessages()).hasSize(3);
        assertThat(internalNote.isInternalNote()).isTrue();

        // Clinic staff confirms resolution
        ticket.markResolved();
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.RESOLVED);
        assertThat(ticket.getResolvedAt()).isNotNull();

        // Close ticket
        ticket.markClosed();
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.CLOSED);
        assertThat(ticket.getClosedAt()).isNotNull();

        // Reopen ticket
        ticket.reopen();
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.OPEN);
        assertThat(ticket.getResolvedAt()).isNull();
        assertThat(ticket.getClosedAt()).isNull();
    }

    @Test
    void ticketDtos_mapping() {
        ClinicTicket ticket = ClinicTicket.create(
                "TCK-000042",
                clinicStaff,
                "Billing tax invoice inquiry",
                TicketCategory.BILLING_AND_SUBSCRIPTION,
                TicketPriority.MEDIUM
        );
        ClinicTicketMessage msg = ClinicTicketMessage.create(
                ticket,
                clinicStaff,
                TicketSenderType.CLINIC,
                "Need VAT breakdown on monthly subscription invoice.",
                false
        );

        TicketSummaryDto summary = TicketSummaryDto.from(ticket);
        assertThat(summary.ticketNumber()).isEqualTo("TCK-000042");
        assertThat(summary.category()).isEqualTo(TicketCategory.BILLING_AND_SUBSCRIPTION);
        assertThat(summary.priority()).isEqualTo(TicketPriority.MEDIUM);
        assertThat(summary.status()).isEqualTo(TicketStatus.OPEN);
        assertThat(summary.clinicHasUnread()).isFalse();

        // Add attachment to message
        msg.setAttachment("screenshot.png", "image/png", 1024L, new byte[] { 1, 2, 3 });
        assertThat(msg.hasAttachment()).isTrue();
        assertThat(msg.getFileName()).isEqualTo("screenshot.png");

        TicketDetailDto detail = TicketDetailDto.from(ticket, List.of(msg));
        assertThat(detail.ticketNumber()).isEqualTo("TCK-000042");
        assertThat(detail.clinicHasUnread()).isFalse();
        assertThat(detail.messages()).hasSize(1);
        TicketMessageDto messageDto = detail.messages().get(0);
        assertThat(messageDto.message()).isEqualTo("Need VAT breakdown on monthly subscription invoice.");
        assertThat(messageDto.senderType()).isEqualTo(TicketSenderType.CLINIC);
        assertThat(messageDto.internalNote()).isFalse();
        assertThat(messageDto.hasAttachment()).isTrue();
        assertThat(messageDto.fileName()).isEqualTo("screenshot.png");
        assertThat(messageDto.fileType()).isEqualTo("image/png");
        assertThat(messageDto.fileSizeBytes()).isEqualTo(1024L);
    }
}
