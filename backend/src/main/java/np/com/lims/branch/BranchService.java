package np.com.lims.branch;

import np.com.lims.branch.dto.BranchDtos.CreateRequest;
import np.com.lims.branch.dto.BranchDtos.Response;
import np.com.lims.branch.dto.BranchDtos.UpdateRequest;
import np.com.lims.branch.entity.Branch;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class BranchService {

    private static final String MODULE = "BRANCH";

    private final BranchRepository repository;
    private final AuditService auditService;

    public BranchService(BranchRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<Response> list(boolean activeOnly) {
        List<Branch> branches = activeOnly
                ? repository.findAllByActiveTrueOrderByNameAsc()
                : repository.findAllByOrderByNameAsc();
        return branches.stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Response get(Long id) {
        return Response.from(find(id));
    }

    @Transactional
    public Response create(CreateRequest request) {
        String code = request.code().trim().toUpperCase();
        if (repository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A branch with code " + code + " already exists");
        }
        Branch branch = Branch.create(code, request.name().trim());
        branch.update(request.name().trim(), trimToNull(request.addressLine()), trimToNull(request.city()),
                trimToNull(request.phone()), trimToNull(request.email()));
        Branch saved = repository.save(branch);
        auditService.record(MODULE, "CREATE", "Branch", saved.getId(),
                "Created branch " + saved.getName(), null, Response.from(saved));
        return Response.from(saved);
    }

    @Transactional
    public Response update(Long id, UpdateRequest request) {
        Branch branch = find(id);
        Response before = Response.from(branch);
        branch.update(request.name().trim(), trimToNull(request.addressLine()), trimToNull(request.city()),
                trimToNull(request.phone()), trimToNull(request.email()));
        auditService.record(MODULE, "UPDATE", "Branch", id,
                "Updated branch " + branch.getName(), before, Response.from(branch));
        return Response.from(branch);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Branch branch = find(id);
        if (branch.isActive() == active) {
            return;
        }
        if (!active && repository.findAllByActiveTrueOrderByNameAsc().size() <= 1) {
            throw ApiException.conflict("At least one branch must remain active");
        }
        branch.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "Branch", id,
                (active ? "Activated" : "Deactivated") + " branch " + branch.getName(), null, null);
    }

    private Branch find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Branch", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
