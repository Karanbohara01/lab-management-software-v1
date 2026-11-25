package np.com.lims.pharmacy.service;

import np.com.lims.common.exception.ApiException;
import np.com.lims.pharmacy.dto.PharmacyDtos.CreateResellerRequest;
import np.com.lims.pharmacy.dto.PharmacyDtos.ResellerDto;
import np.com.lims.pharmacy.entity.PharmacyReseller;
import np.com.lims.pharmacy.repository.PharmacyResellerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PharmacyResellerService {

    private final PharmacyResellerRepository repository;

    public PharmacyResellerService(PharmacyResellerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ResellerDto> list() {
        return repository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ResellerDto create(CreateResellerRequest req) {
        PharmacyReseller r = new PharmacyReseller();
        r.setName(req.name());
        r.setContactPerson(req.contactPerson());
        r.setPhone(req.phone());
        r.setEmail(req.email());
        r.setAddress(req.address());
        r.setPanVatNumber(req.panVatNumber());
        if (req.discountPercentage() != null) r.setDiscountPercentage(req.discountPercentage());
        if (req.creditLimit() != null) r.setCreditLimit(req.creditLimit());
        return toDto(repository.save(r));
    }

    @Transactional
    public ResellerDto update(Long id, CreateResellerRequest req) {
        PharmacyReseller r = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Reseller not found: " + id));
        r.setName(req.name());
        r.setContactPerson(req.contactPerson());
        r.setPhone(req.phone());
        r.setEmail(req.email());
        r.setAddress(req.address());
        r.setPanVatNumber(req.panVatNumber());
        if (req.discountPercentage() != null) r.setDiscountPercentage(req.discountPercentage());
        if (req.creditLimit() != null) r.setCreditLimit(req.creditLimit());
        return toDto(repository.save(r));
    }

    @Transactional
    public void delete(Long id) {
        PharmacyReseller r = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Reseller not found: " + id));
        r.setIsActive(false);
        repository.save(r);
    }

    private ResellerDto toDto(PharmacyReseller r) {
        return new ResellerDto(
                r.getId(),
                r.getName(),
                r.getContactPerson(),
                r.getPhone(),
                r.getEmail(),
                r.getAddress(),
                r.getPanVatNumber(),
                r.getDiscountPercentage(),
                r.getCreditLimit(),
                r.getCurrentBalance(),
                r.getIsActive()
        );
    }
}
