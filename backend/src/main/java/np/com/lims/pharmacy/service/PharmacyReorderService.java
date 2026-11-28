package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreatePurchaseOrderItemRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreatePurchaseOrderRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.PurchaseOrderDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.PurchaseOrderItemDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.ReorderIntelligenceSummaryDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.ReorderRecommendationDto;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyPurchaseOrder;
import np.com.lims.pharmacy.entity.PharmacyPurchaseOrderItem;
import np.com.lims.pharmacy.entity.PharmacyWholesaler;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyPurchaseOrderRepository;
import np.com.lims.pharmacy.repository.PharmacySaleItemRepository;
import np.com.lims.pharmacy.repository.PharmacyWholesalerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PharmacyReorderService {

    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;
    private final PharmacySaleItemRepository saleItemRepository;
    private final PharmacyPurchaseOrderRepository purchaseOrderRepository;
    private final PharmacyWholesalerRepository wholesalerRepository;

    public PharmacyReorderService(PharmacyItemRepository itemRepository,
                                  PharmacyBatchRepository batchRepository,
                                  PharmacySaleItemRepository saleItemRepository,
                                  PharmacyPurchaseOrderRepository purchaseOrderRepository,
                                  PharmacyWholesalerRepository wholesalerRepository) {
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.saleItemRepository = saleItemRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.wholesalerRepository = wholesalerRepository;
    }

    @Transactional(readOnly = true)
    public List<ReorderRecommendationDto> getRecommendations(String urgencyFilter, Long wholesalerFilter, String query) {
        List<PharmacyItem> items = itemRepository.findAll();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

        List<ReorderRecommendationDto> results = new ArrayList<>();

        for (PharmacyItem item : items) {
            if (Boolean.FALSE.equals(item.getIsActive())) continue;

            // 1. Current available unexpired stock
            List<PharmacyBatch> batches = batchRepository.findAvailableBatchesFefo(item.getId());
            int currentUnits = batches.stream()
                    .mapToInt(b -> b.getRemainingUnits() != null ? b.getRemainingUnits() : 0)
                    .sum();
            int packSize = item.getPackSize() != null && item.getPackSize() > 0 ? item.getPackSize() : 10;
            int currentPacks = currentUnits / packSize;

            // 2. Consumption velocity (ADC)
            Long dispensed30Days = saleItemRepository.sumUnitsDeductedSince(item.getId(), thirtyDaysAgo);
            long pastUnits = dispensed30Days != null ? dispensed30Days : 0L;
            double adc = pastUnits > 0 ? (pastUnits / 30.0) : 0.0;

            // 3. Minimum buffer & Reorder Point (ROP)
            int minLevel = item.getMinStockLevel() != null ? item.getMinStockLevel() : 20;
            // ROP = max(minStockLevel, (LeadTime 5 days * ADC) + (SafetyStock 7 days * ADC))
            int dynamicRop = (int) Math.ceil(adc * 12);
            int ropUnits = Math.max(minLevel, dynamicRop);

            // 4. Days of stock remaining
            int daysRemaining;
            if (currentUnits == 0) {
                daysRemaining = 0;
            } else if (adc > 0) {
                daysRemaining = (int) Math.floor(currentUnits / adc);
            } else {
                daysRemaining = 999;
            }

            // 5. Urgency classification
            String urgency;
            if (currentUnits == 0) {
                urgency = "OUT_OF_STOCK";
            } else if (daysRemaining <= 3 || currentUnits <= (minLevel / 2)) {
                urgency = "CRITICAL_URGENT";
            } else if (currentUnits <= ropUnits) {
                urgency = "REORDER_RECOMMENDED";
            } else {
                urgency = "OPTIMAL";
            }

            // 6. Recommended Reorder Packs (replenish to 30 days buffer)
            int targetUnits = Math.max(ropUnits * 2, (int) Math.ceil(adc * 30));
            int deficitUnits = Math.max(0, targetUnits - currentUnits);
            int recommendedPacks = Math.max(1, (int) Math.ceil((double) deficitUnits / packSize));

            // 7. Preferred wholesaler & estimated rate
            PharmacyBatch latestBatch = batchRepository.findFirstByItemIdOrderByCreatedAtDesc(item.getId()).orElse(null);
            Long prefWholesalerId = null;
            String prefWholesalerName = "Standard Hospital Distributor";
            BigDecimal ratePerPack = BigDecimal.valueOf(100);

            if (latestBatch != null) {
                if (latestBatch.getWholesaler() != null) {
                    prefWholesalerId = latestBatch.getWholesaler().getId();
                    prefWholesalerName = latestBatch.getWholesaler().getName();
                }
                if (latestBatch.getPurchaseRatePerPack() != null && latestBatch.getPurchaseRatePerPack().compareTo(BigDecimal.ZERO) > 0) {
                    ratePerPack = latestBatch.getPurchaseRatePerPack();
                } else if (latestBatch.getEffectiveCostPerUnit() != null) {
                    ratePerPack = latestBatch.getEffectiveCostPerUnit().multiply(BigDecimal.valueOf(packSize));
                }
            }

            BigDecimal totalEstAmount = ratePerPack.multiply(BigDecimal.valueOf(recommendedPacks)).setScale(2, RoundingMode.HALF_UP);

            // 8. Filters
            if (urgencyFilter != null && !urgencyFilter.equalsIgnoreCase("ALL")) {
                if (!urgency.equalsIgnoreCase(urgencyFilter)) continue;
            }

            if (wholesalerFilter != null && wholesalerFilter > 0) {
                if (prefWholesalerId == null || !prefWholesalerId.equals(wholesalerFilter)) continue;
            }

            if (query != null && !query.trim().isEmpty()) {
                String q = query.trim().toLowerCase();
                boolean matches = (item.getName() != null && item.getName().toLowerCase().contains(q)) ||
                                  (item.getGenericName() != null && item.getGenericName().toLowerCase().contains(q)) ||
                                  prefWholesalerName.toLowerCase().contains(q);
                if (!matches) continue;
            }

            results.add(new ReorderRecommendationDto(
                    item.getId(),
                    item.getName(),
                    item.getGenericName(),
                    item.getCategory() != null ? item.getCategory().name() : "ALLOPATHIC",
                    item.getPackUnit(),
                    item.getDispensingUnit(),
                    packSize,
                    currentUnits,
                    currentPacks,
                    minLevel,
                    pastUnits,
                    Math.round(adc * 100.0) / 100.0,
                    ropUnits,
                    daysRemaining,
                    urgency,
                    recommendedPacks,
                    prefWholesalerId,
                    prefWholesalerName,
                    ratePerPack,
                    totalEstAmount,
                    item.getRackLocation()
            ));
        }

        // Sort: Out of stock first, then critical, then reorder recommended, then name
        results.sort(Comparator.comparingInt((ReorderRecommendationDto r) -> {
            switch (r.urgency()) {
                case "OUT_OF_STOCK": return 0;
                case "CRITICAL_URGENT": return 1;
                case "REORDER_RECOMMENDED": return 2;
                default: return 3;
            }
        }).thenComparing(ReorderRecommendationDto::itemName));

        return results;
    }

    @Transactional(readOnly = true)
    public ReorderIntelligenceSummaryDto getSummary() {
        List<ReorderRecommendationDto> all = getRecommendations("ALL", null, null);
        long outOfStock = all.stream().filter(r -> "OUT_OF_STOCK".equals(r.urgency())).count();
        long critical = all.stream().filter(r -> "CRITICAL_URGENT".equals(r.urgency())).count();
        long recommended = all.stream().filter(r -> "REORDER_RECOMMENDED".equals(r.urgency())).count();
        long optimal = all.stream().filter(r -> "OPTIMAL".equals(r.urgency())).count();

        BigDecimal estCost = all.stream()
                .filter(r -> !"OPTIMAL".equals(r.urgency()))
                .map(ReorderRecommendationDto::estimatedTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ReorderIntelligenceSummaryDto(
                all.size(),
                outOfStock,
                critical,
                recommended,
                optimal,
                estCost
        );
    }

    @Transactional
    public PurchaseOrderDto createPurchaseOrder(CreatePurchaseOrderRequest req, String username) {
        if (req.items() == null || req.items().isEmpty()) {
            throw ApiException.badRequest("Purchase order must contain at least one medicine line item");
        }

        PharmacyWholesaler wholesaler = wholesalerRepository.findById(req.wholesalerId())
                .orElseThrow(() -> ApiException.notFound("Wholesaler not found: " + req.wholesalerId()));

        String poNumber = "PO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" +
                String.format("%04d", ThreadLocalRandom.current().nextInt(1000, 9999));

        PharmacyPurchaseOrder po = new PharmacyPurchaseOrder();
        po.setPoNumber(poNumber);
        po.setWholesaler(wholesaler);
        po.setOrderDate(LocalDate.now());
        po.setExpectedDeliveryDate(req.expectedDeliveryDate() != null ? req.expectedDeliveryDate() : LocalDate.now().plusDays(3));
        po.setStatus("ISSUED");
        po.setNotes(req.notes());
        po.setCreatedBy(username != null ? username : "Hospital Pharmacist");

        BigDecimal grandTotal = BigDecimal.ZERO;

        for (CreatePurchaseOrderItemRequest line : req.items()) {
            PharmacyItem item = itemRepository.findById(line.itemId())
                    .orElseThrow(() -> ApiException.notFound("Pharmacy item not found: " + line.itemId()));

            PharmacyPurchaseOrderItem poi = new PharmacyPurchaseOrderItem();
            poi.setItem(item);
            poi.setPackUnit(line.packUnit() != null ? line.packUnit() : item.getPackUnit());
            poi.setPackSize(line.packSize() != null ? line.packSize() : item.getPackSize());
            poi.setRecommendedPackQty(line.recommendedPackQty() != null ? line.recommendedPackQty() : 1);
            poi.setOrderedPackQty(line.orderedPackQty() != null ? line.orderedPackQty() : 1);
            poi.setEstimatedRatePerPack(line.estimatedRatePerPack() != null ? line.estimatedRatePerPack() : BigDecimal.ZERO);

            BigDecimal lineTotal = poi.getEstimatedRatePerPack().multiply(BigDecimal.valueOf(poi.getOrderedPackQty()));
            poi.setEstimatedTotalAmount(lineTotal);
            poi.setRemarks(line.remarks());

            po.addItem(poi);
            grandTotal = grandTotal.add(lineTotal);
        }

        po.setTotalEstimatedAmount(grandTotal.setScale(2, RoundingMode.HALF_UP));
        PharmacyPurchaseOrder saved = purchaseOrderRepository.save(po);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderDto> listPurchaseOrders(String status, Long wholesalerId, String query, Pageable pageable) {
        return purchaseOrderRepository.searchOrders(
                (status != null && !status.equalsIgnoreCase("ALL")) ? status : null,
                wholesalerId,
                (query != null && !query.trim().isEmpty()) ? query.trim() : null,
                pageable
        ).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrder(Long id) {
        PharmacyPurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Purchase order not found: " + id));
        return toDto(po);
    }

    @Transactional
    public PurchaseOrderDto updateStatus(Long id, String status) {
        PharmacyPurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Purchase order not found: " + id));
        po.setStatus(status);
        return toDto(purchaseOrderRepository.save(po));
    }

    private PurchaseOrderDto toDto(PharmacyPurchaseOrder po) {
        List<PurchaseOrderItemDto> items = po.getItems().stream().map(i -> new PurchaseOrderItemDto(
                i.getId(),
                i.getItem().getId(),
                i.getItem().getName(),
                i.getItem().getGenericName(),
                i.getPackUnit(),
                i.getPackSize(),
                i.getRecommendedPackQty(),
                i.getOrderedPackQty(),
                i.getReceivedPackQty(),
                i.getEstimatedRatePerPack(),
                i.getEstimatedTotalAmount(),
                i.getRemarks()
        )).collect(Collectors.toList());

        return new PurchaseOrderDto(
                po.getId(),
                po.getPoNumber(),
                po.getWholesaler() != null ? po.getWholesaler().getId() : null,
                po.getWholesaler() != null ? po.getWholesaler().getName() : "Unknown Distributor",
                po.getWholesaler() != null ? po.getWholesaler().getPhone() : null,
                po.getWholesaler() != null ? po.getWholesaler().getPanVatNumber() : null,
                po.getOrderDate(),
                po.getExpectedDeliveryDate(),
                po.getStatus(),
                po.getTotalEstimatedAmount(),
                po.getNotes(),
                po.getCreatedBy(),
                po.getCreatedAt(),
                items
        );
    }
}
