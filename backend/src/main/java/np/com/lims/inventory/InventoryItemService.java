package np.com.lims.inventory;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import np.com.lims.inventory.dto.InventoryDtos.AdjustBatchRequest;
import np.com.lims.inventory.dto.InventoryDtos.DiscardBatchRequest;
import np.com.lims.inventory.dto.InventoryDtos.InventorySummary;
import np.com.lims.inventory.dto.InventoryDtos.ItemCreateRequest;
import np.com.lims.inventory.dto.InventoryDtos.ItemDetail;
import np.com.lims.inventory.dto.InventoryDtos.ItemListItem;
import np.com.lims.inventory.dto.InventoryDtos.ItemUpdateRequest;
import np.com.lims.inventory.dto.InventoryDtos.IssueStockRequest;
import np.com.lims.inventory.dto.InventoryDtos.ReceiveStockRequest;
import np.com.lims.inventory.dto.InventoryDtos.TransactionDto;
import np.com.lims.inventory.entity.InventoryBatch;
import np.com.lims.inventory.entity.InventoryItem;
import np.com.lims.inventory.entity.ItemCategory;
import np.com.lims.inventory.entity.StockStatus;
import np.com.lims.inventory.entity.StockTransaction;
import np.com.lims.inventory.entity.StockTransactionType;
import np.com.lims.settings.LaboratoryProfileService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class InventoryItemService {

    private static final String MODULE = "INVENTORY";

    private final InventoryItemRepository itemRepository;
    private final InventoryBatchRepository batchRepository;
    private final StockTransactionRepository txnRepository;
    private final DepartmentRepository departmentRepository;
    private final SupplierService supplierService;
    private final LaboratoryProfileService laboratoryProfileService;
    private final AuditService auditService;

    public InventoryItemService(InventoryItemRepository itemRepository,
                                InventoryBatchRepository batchRepository,
                                StockTransactionRepository txnRepository,
                                DepartmentRepository departmentRepository,
                                SupplierService supplierService,
                                LaboratoryProfileService laboratoryProfileService,
                                AuditService auditService) {
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.txnRepository = txnRepository;
        this.departmentRepository = departmentRepository;
        this.supplierService = supplierService;
        this.laboratoryProfileService = laboratoryProfileService;
        this.auditService = auditService;
    }

    private int alertDays() {
        return laboratoryProfileService.require().getInventoryExpiryAlertDays();
    }

    @Transactional(readOnly = true)
    public Page<ItemListItem> search(String query, ItemCategory category, Long departmentId,
                                     boolean activeOnly, Pageable pageable) {
        LocalDate today = LocalDate.now();
        int days = alertDays();
        return itemRepository
                .search(StringUtils.hasText(query) ? query.trim() : null, category, departmentId, activeOnly, pageable)
                .map(i -> ItemListItem.from(i, today, days));
    }

    @Transactional(readOnly = true)
    public ItemDetail get(Long id) {
        return ItemDetail.from(load(id), LocalDate.now(), alertDays());
    }

    @Transactional(readOnly = true)
    public Page<TransactionDto> transactions(Long itemId, Pageable pageable) {
        return txnRepository.findByItemIdOrderByOccurredAtDesc(itemId, pageable).map(TransactionDto::from);
    }

    @Transactional(readOnly = true)
    public InventorySummary summary() {
        LocalDate today = LocalDate.now();
        int days = alertDays();
        List<ItemListItem> rows = itemRepository.findByActiveTrue().stream()
                .map(i -> ItemListItem.from(i, today, days)).toList();
        Map<String, Long> counts = new TreeMap<>();
        for (StockStatus s : StockStatus.values()) {
            counts.put(s.name(), 0L);
        }
        rows.forEach(r -> counts.merge(r.status().name(), 1L, Long::sum));
        List<ItemListItem> alerts = rows.stream()
                .filter(r -> r.status() != StockStatus.IN_STOCK)
                .sorted((a, b) -> a.status().compareTo(b.status()))
                .toList();
        return new InventorySummary(counts, alerts);
    }

    @Transactional
    public ItemDetail create(ItemCreateRequest request) {
        String code = request.code().trim().toUpperCase();
        if (itemRepository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("An item with code " + code + " already exists");
        }
        InventoryItem item = InventoryItem.create(code, request.name().trim(), request.category(),
                request.unit().trim());
        item.update(request.name().trim(), request.category(), request.unit().trim(),
                request.minimumStock(), department(request.departmentId()), trimToNull(request.notes()));
        InventoryItem saved = itemRepository.save(item);
        auditService.record(MODULE, "ITEM_CREATE", "InventoryItem", saved.getId(),
                "Created inventory item " + saved.getCode(), null, null);
        return ItemDetail.from(saved, LocalDate.now(), alertDays());
    }

    @Transactional
    public ItemDetail update(Long id, ItemUpdateRequest request) {
        InventoryItem item = load(id);
        item.update(request.name().trim(), request.category(), request.unit().trim(),
                request.minimumStock(), department(request.departmentId()), trimToNull(request.notes()));
        auditService.record(MODULE, "ITEM_UPDATE", "InventoryItem", id,
                "Updated inventory item " + item.getCode(), null, null);
        return ItemDetail.from(item, LocalDate.now(), alertDays());
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        InventoryItem item = load(id);
        item.setActive(active);
        auditService.record(MODULE, active ? "ITEM_ACTIVATE" : "ITEM_DEACTIVATE", "InventoryItem", id,
                (active ? "Activated" : "Deactivated") + " inventory item " + item.getCode(), null, null);
    }

    @Transactional
    public ItemDetail receiveStock(Long itemId, ReceiveStockRequest request) {
        InventoryItem item = load(itemId);
        var supplier = request.supplierId() == null ? null : supplierService.require(request.supplierId());
        InventoryBatch batch = item.receive(request.batchNumber().trim(), supplier,
                request.receivedDate() == null ? LocalDate.now() : request.receivedDate(),
                request.expiryDate(), request.quantity(), request.unitCost(), trimToNull(request.notes()));
        itemRepository.flush();
        txnRepository.save(new StockTransaction(item, batch, StockTransactionType.RECEIPT, request.quantity(),
                item.quantityOnHand(), "Stock received", trimToNull(request.reference()), CurrentUser.username()));
        auditService.record(MODULE, "RECEIVE", "InventoryItem", itemId,
                "Received " + request.quantity() + " " + item.getUnit() + " of " + item.getCode()
                        + " (batch " + request.batchNumber() + ")", null, null);
        return ItemDetail.from(item, LocalDate.now(), alertDays());
    }

    @Transactional
    public ItemDetail issueStock(Long itemId, IssueStockRequest request) {
        InventoryItem item = load(itemId);
        List<InventoryItem.BatchDraw> draws = item.issueFefo(request.quantity());
        String actor = CurrentUser.username();
        BigDecimal running = item.quantityOnHand().add(request.quantity());
        for (InventoryItem.BatchDraw draw : draws) {
            running = running.subtract(draw.taken());
            txnRepository.save(new StockTransaction(item, draw.batch(), StockTransactionType.ISSUE,
                    draw.taken().negate(), running, request.reason().trim(), trimToNull(request.reference()), actor));
        }
        auditService.record(MODULE, "ISSUE", "InventoryItem", itemId,
                "Issued " + request.quantity() + " " + item.getUnit() + " of " + item.getCode()
                        + " – " + request.reason(), null, null);
        return ItemDetail.from(item, LocalDate.now(), alertDays());
    }

    @Transactional
    public ItemDetail adjustBatch(Long batchId, AdjustBatchRequest request) {
        InventoryBatch batch = batchRepository.findWithItemById(batchId)
                .orElseThrow(() -> ApiException.notFound("Batch", batchId));
        InventoryItem item = load(batch.getItem().getId());
        InventoryBatch managed = item.getBatches().stream().filter(b -> b.getId().equals(batchId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Batch", batchId));
        BigDecimal delta = request.newQuantity().subtract(managed.getRemainingQuantity());
        managed.setRemaining(request.newQuantity());
        txnRepository.save(new StockTransaction(item, managed, StockTransactionType.ADJUSTMENT, delta,
                item.quantityOnHand(), request.reason().trim(), null, CurrentUser.username()));
        auditService.record(MODULE, "ADJUST", "InventoryBatch", batchId,
                "Adjusted batch " + managed.getBatchNumber() + " of " + item.getCode() + " by " + delta
                        + " – " + request.reason(), null, null);
        return ItemDetail.from(item, LocalDate.now(), alertDays());
    }

    @Transactional
    public ItemDetail discardBatch(Long batchId, DiscardBatchRequest request) {
        InventoryBatch batch = batchRepository.findWithItemById(batchId)
                .orElseThrow(() -> ApiException.notFound("Batch", batchId));
        InventoryItem item = load(batch.getItem().getId());
        InventoryBatch managed = item.getBatches().stream().filter(b -> b.getId().equals(batchId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Batch", batchId));
        BigDecimal amount = managed.getRemainingQuantity();
        if (amount.signum() <= 0) {
            throw ApiException.conflict("Batch has no remaining stock to discard");
        }
        managed.setRemaining(BigDecimal.ZERO);
        txnRepository.save(new StockTransaction(item, managed, StockTransactionType.WASTAGE, amount.negate(),
                item.quantityOnHand(), request.reason().trim(), null, CurrentUser.username()));
        auditService.record(MODULE, "DISCARD", "InventoryBatch", batchId,
                "Discarded " + amount + " " + item.getUnit() + " from batch " + managed.getBatchNumber()
                        + " of " + item.getCode() + " – " + request.reason(), null, null);
        return ItemDetail.from(item, LocalDate.now(), alertDays());
    }

    /** Package-internal hook used by purchase-order receiving. Runs in the caller's transaction. */
    InventoryBatch receiveIntoItem(InventoryItem managedItem, String batchNumber, np.com.lims.inventory.entity.Supplier supplier,
                                   LocalDate expiryDate, BigDecimal quantity, BigDecimal unitCost, String reference) {
        InventoryBatch batch = managedItem.receive(batchNumber, supplier, LocalDate.now(), expiryDate,
                quantity, unitCost, null);
        itemRepository.flush();
        txnRepository.save(new StockTransaction(managedItem, batch, StockTransactionType.RECEIPT, quantity,
                managedItem.quantityOnHand(), "Received against " + reference, reference, CurrentUser.username()));
        return batch;
    }

    InventoryItem load(Long id) {
        return itemRepository.findDetailedById(id).orElseThrow(() -> ApiException.notFound("Inventory item", id));
    }

    private Department department(Long departmentId) {
        if (departmentId == null) {
            return null;
        }
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> ApiException.notFound("Department", departmentId));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
