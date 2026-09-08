package np.com.lims.qc.web;

import np.com.lims.qc.QcService;
import np.com.lims.qc.QcService.ControlStatus;
import np.com.lims.qc.QcService.LeveyJennings;
import np.com.lims.qc.QcService.MaterialDto;
import np.com.lims.qc.QcService.MaterialUpsert;
import np.com.lims.qc.QcService.RunDto;
import np.com.lims.qc.QcService.RunRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/qc")
public class QcController {

    private final QcService service;

    public QcController(QcService service) {
        this.service = service;
    }

    @GetMapping("/materials")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public List<MaterialDto> materials() {
        return service.materials();
    }

    @PostMapping("/materials")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public MaterialDto create(@RequestBody MaterialUpsert request) {
        return service.saveMaterial(null, request);
    }

    @PutMapping("/materials/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public MaterialDto update(@PathVariable Long id, @RequestBody MaterialUpsert request) {
        return service.saveMaterial(id, request);
    }

    @PostMapping("/runs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_RESULT_ENTER')")
    public RunDto recordRun(@RequestBody RunRequest request) {
        return service.recordRun(request);
    }

    @PostMapping("/runs/{id}/accept")
    @PreAuthorize("hasAuthority('PERM_RESULT_VERIFY')")
    public RunDto acceptRun(@PathVariable Long id, @RequestParam(required = false) String comment) {
        return service.acceptRun(id, comment);
    }

    @GetMapping("/runs")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public List<RunDto> runs(@RequestParam Long testId, @RequestParam(defaultValue = "50") int limit) {
        return service.runsForTest(testId, limit);
    }

    @GetMapping("/levey-jennings")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public LeveyJennings leveyJennings(@RequestParam Long materialId, @RequestParam Long parameterId) {
        return service.leveyJennings(materialId, parameterId);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public ControlStatus status(@RequestParam Long testId) {
        return service.controlStatus(testId);
    }
}
