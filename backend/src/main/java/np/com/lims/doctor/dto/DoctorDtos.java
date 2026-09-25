package np.com.lims.doctor.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import np.com.lims.doctor.entity.Doctor;

public final class DoctorDtos {

    private DoctorDtos() {
    }

    public record UpsertRequest(
            @NotBlank @Size(max = 160) String fullName,
            @Size(max = 120) String specialization,
            @Size(max = 160) String qualification,
            @Size(max = 40) String nmcNumber,
            @Size(max = 32) String phone,
            @Email @Size(max = 160) String email,
            @Size(max = 200) String affiliatedOrganization,
            @jakarta.validation.constraints.DecimalMin("0.0") @jakarta.validation.constraints.DecimalMax("100.0")
            java.math.BigDecimal commissionRate
    ) {
    }

    public record Response(
            Long id,
            String fullName,
            String specialization,
            String qualification,
            String nmcNumber,
            String phone,
            String email,
            String affiliatedOrganization,
            java.math.BigDecimal commissionRate,
            boolean active
    ) {
        public static Response from(Doctor d) {
            return new Response(d.getId(), d.getFullName(), d.getSpecialization(), d.getQualification(),
                    d.getNmcNumber(), d.getPhone(), d.getEmail(), d.getAffiliatedOrganization(),
                    d.getCommissionRate(), d.isActive());
        }
    }
}
