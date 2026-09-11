package np.com.lims.settings;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.settings.dto.LaboratoryProfileDtos.Response;
import np.com.lims.settings.dto.LaboratoryProfileDtos.UpdateRequest;
import np.com.lims.settings.entity.LaboratoryProfile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class LaboratoryProfileService {

    private final LaboratoryProfileRepository repository;
    private final AuditService auditService;

    public LaboratoryProfileService(LaboratoryProfileRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public LaboratoryProfile require() {
        return repository.findById(LaboratoryProfile.SINGLETON_ID)
                .orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "Laboratory profile is not initialised"));
    }

    @Transactional(readOnly = true)
    public Response get() {
        return Response.from(require());
    }

    @Transactional
    public Response update(UpdateRequest request) {
        LaboratoryProfile profile = require();
        Response before = Response.from(profile);
        profile.update(
                request.name().trim(),
                trimToNull(request.addressLine()),
                trimToNull(request.city()),
                trimToNull(request.phone()),
                trimToNull(request.email()),
                trimToNull(request.panNumber()),
                trimToNull(request.reportFooter()),
                trimToNull(request.logoDataUri()));
        profile.updateBilling(request.fiscalYear().trim(), request.invoicePrefix().trim().toUpperCase(),
                request.defaultTaxRate());
        profile.updateInventory(request.inventoryExpiryAlertDays() == null ? 30 : request.inventoryExpiryAlertDays());
        profile.updateOperations(request.requirePaymentBeforeCollection());
        auditService.record("SETTINGS", "UPDATE", "LaboratoryProfile", profile.getId(),
                "Updated laboratory profile", before, Response.from(profile));
        return Response.from(profile);
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
