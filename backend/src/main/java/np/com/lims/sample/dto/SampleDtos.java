package np.com.lims.sample.dto;

import np.com.lims.patient.PatientPrivacy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.catalog.entity.SpecimenType;
import np.com.lims.sample.entity.Sample;
import np.com.lims.sample.entity.SampleEvent;
import np.com.lims.sample.entity.SampleItem;
import np.com.lims.sample.entity.SampleStatus;
import np.com.lims.sample.entity.SpecimenCondition;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class SampleDtos {

    private SampleDtos() {
    }

    public record CollectRequest(
            @Size(max = 160) String collectionSite,
            @Size(max = 120) String container,
            @Size(max = 500) String note,
            @Size(max = 300) String paymentOverrideReason
    ) {
    }

    public record ConditionDto(
            boolean haemolysed,
            boolean lipaemic,
            boolean icteric,
            boolean clotted,
            boolean insufficientVolume,
            boolean wrongContainer,
            @Size(max = 300) String note
    ) {
        public SpecimenCondition toEntity() {
            SpecimenCondition c = new SpecimenCondition();
            c.update(haemolysed, lipaemic, icteric, clotted, insufficientVolume, wrongContainer,
                    note == null || note.isBlank() ? null : note.trim());
            return c;
        }

        public static ConditionDto from(SpecimenCondition c) {
            return c == null ? null : new ConditionDto(c.isHaemolysed(), c.isLipaemic(), c.isIcteric(),
                    c.isClotted(), c.isInsufficientVolume(), c.isWrongContainer(), c.getNote());
        }
    }

    public record ReceiveRequest(@Size(max = 500) String note, ConditionDto condition) {
    }

    public record RejectRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record RecollectRequest(@Size(max = 500) String note) {
    }

    public record NoteRequest(@NotBlank @Size(max = 500) String note) {
    }

    public record ItemDto(
            Long id,
            Long orderItemId,
            Long testId,
            String testCode,
            String testName,
            Long departmentId,
            String departmentName
    ) {
        static ItemDto from(SampleItem i) {
            return new ItemDto(i.getId(), i.getOrderItem().getId(), i.getTest().getId(), i.getTestCode(),
                    i.getTestName(), i.getDepartmentId(), i.getDepartmentName());
        }
    }

    public record EventDto(
            Long id,
            SampleEvent.Type eventType,
            SampleStatus fromStatus,
            SampleStatus toStatus,
            String actor,
            String note,
            Instant occurredAt
    ) {
        static EventDto from(SampleEvent e) {
            return new EventDto(e.getId(), e.getEventType(), e.getFromStatus(), e.getToStatus(),
                    e.getActor(), e.getNote(), e.getOccurredAt());
        }
    }

    public record ListItem(
            Long id,
            String accessionNumber,
            Long orderId,
            String orderNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            SpecimenType specimenType,
            SampleStatus status,
            int testCount,
            List<String> departments,
            String conditionSummary,
            Instant createdAt
    ) {
        public static ListItem from(Sample s) {
            return new ListItem(s.getId(), s.getAccessionNumber(), s.getOrder().getId(),
                    s.getOrder().getOrderNumber(), s.getPatient().getId(), PatientPrivacy.displayName(s.getPatient()),
                    s.getPatient().getMrn(), s.getSpecimenType(), s.getStatus(), s.getItems().size(),
                    s.getItems().stream().map(SampleItem::getDepartmentName).distinct().sorted().toList(),
                    condSummary(s), s.getCreatedAt());
        }
    }

    public record Detail(
            Long id,
            String accessionNumber,
            String barcodeValue,
            Long orderId,
            String orderNumber,
            Long patientId,
            String patientName,
            String patientMrn,
            SpecimenType specimenType,
            SampleStatus status,
            String container,
            String collectionSite,
            String rejectionReason,
            Instant collectedAt,
            String collectedBy,
            Instant receivedAt,
            String receivedBy,
            Instant rejectedAt,
            String rejectedBy,
            ConditionDto condition,
            String conditionSummary,
            List<ItemDto> items,
            List<EventDto> events
    ) {
        public static Detail from(Sample s) {
            return new Detail(
                    s.getId(), s.getAccessionNumber(), s.getBarcodeValue(),
                    s.getOrder().getId(), s.getOrder().getOrderNumber(),
                    s.getPatient().getId(), PatientPrivacy.displayName(s.getPatient()), s.getPatient().getMrn(),
                    s.getSpecimenType(), s.getStatus(), s.getContainer(), s.getCollectionSite(),
                    s.getRejectionReason(),
                    s.getCollectedAt(), s.getCollectedBy(), s.getReceivedAt(), s.getReceivedBy(),
                    s.getRejectedAt(), s.getRejectedBy(),
                    ConditionDto.from(s.getCondition()), condSummary(s),
                    s.getItems().stream().map(ItemDto::from).toList(),
                    s.getEvents().stream().map(EventDto::from).toList());
        }
    }

    private static String condSummary(Sample s) {
        String sum = s.getCondition() == null ? "" : s.getCondition().summary();
        return sum.isBlank() ? null : sum;
    }

    public record StatusSummary(Map<String, Long> counts) {
    }
}
