import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ApiError } from '@/types/api';
import { doctorsApi } from '@/features/doctors/api';
import { patientsApi } from './api';
import { DuplicateCandidates } from './DuplicateCandidates';
import { PROVINCE_NAMES, WARD_OPTIONS, districtsOf, municipalitiesOf } from './np-geo';
import {
  BLOOD_GROUPS,
  GENDERS,
  IDENTIFIER_TYPES,
  LANGUAGES,
  MARITAL_STATUSES,
  PATIENT_CATEGORIES,
  PAYER_TYPES,
  REFERRAL_SOURCE_TYPES,
  REGISTRATION_CHANNELS,
  RELATIONSHIPS,
  SALUTATIONS,
} from './constants';
import { normalizePhone } from './format';
import type {
  BloodGroup,
  IdentifierType,
  MaritalStatus,
  MatchCandidate,
  PatientCategory,
  PatientUpsertPayload,
  PayerType,
  ReferralSourceType,
  RegistrationChannel,
} from './types';

const addressSchema = z.object({
  province: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().max(120).optional(),
  wardNo: z.string().max(8).optional(),
  tole: z.string().max(120).optional(),
  line: z.string().max(200).optional(),
});

const schema = z
  .object({
    salutation: z.string().optional(),
    fullName: z.string().min(1, 'Name is required').max(160),
    nameLocal: z.string().max(160).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Select a gender' }),
    dateOfBirth: z.string().optional(),
    approximateAgeYears: z.union([z.coerce.number().int().min(0).max(150), z.literal('')]).optional(),
    bloodGroup: z.string().optional(),
    maritalStatus: z.string().optional(),
    occupation: z.string().max(120).optional(),
    nationality: z.string().max(60).optional(),
    preferredLanguage: z.string().optional(),
    phone: z.string().max(32).optional(),
    alternatePhone: z.string().max(32).optional(),
    email: z.string().email('Enter a valid email').max(160).or(z.literal('')).optional(),
    address: addressSchema,
    currentSameAsPermanent: z.boolean(),
    currentAddress: addressSchema,
    emergencyName: z.string().max(120).optional(),
    emergencyRelationship: z.string().max(40).optional(),
    emergencyPhone: z.string().max(32).optional(),
    emergencyGuardian: z.boolean(),
    identifiers: z.array(
      z.object({
        type: z.string(),
        value: z.string().max(60),
        issuedPlace: z.string().max(120).optional(),
        issuedDate: z.string().optional(),
        primary: z.boolean(),
      }),
    ),
    payerType: z.string(),
    payerName: z.string().max(160).optional(),
    payerScheme: z.string().max(120).optional(),
    payerMemberId: z.string().max(60).optional(),
    payerAuthorization: z.string().max(60).optional(),
    payerValidUntil: z.string().optional(),
    payerNote: z.string().max(300).optional(),
    category: z.string(),
    registrationChannel: z.string(),
    registrationBranch: z.string().max(80).optional(),
    externalMrn: z.string().max(40).optional(),
    referralSourceType: z.string(),
    referralSourceName: z.string().max(200).optional(),
    referringDoctorId: z.string().optional(),
    notes: z.string().max(1000).optional(),
    vip: z.boolean(),
    confidential: z.boolean(),
    deceased: z.boolean(),
    deceasedDate: z.string().optional(),
    testRecord: z.boolean(),
    consentStore: z.boolean(),
    consentShareReports: z.boolean(),
    consentResearch: z.boolean(),
    duplicateOverrideReason: z.string().max(300).optional(),
  })
  .refine((v) => !!v.dateOfBirth || (v.approximateAgeYears !== '' && v.approximateAgeYears != null), {
    message: 'Provide a date of birth or an approximate age',
    path: ['approximateAgeYears'],
  });

type FormValues = z.input<typeof schema>;

const EMPTY: FormValues = {
  salutation: '',
  fullName: '',
  nameLocal: '',
  gender: 'MALE',
  dateOfBirth: '',
  approximateAgeYears: '',
  bloodGroup: 'UNKNOWN',
  maritalStatus: 'UNKNOWN',
  occupation: '',
  nationality: 'Nepali',
  preferredLanguage: 'Nepali',
  phone: '',
  alternatePhone: '',
  email: '',
  address: { province: '', district: '', municipality: '', wardNo: '', tole: '', line: '' },
  currentSameAsPermanent: true,
  currentAddress: { province: '', district: '', municipality: '', wardNo: '', tole: '', line: '' },
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  emergencyGuardian: false,
  identifiers: [],
  payerType: 'SELF',
  payerName: '',
  payerScheme: '',
  payerMemberId: '',
  payerAuthorization: '',
  payerValidUntil: '',
  payerNote: '',
  category: 'WALK_IN',
  registrationChannel: 'WALK_IN',
  registrationBranch: '',
  externalMrn: '',
  referralSourceType: 'SELF',
  referralSourceName: '',
  referringDoctorId: '',
  notes: '',
  vip: false,
  confidential: false,
  deceased: false,
  deceasedDate: '',
  testRecord: false,
  consentStore: true,
  consentShareReports: true,
  consentResearch: false,
  duplicateOverrideReason: '',
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function RegisterPatientPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const canConfidential = useAuth().hasPermission(PERMISSIONS.PATIENT_CONFIDENTIAL);

  const existing = useQuery(() => (isEdit ? patientsApi.get(Number(id)) : Promise.resolve(null)), [id]);
  const doctors = useQuery(() => doctorsApi.list({ activeOnly: true, size: 300 }), []);

  const [quick, setQuick] = useState(false);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [matching, setMatching] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const idFields = useFieldArray({ control, name: 'identifiers' });

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    reset({
      ...EMPTY,
      salutation: p.salutation ?? '',
      fullName: p.fullName,
      nameLocal: p.nameLocal ?? '',
      gender: p.gender,
      dateOfBirth: p.dateOfBirth ?? '',
      approximateAgeYears: p.dateOfBirth ? '' : (p.approximateAgeYears ?? ''),
      bloodGroup: p.bloodGroup ?? 'UNKNOWN',
      maritalStatus: p.maritalStatus ?? 'UNKNOWN',
      occupation: p.occupation ?? '',
      nationality: p.nationality ?? 'Nepali',
      preferredLanguage: p.preferredLanguage ?? '',
      phone: p.phone ?? '',
      alternatePhone: p.alternatePhone ?? '',
      email: p.email ?? '',
      address: {
        province: p.address?.province ?? '',
        district: p.address?.district ?? '',
        municipality: p.address?.municipality ?? p.address?.city ?? '',
        wardNo: p.address?.wardNo ?? '',
        tole: p.address?.tole ?? '',
        line: p.address?.line ?? '',
      },
      currentSameAsPermanent: !p.currentAddress,
      currentAddress: {
        province: p.currentAddress?.province ?? '',
        district: p.currentAddress?.district ?? '',
        municipality: p.currentAddress?.municipality ?? p.currentAddress?.city ?? '',
        wardNo: p.currentAddress?.wardNo ?? '',
        tole: p.currentAddress?.tole ?? '',
        line: p.currentAddress?.line ?? '',
      },
      emergencyName: p.emergencyContact?.name ?? '',
      emergencyRelationship: p.emergencyContact?.relationship ?? '',
      emergencyPhone: p.emergencyContact?.phone ?? '',
      emergencyGuardian: p.emergencyContact?.guardian ?? false,
      identifiers: (p.identifiers ?? []).map((i) => ({
        type: i.type,
        value: i.value,
        issuedPlace: i.issuedPlace ?? '',
        issuedDate: i.issuedDate ?? '',
        primary: i.primary,
      })),
      payerType: p.payer?.type ?? 'SELF',
      payerName: p.payer?.name ?? '',
      payerScheme: p.payer?.scheme ?? '',
      payerMemberId: p.payer?.memberId ?? '',
      payerAuthorization: p.payer?.authorization ?? '',
      payerValidUntil: p.payer?.validUntil ?? '',
      payerNote: p.payer?.note ?? '',
      category: p.category,
      registrationChannel: p.registrationChannel,
      registrationBranch: p.registrationBranch ?? '',
      externalMrn: p.externalMrn ?? '',
      referralSourceType: p.referralSourceType,
      referralSourceName: p.referralSourceName ?? '',
      referringDoctorId: p.referringDoctorId ? String(p.referringDoctorId) : '',
      notes: p.notes ?? '',
      vip: p.vip,
      confidential: p.confidential,
      deceased: p.deceased,
      deceasedDate: p.deceasedDate ?? '',
      testRecord: p.testRecord,
      consentStore: p.consent?.store ?? false,
      consentShareReports: p.consent?.shareReports ?? false,
      consentResearch: p.consent?.research ?? false,
    });
  }, [existing.data, reset]);

  const w = watch();
  const referralType = w.referralSourceType;
  const [manualMuni, setManualMuni] = useState<Record<string, boolean>>({});

  const renderAddress = (prefix: 'address' | 'currentAddress') => {
    const val = (prefix === 'address' ? w.address : w.currentAddress) ?? {};
    const prov = val.province ?? '';
    const dist = val.district ?? '';
    const muni = val.municipality ?? '';
    const list = municipalitiesOf(dist);
    const useSelect = list.length > 0 && !manualMuni[prefix] && (!muni || list.includes(muni));
    const setField = (f: string, v: string) => setValue(`${prefix}.${f}` as 'address.province', v);
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Province"
          options={[{ value: '', label: '—' }, ...PROVINCE_NAMES.map((p) => ({ value: p, label: p }))]}
          {...register(`${prefix}.province` as 'address.province', {
            onChange: () => {
              setField('district', '');
              setField('municipality', '');
            },
          })}
        />
        <Select
          label="District"
          disabled={!prov}
          options={[{ value: '', label: '—' }, ...districtsOf(prov).map((d) => ({ value: d, label: d }))]}
          {...register(`${prefix}.district` as 'address.district', {
            onChange: () => {
              setField('municipality', '');
              setManualMuni((s) => ({ ...s, [prefix]: false }));
            },
          })}
        />

        {useSelect ? (
          <Select
            label="Municipality / Rural municipality"
            disabled={!dist}
            value={list.includes(muni) ? muni : ''}
            options={[
              { value: '', label: '—' },
              ...list.map((m) => ({ value: m, label: m })),
              { value: '__other__', label: 'Other / not listed…' },
            ]}
            onChange={(e) => {
              if (e.target.value === '__other__') {
                setManualMuni((s) => ({ ...s, [prefix]: true }));
                setField('municipality', '');
              } else {
                setField('municipality', e.target.value);
              }
            }}
          />
        ) : (
          <Input
            label="Municipality / Rural municipality"
            placeholder={dist ? 'Type the local level name' : 'Select district first'}
            value={muni}
            onChange={(e) => setField('municipality', e.target.value)}
            hint={
              list.length > 0 ? (
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setManualMuni((s) => ({ ...s, [prefix]: false }));
                    setField('municipality', '');
                  }}
                >
                  Choose from list instead
                </button>
              ) : undefined
            }
          />
        )}

        <Select
          label="Ward no."
          disabled={!dist}
          options={[{ value: '', label: '—' }, ...WARD_OPTIONS.map((wd) => ({ value: wd, label: wd }))]}
          {...register(`${prefix}.wardNo` as 'address.wardNo')}
        />
        <Input label="Tole / street" {...register(`${prefix}.tole` as 'address.tole')} />
        <Input label="House / address line" {...register(`${prefix}.line` as 'address.line')} />
      </div>
    );
  };
  const dob = w.dateOfBirth ?? '';
  const approxAge = typeof w.approximateAgeYears === 'number' ? w.approximateAgeYears : Number(w.approximateAgeYears);
  const isMinor = useMemo(() => {
    if (dob) {
      const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age < 18;
    }
    return Number.isFinite(approxAge) && approxAge < 18;
  }, [dob, approxAge]);

  // --- live duplicate detection (register mode only) --------------------------
  const matchKey = useDebouncedValue(
    JSON.stringify({ n: w.fullName?.trim() ?? '', p: normalizePhone(w.phone), d: dob }),
    400,
  );
  useEffect(() => {
    if (isEdit) return;
    const { n, p, d } = JSON.parse(matchKey) as { n: string; p: string; d: string };
    if (n.length < 3 || (p.length < 7 && !d)) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setMatching(true);
    patientsApi
      .match({ fullName: n, phone: p || undefined, dateOfBirth: d || undefined, gender: w.gender })
      .then((res) => {
        if (!cancelled) setCandidates(res);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setMatching(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchKey, isEdit]);

  const visibleCandidates = candidates.filter((c) => !dismissed.has(c.id));
  const strongDuplicate = visibleCandidates.some((c) => c.score >= 85);

  const doctorOptions = [
    { value: '', label: 'Select doctor…' },
    ...(doctors.data?.content ?? []).map((d) => ({ value: String(d.id), label: d.fullName })),
  ];

  const buildAddress = (a: FormValues['address']) => ({
    line: a.line || null,
    municipality: a.municipality || null,
    wardNo: a.wardNo || null,
    tole: a.tole || null,
    district: a.district || null,
    province: a.province || null,
    country: 'Nepal',
    city: null,
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!isEdit && strongDuplicate && !values.duplicateOverrideReason?.trim()) {
      setError('duplicateOverrideReason', {
        message: 'This looks like an existing patient. Give a reason to register a new record, or open the existing one.',
      });
      return;
    }

    const payload: PatientUpsertPayload = {
      salutation: values.salutation || null,
      fullName: values.fullName.trim(),
      nameLocal: values.nameLocal || null,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth || null,
      approximateAgeYears:
        values.dateOfBirth || values.approximateAgeYears === '' || values.approximateAgeYears == null
          ? null
          : Number(values.approximateAgeYears),
      bloodGroup: (values.bloodGroup || null) as BloodGroup | null,
      maritalStatus: (values.maritalStatus || null) as MaritalStatus | null,
      occupation: values.occupation || null,
      nationality: values.nationality || null,
      preferredLanguage: values.preferredLanguage || null,
      phone: values.phone || null,
      alternatePhone: values.alternatePhone || null,
      email: values.email || null,
      address: buildAddress(values.address),
      currentAddress: values.currentSameAsPermanent ? null : buildAddress(values.currentAddress),
      emergencyContact: values.emergencyName || values.emergencyPhone
        ? {
            name: values.emergencyName || null,
            relationship: values.emergencyRelationship || null,
            phone: values.emergencyPhone || null,
            guardian: values.emergencyGuardian,
          }
        : null,
      category: values.category as PatientCategory,
      registrationChannel: values.registrationChannel as RegistrationChannel,
      registrationBranch: values.registrationBranch || null,
      externalMrn: values.externalMrn || null,
      referralSourceType: values.referralSourceType as ReferralSourceType,
      referralSourceName: values.referralSourceName || null,
      referringDoctorId: values.referringDoctorId ? Number(values.referringDoctorId) : null,
      notes: values.notes || null,
      vip: values.vip,
      confidential: values.confidential,
      deceased: values.deceased,
      deceasedDate: values.deceased ? values.deceasedDate || null : null,
      testRecord: values.testRecord,
      consent: {
        store: values.consentStore,
        shareReports: values.consentShareReports,
        research: values.consentResearch,
      },
      payer: {
        type: values.payerType as PayerType,
        name: values.payerName || null,
        scheme: values.payerScheme || null,
        memberId: values.payerMemberId || null,
        authorization: values.payerAuthorization || null,
        validUntil: values.payerValidUntil || null,
        note: values.payerNote || null,
      },
      identifiers: values.identifiers
        .filter((i) => i.value.trim())
        .map((i) => ({
          type: i.type as IdentifierType,
          value: i.value.trim(),
          issuedPlace: i.issuedPlace || null,
          issuedDate: i.issuedDate || null,
          primary: i.primary,
          note: null,
        })),
      duplicateOverrideReason: values.duplicateOverrideReason || null,
    };

    try {
      const saved = isEdit
        ? await patientsApi.update(Number(id), payload)
        : await patientsApi.create(payload);
      toast.success(isEdit ? 'Patient updated' : `Patient registered · ${saved.mrn}`);
      navigate(`/app/patients/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors.length > 0) {
          err.fieldErrors.forEach((fe) => setError('root', { message: `${fe.field}: ${fe.message}` }));
        } else {
          setError('root', { message: err.message });
        }
      } else {
        setError('root', { message: 'Unable to save patient' });
      }
    }
  });

  if (isEdit && existing.loading && !existing.data) return <LoadingState label="Loading patient…" />;
  if (isEdit && existing.error) return <ErrorState message={existing.error} onRetry={existing.refetch} />;

  const backTo = isEdit ? `/app/patients/${id}` : '/app/patients';

  return (
    <>
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {isEdit ? 'Back to patient' : 'Back to patients'}
      </Link>

      <PageHeader
        title={isEdit ? `Edit patient · ${existing.data?.mrn ?? ''}` : 'Register patient'}
        description={
          isEdit
            ? 'Update demographics, contact, referral and consent.'
            : 'Search first — check the possible-duplicate panel before creating a new record.'
        }
        actions={
          !isEdit ? (
            <Checkbox
              label="Quick register"
              hint="Name, contact & category only"
              checked={quick}
              onChange={(e) => setQuick(e.target.checked)}
            />
          ) : undefined
        }
      />

      <form onSubmit={onSubmit} className="space-y-4 pb-24" noValidate>
        {errors.root && <Alert tone="danger">{errors.root.message}</Alert>}

        <SectionCard title="Identity">
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <Select label="Title" options={[{ value: '', label: '—' }, ...SALUTATIONS.map((s) => ({ value: s, label: s }))]} {...register('salutation')} />
            <Input label="Full name" placeholder="e.g. Anil Kumar Sharma" error={errors.fullName?.message} {...register('fullName')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name in Devanagari (optional)" {...register('nameLocal')} />
            <Select label="Gender" options={GENDERS} error={errors.gender?.message} {...register('gender')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
            <Input label="Approx. age (yrs)" type="number" min={0} hint="If DOB unknown" error={errors.approximateAgeYears?.message} {...register('approximateAgeYears')} />
            <Select label="Blood group" options={BLOOD_GROUPS} {...register('bloodGroup')} />
          </div>
        </SectionCard>

        {!isEdit && (
          <DuplicateCandidates
            candidates={visibleCandidates}
            loading={matching}
            onDismiss={(cid) => setDismissed((s) => new Set(s).add(cid))}
          />
        )}

        <SectionCard title="Contact">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Phone" inputMode="tel" placeholder="98XXXXXXXX" error={errors.phone?.message} {...register('phone')} />
            <Input label="Alternate phone" inputMode="tel" {...register('alternatePhone')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          </div>
        </SectionCard>

        {!quick && (
          <>
            <SectionCard title="Permanent address">
              {renderAddress('address')}
              <Checkbox label="Current address is the same as permanent" {...register('currentSameAsPermanent')} />
            </SectionCard>

            {!w.currentSameAsPermanent && (
              <SectionCard title="Current address">{renderAddress('currentAddress')}</SectionCard>
            )}

            <SectionCard
              title="Emergency contact / guardian"
              description={isMinor ? 'This patient is a minor — a guardian contact is strongly recommended.' : undefined}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Contact name" {...register('emergencyName')} />
                <Select label="Relationship" options={[{ value: '', label: '—' }, ...RELATIONSHIPS.map((r) => ({ value: r, label: r }))]} {...register('emergencyRelationship')} />
                <Input label="Contact phone" inputMode="tel" {...register('emergencyPhone')} />
              </div>
              <Checkbox label="This contact is the legal guardian" {...register('emergencyGuardian')} />
            </SectionCard>

            <SectionCard title="Additional demographics">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Marital status" options={MARITAL_STATUSES} {...register('maritalStatus')} />
                <Input label="Occupation" {...register('occupation')} />
                <Input label="Nationality" {...register('nationality')} />
                <Select label="Preferred language" options={LANGUAGES.map((l) => ({ value: l, label: l }))} {...register('preferredLanguage')} />
              </div>
            </SectionCard>

            <SectionCard title="Registration & referral">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Patient category" options={PATIENT_CATEGORIES} {...register('category')} />
                <Select label="Registration channel" options={REGISTRATION_CHANNELS} {...register('registrationChannel')} />
                <Input label="Branch / counter" {...register('registrationBranch')} />
                <Input label="External / hospital MRN" {...register('externalMrn')} />
                <Select label="Referral source" options={REFERRAL_SOURCE_TYPES} {...register('referralSourceType')} />
                {referralType === 'DOCTOR' ? (
                  <Select label="Referring doctor" options={doctorOptions} disabled={doctors.loading} {...register('referringDoctorId')} />
                ) : referralType !== 'SELF' ? (
                  <Input label="Referral source name" placeholder="Hospital / camp / organisation" {...register('referralSourceName')} />
                ) : (
                  <div />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Identity documents"
              description="Citizenship, national ID, passport, PAN, insurance — used for lookup and billing."
            >
              {idFields.fields.length === 0 && (
                <p className="text-sm text-muted">No documents recorded.</p>
              )}
              {idFields.fields.map((f, i) => (
                <div key={f.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[10rem_1fr_1fr_auto]">
                  <Select
                    label="Type"
                    options={IDENTIFIER_TYPES}
                    {...register(`identifiers.${i}.type` as const)}
                  />
                  <Input label="Number" {...register(`identifiers.${i}.value` as const)} />
                  <Input label="Issued at / date" placeholder="Place" {...register(`identifiers.${i}.issuedPlace` as const)} />
                  <div className="flex items-end gap-3 pb-1">
                    <Checkbox label="Primary" {...register(`identifiers.${i}.primary` as const)} />
                    <button
                      type="button"
                      onClick={() => idFields.remove(i)}
                      className="rounded-md p-2 text-muted hover:bg-surface-muted hover:text-danger"
                      aria-label="Remove document"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => idFields.append({ type: 'CITIZENSHIP', value: '', issuedPlace: '', issuedDate: '', primary: idFields.fields.length === 0 })}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add document
              </Button>
            </SectionCard>

            <SectionCard title="Billing party" description="Who settles this patient's bills.">
              <Select label="Payer" options={PAYER_TYPES} {...register('payerType')} />
              {w.payerType !== 'SELF' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Payer name" placeholder="Company / insurer / scheme" {...register('payerName')} />
                  <Input label="Scheme / plan" {...register('payerScheme')} />
                  <Input label="Policy / member ID" {...register('payerMemberId')} />
                  <Input label="Authorization / claim ref" {...register('payerAuthorization')} />
                  <Input label="Coverage valid until" type="date" {...register('payerValidUntil')} />
                  <Input label="Note" {...register('payerNote')} />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Flags">
              <div className="grid gap-3 sm:grid-cols-2">
                <Checkbox label="VIP" hint="Prioritised handling" {...register('vip')} />
                {canConfidential && (
                  <Checkbox label="Confidential" hint="Restrict who can view this record" {...register('confidential')} />
                )}
                <Checkbox label="Test / training record" {...register('testRecord')} />
                <Checkbox label="Deceased" {...register('deceased')} />
              </div>
              {w.deceased && (
                <Input label="Date of death" type="date" className="max-w-xs" {...register('deceasedDate')} />
              )}
            </SectionCard>

            <SectionCard title="Consent" description="Recorded with the staff member and time of capture.">
              <Checkbox label="Consent to store and process personal and health data" {...register('consentStore')} />
              <Checkbox label="Consent to receive reports by SMS / email / messaging app" {...register('consentShareReports')} />
              <Checkbox label="Consent to use anonymised data for quality and research" {...register('consentResearch')} />
            </SectionCard>

            <SectionCard title="Notes">
              <Textarea label="Internal notes" rows={3} error={errors.notes?.message} {...register('notes')} />
            </SectionCard>
          </>
        )}

        {!isEdit && strongDuplicate && (
          <SectionCard title="Duplicate override">
            <Alert tone="warning">
              A very similar patient already exists. If this really is a different person, record why.
            </Alert>
            <Input
              label="Reason for registering a new record"
              error={errors.duplicateOverrideReason?.message}
              {...register('duplicateOverrideReason')}
            />
          </SectionCard>
        )}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-3">
            <Button variant="secondary" type="button" onClick={() => navigate(backTo)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Register patient'}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
