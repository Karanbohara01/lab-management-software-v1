import type {
  BloodGroup,
  Gender,
  IdentifierType,
  MaritalStatus,
  PatientCategory,
  PayerType,
  ReferralSourceType,
  RegistrationChannel,
} from './types';

type Opt<T extends string> = { value: T; label: string };

export const GENDERS: Opt<Gender>[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

export const SALUTATIONS = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Master', 'Baby'];

export const BLOOD_GROUPS: Opt<BloodGroup>[] = [
  { value: 'UNKNOWN', label: 'Unknown' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A−' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B−' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB−' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O−' },
];

export const MARITAL_STATUSES: Opt<MaritalStatus>[] = [
  { value: 'UNKNOWN', label: 'Not recorded' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'DIVORCED', label: 'Divorced' },
  { value: 'WIDOWED', label: 'Widowed' },
  { value: 'SEPARATED', label: 'Separated' },
];

export const PATIENT_CATEGORIES: Opt<PatientCategory>[] = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'OPD_REFERRAL', label: 'OPD referral' },
  { value: 'IPD', label: 'In-patient (IPD)' },
  { value: 'HEALTH_CAMP', label: 'Health camp' },
  { value: 'CORPORATE', label: 'Corporate / panel' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MEDICO_LEGAL', label: 'Medico-legal' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'RESEARCH', label: 'Research' },
];

export const REFERRAL_SOURCE_TYPES: Opt<ReferralSourceType>[] = [
  { value: 'SELF', label: 'Self / walk-in' },
  { value: 'DOCTOR', label: 'Referring doctor' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINIC', label: 'Clinic / polyclinic' },
  { value: 'PARTNER_LAB', label: 'Partner laboratory' },
  { value: 'HEALTH_CAMP', label: 'Health camp' },
  { value: 'CORPORATE', label: 'Corporate / organisation' },
  { value: 'ONLINE', label: 'Online booking' },
  { value: 'OTHER', label: 'Other' },
];

export const REGISTRATION_CHANNELS: Opt<RegistrationChannel>[] = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'CAMP', label: 'Camp' },
  { value: 'HOME_COLLECTION', label: 'Home collection' },
];

export const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Father', 'Mother', 'Son', 'Daughter', 'Sibling',
  'Brother', 'Sister', 'Guardian', 'Grandparent', 'Relative', 'Friend', 'Other',
];

export const LANGUAGES = ['Nepali', 'English', 'Maithili', 'Bhojpuri', 'Tharu', 'Tamang', 'Newari', 'Other'];

export const IDENTIFIER_TYPES: Opt<IdentifierType>[] = [
  { value: 'CITIZENSHIP', label: 'Citizenship no.' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'PAN', label: 'PAN' },
  { value: 'NHIS', label: 'Health insurance (NHIS)' },
  { value: 'SSF', label: 'SSF no.' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'DRIVING_LICENSE', label: 'Driving licence' },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth certificate' },
  { value: 'MINOR_ID', label: 'Minor ID' },
  { value: 'EMBASSY_ID', label: 'Embassy ID' },
  { value: 'REFUGEE_ID', label: 'Refugee ID' },
  { value: 'OTHER', label: 'Other' },
];

export const PAYER_TYPES: Opt<PayerType>[] = [
  { value: 'SELF', label: 'Self-pay' },
  { value: 'HEALTH_INSURANCE', label: 'Health insurance' },
  { value: 'SSF', label: 'Social Security Fund' },
  { value: 'CORPORATE', label: 'Corporate / employer' },
  { value: 'GOVERNMENT', label: 'Government scheme' },
  { value: 'NGO', label: 'NGO / INGO' },
  { value: 'EMBASSY', label: 'Embassy' },
  { value: 'OTHER', label: 'Other' },
];

const label = <T extends string>(opts: Opt<T>[]) => (v: T | null | undefined) =>
  (v && opts.find((o) => o.value === v)?.label) || '—';

export const categoryLabel = label(PATIENT_CATEGORIES);
export const bloodGroupLabel = label(BLOOD_GROUPS);
export const maritalStatusLabel = label(MARITAL_STATUSES);
export const referralSourceLabel = label(REFERRAL_SOURCE_TYPES);
export const channelLabel = label(REGISTRATION_CHANNELS);
export const identifierTypeLabel = label(IDENTIFIER_TYPES);
export const payerTypeLabel = label(PAYER_TYPES);
