package np.com.lims.catalog.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import np.com.lims.catalog.entity.ReflexRule;
import np.com.lims.catalog.entity.ReflexTrigger;

public final class ReflexRuleDtos {

    private ReflexRuleDtos() {
    }

    public record CreateRequest(
            @NotNull Long sourceTestId,
            @NotNull ReflexTrigger trigger,
            @NotNull Long targetTestId,
            @Size(max = 500) String note
    ) {
    }

    public record UpdateRequest(
            @NotNull ReflexTrigger trigger,
            @NotNull Long targetTestId,
            @Size(max = 500) String note,
            boolean active
    ) {
    }

    public record ListItem(
            Long id, Long sourceTestId, String sourceTestName, ReflexTrigger trigger,
            Long targetTestId, String targetTestName, String note, boolean active
    ) {
        public static ListItem from(ReflexRule r, String sourceTestName, String targetTestName) {
            return new ListItem(r.getId(), r.getSourceTestId(), sourceTestName, r.getTrigger(),
                    r.getTargetTestId(), targetTestName, r.getNote(), r.isActive());
        }
    }
}
