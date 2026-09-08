package np.com.lims.doctor;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.doctor.dto.DoctorDtos.Response;
import np.com.lims.doctor.dto.DoctorDtos.UpsertRequest;
import np.com.lims.doctor.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DoctorService {

    private static final String MODULE = "DOCTOR";

    private final DoctorRepository repository;
    private final AuditService auditService;

    public DoctorService(DoctorRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<Response> search(String query, boolean activeOnly, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return repository.search(normalized, activeOnly, pageable).map(Response::from);
    }

    @Transactional(readOnly = true)
    public Response get(Long id) {
        return Response.from(find(id));
    }

    @Transactional
    public Response create(UpsertRequest request) {
        assertNmcAvailable(request.nmcNumber(), null);
        Doctor doctor = Doctor.create(request.fullName().trim());
        apply(doctor, request);
        Doctor saved = repository.save(doctor);
        auditService.record(MODULE, "CREATE", "Doctor", saved.getId(),
                "Created referring doctor " + saved.getFullName(), null, Response.from(saved));
        return Response.from(saved);
    }

    @Transactional
    public Response update(Long id, UpsertRequest request) {
        Doctor doctor = find(id);
        assertNmcAvailable(request.nmcNumber(), doctor);
        Response before = Response.from(doctor);
        apply(doctor, request);
        auditService.record(MODULE, "UPDATE", "Doctor", id,
                "Updated referring doctor " + doctor.getFullName(), before, Response.from(doctor));
        return Response.from(doctor);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Doctor doctor = find(id);
        if (doctor.isActive() == active) {
            return;
        }
        doctor.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "Doctor", id,
                (active ? "Activated" : "Deactivated") + " referring doctor " + doctor.getFullName(), null, null);
    }

    private void apply(Doctor doctor, UpsertRequest r) {
        doctor.update(
                r.fullName().trim(),
                trimToNull(r.specialization()),
                trimToNull(r.qualification()),
                trimToNull(r.nmcNumber()),
                trimToNull(r.phone()),
                trimToNull(r.email()),
                trimToNull(r.affiliatedOrganization()));
    }

    private void assertNmcAvailable(String nmcNumber, Doctor current) {
        String normalized = trimToNull(nmcNumber);
        if (normalized == null) {
            return;
        }
        boolean sameAsCurrent = current != null && normalized.equalsIgnoreCase(current.getNmcNumber());
        if (!sameAsCurrent && repository.existsByNmcNumberIgnoreCase(normalized)) {
            throw ApiException.conflict("A doctor with NMC number " + normalized + " already exists");
        }
    }

    private Doctor find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Doctor", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
