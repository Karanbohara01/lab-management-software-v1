package np.com.lims.patient.entity;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import np.com.lims.common.audit.BaseEntity;
import np.com.lims.doctor.entity.Doctor;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "patient")
public class Patient extends BaseEntity {

    @Column(nullable = false, length = 24, updatable = false)
    private String mrn;

    @Column(length = 16)
    private String salutation;

    @Column(name = "full_name", nullable = false, length = 160)
    private String fullName;

    /** Name in local script (Devanagari), optional. */
    @Column(name = "name_local", length = 160)
    private String nameLocal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Gender gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    /** Used when an exact DOB is unknown (common in the field); ignored when {@link #dateOfBirth} is set. */
    @Column(name = "approximate_age_years")
    private Integer approximateAgeYears;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_group", length = 16)
    private BloodGroup bloodGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 16)
    private MaritalStatus maritalStatus;

    @Column(length = 120)
    private String occupation;

    @Column(length = 60)
    private String nationality;

    @Column(name = "preferred_language", length = 40)
    private String preferredLanguage;

    @Column(length = 32)
    private String phone;

    @Column(name = "alternate_phone", length = 32)
    private String alternatePhone;

    /** Digits-only, last 10 — maintained from {@link #phone} for search and duplicate detection. */
    @Column(name = "phone_digits", length = 16)
    private String phoneDigits;

    @Column(length = 160)
    private String email;

    @Embedded
    private Address address = new Address();

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "line", column = @Column(name = "current_address_line", length = 200)),
            @AttributeOverride(name = "city", column = @Column(name = "current_city", length = 100)),
            @AttributeOverride(name = "municipality", column = @Column(name = "current_municipality", length = 120)),
            @AttributeOverride(name = "wardNo", column = @Column(name = "current_ward_no", length = 8)),
            @AttributeOverride(name = "tole", column = @Column(name = "current_tole", length = 120)),
            @AttributeOverride(name = "district", column = @Column(name = "current_district", length = 100)),
            @AttributeOverride(name = "province", column = @Column(name = "current_province", length = 100)),
            @AttributeOverride(name = "country", column = @Column(name = "current_country", length = 60)),
    })
    private Address currentAddress = new Address();

    @Embedded
    private EmergencyContact emergencyContact = new EmergencyContact();

    @Enumerated(EnumType.STRING)
    @Column(name = "patient_category", nullable = false, length = 24)
    private PatientCategory category = PatientCategory.WALK_IN;

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_channel", nullable = false, length = 20)
    private RegistrationChannel registrationChannel = RegistrationChannel.WALK_IN;

    @Column(name = "registration_branch", length = 80)
    private String registrationBranch;

    @Column(name = "external_mrn", length = 40)
    private String externalMrn;

    @Enumerated(EnumType.STRING)
    @Column(name = "referral_source_type", nullable = false, length = 24)
    private ReferralSourceType referralSourceType = ReferralSourceType.SELF;

    @Column(name = "referral_source_name", length = 200)
    private String referralSourceName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referring_doctor_id")
    private Doctor referringDoctor;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private boolean vip = false;

    @Column(nullable = false)
    private boolean confidential = false;

    @Column(nullable = false)
    private boolean deceased = false;

    @Column(name = "deceased_date")
    private LocalDate deceasedDate;

    @Column(name = "test_record", nullable = false)
    private boolean testRecord = false;

    @Embedded
    private Consent consent = new Consent();

    @Embedded
    private Payer payer = new Payer();

    @Column(nullable = false)
    private boolean active = true;

    /** When set, this record was merged into another and is retired (kept as an MRN alias). */
    @Column(name = "merged_into_id")
    private Long mergedIntoId;

    @Column(name = "merged_at")
    private java.time.Instant mergedAt;

    @Column(name = "merged_by", length = 100)
    private String mergedBy;

    protected Patient() {
    }

    public static Patient register(String mrn, String fullName, Gender gender) {
        Patient p = new Patient();
        p.mrn = mrn;
        p.fullName = fullName;
        p.gender = gender;
        p.active = true;
        return p;
    }

    // --- mutation, grouped by concern -------------------------------------------------

    public void applyProfile(String salutation, String fullName, String nameLocal, Gender gender,
                             LocalDate dateOfBirth, Integer approximateAgeYears, BloodGroup bloodGroup,
                             MaritalStatus maritalStatus, String occupation, String nationality,
                             String preferredLanguage) {
        this.salutation = salutation;
        this.fullName = fullName;
        this.nameLocal = nameLocal;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.approximateAgeYears = dateOfBirth != null ? null : approximateAgeYears;
        this.bloodGroup = bloodGroup;
        this.maritalStatus = maritalStatus;
        this.occupation = occupation;
        this.nationality = nationality;
        this.preferredLanguage = preferredLanguage;
    }

    public void applyContact(String phone, String alternatePhone, String email,
                             Address address, Address currentAddress) {
        this.phone = phone;
        this.alternatePhone = alternatePhone;
        this.phoneDigits = normalizeDigits(phone);
        this.email = email;
        this.address = address == null ? new Address() : address;
        this.currentAddress = currentAddress == null ? new Address() : currentAddress;
    }

    public void applyEmergencyContact(EmergencyContact contact) {
        this.emergencyContact = contact == null ? new EmergencyContact() : contact;
    }

    public void applyClassification(PatientCategory category, RegistrationChannel channel,
                                    String registrationBranch, String externalMrn) {
        this.category = category == null ? PatientCategory.WALK_IN : category;
        this.registrationChannel = channel == null ? RegistrationChannel.WALK_IN : channel;
        this.registrationBranch = registrationBranch;
        this.externalMrn = externalMrn;
    }

    public void applyReferral(ReferralSourceType sourceType, String sourceName, Doctor doctor) {
        this.referralSourceType = sourceType == null ? ReferralSourceType.SELF : sourceType;
        this.referralSourceName = sourceName;
        this.referringDoctor = doctor;
    }

    public void applyFlags(boolean vip, boolean confidential, boolean deceased,
                           LocalDate deceasedDate, boolean testRecord) {
        this.vip = vip;
        this.confidential = confidential;
        this.deceased = deceased;
        this.deceasedDate = deceased ? deceasedDate : null;
        this.testRecord = testRecord;
    }

    public void recordConsent(boolean store, boolean shareReports, boolean research, String actor) {
        this.consent.update(store, shareReports, research, actor);
    }

    public void applyPayer(Payer payer) {
        this.payer = payer == null ? new Payer() : payer;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void assignReferringDoctor(Doctor doctor) {
        this.referringDoctor = doctor;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // --- merge -------------------------------------------------------------------

    public boolean isMerged() {
        return mergedIntoId != null;
    }

    public void markMergedInto(Long survivorId, String actor) {
        this.mergedIntoId = survivorId;
        this.mergedAt = java.time.Instant.now();
        this.mergedBy = actor;
        this.active = false;
    }

    /** Non-destructively enrich this record: copy a field from {@code other} only where this one is blank. */
    public void adoptMissingFrom(Patient other) {
        if (isBlank(salutation)) salutation = other.salutation;
        if (isBlank(nameLocal)) nameLocal = other.nameLocal;
        if (dateOfBirth == null) {
            dateOfBirth = other.dateOfBirth;
            if (dateOfBirth != null) approximateAgeYears = null;
        }
        if (approximateAgeYears == null && dateOfBirth == null) approximateAgeYears = other.approximateAgeYears;
        if (bloodGroup == null) bloodGroup = other.bloodGroup;
        if (maritalStatus == null) maritalStatus = other.maritalStatus;
        if (isBlank(occupation)) occupation = other.occupation;
        if (isBlank(preferredLanguage)) preferredLanguage = other.preferredLanguage;
        if (isBlank(phone)) {
            phone = other.phone;
            phoneDigits = other.phoneDigits;
        }
        if (isBlank(alternatePhone)) alternatePhone = other.alternatePhone;
        if (isBlank(email)) email = other.email;
        if (address == null || address.isEmpty()) address = other.address;
        if (currentAddress == null || currentAddress.isEmpty()) currentAddress = other.currentAddress;
        if (emergencyContact == null || emergencyContact.isEmpty()) emergencyContact = other.emergencyContact;
        if (isBlank(externalMrn)) externalMrn = other.externalMrn;
        if (referringDoctor == null && other.referringDoctor != null) {
            referringDoctor = other.referringDoctor;
            referralSourceType = other.referralSourceType;
            referralSourceName = other.referralSourceName;
        }
        if (isBlank(notes)) {
            notes = other.notes;
        } else if (!isBlank(other.notes)) {
            notes = (notes + "\n---\n" + other.notes);
            if (notes.length() > 1000) notes = notes.substring(0, 1000);
        }
        if (other.vip) vip = true;
        if (other.confidential) confidential = true;
        if ((payer == null || !payer.isThirdParty()) && other.payer != null && other.payer.isThirdParty()) {
            payer = other.payer;
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    // --- derived -------------------------------------------------------------------

    /** Best-known age in whole years, from DOB if present else the recorded approximate age. */
    public Integer ageYears() {
        if (dateOfBirth != null) {
            return Period.between(dateOfBirth, LocalDate.now()).getYears();
        }
        return approximateAgeYears;
    }

    public boolean isMinor() {
        Integer age = ageYears();
        return age != null && age < 18;
    }

    /** Age in whole days when the date of birth is known, else null (needed for neonatal ranges). */
    public Integer ageInDays() {
        if (dateOfBirth == null) {
            return null;
        }
        return (int) java.time.temporal.ChronoUnit.DAYS.between(dateOfBirth, LocalDate.now());
    }

    /** A 0–100 score of how complete this record is, for data-quality reporting. */
    public int dataCompleteness() {
        int score = 40; // name + gender + age are mandatory
        if (phoneDigits != null && phoneDigits.length() >= 7) score += 15;
        if (dateOfBirth != null) score += 10;
        if (email != null && !email.isBlank()) score += 5;
        if (address != null && address.getProvince() != null && address.getDistrict() != null) score += 10;
        if (emergencyContact != null && !emergencyContact.isEmpty()) score += 10;
        if (referralSourceType != ReferralSourceType.SELF || referringDoctor != null) score += 5;
        if (consent != null && consent.isStore()) score += 5;
        return Math.min(score, 100);
    }

    private static String normalizeDigits(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    // --- getters ------------------------------------------------------------------

    public String getMrn() {
        return mrn;
    }

    public String getSalutation() {
        return salutation;
    }

    public String getFullName() {
        return fullName;
    }

    public String getNameLocal() {
        return nameLocal;
    }

    public Gender getGender() {
        return gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public Integer getApproximateAgeYears() {
        return approximateAgeYears;
    }

    public BloodGroup getBloodGroup() {
        return bloodGroup;
    }

    public MaritalStatus getMaritalStatus() {
        return maritalStatus;
    }

    public String getOccupation() {
        return occupation;
    }

    public String getNationality() {
        return nationality;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public String getPhone() {
        return phone;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public String getPhoneDigits() {
        return phoneDigits;
    }

    public String getEmail() {
        return email;
    }

    public Address getAddress() {
        return address;
    }

    public Address getCurrentAddress() {
        return currentAddress;
    }

    public EmergencyContact getEmergencyContact() {
        return emergencyContact;
    }

    public PatientCategory getCategory() {
        return category;
    }

    public RegistrationChannel getRegistrationChannel() {
        return registrationChannel;
    }

    public String getRegistrationBranch() {
        return registrationBranch;
    }

    public String getExternalMrn() {
        return externalMrn;
    }

    public ReferralSourceType getReferralSourceType() {
        return referralSourceType;
    }

    public String getReferralSourceName() {
        return referralSourceName;
    }

    public Doctor getReferringDoctor() {
        return referringDoctor;
    }

    public String getNotes() {
        return notes;
    }

    public boolean isVip() {
        return vip;
    }

    public boolean isConfidential() {
        return confidential;
    }

    public boolean isDeceased() {
        return deceased;
    }

    public LocalDate getDeceasedDate() {
        return deceasedDate;
    }

    public boolean isTestRecord() {
        return testRecord;
    }

    public Consent getConsent() {
        return consent;
    }

    public Payer getPayer() {
        return payer;
    }

    public boolean isActive() {
        return active;
    }

    public Long getMergedIntoId() {
        return mergedIntoId;
    }

    public java.time.Instant getMergedAt() {
        return mergedAt;
    }

    public String getMergedBy() {
        return mergedBy;
    }
}
