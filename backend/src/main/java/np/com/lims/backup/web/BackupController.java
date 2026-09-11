package np.com.lims.backup.web;

import np.com.lims.backup.DatabaseBackupService;
import np.com.lims.backup.dto.BackupDtos.ListItem;
import np.com.lims.backup.entity.BackupRun;
import np.com.lims.backup.entity.BackupStatus;
import np.com.lims.common.api.PageResponse;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.web.CurrentUser;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

@RestController
@RequestMapping("/backups")
public class BackupController {

    private final DatabaseBackupService service;

    public BackupController(DatabaseBackupService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_BACKUP_READ')")
    public PageResponse<ListItem> list(
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return PageResponse.from(service.list(pageable).map(ListItem::from));
    }

    /**
     * Runs a backup synchronously and returns once finished. A full-database dump can take a
     * while on a large installation — the caller should expect this request to be slow, not
     * treat a long wait as a failure.
     */
    @PostMapping("/run")
    @PreAuthorize("hasAuthority('PERM_BACKUP_MANAGE')")
    public ListItem run() {
        return ListItem.from(service.run(CurrentUser.username()));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAuthority('PERM_BACKUP_MANAGE')")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        BackupRun run = service.get(id);
        if (run.getStatus() != BackupStatus.SUCCEEDED || run.getFilePath() == null) {
            throw ApiException.conflict("This backup did not complete successfully — nothing to download");
        }
        File file = new File(run.getFilePath());
        if (!file.exists()) {
            throw ApiException.notFound("Backup file (it may have been moved or deleted on disk)", id);
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .body(new FileSystemResource(file));
    }
}
