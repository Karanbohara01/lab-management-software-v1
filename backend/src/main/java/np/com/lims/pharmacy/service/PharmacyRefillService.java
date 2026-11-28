package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.*;
import np.com.lims.pharmacy.entity.PharmacyRefillSchedule;
import np.com.lims.pharmacy.repository.PharmacyRefillScheduleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class PharmacyRefillService {

    private final PharmacyRefillScheduleRepository refillRepository;

    public PharmacyRefillService(PharmacyRefillScheduleRepository refillRepository) {
        this.refillRepository = refillRepository;
    }

    public Page<RefillScheduleDto> searchRefills(String status, String query, Pageable pageable) {
        String queryParam = (query != null && !query.isBlank()) ? query.trim() : null;
        String statusParam = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;

        return refillRepository.searchRefills(statusParam, queryParam, pageable)
                .map(this::toDto);
    }

    public RefillStatsDto getStats() {
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(7);

        long total = refillRepository.count();
        long overdue = refillRepository.countOverdue(today);
        long dueThisWeek = refillRepository.countDueBetween(today, weekEnd);
        long remindersSent = refillRepository.countByStatus("REMINDER_SENT");
        long completed = refillRepository.countByStatus("REFILLED");

        return new RefillStatsDto(total, overdue, dueThisWeek, remindersSent, completed);
    }

    @Transactional
    public RefillScheduleDto createSchedule(CreateRefillRequest req) {
        PharmacyRefillSchedule entity = new PharmacyRefillSchedule();
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        entity.setOrganizationId(tenantId);
        entity.setPatientId(req.patientId());
        entity.setPatientName(req.patientName());
        entity.setPatientPhone(req.patientPhone());
        entity.setSaleId(req.saleId());
        entity.setInvoiceNumber(req.invoiceNumber());
        entity.setItemId(req.itemId());
        entity.setItemName(req.itemName());
        entity.setDispensedQuantity(req.dispensedQuantity() != null ? req.dispensedQuantity() : 1);
        entity.setUnitType(req.unitType() != null ? req.unitType() : "UNIT");
        entity.setDosageInstruction(req.dosageInstruction());

        LocalDate dispensed = LocalDate.now();
        int days = req.courseDays() != null && req.courseDays() > 0 ? req.courseDays() : 30;
        entity.setDispensedDate(dispensed);
        entity.setCourseDays(days);
        // Alert 3 days before supply runs out
        entity.setRefillDueDate(dispensed.plusDays(Math.max(1, days - 3)));
        entity.setStatus("SCHEDULED");
        entity.setNotes(req.notes());

        return toDto(refillRepository.save(entity));
    }

    @Transactional
    public RefillScheduleDto sendSmsReminder(Long refillId) {
        PharmacyRefillSchedule entity = refillRepository.findById(refillId)
                .orElseThrow(() -> ApiException.notFound("Refill schedule not found: " + refillId));

        entity.setReminderCount(entity.getReminderCount() + 1);
        entity.setLastReminderSentAt(LocalDateTime.now());
        entity.setStatus("REMINDER_SENT");

        return toDto(refillRepository.save(entity));
    }

    @Transactional
    public RefillScheduleDto markRefilled(Long refillId) {
        PharmacyRefillSchedule entity = refillRepository.findById(refillId)
                .orElseThrow(() -> ApiException.notFound("Refill schedule not found: " + refillId));

        entity.setStatus("REFILLED");
        return toDto(refillRepository.save(entity));
    }

    private RefillScheduleDto toDto(PharmacyRefillSchedule r) {
        boolean isOverdue = r.getRefillDueDate().isBefore(LocalDate.now()) && !"REFILLED".equals(r.getStatus());
        return new RefillScheduleDto(
                r.getId(),
                r.getPatientId(),
                r.getPatientName(),
                r.getPatientPhone(),
                r.getSaleId(),
                r.getInvoiceNumber(),
                r.getItemId(),
                r.getItemName(),
                r.getDispensedQuantity(),
                r.getUnitType(),
                r.getDosageInstruction(),
                r.getDispensedDate(),
                r.getCourseDays(),
                r.getRefillDueDate(),
                r.getStatus(),
                r.getLastReminderSentAt(),
                r.getReminderCount(),
                r.getNotes(),
                isOverdue
        );
    }
}
