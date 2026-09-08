package np.com.lims.inventory;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.inventory.dto.InventoryDtos.PoCancelRequest;
import np.com.lims.inventory.dto.InventoryDtos.PoDetail;
import np.com.lims.inventory.dto.InventoryDtos.PoLineRequest;
import np.com.lims.inventory.dto.InventoryDtos.PoListItem;
import np.com.lims.inventory.dto.InventoryDtos.PoReceiveLine;
import np.com.lims.inventory.dto.InventoryDtos.PoReceiveRequest;
import np.com.lims.inventory.dto.InventoryDtos.PoUpsertRequest;
import np.com.lims.inventory.entity.InventoryItem;
import np.com.lims.inventory.entity.PurchaseOrder;
import np.com.lims.inventory.entity.PurchaseOrderItem;
import np.com.lims.inventory.entity.PurchaseOrderStatus;
import np.com.lims.inventory.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class PurchaseOrderService {

    private static final String MODULE = "INVENTORY";
    private static final String PO_SEQUENCE = "PURCHASE_ORDER";

    private final PurchaseOrderRepository repository;
    private final SupplierService supplierService;
    private final InventoryItemService itemService;
    private final SequenceService sequenceService;
    private final AuditService auditService;

    public PurchaseOrderService(PurchaseOrderRepository repository,
                                SupplierService supplierService,
                                InventoryItemService itemService,
                                SequenceService sequenceService,
                                AuditService auditService) {
        this.repository = repository;
        this.supplierService = supplierService;
        this.itemService = itemService;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<PoListItem> search(PurchaseOrderStatus status, String query, Pageable pageable) {
        return repository.search(status, StringUtils.hasText(query) ? query.trim() : null, pageable)
                .map(PoListItem::from);
    }

    @Transactional(readOnly = true)
    public PoDetail get(Long id) {
        return PoDetail.from(load(id));
    }

    @Transactional
    public PoDetail create(PoUpsertRequest request) {
        Supplier supplier = supplierService.require(request.supplierId());
        String number = sequenceService.nextFormatted(PO_SEQUENCE, "PO", 6);
        PurchaseOrder po = PurchaseOrder.draft(number, supplier, request.expectedDate(),
                trimToNull(request.notes()));
        po.replaceItems(buildLines(po, request.lines()));
        PurchaseOrder saved = repository.save(po);
        auditService.record(MODULE, "PO_CREATE", "PurchaseOrder", saved.getId(),
                "Created purchase order " + number + " for " + supplier.getName(), null, null);
        return PoDetail.from(saved);
    }

    @Transactional
    public PoDetail update(Long id, PoUpsertRequest request) {
        PurchaseOrder po = load(id);
        Supplier supplier = supplierService.require(request.supplierId());
        po.updateHeader(supplier, request.expectedDate(), trimToNull(request.notes()));
        po.replaceItems(buildLines(po, request.lines()));
        auditService.record(MODULE, "PO_UPDATE", "PurchaseOrder", id,
                "Updated purchase order " + po.getPoNumber(), null, null);
        return PoDetail.from(po);
    }

    @Transactional
    public PoDetail submit(Long id) {
        PurchaseOrder po = load(id);
        po.submit(CurrentUser.username());
        auditService.record(MODULE, "PO_SUBMIT", "PurchaseOrder", id,
                "Submitted purchase order " + po.getPoNumber(), null, null);
        return PoDetail.from(po);
    }

    @Transactional
    public PoDetail receive(Long id, PoReceiveRequest request) {
        PurchaseOrder po = load(id);
        String actor = CurrentUser.username();
        for (PoReceiveLine line : request.lines()) {
            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(i -> i.getId().equals(line.poItemId()))
                    .findFirst()
                    .orElseThrow(() -> ApiException.notFound("Purchase order line", line.poItemId()));
            InventoryItem managed = itemService.load(poItem.getItem().getId());
            itemService.receiveIntoItem(managed, line.batchNumber().trim(), po.getSupplier(),
                    line.expiryDate(), line.quantity(), line.unitCost(), po.getPoNumber());
            poItem.recordReceived(line.quantity());
        }
        po.markReceiptProgress(actor);
        auditService.record(MODULE, "PO_RECEIVE", "PurchaseOrder", id,
                "Received stock against purchase order " + po.getPoNumber() + " → " + po.getStatus(), null, null);
        return PoDetail.from(po);
    }

    @Transactional
    public PoDetail cancel(Long id, String reason) {
        PurchaseOrder po = load(id);
        po.cancel(CurrentUser.username(), reason.trim());
        auditService.record(MODULE, "PO_CANCEL", "PurchaseOrder", id,
                "Cancelled purchase order " + po.getPoNumber() + " – " + reason, null, null);
        return PoDetail.from(po);
    }

    private List<PurchaseOrderItem> buildLines(PurchaseOrder po, List<PoLineRequest> lines) {
        return lines.stream()
                .map(line -> po.newItem(itemService.load(line.itemId()), line.quantity(), line.estimatedUnitCost()))
                .toList();
    }

    private PurchaseOrder load(Long id) {
        return repository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Purchase order", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
