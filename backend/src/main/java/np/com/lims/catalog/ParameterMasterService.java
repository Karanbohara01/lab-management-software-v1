package np.com.lims.catalog;

import np.com.lims.catalog.dto.ParameterMasterDtos.Response;
import np.com.lims.catalog.dto.ParameterMasterDtos.UpsertRequest;
import np.com.lims.catalog.entity.ParameterMaster;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantContext;
import np.com.lims.common.tenant.TenantGuard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ParameterMasterService {

    private static final String MODULE = "PARAMETER_MASTER";

    private final ParameterMasterRepository repository;
    private final AuditService auditService;

    public ParameterMasterService(ParameterMasterRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<Response> search(String query, boolean activeOnly, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        return repository.search(TenantContext.require(), normalized, activeOnly, pageable).map(Response::from);
    }

    @Transactional
    public Response create(UpsertRequest request) {
        Long orgId = TenantContext.require();
        String name = request.name().trim();
        if (repository.existsByNameIgnoreCaseAndOrganizationId(name, orgId)) {
            throw ApiException.conflict("A parameter named \"" + name + "\" already exists in your dictionary");
        }
        ParameterMaster p = ParameterMaster.create(name);
        apply(p, request);
        ParameterMaster saved = repository.save(p);
        auditService.record(MODULE, "CREATE", "ParameterMaster", saved.getId(), "Added parameter " + saved.getName(), null, Response.from(saved));
        return Response.from(saved);
    }

    @Transactional
    public Response update(Long id, UpsertRequest request) {
        ParameterMaster p = load(id);
        String name = request.name().trim();
        if (!name.equalsIgnoreCase(p.getName())
                && repository.existsByNameIgnoreCaseAndOrganizationId(name, TenantContext.require())) {
            throw ApiException.conflict("A parameter named \"" + name + "\" already exists in your dictionary");
        }
        apply(p, request);
        auditService.record(MODULE, "UPDATE", "ParameterMaster", p.getId(), "Updated parameter " + p.getName(), null, Response.from(p));
        return Response.from(p);
    }

    /**
     * Gives a newly-provisioned organization the same starter dictionary migration V48 gave every
     * organization that already existed — called once from {@code PlatformService.provision()}.
     * Safe to call more than once (e.g. a retried signup): does nothing if the organization
     * already has any parameters at all, rather than risking duplicate rows.
     */
    @Transactional
    public void seedDefaults(Long organizationId) {
        if (repository.search(organizationId, null, false, org.springframework.data.domain.Pageable.ofSize(1))
                .hasContent()) {
            return;
        }
        for (DefaultParameterPresets.Preset preset : DefaultParameterPresets.ALL) {
            ParameterMaster p = ParameterMaster.createFor(organizationId, preset.name());
            p.update(preset.name(), preset.code(), preset.unit(), np.com.lims.catalog.entity.ParameterDataType.NUMERIC,
                    preset.decimalPlaces(), null, null, preset.groupHeading(), null,
                    preset.low(), preset.high(), preset.criticalLow(), preset.criticalHigh());
            repository.save(p);
        }
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        ParameterMaster p = load(id);
        p.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "ParameterMaster", p.getId(),
                (active ? "Activated" : "Deactivated") + " parameter " + p.getName(), null, null);
    }

    private void apply(ParameterMaster p, UpsertRequest r) {
        p.update(r.name().trim(), trimToNull(r.code()), trimToNull(r.unit()), r.dataType(), r.decimalPlaces(),
                trimToNull(r.method()), trimToNull(r.loincCode()), trimToNull(r.groupHeading()),
                trimToNull(r.allowedValues()), r.lowValue(), r.highValue(), r.criticalLow(), r.criticalHigh());
    }

    private ParameterMaster load(Long id) {
        return TenantGuard.owned(repository.findById(id), ParameterMaster::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Parameter", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
