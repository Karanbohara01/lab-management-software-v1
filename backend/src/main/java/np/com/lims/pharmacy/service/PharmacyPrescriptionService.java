package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.*;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyPrescription;
import np.com.lims.pharmacy.entity.PharmacyPrescriptionItem;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyPrescriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PharmacyPrescriptionService {

    private final PharmacyPrescriptionRepository prescriptionRepository;
    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;

    public PharmacyPrescriptionService(
            PharmacyPrescriptionRepository prescriptionRepository,
            PharmacyItemRepository itemRepository,
            PharmacyBatchRepository batchRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public Page<PrescriptionDto> list(String query, String status, Pageable pageable) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        return prescriptionRepository.searchPrescriptions(tenantId, query, status, pageable)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public PrescriptionDto getByNumber(String prescriptionNumber) {
        PharmacyPrescription p = prescriptionRepository.findByPrescriptionNumber(prescriptionNumber)
                .orElseThrow(() -> ApiException.notFound("Prescription not found: " + prescriptionNumber));
        return mapToDto(p);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionDto> getPendingByPatient(Long patientId) {
        return prescriptionRepository.findByPatientIdAndStatusInOrderByCreatedAtDesc(
                patientId, List.of("PENDING", "PARTIALLY_DISPENSED"))
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public PrescriptionDto createPrescription(CreatePrescriptionRequest req) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;

        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        String prescriptionNumber = "RX-" + datePrefix + "-" + rand;

        PharmacyPrescription prescription = new PharmacyPrescription();
        prescription.setOrganizationId(tenantId);
        prescription.setPrescriptionNumber(prescriptionNumber);
        prescription.setPatientId(req.patientId());
        prescription.setPatientName(req.patientName());
        prescription.setPatientMrn(req.patientMrn());
        prescription.setPatientPhone(req.patientPhone());
        prescription.setDoctorId(req.doctorId());
        prescription.setDoctorName(req.doctorName());
        prescription.setDoctorNmc(req.doctorNmc());
        prescription.setDepartment(req.department() != null ? req.department() : "OPD");
        prescription.setDiagnosis(req.diagnosis());
        prescription.setValidUntil(req.validUntil() != null ? req.validUntil() : LocalDate.now().plusDays(15));
        prescription.setNotes(req.notes());
        prescription.setStatus("PENDING");

        for (PrescriptionItemRequest itemReq : req.items()) {
            PharmacyItem medicine = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> ApiException.notFound("Medicine not found: " + itemReq.itemId()));

            PharmacyPrescriptionItem item = new PharmacyPrescriptionItem();
            item.setItemId(medicine.getId());
            item.setItemName(medicine.getName());
            item.setGenericName(medicine.getGenericName());
            item.setDosage(itemReq.dosage());
            item.setFrequency(itemReq.frequency());
            item.setDurationDays(itemReq.durationDays() != null ? itemReq.durationDays() : 5);
            item.setQuantityPrescribed(itemReq.quantityPrescribed());
            item.setQuantityDispensed(0);
            item.setUnitType(itemReq.unitType() != null ? itemReq.unitType() : "UNIT");
            item.setInstructions(itemReq.instructions());

            prescription.addItem(item);
        }

        PharmacyPrescription saved = prescriptionRepository.save(prescription);
        return mapToDto(saved);
    }

    @Transactional
    public void markDispensed(String prescriptionNumber) {
        PharmacyPrescription p = prescriptionRepository.findByPrescriptionNumber(prescriptionNumber)
                .orElse(null);
        if (p != null) {
            p.setStatus("COMPLETED");
            prescriptionRepository.save(p);
        }
    }

    private PrescriptionDto mapToDto(PharmacyPrescription p) {
        List<PrescriptionItemDto> itemDtos = p.getItems().stream().map(item -> {
            List<PharmacyBatch> batches = batchRepository.findAvailableBatchesFefo(item.getItemId());
            int totalStock = batches.stream().mapToInt(PharmacyBatch::getRemainingUnits).sum();
            BigDecimal unitPrice = batches.stream()
                    .map(PharmacyBatch::getUnitMrp)
                    .findFirst()
                    .orElse(BigDecimal.ZERO);

            return new PrescriptionItemDto(
                    item.getId(),
                    item.getItemId(),
                    item.getItemName(),
                    item.getGenericName(),
                    item.getDosage(),
                    item.getFrequency(),
                    item.getDurationDays(),
                    item.getQuantityPrescribed(),
                    item.getQuantityDispensed(),
                    item.getUnitType(),
                    item.getInstructions(),
                    unitPrice,
                    totalStock
            );
        }).toList();

        return new PrescriptionDto(
                p.getId(),
                p.getPrescriptionNumber(),
                p.getPatientId(),
                p.getPatientName(),
                p.getPatientMrn(),
                p.getPatientPhone(),
                p.getDoctorId(),
                p.getDoctorName(),
                p.getDoctorNmc(),
                p.getDepartment(),
                p.getDiagnosis(),
                p.getStatus(),
                p.getValidUntil(),
                p.getNotes(),
                p.getCreatedAt(),
                itemDtos
        );
    }
}
