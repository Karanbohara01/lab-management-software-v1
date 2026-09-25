package np.com.lims.catalog;

import np.com.lims.catalog.dto.ReflexRuleDtos.CreateRequest;
import np.com.lims.catalog.dto.ReflexRuleDtos.ListItem;
import np.com.lims.catalog.dto.ReflexRuleDtos.UpdateRequest;
import np.com.lims.catalog.entity.LabTest;
import np.com.lims.catalog.entity.ReflexRule;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReflexRuleService {

    private static final String MODULE = "TEST_CATALOG";

    private final ReflexRuleRepository repository;
    private final LabTestRepository testRepository;
    private final AuditService auditService;

    public ReflexRuleService(ReflexRuleRepository repository, LabTestRepository testRepository,
                             AuditService auditService) {
        this.repository = repository;
        this.testRepository = testRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ListItem> list() {
        List<ReflexRule> rules = repository.findAllByOrderBySourceTestIdAsc();
        Map<Long, String> names = testRepository.findAll().stream()
                .collect(Collectors.toMap(LabTest::getId, LabTest::getName, (a, b) -> a));
        return rules.stream()
                .map(r -> ListItem.from(r, names.get(r.getSourceTestId()), names.get(r.getTargetTestId())))
                .toList();
    }

    @Transactional
    public ListItem create(CreateRequest request) {
        LabTest source = testRepository.findById(request.sourceTestId())
                .orElseThrow(() -> ApiException.notFound("Test", request.sourceTestId()));
        LabTest target = testRepository.findById(request.targetTestId())
                .orElseThrow(() -> ApiException.notFound("Test", request.targetTestId()));
        if (source.getId().equals(target.getId())) {
            throw ApiException.conflict("A test cannot reflex to itself");
        }
        ReflexRule rule = ReflexRule.create(source.getId(), request.trigger(), target.getId(), trimToNull(request.note()));
        ReflexRule saved = repository.save(rule);
        auditService.record(MODULE, "REFLEX_RULE_CREATE", "ReflexRule", saved.getId(),
                "Added reflex rule: " + source.getName() + " (" + request.trigger() + ") -> " + target.getName(), null, null);
        return ListItem.from(saved, source.getName(), target.getName());
    }

    @Transactional
    public ListItem update(Long id, UpdateRequest request) {
        ReflexRule rule = repository.findById(id).orElseThrow(() -> ApiException.notFound("Reflex rule", id));
        LabTest target = testRepository.findById(request.targetTestId())
                .orElseThrow(() -> ApiException.notFound("Test", request.targetTestId()));
        rule.update(request.trigger(), target.getId(), trimToNull(request.note()));
        rule.setActive(request.active());
        auditService.record(MODULE, "REFLEX_RULE_UPDATE", "ReflexRule", id,
                "Updated reflex rule " + id + " (active=" + request.active() + ")", null, null);
        String sourceName = testRepository.findById(rule.getSourceTestId()).map(LabTest::getName).orElse(null);
        return ListItem.from(rule, sourceName, target.getName());
    }

    @Transactional
    public void delete(Long id) {
        ReflexRule rule = repository.findById(id).orElseThrow(() -> ApiException.notFound("Reflex rule", id));
        repository.delete(rule);
        auditService.record(MODULE, "REFLEX_RULE_DELETE", "ReflexRule", id, "Deleted reflex rule " + id, null, null);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
