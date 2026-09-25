package np.com.lims.catalog.web;

import jakarta.validation.Valid;
import np.com.lims.catalog.ReflexRuleService;
import np.com.lims.catalog.dto.ReflexRuleDtos.CreateRequest;
import np.com.lims.catalog.dto.ReflexRuleDtos.ListItem;
import np.com.lims.catalog.dto.ReflexRuleDtos.UpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@org.springframework.web.bind.annotation.RequestMapping("/reflex-rules")
public class ReflexRuleController {

    private final ReflexRuleService service;

    public ReflexRuleController(ReflexRuleService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_READ')")
    public List<ListItem> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public ListItem create(@Valid @RequestBody CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public ListItem update(@PathVariable Long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
