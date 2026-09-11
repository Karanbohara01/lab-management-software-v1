package np.com.lims.branch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import np.com.lims.branch.entity.Branch;

public final class BranchDtos {

    private BranchDtos() {
    }

    public record CreateRequest(
            @NotBlank @Size(max = 24) @Pattern(regexp = "[A-Za-z0-9_-]+", message = "Code may only contain letters, digits, - and _")
            String code,
            @NotBlank @Size(max = 160) String name,
            @Size(max = 300) String addressLine,
            @Size(max = 120) String city,
            @Size(max = 64) String phone,
            @Email @Size(max = 160) String email
    ) {
    }

    public record UpdateRequest(
            @NotBlank @Size(max = 160) String name,
            @Size(max = 300) String addressLine,
            @Size(max = 120) String city,
            @Size(max = 64) String phone,
            @Email @Size(max = 160) String email
    ) {
    }

    public record Response(
            Long id,
            String code,
            String name,
            String addressLine,
            String city,
            String phone,
            String email,
            boolean active
    ) {
        public static Response from(Branch b) {
            return new Response(b.getId(), b.getCode(), b.getName(), b.getAddressLine(), b.getCity(),
                    b.getPhone(), b.getEmail(), b.isActive());
        }
    }
}
