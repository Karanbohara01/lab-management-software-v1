package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateWholesalerRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.WholesalerDto;
import np.com.lims.pharmacy.entity.PharmacyWholesaler;
import np.com.lims.pharmacy.repository.PharmacyWholesalerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PharmacyWholesalerService {

    private final PharmacyWholesalerRepository repository;

    public PharmacyWholesalerService(PharmacyWholesalerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<WholesalerDto> list() {
        return repository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public WholesalerDto create(CreateWholesalerRequest req) {
        PharmacyWholesaler w = new PharmacyWholesaler();
        w.setName(req.name());
        w.setContactPerson(req.contactPerson());
        w.setPhone(req.phone());
        w.setEmail(req.email());
        w.setAddress(req.address());
        w.setPanVatNumber(req.panVatNumber());
        w.setDdaRegistrationNo(req.ddaRegistrationNo());
        if (req.creditPeriodDays() != null) w.setCreditPeriodDays(req.creditPeriodDays());
        return toDto(repository.save(w));
    }

    @Transactional
    public WholesalerDto update(Long id, CreateWholesalerRequest req) {
        PharmacyWholesaler w = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Wholesaler not found: " + id));
        w.setName(req.name());
        w.setContactPerson(req.contactPerson());
        w.setPhone(req.phone());
        w.setEmail(req.email());
        w.setAddress(req.address());
        w.setPanVatNumber(req.panVatNumber());
        w.setDdaRegistrationNo(req.ddaRegistrationNo());
        if (req.creditPeriodDays() != null) w.setCreditPeriodDays(req.creditPeriodDays());
        return toDto(repository.save(w));
    }

    @Transactional
    public void delete(Long id) {
        PharmacyWholesaler w = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Wholesaler not found: " + id));
        w.setIsActive(false);
        repository.save(w);
    }

    private WholesalerDto toDto(PharmacyWholesaler w) {
        return new WholesalerDto(
                w.getId(),
                w.getName(),
                w.getContactPerson(),
                w.getPhone(),
                w.getEmail(),
                w.getAddress(),
                w.getPanVatNumber(),
                w.getDdaRegistrationNo(),
                w.getCreditPeriodDays(),
                w.getIsActive()
        );
    }
}
