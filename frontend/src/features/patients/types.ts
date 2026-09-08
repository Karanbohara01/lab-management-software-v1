export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type BloodGroup =
  | 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'UNKNOWN';

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'UNKNOWN';

export type PatientCategory =
  | 'WALK_IN' | 'OPD_REFERRAL' | 'IPD' | 'HEALTH_CAMP' | 'CORPORATE'
  | 'INSURANCE' | 'MEDICO_LEGAL' | 'STAFF' | 'RESEARCH';

export type ReferralSourceType =
  | 'SELF' | 'DOCTOR' | 'HOSPITAL' | 'CLINIC' | 'PARTNER_LAB'
  | 'HEALTH_CAMP' | 'CORPORATE' | 'ONLINE' | 'OTHER';

export type RegistrationChannel = 'WALK_IN' | 'PHONE' | 'ONLINE' | 'PARTNER' | 'CAMP' | 'HOME_COLLECTION';

export type IdentifierType =
  | 'CITIZENSHIP' | 'NATIONAL_ID' | 'PASSPORT' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE'
  | 'NHIS' | 'SSF' | 'BIRTH_CERTIFICATE' | 'MINOR_ID' | 'EMBASSY_ID' | 'REFUGEE_ID' | 'OTHER';

export type PayerType = 'SELF' | 'HEALTH_INSURANCE' | 'SSF' | 'CORPORATE' | 'EMBASSY' | 'NGO' | 'GOVERNMENT' | 'OTHER';

export interface PatientIdentifier {
  id: number | null;
  type: IdentifierType;
  value: string;
  issuedPlace: string | null;
  issuedDate: string | null;
  primary: boolean;
  note: string | null;
}

export interface Payer {
  type: PayerType;
  name: string | null;
  scheme: string | null;
  memberId: string | null;
  authorization: string | null;
  validUntil: string | null;
  note: string | null;
}

export interface Address {
  line: string | null;
  city: string | null;
  municipality: string | null;
  wardNo: string | null;
  tole: string | null;
  district: string | null;
  province: string | null;
  country: string | null;
}

export interface EmergencyContact {
  name: string | null;
  relationship: string | null;
  phone: string | null;
  guardian: boolean;
}

export interface Consent {
  store: boolean;
  shareReports: boolean;
  research: boolean;
}

export interface PatientListItem {
  id: number;
  mrn: string;
  salutation: string | null;
  fullName: string;
  gender: Gender;
  ageYears: number | null;
  phone: string | null;
  category: PatientCategory;
  referringDoctorName: string | null;
  vip: boolean;
  confidential: boolean;
  deceased: boolean;
  active: boolean;
  dataCompleteness: number;
  createdAt: string;
}

export interface PatientDetail {
  id: number;
  mrn: string;
  salutation: string | null;
  fullName: string;
  nameLocal: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  approximateAgeYears: number | null;
  ageYears: number | null;
  minor: boolean;
  bloodGroup: BloodGroup | null;
  maritalStatus: MaritalStatus | null;
  occupation: string | null;
  nationality: string | null;
  preferredLanguage: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  address: Address | null;
  currentAddress: Address | null;
  emergencyContact: EmergencyContact | null;
  category: PatientCategory;
  registrationChannel: RegistrationChannel;
  registrationBranch: string | null;
  externalMrn: string | null;
  referralSourceType: ReferralSourceType;
  referralSourceName: string | null;
  referringDoctorId: number | null;
  referringDoctorName: string | null;
  notes: string | null;
  vip: boolean;
  confidential: boolean;
  deceased: boolean;
  deceasedDate: string | null;
  testRecord: boolean;
  consent: Consent;
  consentCapturedAt: string | null;
  consentCapturedBy: string | null;
  payer: Payer;
  identifiers: PatientIdentifier[];
  dataCompleteness: number;
  active: boolean;
  mergedIntoId: number | null;
  mergedIntoMrn: string | null;
  mergedAt: string | null;
  mergedBy: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface MergeParty {
  id: number;
  mrn: string;
  fullName: string;
  gender: Gender;
  ageYears: number | null;
  confidential: boolean;
}

export interface MergePreview {
  survivor: MergeParty;
  duplicate: MergeParty;
  labOrders: number;
  samples: number;
  results: number;
  reports: number;
  invoices: number;
  fieldsAdopted: string[];
  warnings: string[];
}

export interface PatientUpsertPayload {
  salutation?: string | null;
  fullName: string;
  nameLocal?: string | null;
  gender: Gender;
  dateOfBirth?: string | null;
  approximateAgeYears?: number | null;
  bloodGroup?: BloodGroup | null;
  maritalStatus?: MaritalStatus | null;
  occupation?: string | null;
  nationality?: string | null;
  preferredLanguage?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  email?: string | null;
  address?: Partial<Address> | null;
  currentAddress?: Partial<Address> | null;
  emergencyContact?: Partial<EmergencyContact> | null;
  category?: PatientCategory;
  registrationChannel?: RegistrationChannel;
  registrationBranch?: string | null;
  externalMrn?: string | null;
  referralSourceType?: ReferralSourceType;
  referralSourceName?: string | null;
  referringDoctorId?: number | null;
  notes?: string | null;
  vip?: boolean;
  confidential?: boolean;
  deceased?: boolean;
  deceasedDate?: string | null;
  testRecord?: boolean;
  consent?: Consent;
  payer?: Payer;
  identifiers?: Omit<PatientIdentifier, 'id'>[];
  duplicateOverrideReason?: string | null;
}

export interface MatchCandidate {
  id: number;
  mrn: string;
  fullName: string;
  gender: Gender;
  ageYears: number | null;
  phone: string | null;
  category: PatientCategory;
  active: boolean;
  score: number;
  reasons: string[];
  registeredAt: string;
}

export interface MatchQuery {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string | null;
  approximateAgeYears?: number | null;
  gender?: Gender;
  excludeId?: number | null;
}
