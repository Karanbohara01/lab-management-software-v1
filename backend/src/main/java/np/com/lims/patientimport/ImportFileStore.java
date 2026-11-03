package np.com.lims.patientimport;

import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.patientimport.read.CsvReader;
import np.com.lims.patientimport.read.TabularReader;
import np.com.lims.patientimport.read.XlsxReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

/**
 * Where uploaded spreadsheets live while an import runs, and how they are read back.
 *
 * <p>Files are written under a configured directory, one per job, named after the job rather than
 * after what the clinic called it: a patient list is sensitive, and a filename like
 * "Patients_Marici_2019.xlsx" on disk tells anyone who can list the directory more than it should.
 * The original name is kept in the database, for the administrator.
 *
 * <p>Each tenant gets its own subdirectory, so no path built from one clinic's job can ever reach
 * another's file.
 */
@Component
public class ImportFileStore {

    private static final Logger log = LoggerFactory.getLogger(ImportFileStore.class);

    /** Upload formats that can actually be read. */
    public enum Format { XLSX, CSV }

    private final Path root;

    public ImportFileStore(@Value("${lims.patient-import.directory:./patient-imports}") String directory) {
        this.root = Path.of(directory);
    }

    /** What a filename claims to be, rejecting anything this module cannot read with a useful message. */
    public static Format formatOf(String originalFilename) {
        String name = originalFilename == null ? "" : originalFilename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
            return Format.XLSX;
        }
        if (name.endsWith(".csv") || name.endsWith(".txt") || name.endsWith(".tsv")) {
            return Format.CSV;
        }
        if (name.endsWith(".xls")) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "The older .xls format cannot be read. Open the file in Excel and use File, Save As to save "
                            + "it as .xlsx or CSV, then upload that.");
        }
        throw new ApiException(ErrorCode.VALIDATION_FAILED,
                "Only Excel (.xlsx) and CSV files can be imported. This file is " + extensionOf(name) + ".");
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 || dot == name.length() - 1 ? "of an unknown type" : "a " + name.substring(dot) + " file";
    }

    public record Stored(String storedFilename, long sizeBytes, String checksum) {
    }

    /**
     * Writes the upload to disk, returning its stored name and a checksum of its contents. The
     * checksum is what lets the system notice that the same file is being imported twice.
     */
    public Stored store(Long organizationId, MultipartFile upload, Format format) {
        if (upload == null || upload.isEmpty()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "The uploaded file is empty.");
        }
        String storedName = UUID.randomUUID() + "." + format.name().toLowerCase(Locale.ROOT);
        Path target = pathFor(organizationId, storedName);
        try {
            Files.createDirectories(target.getParent());
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream in = new DigestInputStream(new BufferedInputStream(upload.getInputStream()), digest)) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new Stored(storedName, Files.size(target), HexFormat.of().formatHex(digest.digest()));
        } catch (NoSuchAlgorithmException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Could not checksum the uploaded file");
        } catch (IOException e) {
            log.error("Could not store an uploaded patient import for organization {}", organizationId, e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "The uploaded file could not be saved.");
        }
    }

    /**
     * Opens a stored file for reading. The stored name is one this module generated, and the path is
     * rebuilt from the tenant and that name rather than from anything a request supplied.
     */
    public TabularReader open(Long organizationId, String storedFilename, Format format) {
        Path file = pathFor(organizationId, storedFilename);
        if (!Files.isRegularFile(file)) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "The uploaded file is no longer available. Upload it again to re-run this import.");
        }
        try {
            if (format == Format.XLSX) {
                if (!XlsxReader.looksLikeXlsx(file)) {
                    throw new ApiException(ErrorCode.VALIDATION_FAILED,
                            "This file is named .xlsx but is not an Excel workbook. If it is really the older .xls "
                                    + "format, re-save it as .xlsx or CSV.");
                }
                return XlsxReader.open(file);
            }
            return new CsvReader(new BufferedInputStream(new FileInputStream(file.toFile()), 64 * 1024));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Could not read patient import file {} for organization {}", storedFilename, organizationId, e);
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "This file could not be read. Check that it is a valid Excel workbook or CSV file.");
        }
    }

    public boolean exists(Long organizationId, String storedFilename) {
        return Files.isRegularFile(pathFor(organizationId, storedFilename));
    }

    public void delete(Long organizationId, String storedFilename) {
        try {
            Files.deleteIfExists(pathFor(organizationId, storedFilename));
        } catch (IOException e) {
            log.warn("Could not delete patient import file {} for organization {}", storedFilename, organizationId, e);
        }
    }

    /**
     * The file's location. The stored name is validated even though this module generated it: a
     * defect elsewhere must not become a path that escapes the tenant's directory.
     */
    private Path pathFor(Long organizationId, String storedFilename) {
        if (storedFilename == null || !storedFilename.matches("[A-Za-z0-9._-]{1,120}")) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Invalid import file reference.");
        }
        return root.resolve("org-" + organizationId).resolve(storedFilename).normalize();
    }
}
