package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.pharmacy.dto.PharmacyDtos.*;
import np.com.lims.pharmacy.entity.*;
import np.com.lims.pharmacy.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class PharmacyReturnService {

    private final PharmacySaleRepository saleRepository;
    private final PharmacySaleReturnRepository saleReturnRepository;
    private final PharmacySupplierReturnRepository supplierReturnRepository;
    private final PharmacyWholesalerRepository wholesalerRepository;
    private final PharmacyBatchRepository batchRepository;
    private final PharmacyItemRepository itemRepository;

    public PharmacyReturnService(
            PharmacySaleRepository saleRepository,
            PharmacySaleReturnRepository saleReturnRepository,
            PharmacySupplierReturnRepository supplierReturnRepository,
            PharmacyWholesalerRepository wholesalerRepository,
            PharmacyBatchRepository batchRepository,
            PharmacyItemRepository itemRepository
    ) {
        this.saleRepository = saleRepository;
        this.saleReturnRepository = saleReturnRepository;
        this.supplierReturnRepository = supplierReturnRepository;
        this.wholesalerRepository = wholesalerRepository;
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
    }

    /**
     * Issues an IRD-compliant Credit Note (फिर्ता बिल) and restores returned medicines back to batch stock.
     */
    public SaleReturnDto createSaleReturn(CreateSaleReturnRequest req) {
        PharmacySale sale = saleRepository.findById(req.saleId())
                .orElseThrow(() -> ApiException.notFound("Sale bill not found: " + req.saleId()));

        if (req.items() == null || req.items().isEmpty()) {
            throw ApiException.badRequest("At least one line item must be selected for return");
        }

        Long orgId = sale.getOrganizationId() != null ? sale.getOrganizationId() : (TenantContext.get() != null ? TenantContext.get() : 1L);

        PharmacySaleReturn saleReturn = new PharmacySaleReturn();
        saleReturn.setOrganizationId(orgId);
        saleReturn.setSale(sale);
        saleReturn.setOriginalInvoiceNumber(sale.getInvoiceNumber());
        saleReturn.setCustomerName(sale.getCustomerName());
        saleReturn.setCustomerPhone(sale.getCustomerPhone());
        saleReturn.setPatient(sale.getPatient());
        saleReturn.setReturnReason(req.returnReason());
        saleReturn.setRefundMethod(req.refundMethod() != null ? req.refundMethod() : "CASH");
        saleReturn.setNotes(req.notes());
        saleReturn.setCreditNoteNumber(generateCreditNoteNumber(orgId));

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxable = BigDecimal.ZERO;
        BigDecimal nonTaxable = BigDecimal.ZERO;
        BigDecimal vatTotal = BigDecimal.ZERO;

        List<PharmacySaleReturnItem> returnItems = new ArrayList<>();

        for (ReturnLineItemRequest lineReq : req.items()) {
            PharmacySaleItem saleItem = sale.getItems().stream()
                    .filter(si -> si.getId().equals(lineReq.saleItemId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.badRequest("Invalid sale item ID: " + lineReq.saleItemId()));

            int returnQty = lineReq.returnQuantity();
            int remainingReturnable = saleItem.getQuantity() - saleItem.getReturnedQuantity();
            if (returnQty <= 0) {
                continue;
            }
            if (returnQty > remainingReturnable) {
                throw ApiException.badRequest(String.format(
                        "Cannot return %d of %s. Maximum returnable remaining: %d",
                        returnQty, saleItem.getItem().getName(), remainingReturnable
                ));
            }

            PharmacyItem item = saleItem.getItem();
            PharmacyBatch batch = saleItem.getBatch();
            int packSize = item.getPackSize() != null && item.getPackSize() > 0 ? item.getPackSize() : 1;

            int unitsToRestore;
            if ("PACK".equalsIgnoreCase(saleItem.getUnitType())) {
                unitsToRestore = returnQty * packSize;
            } else {
                unitsToRestore = returnQty;
            }

            // Calculate line refund amount
            BigDecimal lineSubtotal = saleItem.getUnitPrice().multiply(BigDecimal.valueOf(returnQty));
            BigDecimal lineVat = BigDecimal.ZERO;
            if (Boolean.TRUE.equals(saleItem.getIsVatApplicable()) && saleItem.getVatPercentage() != null && saleItem.getVatPercentage().compareTo(BigDecimal.ZERO) > 0) {
                lineVat = lineSubtotal.multiply(saleItem.getVatPercentage())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                taxable = taxable.add(lineSubtotal);
                vatTotal = vatTotal.add(lineVat);
            } else {
                nonTaxable = nonTaxable.add(lineSubtotal);
            }
            subtotal = subtotal.add(lineSubtotal);

            // Restore batch units (remainingUnits drives all item-level stock calculations)
            batch.setRemainingUnits(batch.getRemainingUnits() + unitsToRestore);
            batchRepository.save(batch);

            // Update sale item returned tracker
            saleItem.setReturnedQuantity(saleItem.getReturnedQuantity() + returnQty);
            saleItem.setReturnedUnits(saleItem.getReturnedUnits() + unitsToRestore);

            PharmacySaleReturnItem retItem = new PharmacySaleReturnItem();
            retItem.setSaleReturn(saleReturn);
            retItem.setSaleItem(saleItem);
            retItem.setItem(item);
            retItem.setBatch(batch);
            retItem.setUnitType(saleItem.getUnitType());
            retItem.setReturnQuantity(returnQty);
            retItem.setUnitsRestored(unitsToRestore);
            retItem.setUnitPrice(saleItem.getUnitPrice());
            retItem.setIsVatApplicable(saleItem.getIsVatApplicable());
            retItem.setVatPercentage(saleItem.getVatPercentage());
            retItem.setVatAmount(lineVat);
            retItem.setTotalRefund(lineSubtotal.add(lineVat));
            returnItems.add(retItem);
        }

        if (returnItems.isEmpty()) {
            throw ApiException.badRequest("No valid items to return");
        }

        BigDecimal netRefund = subtotal.add(vatTotal);
        saleReturn.setSubtotal(subtotal);
        saleReturn.setTaxableAmount(taxable);
        saleReturn.setNonTaxableAmount(nonTaxable);
        saleReturn.setVatAmount(vatTotal);
        saleReturn.setNetRefundAmount(netRefund);
        saleReturn.setItems(returnItems);

        // Update parent sale's returned amount and status
        sale.setReturnedAmount(sale.getReturnedAmount().add(netRefund));
        if (sale.getReturnedAmount().compareTo(sale.getNetTotal()) >= 0) {
            sale.setReturnStatus("FULL_RETURN");
        } else {
            sale.setReturnStatus("PARTIAL_RETURN");
        }
        saleRepository.save(sale);

        PharmacySaleReturn saved = saleReturnRepository.save(saleReturn);
        return toSaleReturnDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SaleReturnDto> listSaleReturns(Pageable pageable) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        return saleReturnRepository.findByOrganizationIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(this::toSaleReturnDto);
    }

    @Transactional(readOnly = true)
    public SaleReturnDto getSaleReturn(Long id) {
        PharmacySaleReturn ret = saleReturnRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Credit note not found: " + id));
        return toSaleReturnDto(ret);
    }

    /**
     * Issues a Wholesaler Debit Note for expired / damaged batches being returned to distributor.
     */
    public SupplierReturnDto createSupplierReturn(CreateSupplierReturnRequest req) {
        PharmacyWholesaler wholesaler = wholesalerRepository.findById(req.wholesalerId())
                .orElseThrow(() -> ApiException.notFound("Wholesaler not found: " + req.wholesalerId()));

        if (req.items() == null || req.items().isEmpty()) {
            throw ApiException.badRequest("At least one batch item must be selected for supplier return");
        }

        Long orgId = wholesaler.getOrganizationId() != null ? wholesaler.getOrganizationId() : (TenantContext.get() != null ? TenantContext.get() : 1L);

        PharmacySupplierReturn supReturn = new PharmacySupplierReturn();
        supReturn.setOrganizationId(orgId);
        supReturn.setWholesaler(wholesaler);
        supReturn.setWholesalerName(wholesaler.getName());
        supReturn.setReturnDate(LocalDate.now());
        supReturn.setReason(req.reason());
        supReturn.setNotes(req.notes());
        supReturn.setDebitNoteNumber(generateDebitNoteNumber(orgId));

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PharmacySupplierReturnItem> items = new ArrayList<>();

        for (SupplierReturnItemRequest line : req.items()) {
            PharmacyBatch batch = batchRepository.findById(line.batchId())
                    .orElseThrow(() -> ApiException.badRequest("Batch not found: " + line.batchId()));

            PharmacyItem item = batch.getItem();
            int packSize = item.getPackSize() != null && item.getPackSize() > 0 ? item.getPackSize() : 1;
            int returnPacks = line.packQuantity();
            int unitsToDeduct = returnPacks * packSize;

            if (unitsToDeduct > batch.getRemainingUnits()) {
                throw ApiException.badRequest(String.format(
                        "Cannot return %d packs from batch %s. Available remaining: %d units (%d packs)",
                        returnPacks, batch.getBatchNumber(), batch.getRemainingUnits(), batch.getRemainingUnits() / packSize
                ));
            }

            BigDecimal ratePerPack = batch.getPurchaseRatePerPack() != null ? batch.getPurchaseRatePerPack() : BigDecimal.ZERO;
            BigDecimal lineTotal = ratePerPack.multiply(BigDecimal.valueOf(returnPacks));
            totalAmount = totalAmount.add(lineTotal);

            // Deduct stock from batch
            batch.setRemainingUnits(batch.getRemainingUnits() - unitsToDeduct);
            batchRepository.save(batch);

            PharmacySupplierReturnItem itemEntity = new PharmacySupplierReturnItem();
            itemEntity.setSupplierReturn(supReturn);
            itemEntity.setItem(item);
            itemEntity.setBatch(batch);
            itemEntity.setBatchNumber(batch.getBatchNumber());
            itemEntity.setExpiryDate(batch.getExpiryDate());
            itemEntity.setPackQuantity(returnPacks);
            itemEntity.setRatePerPack(ratePerPack);
            itemEntity.setLineTotal(lineTotal);
            items.add(itemEntity);
        }

        supReturn.setTotalAmount(totalAmount);
        supReturn.setItems(items);

        PharmacySupplierReturn saved = supplierReturnRepository.save(supReturn);
        return toSupplierReturnDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SupplierReturnDto> listSupplierReturns(Pageable pageable) {
        Long tenantId = TenantContext.get() != null ? TenantContext.get() : 1L;
        return supplierReturnRepository.findByOrganizationIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(this::toSupplierReturnDto);
    }

    private String generateCreditNoteNumber(Long orgId) {
        long count = saleReturnRepository.countByOrganizationId(orgId);
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("CN-%s-%04d", datePart, count + 1);
    }

    private String generateDebitNoteNumber(Long orgId) {
        long count = supplierReturnRepository.countByOrganizationId(orgId);
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return String.format("DN-%s-%04d", datePart, count + 1);
    }

    private SaleReturnDto toSaleReturnDto(PharmacySaleReturn r) {
        List<SaleReturnItemDto> itemDtos = r.getItems().stream().map(i -> new SaleReturnItemDto(
                i.getId(),
                i.getSaleItem().getId(),
                i.getItem().getId(),
                i.getItem().getName(),
                i.getBatch().getBatchNumber(),
                i.getBatch().getExpiryDate(),
                i.getUnitType(),
                i.getReturnQuantity(),
                i.getUnitsRestored(),
                i.getUnitPrice(),
                i.getIsVatApplicable(),
                i.getVatAmount(),
                i.getTotalRefund()
        )).toList();

        return new SaleReturnDto(
                r.getId(),
                r.getCreditNoteNumber(),
                r.getSale().getId(),
                r.getOriginalInvoiceNumber(),
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getPatient() != null ? r.getPatient().getId() : null,
                r.getReturnReason(),
                r.getRefundMethod(),
                r.getSubtotal(),
                r.getTaxableAmount(),
                r.getNonTaxableAmount(),
                r.getVatAmount(),
                r.getNetRefundAmount(),
                r.getNotes(),
                r.getCreatedAt(),
                itemDtos
        );
    }

    private SupplierReturnDto toSupplierReturnDto(PharmacySupplierReturn r) {
        List<SupplierReturnItemDto> itemDtos = r.getItems().stream().map(i -> new SupplierReturnItemDto(
                i.getId(),
                i.getItem().getId(),
                i.getItem().getName(),
                i.getBatch().getId(),
                i.getBatchNumber(),
                i.getExpiryDate(),
                i.getPackQuantity(),
                i.getRatePerPack(),
                i.getLineTotal()
        )).toList();

        return new SupplierReturnDto(
                r.getId(),
                r.getDebitNoteNumber(),
                r.getWholesaler().getId(),
                r.getWholesalerName(),
                r.getReturnDate(),
                r.getReason(),
                r.getTotalAmount(),
                r.getNotes(),
                r.getCreatedAt(),
                itemDtos
        );
    }
}
