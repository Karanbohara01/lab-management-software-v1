package np.com.lims.microbiology.web;

import jakarta.validation.Valid;
import np.com.lims.microbiology.MicrobiologyService;
import np.com.lims.microbiology.MicrobiologyService.AntibioticDto;
import np.com.lims.microbiology.MicrobiologyService.AntibioticUpsert;
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
@RequestMapping("/microbiology/antibiotics")
public class MicrobiologyController {

    private final MicrobiologyService service;

    public MicrobiologyController(MicrobiologyService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public List<AntibioticDto> antibiotics(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return service.antibiotics(activeOnly);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public AntibioticDto create(@Valid @RequestBody AntibioticUpsert request) {
        return service.save(null, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public AntibioticDto update(@PathVariable Long id, @Valid @RequestBody AntibioticUpsert request) {
        return service.save(id, request);
    }
}
