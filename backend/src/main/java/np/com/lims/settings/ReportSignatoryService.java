package np.com.lims.settings;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.tenant.TenantGuard;
import np.com.lims.settings.dto.ReportSignatoryDtos.Response;
import np.com.lims.settings.dto.ReportSignatoryDtos.UpsertRequest;
import np.com.lims.settings.entity.ReportSignatory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ReportSignatoryService {

    private final ReportSignatoryRepository repository;

    public ReportSignatoryService(ReportSignatoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Response> list() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream().map(Response::from).toList();
    }

    @Transactional
    public Response create(UpsertRequest request) {
        ReportSignatory signatory = ReportSignatory.create();
        apply(signatory, request);
        return Response.from(repository.save(signatory));
    }

    @Transactional
    public Response update(Long id, UpsertRequest request) {
        ReportSignatory signatory = TenantGuard.owned(repository.findById(id), ReportSignatory::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Signatory", id));
        apply(signatory, request);
        return Response.from(signatory);
    }

    @Transactional
    public void delete(Long id) {
        // deleteById() has the same bare-findById gap TenantGuard exists for (see its javadoc) —
        // load-and-check first rather than deleting blind by id.
        ReportSignatory signatory = TenantGuard.owned(repository.findById(id), ReportSignatory::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Signatory", id));
        repository.delete(signatory);
    }

    private void apply(ReportSignatory signatory, UpsertRequest request) {
        String signature = StringUtils.hasText(request.signatureDataUri()) ? request.signatureDataUri() : null;
        signatory.update(request.title().trim(), signature, request.displayOrder());
    }
}
