package np.com.lims.catalog.web;

import jakarta.validation.Valid;
import np.com.lims.platform.MasterCatalogService;
import np.com.lims.platform.dto.MasterCatalogDtos.ImportRequest;
import np.com.lims.platform.dto.MasterCatalogDtos.ImportResult;
import np.com.lims.platform.dto.MasterCatalogDtos.ListItem;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The clinic-facing half of the master lab test catalogue — browse the platform's shared library
 * and import selected tests into this organization's own catalog. Deliberately a separate
 * controller/path from {@code PlatformController} (which stays entirely behind
 * {@code PERM_PLATFORM_MANAGE}, the platform-admin curation side): every clinic with ordinary
 * {@code TEST_CATALOG_*} permissions needs this, not just platform admins.
 */
@RestController
@RequestMapping("/catalog/master-tests")
public class MasterCatalogController {

    private final MasterCatalogService service;

    public MasterCatalogController(MasterCatalogService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public List<ListItem> list() {
        return service.listActive();
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public ImportResult importTests(@Valid @RequestBody ImportRequest request) {
        return service.importInto(request.masterTestIds());
    }
}
