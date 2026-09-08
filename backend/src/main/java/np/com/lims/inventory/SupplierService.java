package np.com.lims.inventory;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.inventory.dto.InventoryDtos.SupplierRequest;
import np.com.lims.inventory.dto.InventoryDtos.SupplierResponse;
import np.com.lims.inventory.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class SupplierService {

    private static final String MODULE = "INVENTORY";

    private final SupplierRepository repository;
    private final AuditService auditService;

    public SupplierService(SupplierRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponse> search(String query, boolean activeOnly, Pageable pageable) {
        return repository.search(StringUtils.hasText(query) ? query.trim() : null, activeOnly, pageable)
                .map(SupplierResponse::from);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> activeList() {
        return repository.findAllByActiveTrueOrderByNameAsc().stream().map(SupplierResponse::from).toList();
    }

    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        Supplier supplier = Supplier.create(request.name().trim());
        apply(supplier, request);
        Supplier saved = repository.save(supplier);
        auditService.record(MODULE, "SUPPLIER_CREATE", "Supplier", saved.getId(),
                "Added supplier " + saved.getName(), null, SupplierResponse.from(saved));
        return SupplierResponse.from(saved);
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest request) {
        Supplier supplier = find(id);
        apply(supplier, request);
        auditService.record(MODULE, "SUPPLIER_UPDATE", "Supplier", id,
                "Updated supplier " + supplier.getName(), null, SupplierResponse.from(supplier));
        return SupplierResponse.from(supplier);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Supplier supplier = find(id);
        supplier.setActive(active);
        auditService.record(MODULE, active ? "SUPPLIER_ACTIVATE" : "SUPPLIER_DEACTIVATE", "Supplier", id,
                (active ? "Activated" : "Deactivated") + " supplier " + supplier.getName(), null, null);
    }

    Supplier require(Long id) {
        return find(id);
    }

    private void apply(Supplier supplier, SupplierRequest r) {
        supplier.update(r.name().trim(), trimToNull(r.contactPerson()), trimToNull(r.phone()),
                trimToNull(r.email()), trimToNull(r.address()), trimToNull(r.panNumber()));
    }

    private Supplier find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Supplier", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
