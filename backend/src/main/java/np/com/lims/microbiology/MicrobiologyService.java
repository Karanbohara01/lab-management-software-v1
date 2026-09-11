package np.com.lims.microbiology;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.microbiology.entity.Antibiotic;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Antibiotic master list used to build culture susceptibility panels. */
@Service
public class MicrobiologyService {

    private static final String MODULE = "MICROBIOLOGY";

    public record AntibioticDto(Long id, String code, String name, String drugClass, boolean active) {
        static AntibioticDto from(Antibiotic a) {
            return new AntibioticDto(a.getId(), a.getCode(), a.getName(), a.getDrugClass(), a.isActive());
        }
    }

    public record AntibioticUpsert(
            @NotBlank @Size(max = 16) String code,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 60) String drugClass,
            Boolean active
    ) {
    }

    private final AntibioticRepository repository;
    private final AuditService auditService;

    public MicrobiologyService(AntibioticRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AntibioticDto> antibiotics(boolean activeOnly) {
        List<Antibiotic> list = activeOnly
                ? repository.findAllByActiveTrueOrderByDrugClassAscNameAsc()
                : repository.findAllByOrderByDrugClassAscNameAsc();
        return list.stream().map(AntibioticDto::from).toList();
    }

    @Transactional
    public AntibioticDto save(Long id, AntibioticUpsert req) {
        String code = req.code().trim().toUpperCase();
        Antibiotic antibiotic;
        if (id == null) {
            if (repository.existsByCodeIgnoreCase(code)) {
                throw ApiException.conflict("An antibiotic with code " + code + " already exists");
            }
            antibiotic = repository.save(Antibiotic.create(code, req.name().trim(), trim(req.drugClass())));
            auditService.record(MODULE, "CREATE_ANTIBIOTIC", "Antibiotic", antibiotic.getId(),
                    "Added antibiotic " + code, null, null);
        } else {
            antibiotic = repository.findById(id).orElseThrow(() -> ApiException.notFound("Antibiotic", id));
            antibiotic.update(req.name().trim(), trim(req.drugClass()), req.active() == null || req.active());
            auditService.record(MODULE, "UPDATE_ANTIBIOTIC", "Antibiotic", id,
                    "Updated antibiotic " + antibiotic.getCode(), null, null);
        }
        return AntibioticDto.from(antibiotic);
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
