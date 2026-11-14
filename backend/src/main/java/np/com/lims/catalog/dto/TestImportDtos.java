package np.com.lims.catalog.dto;

import java.util.List;

public final class TestImportDtos {

    private TestImportDtos() {
    }

    public record RowError(int rowNumber, String code, String message) {
    }

    public record ImportResult(List<String> created, List<String> updated, List<RowError> errors) {
    }
}
