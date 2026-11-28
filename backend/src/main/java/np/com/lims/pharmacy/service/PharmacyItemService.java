package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateItemRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.ItemDto;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PharmacyItemService {

    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;

    public PharmacyItemService(PharmacyItemRepository itemRepository, PharmacyBatchRepository batchRepository) {
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public Page<ItemDto> list(String query, Pageable pageable) {
        Page<PharmacyItem> page = (query != null && !query.trim().isEmpty())
                ? itemRepository.searchActive(query.trim(), pageable)
                : itemRepository.findByIsActiveTrueOrderByNameAsc(pageable);

        List<Long> itemIds = page.getContent().stream().map(PharmacyItem::getId).toList();
        Map<Long, List<PharmacyBatch>> batchMap = batchRepository.findAll().stream()
                .filter(b -> b.getIsActive() && itemIds.contains(b.getItem().getId()))
                .collect(Collectors.groupingBy(b -> b.getItem().getId()));

        List<ItemDto> dtos = page.getContent().stream().map(item -> {
            List<PharmacyBatch> batches = batchMap.getOrDefault(item.getId(), List.of());
            int totalUnits = batches.stream().mapToInt(PharmacyBatch::getRemainingUnits).sum();
            int packSize = item.getPackSize();
            int totalPacks = packSize > 0 ? totalUnits / packSize : totalUnits;

            BigDecimal latestMrpPerPack = batches.stream()
                    .max(PharmacyBatch.FEFO.reversed())
                    .map(PharmacyBatch::getMrpPerPack)
                    .orElse(BigDecimal.ZERO);

            BigDecimal latestUnitMrp = batches.stream()
                    .max(PharmacyBatch.FEFO.reversed())
                    .map(PharmacyBatch::getUnitMrp)
                    .orElse(BigDecimal.ZERO);

            return toDto(item, totalUnits, totalPacks, latestMrpPerPack, latestUnitMrp);
        }).toList();

        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ItemDto getById(Long id) {
        PharmacyItem item = itemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Pharmacy item not found: " + id));

        List<PharmacyBatch> batches = batchRepository.findAvailableBatchesFefo(id);
        int totalUnits = batches.stream().mapToInt(PharmacyBatch::getRemainingUnits).sum();
        int packSize = item.getPackSize();
        int totalPacks = packSize > 0 ? totalUnits / packSize : totalUnits;

        BigDecimal latestMrp = batches.isEmpty() ? BigDecimal.ZERO : batches.get(0).getMrpPerPack();
        BigDecimal latestUnitMrp = batches.isEmpty() ? BigDecimal.ZERO : batches.get(0).getUnitMrp();

        return toDto(item, totalUnits, totalPacks, latestMrp, latestUnitMrp);
    }

    @Transactional
    public ItemDto create(CreateItemRequest req) {
        PharmacyItem item = new PharmacyItem();
        applyRequest(item, req);
        PharmacyItem saved = itemRepository.save(item);
        return toDto(saved, 0, 0, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Transactional
    public ItemDto update(Long id, CreateItemRequest req) {
        PharmacyItem item = itemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Pharmacy item not found: " + id));
        applyRequest(item, req);
        PharmacyItem saved = itemRepository.save(item);
        return getById(saved.getId());
    }

    @Transactional
    public void delete(Long id) {
        PharmacyItem item = itemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Pharmacy item not found: " + id));
        item.setIsActive(false);
        itemRepository.save(item);
    }

    private void applyRequest(PharmacyItem item, CreateItemRequest req) {
        item.setName(req.name());
        item.setGenericName(req.genericName());
        if (req.category() != null) item.setCategory(req.category());
        if (req.dosageForm() != null) item.setDosageForm(req.dosageForm());
        item.setStrength(req.strength());
        item.setManufacturer(req.manufacturer());
        if (req.packUnit() != null) item.setPackUnit(req.packUnit());
        if (req.dispensingUnit() != null) item.setDispensingUnit(req.dispensingUnit());
        if (req.packSize() != null) item.setPackSize(req.packSize());
        item.setHsCode(req.hsCode());
        item.setIsVatApplicable(req.isVatApplicable());
        item.setVatPercentage(req.vatPercentage());
        if (req.schedule() != null) item.setSchedule(req.schedule());
        item.setRackLocation(req.rackLocation());
        item.setMinStockLevel(req.minStockLevel());
        if (req.isNarcotic() != null) item.setIsNarcotic(req.isNarcotic());
        if (req.requiresPrescription() != null) item.setRequiresPrescription(req.requiresPrescription());
        item.setBarcode(req.barcode());
    }

    private ItemDto toDto(PharmacyItem i, int units, int packs, BigDecimal mrpPack, BigDecimal unitMrp) {
        return new ItemDto(
                i.getId(),
                i.getName(),
                i.getGenericName(),
                i.getCategory(),
                i.getDosageForm(),
                i.getStrength(),
                i.getManufacturer(),
                i.getPackUnit(),
                i.getDispensingUnit(),
                i.getPackSize(),
                i.getHsCode(),
                i.getIsVatApplicable(),
                i.getVatPercentage(),
                i.getSchedule(),
                i.getRackLocation(),
                i.getMinStockLevel(),
                i.getIsActive(),
                i.getIsNarcotic(),
                i.getRequiresPrescription(),
                i.getBarcode(),
                units,
                packs,
                mrpPack,
                unitMrp
        );
    }
}
