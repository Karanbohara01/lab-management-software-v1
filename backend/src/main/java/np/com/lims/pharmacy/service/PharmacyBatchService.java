package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.pharmacy.dto.PharmacyDtos.BatchDto;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PharmacyBatchService {

    private final PharmacyBatchRepository batchRepository;

    public PharmacyBatchService(PharmacyBatchRepository batchRepository) {
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public List<BatchDto> listAvailable() {
        return batchRepository.findByRemainingUnitsGreaterThanOrderByExpiryDateAsc(0).stream()
                .filter(PharmacyBatch::getIsActive)
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BatchDto> listByItem(Long itemId) {
        return batchRepository.findAvailableBatchesFefo(itemId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BatchDto> listExpiring(int withinDays) {
        LocalDate today = LocalDate.now();
        LocalDate target = today.plusDays(withinDays);
        return batchRepository.findNearExpiryBatches(today, target).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BatchDto> listExpired() {
        LocalDate today = LocalDate.now();
        return batchRepository.findExpiredBatches(today).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void discardBatch(Long id) {
        PharmacyBatch b = batchRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Batch not found: " + id));
        b.setRemainingUnits(0);
        b.setIsActive(false);
        batchRepository.save(b);
    }

    public BatchDto toDto(PharmacyBatch b) {
        LocalDate today = LocalDate.now();
        int packSize = b.getPackSize() > 0 ? b.getPackSize() : 1;
        int remUnits = b.getRemainingUnits();
        int remPacks = remUnits / packSize;
        int remLoose = remUnits % packSize;

        return new BatchDto(
                b.getId(),
                b.getItem().getId(),
                b.getItem().getName(),
                b.getItem().getGenericName(),
                b.getWholesaler() != null ? b.getWholesaler().getId() : null,
                b.getWholesaler() != null ? b.getWholesaler().getName() : "Direct",
                b.getBatchNumber(),
                b.getMfgDate(),
                b.getExpiryDate(),
                packSize,
                b.getInitialUnits(),
                remUnits,
                remPacks,
                remLoose,
                b.getPurchaseRatePerPack(),
                b.getEffectiveCostPerUnit(),
                b.getMrpPerPack(),
                b.getUnitMrp(),
                b.getWholesaleRatePerPack(),
                b.getRackLocation() != null ? b.getRackLocation() : b.getItem().getRackLocation(),
                b.isExpired(today),
                b.isExpiringWithin(today, 60)
        );
    }
}
