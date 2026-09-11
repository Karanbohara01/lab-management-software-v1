package np.com.lims.backup.dto;

import np.com.lims.backup.entity.BackupRun;
import np.com.lims.backup.entity.BackupStatus;

import java.time.Instant;

public final class BackupDtos {

    private BackupDtos() {
    }

    public record ListItem(
            Long id, BackupStatus status, Instant startedAt, Instant completedAt,
            Long fileSizeBytes, Integer tableCount, Long rowCount, String errorMessage, String triggeredBy
    ) {
        public static ListItem from(BackupRun r) {
            return new ListItem(r.getId(), r.getStatus(), r.getStartedAt(), r.getCompletedAt(),
                    r.getFileSizeBytes(), r.getTableCount(), r.getRowCount(), r.getErrorMessage(), r.getTriggeredBy());
        }
    }
}
