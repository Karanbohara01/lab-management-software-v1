package np.com.lims.result.comment.web;

import np.com.lims.result.comment.ResultCommentTemplateService;
import np.com.lims.result.comment.ResultCommentTemplateService.TemplateDto;
import np.com.lims.result.comment.ResultCommentTemplateService.UpsertRequest;
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
@RequestMapping("/result-comment-templates")
public class ResultCommentTemplateController {

    private final ResultCommentTemplateService service;

    public ResultCommentTemplateController(ResultCommentTemplateService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public List<TemplateDto> list() {
        return service.all();
    }

    @GetMapping("/applicable")
    @PreAuthorize("hasAuthority('PERM_RESULT_READ')")
    public List<TemplateDto> applicable(@RequestParam(required = false) Long testId) {
        return service.applicable(testId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public TemplateDto create(@RequestBody UpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public TemplateDto update(@PathVariable Long id, @RequestBody UpsertRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('PERM_TEST_CATALOG_WRITE')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
