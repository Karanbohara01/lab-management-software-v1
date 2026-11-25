package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.patient.PatientRepository;
import np.com.lims.patient.entity.Patient;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateDispenseRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.DispenseItemRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.SaleReceiptDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.SaleReceiptItemDto;
import np.com.lims.pharmacy.entity.PharmacyBatch;
import np.com.lims.pharmacy.entity.PharmacyItem;
import np.com.lims.pharmacy.entity.PharmacyReseller;
import np.com.lims.pharmacy.entity.PharmacySale;
import np.com.lims.pharmacy.entity.PharmacySaleItem;
import np.com.lims.pharmacy.repository.PharmacyBatchRepository;
import np.com.lims.pharmacy.repository.PharmacyItemRepository;
import np.com.lims.pharmacy.repository.PharmacyResellerRepository;
import np.com.lims.pharmacy.repository.PharmacySaleRepository;
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
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PharmacyDispenseService {

    private final PharmacySaleRepository saleRepository;
    private final PharmacyItemRepository itemRepository;
    private final PharmacyBatchRepository batchRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PharmacyResellerRepository resellerRepository;

    public PharmacyDispenseService(PharmacySaleRepository saleRepository,
                                   PharmacyItemRepository itemRepository,
                                   PharmacyBatchRepository batchRepository,
                                   PatientRepository patientRepository,
                                   DoctorRepository doctorRepository,
                                   PharmacyResellerRepository resellerRepository) {
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.resellerRepository = resellerRepository;
    }

    @Transactional(readOnly = true)
    public Page<SaleReceiptDto> listSales(Pageable pageable) {
        return saleRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toReceiptDto);
    }

    @Transactional(readOnly = true)
    public SaleReceiptDto getSaleById(Long id) {
        PharmacySale s = saleRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Sale invoice not found: " + id));
        return toReceiptDto(s);
    }

    @Transactional
    public SaleReceiptDto dispense(CreateDispenseRequest req) {
        if (req.items() == null || req.items().isEmpty()) {
            throw ApiException.badRequest("Dispensing order must contain at least one medicine/item");
        }

        PharmacySale sale = new PharmacySale();
        String invoiceNo = "PHARM-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-" + (1000 + ThreadLocalRandom.current().nextInt(9000));
        sale.setInvoiceNumber(invoiceNo);

        String saleType = req.saleType() != null ? req.saleType().toUpperCase() : "RETAIL";
        sale.setSaleType(saleType);

        if (req.patientId() != null) {
            Patient p = patientRepository.findById(req.patientId()).orElse(null);
            sale.setPatient(p);
            if (p != null && (req.customerName() == null || req.customerName().isBlank())) {
                sale.setCustomerName(p.getFullName());
                sale.setCustomerPhone(p.getPhone());
            }
        }
        if (sale.getCustomerName() == null || sale.getCustomerName().isBlank()) {
            sale.setCustomerName(req.customerName() != null ? req.customerName() : "Walk-in Customer");
            sale.setCustomerPhone(req.customerPhone());
        }

        if (req.doctorId() != null) {
            Doctor d = doctorRepository.findById(req.doctorId()).orElse(null);
            sale.setDoctor(d);
            if (d != null) sale.setDoctorName(d.getFullName());
        } else if (req.doctorName() != null && !req.doctorName().isBlank()) {
            sale.setDoctorName(req.doctorName());
        }

        PharmacyReseller reseller = null;
        if ("RESELLER_WHOLESALE".equals(saleType) && req.resellerId() != null) {
            reseller = resellerRepository.findById(req.resellerId()).orElse(null);
            sale.setReseller(reseller);
        }

        sale.setPaymentMethod(req.paymentMethod() != null ? req.paymentMethod().toUpperCase() : "CASH");
        sale.setRefillReminderDays(req.refillReminderDays());
        sale.setNotes(req.notes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal nonTaxableAmount = BigDecimal.ZERO;
        BigDecimal vatAmount = BigDecimal.ZERO;

        for (DispenseItemRequest itemReq : req.items()) {
            PharmacyItem item = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> ApiException.notFound("Item not found: " + itemReq.itemId()));

            // Select Batch (FEFO if batchId not explicitly chosen)
            PharmacyBatch batch;
            if (itemReq.batchId() != null) {
                batch = batchRepository.findById(itemReq.batchId())
                        .orElseThrow(() -> ApiException.notFound("Batch not found: " + itemReq.batchId()));
            } else {
                List<PharmacyBatch> available = batchRepository.findAvailableBatchesFefo(item.getId());
                if (available.isEmpty()) {
                    throw ApiException.conflict("Out of stock for item: " + item.getName());
                }
                batch = available.get(0);
            }

            String unitType = itemReq.unitType() != null ? itemReq.unitType().toUpperCase() : "UNIT";
            int quantity = itemReq.quantity();
            if (quantity <= 0) {
                throw ApiException.badRequest("Quantity must be greater than zero");
            }

            int packSize = batch.getPackSize() > 0 ? batch.getPackSize() : 1;
            int unitsToDeduct = "PACK".equals(unitType) ? (quantity * packSize) : quantity;

            // Deduct stock safely
            batch.deductUnits(unitsToDeduct);
            batchRepository.save(batch);

            // Calculate Unit Price based on unit type and sale tier
            BigDecimal unitPrice;
            if ("RESELLER_WHOLESALE".equals(saleType) && batch.getWholesaleRatePerPack() != null) {
                BigDecimal packRate = batch.getWholesaleRatePerPack();
                unitPrice = "PACK".equals(unitType) ? packRate : packRate.divide(BigDecimal.valueOf(packSize), 2, RoundingMode.HALF_UP);
            } else {
                unitPrice = "PACK".equals(unitType) ? batch.getMrpPerPack() : batch.getUnitMrp();
            }

            BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(lineGross);

            // Check VAT applicability (e.g. 13% on skincare vs 0% on medicines)
            boolean isVat = item.getIsVatApplicable();
            BigDecimal vatPct = isVat ? item.getVatPercentage() : BigDecimal.ZERO;
            BigDecimal lineVat = BigDecimal.ZERO;

            if (isVat && vatPct.compareTo(BigDecimal.ZERO) > 0) {
                taxableAmount = taxableAmount.add(lineGross);
                lineVat = lineGross.multiply(vatPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                vatAmount = vatAmount.add(lineVat);
            } else {
                nonTaxableAmount = nonTaxableAmount.add(lineGross);
            }

            BigDecimal lineTotal = lineGross.add(lineVat);

            PharmacySaleItem saleItem = new PharmacySaleItem();
            saleItem.setItem(item);
            saleItem.setBatch(batch);
            saleItem.setUnitType(unitType);
            saleItem.setQuantity(quantity);
            saleItem.setUnitsDeducted(unitsToDeduct);
            saleItem.setUnitPrice(unitPrice);
            saleItem.setIsVatApplicable(isVat);
            saleItem.setVatPercentage(vatPct);
            saleItem.setVatAmount(lineVat);
            saleItem.setTotalPrice(lineTotal);
            saleItem.setDosageInstruction(itemReq.dosageInstruction());

            sale.addItem(saleItem);
        }

        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(BigDecimal.ZERO);
        sale.setTaxableAmount(taxableAmount);
        sale.setNonTaxableAmount(nonTaxableAmount);
        sale.setVatAmount(vatAmount);

        BigDecimal netTotal = subtotal.add(vatAmount);
        sale.setNetTotal(netTotal);

        BigDecimal paid = req.paidAmount() != null && req.paidAmount().compareTo(BigDecimal.ZERO) > 0
                ? req.paidAmount()
                : netTotal;
        sale.setPaidAmount(paid);
        sale.setChangeAmount(paid.compareTo(netTotal) > 0 ? paid.subtract(netTotal) : BigDecimal.ZERO);
        sale.setStatus("COMPLETED");

        PharmacySale saved = saleRepository.save(sale);
        return toReceiptDto(saved);
    }

    private SaleReceiptDto toReceiptDto(PharmacySale s) {
        List<SaleReceiptItemDto> items = s.getItems().stream().map(i -> new SaleReceiptItemDto(
                i.getItem().getId(),
                i.getItem().getName(),
                i.getItem().getGenericName(),
                i.getBatch().getBatchNumber(),
                i.getBatch().getExpiryDate(),
                i.getUnitType(),
                i.getQuantity(),
                i.getUnitsDeducted(),
                i.getUnitPrice(),
                i.getIsVatApplicable(),
                i.getVatAmount(),
                i.getTotalPrice(),
                i.getDosageInstruction()
        )).toList();

        return new SaleReceiptDto(
                s.getId(),
                s.getInvoiceNumber(),
                s.getSaleType(),
                s.getPatient() != null ? s.getPatient().getId() : null,
                s.getCustomerName(),
                s.getCustomerPhone(),
                s.getDoctor() != null ? s.getDoctor().getId() : null,
                s.getDoctorName(),
                s.getReseller() != null ? s.getReseller().getId() : null,
                s.getReseller() != null ? s.getReseller().getName() : null,
                s.getSubtotal(),
                s.getDiscountAmount(),
                s.getTaxableAmount(),
                s.getNonTaxableAmount(),
                s.getVatAmount(),
                s.getNetTotal(),
                s.getPaidAmount(),
                s.getChangeAmount(),
                s.getPaymentMethod(),
                s.getStatus(),
                s.getRefillReminderDays(),
                s.getNotes(),
                s.getCreatedAt(),
                items
        );
    }
}
