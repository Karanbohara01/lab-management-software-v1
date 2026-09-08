package np.com.lims.patient.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import np.com.lims.patient.entity.Address;
import np.com.lims.patient.entity.BloodGroup;
import np.com.lims.patient.entity.Consent;
import np.com.lims.patient.entity.EmergencyContact;
import np.com.lims.patient.entity.Gender;
import np.com.lims.patient.entity.IdentifierType;
import np.com.lims.patient.entity.MaritalStatus;
import np.com.lims.patient.entity.Patient;
import np.com.lims.patient.entity.PatientCategory;
import np.com.lims.patient.entity.PatientIdentifier;
import np.com.lims.patient.entity.Payer;
import np.com.lims.patient.entity.PayerType;
import np.com.lims.patient.entity.ReferralSourceType;
import np.com.lims.patient.entity.RegistrationChannel;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class PatientDtos {

    private PatientDtos() {
    }

    public record AddressDto(
            @Size(max = 200) String line,
            @Size(max = 100) String city,
            @Size(max = 120) String municipality,
            @Size(max = 8) String wardNo,
            @Size(max = 120) String tole,
            @Size(max = 100) String district,
            @Size(max = 100) String province,
            @Size(max = 60) String country
    ) {
        public Address toEntity() {
            return new Address(line, city, municipality, wardNo, tole, district, province, country);
        }

        public static AddressDto from(Address a) {
            if (a == null || a.isEmpty()) {
                return null;
            }
            return new AddressDto(a.getLine(), a.getCity(), a.getMunicipality(), a.getWardNo(), a.getTole(),
                    a.getDistrict(), a.getProvince(), a.getCountry());
        }
    }

    public record EmergencyContactDto(
            @Size(max = 120) String name,
            @Size(max = 40) String relationship,
            @Size(max = 32) String phone,
            boolean guardian
    ) {
        public EmergencyContact toEntity() {
            return new EmergencyContact(name, relationship, phone, guardian);
        }

        public static EmergencyContactDto from(EmergencyContact c) {
            if (c == null || c.isEmpty()) {
                return null;
            }
            return new EmergencyContactDto(c.getName(), c.getRelationship(), c.getPhone(), c.isGuardian());
        }
    }

    public record ConsentDto(boolean store, boolean shareReports, boolean research) {
        public static ConsentDto from(Consent c) {
            return c == null ? new ConsentDto(false, false, false)
                    : new ConsentDto(c.isStore(), c.isShareReports(), c.isResearch());
        }
    }

    public record IdentifierDto(
            Long id,
            @NotNull IdentifierType type,
            @NotBlank @Size(max = 60) String value,
            @Size(max = 120) String issuedPlace,
            LocalDate issuedDate,
            boolean primary,
            @Size(max = 200) String note
    ) {
        public static IdentifierDto from(PatientIdentifier i) {
            return new IdentifierDto(i.getId(), i.getType(), i.getValue(), i.getIssuedPlace(),
                    i.getIssuedDate(), i.isPrimary(), i.getNote());
        }
    }

    public record PayerDto(
            @NotNull PayerType type,
            @Size(max = 160) String name,
            @Size(max = 120) String scheme,
            @Size(max = 60) String memberId,
            @Size(max = 60) String authorization,
            LocalDate validUntil,
            @Size(max = 300) String note
    ) {
        public Payer toEntity() {
            return new Payer(type, name, scheme, memberId, authorization, validUntil, note);
        }

        public static PayerDto from(Payer p) {
            if (p == null) {
                return new PayerDto(PayerType.SELF, null, null, null, null, null, null);
            }
            return new PayerDto(p.getType(), p.getName(), p.getScheme(), p.getMemberId(),
                    p.getAuthorization(), p.getValidUntil(), p.getNote());
        }
    }

    public record UpsertRequest(
            @Size(max = 16) String salutation,
            @NotBlank @Size(max = 160) String fullName,
            @Size(max = 160) String nameLocal,
            @NotNull Gender gender,
            @PastOrPresent LocalDate dateOfBirth,
            @Min(0) @Max(150) Integer approximateAgeYears,
            BloodGroup bloodGroup,
            MaritalStatus maritalStatus,
            @Size(max = 120) String occupation,
            @Size(max = 60) String nationality,
            @Size(max = 40) String preferredLanguage,
            @Size(max = 32) String phone,
            @Size(max = 32) String alternatePhone,
            @Email @Size(max = 160) String email,
            @Valid AddressDto address,
            @Valid AddressDto currentAddress,
            @Valid EmergencyContactDto emergencyContact,
            PatientCategory category,
            RegistrationChannel registrationChannel,
            @Size(max = 80) String registrationBranch,
            @Size(max = 40) String externalMrn,
            ReferralSourceType referralSourceType,
            @Size(max = 200) String referralSourceName,
            Long referringDoctorId,
            @Size(max = 1000) String notes,
            boolean vip,
            boolean confidential,
            boolean deceased,
            LocalDate deceasedDate,
            boolean testRecord,
            ConsentDto consent,
            @Valid PayerDto payer,
            @Valid List<IdentifierDto> identifiers,
            @Size(max = 300) String duplicateOverrideReason
    ) {
        public List<IdentifierDto> identifiersOrEmpty() {
            return identifiers == null ? List.of() : identifiers;
        }
    }

    public record ListItem(
            Long id,
            String mrn,
            String salutation,
            String fullName,
            Gender gender,
            Integer ageYears,
            String phone,
            PatientCategory category,
            String referringDoctorName,
            boolean vip,
            boolean confidential,
            boolean deceased,
            boolean active,
            int dataCompleteness,
            Instant createdAt
    ) {
        public static ListItem from(Patient p) {
            return new ListItem(p.getId(), p.getMrn(), p.getSalutation(), p.getFullName(), p.getGender(),
                    p.ageYears(), p.getPhone(), p.getCategory(),
                    p.getReferringDoctor() == null ? null : p.getReferringDoctor().getFullName(),
                    p.isVip(), p.isConfidential(), p.isDeceased(), p.isActive(),
                    p.dataCompleteness(), p.getCreatedAt());
        }
    }

    public record Detail(
            Long id,
            String mrn,
            String salutation,
            String fullName,
            String nameLocal,
            Gender gender,
            LocalDate dateOfBirth,
            Integer approximateAgeYears,
            Integer ageYears,
            boolean minor,
            BloodGroup bloodGroup,
            MaritalStatus maritalStatus,
            String occupation,
            String nationality,
            String preferredLanguage,
            String phone,
            String alternatePhone,
            String email,
            AddressDto address,
            AddressDto currentAddress,
            EmergencyContactDto emergencyContact,
            PatientCategory category,
            RegistrationChannel registrationChannel,
            String registrationBranch,
            String externalMrn,
            ReferralSourceType referralSourceType,
            String referralSourceName,
            Long referringDoctorId,
            String referringDoctorName,
            String notes,
            boolean vip,
            boolean confidential,
            boolean deceased,
            LocalDate deceasedDate,
            boolean testRecord,
            ConsentDto consent,
            Instant consentCapturedAt,
            String consentCapturedBy,
            PayerDto payer,
            List<IdentifierDto> identifiers,
            int dataCompleteness,
            boolean active,
            Long mergedIntoId,
            String mergedIntoMrn,
            Instant mergedAt,
            String mergedBy,
            Instant createdAt,
            Instant updatedAt,
            String createdBy
    ) {
        public static Detail from(Patient p) {
            return from(p, null, List.of());
        }

        public static Detail from(Patient p, String mergedIntoMrn, List<IdentifierDto> identifiers) {
            return new Detail(
                    p.getId(), p.getMrn(), p.getSalutation(), p.getFullName(), p.getNameLocal(), p.getGender(),
                    p.getDateOfBirth(), p.getApproximateAgeYears(), p.ageYears(), p.isMinor(),
                    p.getBloodGroup(), p.getMaritalStatus(), p.getOccupation(), p.getNationality(),
                    p.getPreferredLanguage(), p.getPhone(), p.getAlternatePhone(), p.getEmail(),
                    AddressDto.from(p.getAddress()), AddressDto.from(p.getCurrentAddress()),
                    EmergencyContactDto.from(p.getEmergencyContact()),
                    p.getCategory(), p.getRegistrationChannel(), p.getRegistrationBranch(), p.getExternalMrn(),
                    p.getReferralSourceType(), p.getReferralSourceName(),
                    p.getReferringDoctor() == null ? null : p.getReferringDoctor().getId(),
                    p.getReferringDoctor() == null ? null : p.getReferringDoctor().getFullName(),
                    p.getNotes(), p.isVip(), p.isConfidential(), p.isDeceased(), p.getDeceasedDate(),
                    p.isTestRecord(), ConsentDto.from(p.getConsent()),
                    p.getConsent() == null ? null : p.getConsent().getCapturedAt(),
                    p.getConsent() == null ? null : p.getConsent().getCapturedBy(),
                    PayerDto.from(p.getPayer()), identifiers == null ? List.of() : identifiers,
                    p.dataCompleteness(), p.isActive(),
                    p.getMergedIntoId(), mergedIntoMrn, p.getMergedAt(), p.getMergedBy(),
                    p.getCreatedAt(), p.getUpdatedAt(), p.getCreatedBy());
        }
    }

    public record MatchRequest(
            @Size(max = 160) String fullName,
            @Size(max = 32) String phone,
            LocalDate dateOfBirth,
            @Min(0) @Max(150) Integer approximateAgeYears,
            Gender gender,
            Long excludeId
    ) {
    }

    public record MergeRequest(
            @NotNull Long duplicateId,
            @NotBlank @Size(max = 300) String reason
    ) {
    }

    public record MergeParty(Long id, String mrn, String fullName, Gender gender, Integer ageYears, boolean confidential) {
        public static MergeParty from(Patient p) {
            return new MergeParty(p.getId(), p.getMrn(), p.getFullName(), p.getGender(), p.ageYears(), p.isConfidential());
        }
    }

    public record MergePreview(
            MergeParty survivor,
            MergeParty duplicate,
            long labOrders,
            long samples,
            long results,
            long reports,
            long invoices,
            List<String> fieldsAdopted,
            List<String> warnings
    ) {
    }

    public record MatchCandidate(
            Long id,
            String mrn,
            String fullName,
            Gender gender,
            Integer ageYears,
            String phone,
            PatientCategory category,
            boolean active,
            int score,
            List<String> reasons,
            Instant registeredAt
    ) {
    }
}
