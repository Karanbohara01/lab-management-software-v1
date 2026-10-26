import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { AlertTriangle, Calendar, MapPin, Phone, Stethoscope, Tag } from 'lucide-react';
import type { PatientDetail } from './types';
import { formatAddress, formatDate } from './format';
import { bloodGroupLabel, categoryLabel } from './constants';

/**
 * Printable patient card + registration slip. Rendered off-screen; `window.print()` plus the
 * `#patient-print` rule in index.css isolates it on the page.
 *
 * Styled as a "patient summary card" tile (soft rounded chips, a left accent spine, generous
 * whitespace) rather than the government-form look of a boxed table — see the inline comments
 * below for the handful of deliberate choices that go with that.
 */
export function PatientCard({ patient, labName }: { patient: PatientDetail; labName?: string }) {
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);

  useEffect(() => {
    /*
     * This app's only patient-facing self-service deep link is /portal/:token, and no portal
     * token is available on `patient` here (it's a separate, opt-in share action elsewhere) — so
     * a public portal link isn't an honest option for this QR. Rather than invent a fake
     * placeholder string, this encodes a real, working link that already exists:
     * /app/patients/:id, the staff-facing record route this very page lives on (`patient.id` is
     * on PatientDetail). It's auth-gated, so it's most useful to lab/front-desk staff scanning
     * with a logged-in device for instant lookup — not a patient scanning it at home — which
     * fits a *registration* card handled mostly at the counter. The MRN itself stays printed as
     * plain mono text below the code either way, so MRN lookup never depends on the QR decoding.
     */
    const lookupUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/app/patients/${patient.id}`
        : `urn:mrn:${patient.mrn}`;
    let cancelled = false;
    QRCode.toDataURL(lookupUrl, { margin: 0, width: 140, errorCorrectionLevel: 'M' })
      .then((uri) => {
        if (!cancelled) setQrDataUri(uri);
      })
      .catch(() => {
        if (!cancelled) setQrDataUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.id, patient.mrn]);

  const age =
    patient.ageYears != null
      ? `${patient.ageYears} yrs`
      : patient.approximateAgeYears != null
        ? `~${patient.approximateAgeYears} yrs`
        : '—';

  return (
    <div id="patient-print" className="hidden print:block">
      <div className="mx-auto max-w-md p-5 font-sans text-black">
        <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* The old full-bleed top bar is gone — in its place a vertical accent spine down the
              left edge, like a dashboard tile's status rail, rather than a letterhead band. Still
              a literal Tailwind shade (never the app's theme-variable `primary` token) so the
              printed card looks identical regardless of the viewer's light/dark mode setting. */}
          <div className="w-2 shrink-0 bg-sky-600" aria-hidden />

          <div className="min-w-0 flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-sky-900">{labName || 'Laboratory'}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                  Patient registration card
                </span>
              </div>
              <p className="pt-0.5 text-[10px] text-gray-500">{formatDate(new Date().toISOString())}</p>
            </div>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold leading-tight text-gray-900">
                  {patient.salutation ? `${patient.salutation} ` : ''}
                  {patient.fullName}
                </p>
                {patient.nameLocal && <p className="truncate text-sm text-gray-600">{patient.nameLocal}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill>{age}</Pill>
                  <Pill>{patient.gender}</Pill>
                  <Pill>{bloodGroupLabel(patient.bloodGroup)}</Pill>
                </div>
              </div>

              <div className="shrink-0 text-center">
                <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-gray-400">MRN</p>
                <div className="flex h-[68px] w-[68px] items-center justify-center rounded-lg border border-gray-200 bg-white p-1">
                  {qrDataUri && (
                    <img
                      src={qrDataUri}
                      alt={`QR code linking to this patient's record, MRN ${patient.mrn}`}
                      className="h-full w-full"
                    />
                  )}
                </div>
                <p className="mt-1 font-mono text-xs font-bold tracking-widest text-sky-900">{patient.mrn}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100" />

            {/* Field groups as icon + label + value pairs in a 2-col grid, not a boxed <table> —
                divider above/below each group instead of row borders. */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              <Field icon={<Phone className="h-3.5 w-3.5" strokeWidth={2} />} label="Phone" value={patient.phone || '—'} />
              <Field icon={<Tag className="h-3.5 w-3.5" strokeWidth={2} />} label="Category" value={categoryLabel(patient.category)} />
              <Field
                icon={<Stethoscope className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Referred by"
                value={patient.referringDoctorName || patient.referralSourceName || 'Self'}
              />
              <Field
                icon={<Calendar className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Registered"
                value={formatDate(patient.createdAt)}
              />
              <Field
                icon={<MapPin className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Address"
                value={formatAddress(patient.address) || '—'}
                full
              />
            </div>

            {/* Amber for "needs attention" is already this app's print-document convention (see
                ReportDocument's critical-value banner and InvoicePrintDocument's balance-due row)
                — reused here for the one field that's genuinely urgent-in-context, rather than
                inventing a new accent color outside the sky/gray brand family. */}
            {patient.emergencyContact?.name && (
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-700">Emergency contact</p>
                  <p className="break-words text-[11px] font-medium leading-snug text-amber-900">
                    {patient.emergencyContact.name}
                    {patient.emergencyContact.relationship ? ` (${patient.emergencyContact.relationship})` : ''}
                    {patient.emergencyContact.phone ? ` · ${patient.emergencyContact.phone}` : ''}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-sky-50 px-3 py-2">
              <p className="text-[9px] leading-snug text-sky-800">
                Please bring this card on every visit. Quote the MRN{' '}
                <span className="font-mono font-bold">{patient.mrn}</span> for all enquiries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
      {children}
    </span>
  );
}

function Field({
  icon,
  label,
  value,
  full,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${full ? 'col-span-2' : ''}`}>
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="break-words text-[11px] font-medium leading-snug text-gray-800">{value}</p>
      </div>
    </div>
  );
}
