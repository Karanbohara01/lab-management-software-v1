package np.com.lims.patient;

import np.com.lims.common.audit.AuditService;
import np.com.lims.common.exception.ApiException;
import np.com.lims.common.exception.ErrorCode;
import np.com.lims.common.sequence.SequenceService;
import np.com.lims.common.web.CurrentUser;
import np.com.lims.common.tenant.TenantGuard;
import np.com.lims.communication.SmsAutomationTriggerService;
import np.com.lims.doctor.DoctorRepository;
import np.com.lims.doctor.entity.Doctor;
import np.com.lims.patient.dto.PatientDtos.AddressDto;
import np.com.lims.patient.dto.PatientDtos.Detail;
import np.com.lims.patient.dto.PatientDtos.IdentifierDto;
import np.com.lims.patient.dto.PatientDtos.ListItem;
import np.com.lims.patient.dto.PatientDtos.MatchCandidate;
import np.com.lims.patient.dto.PatientDtos.MatchRequest;
import np.com.lims.patient.dto.PatientDtos.UpsertRequest;
import np.com.lims.patient.entity.Address;
import np.com.lims.patient.entity.EmergencyContact;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.IdentifierType;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.PatientIdentifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private static final String MODULE = "PATIENT";
    private static final String MRN_SEQUENCE = "PATIENT_MRN";
    private static final String CONFIDENTIAL_AUTH = "PERM_PATIENT_CONFIDENTIAL";
    private static final Set<String> NAME_NOISE =
            Set.of("mr", "mrs", "ms", "miss", "dr", "master", "baby", "b/o", "s/o", "d/o", "w/o", "the", "late");
    /** At or above this score a new registration is blocked unless an override reason is supplied. */
    private static final int HARD_DUPLICATE_SCORE = 85;

    private final PatientRepository patientRepository;
    private final PatientIdentifierRepository identifierRepository;
    private final DoctorRepository doctorRepository;
    private final SequenceService sequenceService;
    private final AuditService auditService;
    private final SmsAutomationTriggerService smsAutomationTriggerService;

    public PatientService(PatientRepository patientRepository,
                          PatientIdentifierRepository identifierRepository,
                          DoctorRepository doctorRepository,
                          SequenceService sequenceService,
                          AuditService auditService,
                          SmsAutomationTriggerService smsAutomationTriggerService) {
        this.patientRepository = patientRepository;
        this.identifierRepository = identifierRepository;
        this.doctorRepository = doctorRepository;
        this.sequenceService = sequenceService;
        this.auditService = auditService;
        this.smsAutomationTriggerService = smsAutomationTriggerService;
    }

    private List<IdentifierDto> identifiersOf(Long patientId) {
        return identifierRepository.findByPatientIdOrderByPrimaryDescIdAsc(patientId).stream()
                .map(IdentifierDto::from).toList();
    }

    private void replaceIdentifiers(Patient patient, List<IdentifierDto> dtos) {
        identifierRepository.deleteByPatientId(patient.getId());
        identifierRepository.flush();
        boolean primaryTaken = false;
        List<PatientIdentifier> toSave = new ArrayList<>();
        for (IdentifierDto d : dtos) {
            if (!StringUtils.hasText(d.value())) {
                continue;
            }
            boolean primary = d.primary() && !primaryTaken;
            primaryTaken = primaryTaken || primary;
            toSave.add(new PatientIdentifier(patient, d.type(), d.value().trim(),
                    trimToNull(d.issuedPlace()), d.issuedDate(), primary, trimToNull(d.note())));
        }
        identifierRepository.saveAll(toSave);
    }

    private boolean canSeeConfidential() {
        return CurrentUser.hasAuthority(CONFIDENTIAL_AUTH);
    }

    @Transactional(readOnly = true)
    public Page<ListItem> search(String query, PatientCategory category, boolean activeOnly, Pageable pageable) {
        String normalized = StringUtils.hasText(query) ? query.trim() : null;
        String digits = normalized == null ? "" : normalized.replaceAll("\\D", "");
        return patientRepository.search(normalized, digits, activeOnly, category, canSeeConfidential(), pageable)
                .map(ListItem::from);
    }

    /** Internal read — enforces confidential access but does not write a view-audit entry. */
    @Transactional(readOnly = true)
    public Detail get(Long id) {
        Patient p = loadReadable(id);
        return Detail.from(p, mergedIntoMrn(p), identifiersOf(id));
    }

    /** Read for an end-user request: enforces access and records an audit entry for confidential records. */
    @Transactional
    public Detail view(Long id) {
        Patient p = loadReadable(id);
        if (p.isConfidential()) {
            auditService.record(MODULE, "VIEW_CONFIDENTIAL", "Patient", id,
                    CurrentUser.username() + " viewed confidential patient " + p.getMrn(), null, null);
        }
        return Detail.from(p, mergedIntoMrn(p), identifiersOf(id));
    }

    @Transactional(readOnly = true)
    public List<MatchCandidate> findPotentialDuplicates(MatchRequest request) {
        return scoreCandidates(request, 8, 25);
    }

    @Transactional(readOnly = true)
    public List<ListItem> findByIdentifier(IdentifierType type, String value) {
        if (!StringUtils.hasText(value)) {
            return List.of();
        }
        boolean conf = canSeeConfidential();
        return identifierRepository.findByTypeAndValueIgnoreCase(type, value.trim()).stream()
                .map(PatientIdentifier::getPatient)
                .filter(p -> p.getMergedIntoId() == null)
                .filter(p -> conf || !p.isConfidential())
                .distinct()
                .map(ListItem::from)
                .toList();
    }

    private Patient loadReadable(Long id) {
        Patient p = load(id);
        if (p.isConfidential() && !canSeeConfidential()) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "This patient record is restricted.");
        }
        return p;
    }

    private String mergedIntoMrn(Patient p) {
        if (p.getMergedIntoId() == null) {
            return null;
        }
        return patientRepository.findById(p.getMergedIntoId()).map(Patient::getMrn).orElse(null);
    }

    @Transactional
    public Detail register(UpsertRequest request) {
        validateAge(request);
        if (request.confidential() && !canSeeConfidential()) {
            throw new ApiException(ErrorCode.ACCESS_DENIED,
                    "You do not have permission to mark a patient record confidential.");
        }
        guardAgainstHardDuplicate(request);

        String mrn = sequenceService.nextFormatted(MRN_SEQUENCE, "P", 6);
        Patient patient = Patient.register(mrn, request.fullName().trim(), request.gender());
        apply(patient, request);
        Patient saved = patientRepository.save(patient);
        replaceIdentifiers(saved, request.identifiersOrEmpty());

        String summary = "Registered patient " + saved.getFullName() + " (" + mrn + ")";
        if (StringUtils.hasText(request.duplicateOverrideReason())) {
            summary += " — duplicate override: " + request.duplicateOverrideReason().trim();
        }
        Detail after = Detail.from(saved, null, identifiersOf(saved.getId()));
        auditService.record(MODULE, "REGISTER", "Patient", saved.getId(), summary, null, after);
        smsAutomationTriggerService.patientRegistered(saved);
        return after;
    }

    /**
     * Creates a patient from one row of a bulk import, inside the caller's batch transaction.
     *
     * <p>Lives here, beside {@link #register}, rather than in the import module, so that patient
     * creation keeps a single owner: the same MRN sequence, the same {@link Patient#register}
     * factory, the same {@link #apply} mapping and the same age rule. If a future field is added to
     * one it is obvious that it belongs in the other.
     *
     * <p>Four things {@link #register} does are deliberately left out, each for a reason that only
     * applies at import scale:
     * <ul>
     *   <li>No duplicate guard. Its name lookup is a leading-wildcard LIKE that cannot use an index;
     *       run once per row against a growing table it would dominate the import. The import does
     *       its own duplicate pass in batches beforehand, and the administrator has already decided
     *       what to do about what it found.</li>
     *   <li>No audit row per patient. {@code AuditService} commits in its own transaction, so a row
     *       apiece would double the transaction count for the whole import. The job writes one audit
     *       entry, and the import's own staged rows are a per-patient record of what came from where.</li>
     *   <li>No identifier rewrite. That path deletes and flushes even when there is nothing to
     *       write, and a spreadsheet import supplies no identifiers.</li>
     *   <li>No confidential flag. A background worker has no security context to check the
     *       permission against, so the import does not offer the field at all.</li>
     * </ul>
     *
     * <p>Deliberately NOT annotated transactional. It runs inside the import batch's transaction,
     * and a transactional annotation here would make it a participant — so when the import catches
     * a bad row and carries on with the rest of the batch, Spring would already have marked the
     * whole transaction rollback-only and the batch would fail at commit having reported success.
     * The guard against being called with no transaction at all remains: the patient-number
     * sequence demands one.
     *
     * @param actor the user who uploaded the file, recorded by the import's own job and row records
     *              since the worker thread carries no security context of its own
     */
    /**
     * Takes a patient number the caller has already reserved through {@link #reserveImportMrns}.
     * The import reserves one block per batch instead of drawing a number per row — see the
     * sequence service for why that is the difference between a batch costing its size and costing
     * its square.
     */
    public Patient createFromImport(UpsertRequest request, String mrn, String actor) {
        validateAge(request);
        Patient patient = Patient.register(mrn, request.fullName().trim(), request.gender());
        apply(patient, request);
        patient.markImported();
        return patientRepository.save(patient);
    }

    /** Reserves {@code count} patient numbers for an import batch, inside the caller's transaction. */
    public List<String> reserveImportMrns(int count) {
        return sequenceService.nextBlockFormatted(MRN_SEQUENCE, "P", 6, count);
    }

    /** Returns the numbers a batch reserved but did not use, so the sequence stays gap-free. */
    public void releaseImportMrns(int unused) {
        sequenceService.releaseUnused(MRN_SEQUENCE, unused);
    }

    /**
     * Fills in fields an existing patient does not have, from one row of an import. Never replaces a
     * value the clinic already holds — an import can complete a record but not rewrite it.
     *
     * <p>Not annotated transactional, for the same reason as {@link #createFromImport}: it runs
     * inside the import batch's transaction, and being a transactional participant would let one
     * caught bad row mark the whole batch rollback-only.
     *
     * @return a human-readable list of what was filled, or empty when the row added nothing
     */
    public List<String> fillBlanksFromImport(Patient patient, UpsertRequest r) {
        List<String> filled = new ArrayList<>();
        if (!StringUtils.hasText(patient.getPhone()) && StringUtils.hasText(r.phone())) {
            filled.add("phone");
        }
        if (!StringUtils.hasText(patient.getEmail()) && StringUtils.hasText(r.email())) {
            filled.add("email");
        }
        if (patient.getDateOfBirth() == null && r.dateOfBirth() != null) {
            filled.add("date of birth");
        }
        if (patient.getBloodGroup() == null && r.bloodGroup() != null) {
            filled.add("blood group");
        }
        if (!StringUtils.hasText(patient.getExternalMrn()) && StringUtils.hasText(r.externalMrn())) {
            filled.add("existing patient ID");
        }
        // Hibernate maps an embeddable whose every column is null to a null reference, so a patient
        // registered without an address has no Address object at all — not an empty one.
        boolean hasAddress = patient.getAddress() != null && !patient.getAddress().isEmpty();
        if (!hasAddress && r.address() != null && StringUtils.hasText(r.address().line())) {
            filled.add("address");
        }
        if (filled.isEmpty()) {
            return List.of();
        }
        patient.fillBlanksFrom(
                trimToNull(r.phone()), trimToNull(r.alternatePhone()), trimToNull(r.email()),
                r.dateOfBirth(), r.approximateAgeYears(), r.bloodGroup(), r.maritalStatus(),
                trimToNull(r.occupation()), trimToNull(r.nameLocal()), trimToNull(r.externalMrn()),
                toAddress(r.address()), toEmergencyContact(r.emergencyContact()));
        return filled;
    }

    @Transactional
    public Detail update(Long id, UpsertRequest request) {
        validateAge(request);
        Patient patient = load(id);
        if (patient.isMerged()) {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "This record has been merged into another and can no longer be edited.");
        }
        if ((patient.isConfidential() || request.confidential()) && !canSeeConfidential()) {
            throw new ApiException(ErrorCode.ACCESS_DENIED, "This patient record is restricted.");
        }
        Detail before = Detail.from(patient, mergedIntoMrn(patient), identifiersOf(id));
        apply(patient, request);
        replaceIdentifiers(patient, request.identifiersOrEmpty());
        Detail after = Detail.from(patient, mergedIntoMrn(patient), identifiersOf(id));
        auditService.record(MODULE, "UPDATE", "Patient", id,
                "Updated patient " + patient.getFullName(), before, after);
        return after;
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Patient patient = load(id);
        if (patient.isActive() == active) {
            return;
        }
        patient.setActive(active);
        auditService.record(MODULE, active ? "ACTIVATE" : "DEACTIVATE", "Patient", id,
                (active ? "Reactivated" : "Deactivated") + " patient " + patient.getFullName(), null, null);
    }

    // --- mapping ------------------------------------------------------------------

    private void apply(Patient patient, UpsertRequest r) {
        String nationality = StringUtils.hasText(r.nationality()) ? r.nationality().trim() : "Nepali";
        patient.applyProfile(
                trimToNull(r.salutation()), r.fullName().trim(), trimToNull(r.nameLocal()), r.gender(),
                r.dateOfBirth(), r.approximateAgeYears(), r.bloodGroup(), r.maritalStatus(),
                trimToNull(r.occupation()), nationality, trimToNull(r.preferredLanguage()));

        patient.applyContact(
                trimToNull(r.phone()), trimToNull(r.alternatePhone()), trimToNull(r.email()),
                toAddress(r.address()), toAddress(r.currentAddress()));

        patient.applyEmergencyContact(toEmergencyContact(r.emergencyContact()));

        patient.applyClassification(r.category(), r.registrationChannel(),
                trimToNull(r.registrationBranch()), trimToNull(r.externalMrn()));

        patient.applyReferral(r.referralSourceType(), trimToNull(r.referralSourceName()),
                resolveDoctor(r.referringDoctorId()));

        patient.applyFlags(r.vip(), r.confidential(), r.deceased(), r.deceasedDate(), r.testRecord());

        if (r.consent() != null) {
            patient.recordConsent(r.consent().store(), r.consent().shareReports(), r.consent().research(),
                    CurrentUser.username());
        }

        patient.applyPayer(r.payer() == null ? null : r.payer().toEntity());

        patient.setNotes(trimToNull(r.notes()));
    }

    private Address toAddress(AddressDto dto) {
        if (dto == null) {
            return new Address();
        }
        Address a = dto.toEntity();
        return a.isEmpty() ? new Address() : a;
    }

    private EmergencyContact toEmergencyContact(np.com.lims.patient.dto.PatientDtos.EmergencyContactDto dto) {
        if (dto == null) {
            return new EmergencyContact();
        }
        EmergencyContact c = dto.toEntity();
        return c.isEmpty() ? new EmergencyContact() : c;
    }

    private Doctor resolveDoctor(Long doctorId) {
        if (doctorId == null) {
            return null;
        }
        return TenantGuard.owned(doctorRepository.findById(doctorId), Doctor::getOrganizationId)
                .orElseThrow(() -> ApiException.notFound("Doctor", doctorId));
    }

    private void validateAge(UpsertRequest r) {
        if (r.dateOfBirth() == null && r.approximateAgeYears() == null) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED,
                    "Either a date of birth or an approximate age is required");
        }
        if (r.deceased() && r.deceasedDate() != null && r.dateOfBirth() != null
                && r.deceasedDate().isBefore(r.dateOfBirth())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Date of death cannot be before date of birth");
        }
    }

    private void guardAgainstHardDuplicate(UpsertRequest r) {
        if (StringUtils.hasText(r.duplicateOverrideReason())) {
            return;
        }
        MatchRequest mr = new MatchRequest(r.fullName(), r.phone(), r.dateOfBirth(),
                r.approximateAgeYears(), r.gender(), null);
        scoreCandidates(mr, 1, HARD_DUPLICATE_SCORE).stream().findFirst().ifPresent(top -> {
            throw new ApiException(ErrorCode.RESOURCE_CONFLICT,
                    "A patient with a very similar name, phone and date of birth already exists (" + top.mrn()
                            + "). Open that record, or provide an override reason to register a new one.");
        });
    }

    // --- duplicate scoring -------------------------------------------------------

    private List<MatchCandidate> scoreCandidates(MatchRequest request, int limit, int minScore) {
        String phoneDigits = normalizeDigits(request.phone());
        List<String> tokens = nameTokens(request.fullName());
        String nameToken = tokens.stream().max(Comparator.comparingInt(String::length))
                .map(t -> "%" + t + "%").orElse(null);

        if (phoneDigits == null && nameToken == null && request.dateOfBirth() == null) {
            return List.of();
        }

        List<Patient> pool = patientRepository.findMatchPool(
                phoneDigits, nameToken, request.dateOfBirth(), PageRequest.of(0, 60));

        Set<String> reqTokenSet = new HashSet<>(tokens);
        String reqNormalized = String.join(" ", tokens);

        boolean includeConfidential = canSeeConfidential();
        return pool.stream()
                .filter(p -> request.excludeId() == null || !request.excludeId().equals(p.getId()))
                .filter(p -> p.getMergedIntoId() == null)
                .filter(p -> includeConfidential || !p.isConfidential())
                .map(p -> {
                    int score = 0;
                    List<String> reasons = new ArrayList<>();

                    if (phoneDigits != null && phoneDigits.equals(p.getPhoneDigits())) {
                        score += 45;
                        reasons.add("Same phone number");
                    }

                    List<String> candTokens = nameTokens(p.getFullName());
                    String candNormalized = String.join(" ", candTokens);
                    if (!reqNormalized.isBlank() && reqNormalized.equals(candNormalized)) {
                        score += 35;
                        reasons.add("Same name");
                    } else {
                        Set<String> candSet = new HashSet<>(candTokens);
                        Set<String> shared = new HashSet<>(reqTokenSet);
                        shared.retainAll(candSet);
                        int union = reqTokenSet.size() + candSet.size() - shared.size();
                        double jaccard = union == 0 ? 0 : (double) shared.size() / union;
                        if (jaccard >= 0.6) {
                            score += 22;
                            reasons.add("Similar name");
                        } else if (!shared.isEmpty()) {
                            score += 8;
                            reasons.add("Shared name part");
                        }
                    }

                    if (request.dateOfBirth() != null && request.dateOfBirth().equals(p.getDateOfBirth())) {
                        score += 25;
                        reasons.add("Same date of birth");
                    } else if (request.dateOfBirth() != null && p.getDateOfBirth() != null
                            && request.dateOfBirth().getYear() == p.getDateOfBirth().getYear()) {
                        score += 8;
                        reasons.add("Same birth year");
                    } else if (request.approximateAgeYears() != null && p.ageYears() != null
                            && Math.abs(request.approximateAgeYears() - p.ageYears()) <= 1) {
                        score += 5;
                        reasons.add("Similar age");
                    }

                    if (request.gender() != null && request.gender() == p.getGender()) {
                        score += 5;
                    }

                    return new MatchCandidate(p.getId(), p.getMrn(), p.getFullName(), p.getGender(), p.ageYears(),
                            p.getPhone(), p.getCategory(), p.isActive(), Math.min(score, 100), reasons,
                            p.getCreatedAt());
                })
                .filter(c -> c.score() >= minScore)
                .sorted(Comparator.comparingInt(MatchCandidate::score).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private static List<String> nameTokens(String name) {
        if (!StringUtils.hasText(name)) {
            return List.of();
        }
        return Arrays.stream(name.toLowerCase().replaceAll("[^a-z0-9\\s]", " ").split("\\s+"))
                .filter(t -> t.length() > 1 && !NAME_NOISE.contains(t))
                .toList();
    }

    private static String normalizeDigits(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() < 7) {
            return null;
        }
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    private Patient load(Long id) {
        return patientRepository.findWithDoctorById(id)
                .orElseThrow(() -> ApiException.notFound("Patient", id));
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
