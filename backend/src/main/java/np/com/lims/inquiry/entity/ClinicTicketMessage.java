package np.com.lims.inquiry.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.user.entity.User;

@Entity
@Table(name = "clinic_ticket_message")
public class ClinicTicketMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private ClinicTicket ticket;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User senderUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private TicketSenderType senderType;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_internal_note", nullable = false)
    private boolean internalNote = false;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @jakarta.persistence.Lob
    @jakarta.persistence.Basic(fetch = FetchType.LAZY)
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    protected ClinicTicketMessage() {
    }

    public static ClinicTicketMessage create(ClinicTicket ticket,
                                             User senderUser,
                                             TicketSenderType senderType,
                                             String message,
                                             boolean internalNote) {
        ClinicTicketMessage msg = new ClinicTicketMessage();
        msg.ticket = ticket;
        msg.senderUser = senderUser;
        msg.senderType = senderType;
        msg.message = message.trim();
        msg.internalNote = internalNote;
        return msg;
    }

    public ClinicTicket getTicket() {
        return ticket;
    }

    public void setTicket(ClinicTicket ticket) {
        this.ticket = ticket;
    }

    public User getSenderUser() {
        return senderUser;
    }

    public TicketSenderType getSenderType() {
        return senderType;
    }

    public String getMessage() {
        return message;
    }

    public boolean isInternalNote() {
        return internalNote;
    }

    public void setAttachment(String fileName, String fileType, long fileSizeBytes, byte[] fileData) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSizeBytes = fileSizeBytes;
        this.fileData = fileData;
    }

    public boolean hasAttachment() {
        return this.fileName != null && this.fileData != null;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public byte[] getFileData() {
        return fileData;
    }
}
