package np.com.lims.pharmacy.web;

import jakarta.validation.Valid;
import np.com.lims.pharmacy.dto.PharmacyDtos.BatchDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateDispenseRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateItemRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreatePurchaseRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateResellerRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateWholesalerRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.ItemDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.PharmacyDashboardStats;
import np.com.lims.pharmacy.dto.PharmacyDtos.PurchaseSummaryDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.ResellerDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.SaleReceiptDto;
import np.com.lims.pharmacy.dto.PharmacyDtos.WholesalerDto;
import np.com.lims.pharmacy.service.PharmacyBatchService;
import np.com.lims.pharmacy.service.PharmacyDashboardService;
import np.com.lims.pharmacy.service.PharmacyDispenseService;
import np.com.lims.pharmacy.service.PharmacyItemService;
import np.com.lims.pharmacy.service.PharmacyPurchaseService;
import np.com.lims.pharmacy.service.PharmacyResellerService;
import np.com.lims.pharmacy.service.PharmacyWholesalerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/pharmacy")
public class PharmacyController {

    private final PharmacyItemService itemService;
    private final PharmacyBatchService batchService;
    private final PharmacyWholesalerService wholesalerService;
    private final PharmacyResellerService resellerService;
    private final PharmacyPurchaseService purchaseService;
    private final PharmacyDispenseService dispenseService;
    private final PharmacyDashboardService dashboardService;

    public PharmacyController(PharmacyItemService itemService,
                              PharmacyBatchService batchService,
                              PharmacyWholesalerService wholesalerService,
                              PharmacyResellerService resellerService,
                              PharmacyPurchaseService purchaseService,
                              PharmacyDispenseService dispenseService,
                              PharmacyDashboardService dashboardService) {
        this.itemService = itemService;
        this.batchService = batchService;
        this.wholesalerService = wholesalerService;
        this.resellerService = resellerService;
        this.purchaseService = purchaseService;
        this.dispenseService = dispenseService;
        this.dashboardService = dashboardService;
    }

    // --- Statistics ---
    @GetMapping("/stats")
    public PharmacyDashboardStats getStats() {
        return dashboardService.getStats();
    }

    // --- Medicines & Items ---
    @GetMapping("/items")
    public Page<ItemDto> listItems(@RequestParam(required = false) String query,
                                  @PageableDefault(size = 50) Pageable pageable) {
        return itemService.list(query, pageable);
    }

    @GetMapping("/items/{id}")
    public ItemDto getItem(@PathVariable Long id) {
        return itemService.getById(id);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemDto createItem(@Valid @RequestBody CreateItemRequest req) {
        return itemService.create(req);
    }

    @PutMapping("/items/{id}")
    public ItemDto updateItem(@PathVariable Long id, @Valid @RequestBody CreateItemRequest req) {
        return itemService.update(id, req);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Long id) {
        itemService.delete(id);
    }

    // --- Batches & Expiry ---
    @GetMapping("/batches")
    public List<BatchDto> listBatches() {
        return batchService.listAvailable();
    }

    @GetMapping("/batches/item/{itemId}")
    public List<BatchDto> listBatchesByItem(@PathVariable Long itemId) {
        return batchService.listByItem(itemId);
    }

    @GetMapping("/batches/expiring")
    public List<BatchDto> listExpiringBatches(@RequestParam(defaultValue = "60") int days) {
        return batchService.listExpiring(days);
    }

    @GetMapping("/batches/expired")
    public List<BatchDto> listExpiredBatches() {
        return batchService.listExpired();
    }

    @PostMapping("/batches/{id}/discard")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void discardBatch(@PathVariable Long id) {
        batchService.discardBatch(id);
    }

    // --- Wholesalers ---
    @GetMapping("/wholesalers")
    public List<WholesalerDto> listWholesalers() {
        return wholesalerService.list();
    }

    @PostMapping("/wholesalers")
    @ResponseStatus(HttpStatus.CREATED)
    public WholesalerDto createWholesaler(@Valid @RequestBody CreateWholesalerRequest req) {
        return wholesalerService.create(req);
    }

    @PutMapping("/wholesalers/{id}")
    public WholesalerDto updateWholesaler(@PathVariable Long id, @Valid @RequestBody CreateWholesalerRequest req) {
        return wholesalerService.update(id, req);
    }

    @DeleteMapping("/wholesalers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWholesaler(@PathVariable Long id) {
        wholesalerService.delete(id);
    }

    // --- Resellers ---
    @GetMapping("/resellers")
    public List<ResellerDto> listResellers() {
        return resellerService.list();
    }

    @PostMapping("/resellers")
    @ResponseStatus(HttpStatus.CREATED)
    public ResellerDto createReseller(@Valid @RequestBody CreateResellerRequest req) {
        return resellerService.create(req);
    }

    @PutMapping("/resellers/{id}")
    public ResellerDto updateReseller(@PathVariable Long id, @Valid @RequestBody CreateResellerRequest req) {
        return resellerService.update(id, req);
    }

    @DeleteMapping("/resellers/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReseller(@PathVariable Long id) {
        resellerService.delete(id);
    }

    // --- Purchases (Inward GRN) ---
    @GetMapping("/purchases")
    public Page<PurchaseSummaryDto> listPurchases(@PageableDefault(size = 20) Pageable pageable) {
        return purchaseService.list(pageable);
    }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseSummaryDto createPurchase(@Valid @RequestBody CreatePurchaseRequest req) {
        return purchaseService.createPurchase(req);
    }

    // --- Dispense / Counter Sales (POS) ---
    @GetMapping("/sales")
    public Page<SaleReceiptDto> listSales(@PageableDefault(size = 20) Pageable pageable) {
        return dispenseService.listSales(pageable);
    }

    @GetMapping("/sales/{id}")
    public SaleReceiptDto getSale(@PathVariable Long id) {
        return dispenseService.getSaleById(id);
    }

    @PostMapping("/dispense")
    @ResponseStatus(HttpStatus.CREATED)
    public SaleReceiptDto dispense(@Valid @RequestBody CreateDispenseRequest req) {
        return dispenseService.dispense(req);
    }
}
