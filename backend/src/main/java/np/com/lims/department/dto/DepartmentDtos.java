package np.com.lims.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import np.com.lims.department.entity.Department;

public final class DepartmentDtos {

    private DepartmentDtos() {
    }

    public record CreateRequest(
            @NotBlank @Size(max = 24) @Pattern(regexp = "[A-Za-z0-9_-]+", message = "Code may only contain letters, digits, - and _")
            String code,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description
    ) {
    }

    public record UpdateRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description
    ) {
    }

    public record Response(
            Long id,
            String code,
            String name,
            String description,
            boolean active
    ) {
        public static Response from(Department d) {
            return new Response(d.getId(), d.getCode(), d.getName(), d.getDescription(), d.isActive());
        }
    }
}
