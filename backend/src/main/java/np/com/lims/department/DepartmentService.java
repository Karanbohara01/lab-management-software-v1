package np.com.lims.department;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.department.dto.DepartmentDtos.CreateRequest;
import np.com.lims.department.dto.DepartmentDtos.Response;
import np.com.lims.department.dto.DepartmentDtos.UpdateRequest;
import np.com.lims.department.entity.Department;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class DepartmentService {

    private static final String MODULE = "DEPARTMENT";

    private final DepartmentRepository repository;
    private final AuditService auditService;

    public DepartmentService(DepartmentRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<Response> list(boolean activeOnly) {
        List<Department> departments = activeOnly
                ? repository.findAllByActiveTrueOrderByNameAsc()
                : repository.findAllByOrderByNameAsc();
        return departments.stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Response get(Long id) {
        return Response.from(find(id));
    }

    @Transactional
    public Response create(CreateRequest request) {
        String code = request.code().trim().toUpperCase();
        if (repository.existsByCodeIgnoreCase(code)) {
            throw ApiException.conflict("A department with code " + code + " already exists");
        }
        Department department = Department.create(code, request.name().trim());
        department.update(request.name().trim(), trimToNull(request.description()));
        Department saved = repository.save(department);
        auditService.record(MODULE, "CREATE", "Department", saved.getId(),
                "Created department " + saved.getName(), null, Response.from(saved));
        return Response.from(saved);
    }

    @Transactional
    public Response update(Long id, UpdateRequest request) {
        Department department = find(id);
        Response before = Response.from(department);
        department.update(request.name().trim(), trimToNull(request.description()));
        auditService.record(MODULE, "UPDATE", "Department", id,
                "Updated department " + department.getName(), before, Response.from(department));
        return Response.from(department);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Department department = find(id);
        if (department.isActive() == active) {
            return;
        }
        department.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "Department", id,
                (active ? "Activated" : "Deactivated") + " department " + department.getName(), null, null);
    }

    private Department find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Department", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
