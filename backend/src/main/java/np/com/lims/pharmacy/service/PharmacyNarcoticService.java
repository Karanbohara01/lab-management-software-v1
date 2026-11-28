package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.*;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyNarcoticLog;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyNarcoticLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class PharmacyNarcoticService {

    private final PharmacyNarcoticLogRepository narcoticLogRepository;
    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;

    public PharmacyNarcoticService(
            PharmacyNarcoticLogRepository narcoticLogRepository,
            PharmacyItemRepository itemRepository,
            PharmacyBatchRepository batchRepository) {
        this.narcoticLogRepository = narcoticLogRepository;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public Page<NarcoticLogDto> listLogs(String query, Pageable pageable) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        Page<PharmacyNarcoticLog> page = (query != null && !query.isBlank())
                ? narcoticLogRepository.searchLogs(tenantId, query.trim(), pageable)
                : narcoticLogRepository.findByOrganizationIdOrderByLogDateDesc(tenantId, pageable);

        return page.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<NarcoticLogDto> getDdaReport(LocalDateTime start, LocalDateTime end) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        return narcoticLogRepository.findByOrganizationIdAndLogDateBetweenOrderByLogDateAsc(tenantId, start, end)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public NarcoticLogDto recordLog(RecordNarcoticLogRequest req) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;

        PharmacyItem item = itemRepository.findById(req.itemId())
                .orElseThrow(() -> ApiException.notFound("Medicine item not found"));

        PharmacyBatch batch = batchRepository.findById(req.batchId())
                .orElseThrow(() -> ApiException.notFound("Medicine batch not found"));

        int balanceRemaining = batch.getRemainingUnits();

        PharmacyNarcoticLog log = new PharmacyNarcoticLog();
        log.setOrganizationId(tenantId);
        log.setItemId(item.getId());
        log.setBatchId(batch.getId());
        log.setSaleId(req.saleId());
        log.setSaleItemId(req.saleItemId());
        log.setLogDate(LocalDateTime.now());
        log.setPatientId(req.patientId());
        log.setPatientName(req.patientName());
        log.setPatientAgeGender(req.patientAgeGender());
        log.setPatientAddress(req.patientAddress());
        log.setBuyerName(req.buyerName());
        log.setBuyerRelation(req.buyerRelation() != null ? req.buyerRelation() : "SELF");
        log.setBuyerContact(req.buyerContact());
        log.setBuyerIdType(req.buyerIdType() != null ? req.buyerIdType() : "CITIZENSHIP");
        log.setBuyerIdNumber(req.buyerIdNumber());
        log.setDoctorId(req.doctorId());
        log.setDoctorName(req.doctorName());
        log.setDoctorNmcNumber(req.doctorNmcNumber());
        log.setPrescriptionNumber(req.prescriptionNumber());
        log.setPrescriptionDate(req.prescriptionDate());
        log.setDispensedQuantity(req.dispensedQuantity());
        log.setUnitType(req.unitType() != null ? req.unitType() : "UNIT");
        log.setBalanceStockUnits(balanceRemaining);
        log.setPharmacistName(req.pharmacistName());
        log.setPharmacistNpcNumber(req.pharmacistNpcNumber());
        log.setRemarks(req.remarks());

        PharmacyNarcoticLog saved = narcoticLogRepository.save(log);
        return mapToDto(saved);
    }

    private NarcoticLogDto mapToDto(PharmacyNarcoticLog log) {
        PharmacyItem item = itemRepository.findById(log.getItemId()).orElse(null);
        PharmacyBatch batch = batchRepository.findById(log.getBatchId()).orElse(null);

        return new NarcoticLogDto(
                log.getId(),
                log.getItemId(),
                item != null ? item.getName() : "Unknown Drug",
                item != null ? item.getGenericName() : null,
                log.getBatchId(),
                batch != null ? batch.getBatchNumber() : "N/A",
                batch != null ? batch.getExpiryDate() : null,
                log.getSaleId(),
                log.getLogDate().atZone(ZoneId.systemDefault()).toInstant(),
                log.getPatientId(),
                log.getPatientName(),
                log.getPatientAgeGender(),
                log.getPatientAddress(),
                log.getBuyerName(),
                log.getBuyerRelation(),
                log.getBuyerContact(),
                log.getBuyerIdType(),
                log.getBuyerIdNumber(),
                log.getDoctorId(),
                log.getDoctorName(),
                log.getDoctorNmcNumber(),
                log.getPrescriptionNumber(),
                log.getPrescriptionDate(),
                log.getDispensedQuantity(),
                log.getUnitType(),
                log.getBalanceStockUnits(),
                log.getPharmacistName(),
                log.getPharmacistNpcNumber(),
                log.getRemarks()
        );
    }
}
