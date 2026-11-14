package np.com.lims.catalog.web;

import jakarta.validation.Valid;
import np.com.lims.catalog.LabTestService;
import np.com.lims.catalog.TestCatalogCsvWriter;
import np.com.lims.catalog.TestCatalogImportService;
import np.com.lims.catalog.dto.TestDtos.CreateRequest;
import np.com.lims.catalog.dto.TestDtos.Detail;
import np.com.lims.catalog.dto.TestDtos.ListItem;
import np.com.lims.catalog.dto.TestDtos.UpdateRequest;
import np.com.lims.catalog.dto.TestImportDtos.ImportResult;
import np.com.lims.common.api.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/tests")
public class TestCatalogController {

    private final LabTestService service;
    private final TestCatalogImportService importService;

    public TestCatalogController(LabTestService service, TestCatalogImportService importService) {
        this.service = service;
        this.importService = importService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public PageResponse<ListItem> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return PageResponse.from(service.search(query, departmentId, activeOnly, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public Detail get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail create(@Valid @RequestBody CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/active")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public Detail setActive(@PathVariable Long id, @RequestParam boolean value) {
        service.setActive(id, value);
        return service.get(id);
    }

    /** The whole catalog as CSV — "migrate to a new system" and "edit prices in a spreadsheet,
     * re-upload" both start here. */
    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public ResponseEntity<byte[]> export() {
        return download("test-catalog.csv", TestCatalogCsvWriter.export(service.listAllForCsv()));
    }

    /** A blank catalog with the expected columns, two worked examples and usage notes. */
    @GetMapping(value = "/import/template", produces = "text/csv")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public ResponseEntity<byte[]> importTemplate() {
        return download("test-catalog-template.csv", TestCatalogCsvWriter.template());
    }

    @PostMapping(value = "/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public ImportResult importCsv(@RequestPart("file") MultipartFile file) {
        return importService.importCsv(file);
    }

    private static ResponseEntity<byte[]> download(String filename, String body) {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(bytes);
    }
}
