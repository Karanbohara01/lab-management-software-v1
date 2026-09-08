package np.com.lims.result.comment;

import np.com.lims.catalog.LabTestRepository;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.DepartmentRepository;
import np.com.lims.department.entity.Department;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResultCommentTemplateService {

    public record TemplateDto(Long id, CommentScope scope, Long departmentId, String departmentName,
                              Long testId, String testCode, String category, String title, String body,
                              int displayOrder, boolean active) {
        static TemplateDto from(ResultCommentTemplate t) {
            return new TemplateDto(t.getId(), t.getScope(),
                    t.getDepartment() == null ? null : t.getDepartment().getId(),
                    t.getDepartment() == null ? null : t.getDepartment().getName(),
                    t.getTest() == null ? null : t.getTest().getId(),
                    t.getTest() == null ? null : t.getTest().getCode(),
                    t.getCategory(), t.getTitle(), t.getBody(), t.getDisplayOrder(), t.isActive());
        }
    }

    public record UpsertRequest(CommentScope scope, Long departmentId, Long testId, String category,
                                String title, String body, int displayOrder, Boolean active) {
    }

    private final ResultCommentTemplateRepository repository;
    private final DepartmentRepository departmentRepository;
    private final LabTestRepository testRepository;

    public ResultCommentTemplateService(ResultCommentTemplateRepository repository,
                                        DepartmentRepository departmentRepository,
                                        LabTestRepository testRepository) {
        this.repository = repository;
        this.departmentRepository = departmentRepository;
        this.testRepository = testRepository;
    }

    @Transactional(readOnly = true)
    public List<TemplateDto> all() {
        return repository.findAllByOrderByScopeAscDisplayOrderAscIdAsc().stream().map(TemplateDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TemplateDto> applicable(Long testId) {
        Long departmentId = null;
        if (testId != null) {
            departmentId = testRepository.findById(testId).map(t -> t.getDepartment().getId()).orElse(null);
        }
        return repository.findApplicable(departmentId, testId).stream().map(TemplateDto::from).toList();
    }

    @Transactional
    public TemplateDto create(UpsertRequest r) {
        ResultCommentTemplate t = ResultCommentTemplate.create();
        apply(t, r);
        return TemplateDto.from(repository.save(t));
    }

    @Transactional
    public TemplateDto update(Long id, UpsertRequest r) {
        ResultCommentTemplate t = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Comment template", id));
        apply(t, r);
        return TemplateDto.from(t);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void apply(ResultCommentTemplate t, UpsertRequest r) {
        Department department = r.departmentId() == null ? null : departmentRepository.findById(r.departmentId())
                .orElseThrow(() -> ApiException.notFound("Department", r.departmentId()));
        LabTest test = r.testId() == null ? null : testRepository.findById(r.testId())
                .orElseThrow(() -> ApiException.notFound("Test", r.testId()));
        t.update(r.scope(), department, test, trim(r.category()), trim(r.title()), trim(r.body()),
                r.displayOrder(), r.active() == null || r.active());
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
