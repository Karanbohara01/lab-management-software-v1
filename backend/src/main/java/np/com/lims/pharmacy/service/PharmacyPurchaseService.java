package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreatePurchaseRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.PurchaseItemRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.PurchaseSummaryDto;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyPurchase;
import np.com.lims.pharmacy.entity.PharmacyPurchaseItem;
import np.com.lims.pharmacy.entity.PharmacyWholesaler;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyPurchaseRepository;
import np.com.lims.pharmacy.repository.PharmacyWholesalerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PharmacyPurchaseService {

    private final PharmacyPurchaseRepository purchaseRepository;
    private final PharmacyWholesalerRepository wholesalerRepository;
    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;

    public PharmacyPurchaseService(PharmacyPurchaseRepository purchaseRepository,
                                   PharmacyWholesalerRepository wholesalerRepository,
                                   PharmacyItemRepository itemRepository,
                                   PharmacyBatchRepository batchRepository) {
        this.purchaseRepository = purchaseRepository;
        this.wholesalerRepository = wholesalerRepository;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
    }

    @Transactional(readOnly = true)
    public Page<PurchaseSummaryDto> list(Pageable pageable) {
        return purchaseRepository.findAllByOrderByReceivedDateDesc(pageable)
                .map(this::toSummary);
    }

    @Transactional
    public PurchaseSummaryDto createPurchase(CreatePurchaseRequest req) {
        if (req.items() == null || req.items().isEmpty()) {
            throw ApiException.badRequest("Purchase must have at least one line item");
        }

        PharmacyWholesaler wholesaler = wholesalerRepository.findById(req.wholesalerId())
                .orElseThrow(() -> ApiException.notFound("Wholesaler not found: " + req.wholesalerId()));

        PharmacyPurchase p = new PharmacyPurchase();
        String poNumber = "PO-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-" + (1000 + ThreadLocalRandom.current().nextInt(9000));
        p.setPurchaseNumber(poNumber);
        p.setWholesaler(wholesaler);
        p.setWholesalerInvoiceNo(req.wholesalerInvoiceNo());
        p.setInvoiceDate(req.invoiceDate());
        p.setReceivedDate(req.receivedDate() != null ? req.receivedDate() : LocalDate.now());

        BigDecimal carrierCharges = req.carrierCharges() != null ? req.carrierCharges() : BigDecimal.ZERO;
        BigDecimal otherCharges = req.otherCharges() != null ? req.otherCharges() : BigDecimal.ZERO;
        p.setCarrierCharges(carrierCharges);
        p.setOtherCharges(otherCharges);
        p.setNotes(req.notes());

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTaxable = BigDecimal.ZERO;
        BigDecimal totalNonTaxable = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        // First pass: compute total gross for proportional freight/carrier allocation
        BigDecimal totalGross = BigDecimal.ZERO;
        for (PurchaseItemRequest itemReq : req.items()) {
            BigDecimal lineGross = itemReq.purchaseRatePerPack().multiply(BigDecimal.valueOf(itemReq.billedPackQty()));
            totalGross = totalGross.add(lineGross);
        }

        for (PurchaseItemRequest itemReq : req.items()) {
            PharmacyItem item = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> ApiException.notFound("Medicine not found: " + itemReq.itemId()));

            int billedPacks = itemReq.billedPackQty();
            int freePacks = itemReq.freePackQty() != null ? itemReq.freePackQty() : 0;
            int totalPacks = billedPacks + freePacks;
            int packSize = itemReq.packSize() != null && itemReq.packSize() > 0 ? itemReq.packSize() : item.getPackSize();
            int totalUnitsReceived = totalPacks * packSize;

            BigDecimal rate = itemReq.purchaseRatePerPack();
            BigDecimal lineGross = rate.multiply(BigDecimal.valueOf(billedPacks));
            totalSubtotal = totalSubtotal.add(lineGross);

            BigDecimal discPct = itemReq.discountPercentage() != null ? itemReq.discountPercentage() : BigDecimal.ZERO;
            BigDecimal lineDisc = lineGross.multiply(discPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            totalDiscount = totalDiscount.add(lineDisc);

            BigDecimal lineAfterDisc = lineGross.subtract(lineDisc);

            boolean isVat = itemReq.isVatApplicable() != null ? itemReq.isVatApplicable() : item.getIsVatApplicable();
            BigDecimal vatPct = isVat
                    ? (itemReq.vatPercentage() != null ? itemReq.vatPercentage() : item.getVatPercentage())
                    : BigDecimal.ZERO;

            BigDecimal lineVat = BigDecimal.ZERO;
            if (isVat && vatPct.compareTo(BigDecimal.ZERO) > 0) {
                totalTaxable = totalTaxable.add(lineAfterDisc);
                lineVat = lineAfterDisc.multiply(vatPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                totalVat = totalVat.add(lineVat);
            } else {
                totalNonTaxable = totalNonTaxable.add(lineAfterDisc);
            }

            BigDecimal lineTotal = lineAfterDisc.add(lineVat);

            // Calculate landed/effective unit cost accounting for carrier charges and free bonus packs
            BigDecimal allocatedCharges = BigDecimal.ZERO;
            if (totalGross.compareTo(BigDecimal.ZERO) > 0 && carrierCharges.add(otherCharges).compareTo(BigDecimal.ZERO) > 0) {
                allocatedCharges = (carrierCharges.add(otherCharges))
                        .multiply(lineGross)
                        .divide(totalGross, 4, RoundingMode.HALF_UP);
            }

            BigDecimal effectiveUnitCost = totalUnitsReceived > 0
                    ? lineAfterDisc.add(allocatedCharges).divide(BigDecimal.valueOf(totalUnitsReceived), 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            // Create/Record Batch in Inventory
            PharmacyBatch batch = new PharmacyBatch();
            batch.setItem(item);
            batch.setWholesaler(wholesaler);
            batch.setBatchNumber(itemReq.batchNumber().trim().toUpperCase());
            batch.setMfgDate(itemReq.mfgDate());
            batch.setExpiryDate(itemReq.expiryDate());
            batch.setPackSize(packSize);
            batch.setInitialUnits(totalUnitsReceived);
            batch.setRemainingUnits(totalUnitsReceived);
            batch.setPurchaseRatePerPack(rate);
            batch.setEffectiveCostPerUnit(effectiveUnitCost);
            batch.setMrpPerPack(itemReq.mrpPerPack());
            batch.setUnitMrp(itemReq.mrpPerPack().divide(BigDecimal.valueOf(packSize), 2, RoundingMode.HALF_UP));
            batch.setWholesaleRatePerPack(itemReq.wholesaleRatePerPack());
            batch.setRackLocation(item.getRackLocation());
            PharmacyBatch savedBatch = batchRepository.save(batch);

            // Create Purchase Line Item
            PharmacyPurchaseItem pi = new PharmacyPurchaseItem();
            pi.setItem(item);
            pi.setBatch(savedBatch);
            pi.setBatchNumber(itemReq.batchNumber());
            pi.setMfgDate(itemReq.mfgDate());
            pi.setExpiryDate(itemReq.expiryDate());
            pi.setPackSize(packSize);
            pi.setBilledPackQty(billedPacks);
            pi.setFreePackQty(freePacks);
            pi.setPurchaseRatePerPack(rate);
            pi.setDiscountPercentage(discPct);
            pi.setDiscountAmount(lineDisc);
            pi.setIsVatApplicable(isVat);
            pi.setVatPercentage(vatPct);
            pi.setVatAmount(lineVat);
            pi.setMrpPerPack(itemReq.mrpPerPack());
            pi.setWholesaleRatePerPack(itemReq.wholesaleRatePerPack());
            pi.setLineTotal(lineTotal);
            pi.setEffectiveUnitCost(effectiveUnitCost);

            p.addItem(pi);
        }

        p.setSubtotal(totalSubtotal);
        p.setDiscountAmount(totalDiscount);
        p.setTaxableAmount(totalTaxable);
        p.setNonTaxableAmount(totalNonTaxable);
        p.setVatAmount(totalVat);

        BigDecimal netTotal = totalSubtotal.subtract(totalDiscount)
                .add(totalVat)
                .add(carrierCharges)
                .add(otherCharges);
        p.setNetTotal(netTotal);
        p.setPaymentStatus("UNPAID");

        PharmacyPurchase saved = purchaseRepository.save(p);
        return toSummary(saved);
    }

    private PurchaseSummaryDto toSummary(PharmacyPurchase p) {
        return new PurchaseSummaryDto(
                p.getId(),
                p.getPurchaseNumber(),
                p.getWholesaler().getId(),
                p.getWholesaler().getName(),
                p.getWholesalerInvoiceNo(),
                p.getInvoiceDate(),
                p.getReceivedDate(),
                p.getSubtotal(),
                p.getDiscountAmount(),
                p.getCarrierCharges(),
                p.getVatAmount(),
                p.getNetTotal(),
                p.getPaymentStatus(),
                p.getItems() != null ? p.getItems().size() : 0
        );
    }
}
