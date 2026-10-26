import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { AlertTriangle } from 'lucide-react';
import type { PatientDetail } from './types';
import { formatAddress, formatDate } from './format';
import { bloodGroupLabel, categoryLabel } from './constants';

/**
 * Printable patient card + registration slip. Rendered off-screen; `window.print()` plus the
 * `#patient-print` rule in index.css isolates it on the page.
 *
 * Modeled on how real insurance/membership cards are actually structured, not a dashboard tile:
 * a top identity strip, then a strict hierarchy with exactly ONE dominant identifier (the MRN,
 * sized well above everything else) over visibly subordinate secondary fields — mixing several
 * same-weight ID-like numbers is a documented real failure mode (staff pulling the wrong field).
 * Secondary fields are plain label/value pairs rather than icon-badge rows, which reads as a
 * crafted card rather than a shrunken phone-app list. Type sizes are floored around 9pt+ for
 * anything that isn't a legend-style caption, since this prints on an office printer, not a
 * screen — print-craft guidance treats sub-9pt body text as a real legibility risk, not a
 * stylistic nicety.
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
     * plain mono text either way, so MRN lookup never depends on the QR decoding. Generated at
     * 300 so the raster stays crisp once this prints at real card size, not screen resolution.
     */
    const lookupUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/app/patients/${patient.id}`
        : `urn:mrn:${patient.mrn}`;
    let cancelled = false;
    QRCode.toDataURL(lookupUrl, { margin: 0, width: 300, errorCorrectionLevel: 'M' })
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
        : null;

  return (
    <div id="patient-print" className="hidden print:block">
      <div className="mx-auto max-w-lg p-6 font-sans text-black">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Zone 1 — identity strip. A literal Tailwind shade, never the app's theme-variable
              `primary` token, so the printed card looks identical regardless of the viewer's
              light/dark mode setting. */}
          <div className="flex items-center justify-between bg-sky-700 px-5 py-2.5">
            <p className="text-sm font-bold uppercase tracking-wide text-white">{labName || 'Laboratory'}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">Patient card</span>
          </div>

          <div className="p-5">
            {/* Zone 2 — name, then the one dominant identifier. */}
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Patient</p>
            <p className="truncate text-xl font-bold leading-tight text-gray-900">
              {patient.salutation ? `${patient.salutation} ` : ''}
              {patient.fullName}
            </p>
            {patient.nameLocal && <p className="truncate text-sm text-gray-600">{patient.nameLocal}</p>}
            <p className="mt-1.5 text-xs text-gray-700">
              {[age, patient.gender, bloodGroupLabel(patient.bloodGroup)].filter(Boolean).join('   ·   ')}
            </p>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-sky-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Medical record no.</p>
                <p className="truncate font-mono text-2xl font-bold tracking-wider text-sky-900">{patient.mrn}</p>
              </div>
              {/* QR stays isolated in its own white box with clear padding on every side — a
                  colored fill touching the code's edge is a documented real scan-failure risk
                  (barcode/QR quiet-zone guidance), so it never sits directly on the sky-50 fill. */}
              <div className="shrink-0 rounded-md border border-gray-200 bg-white p-1.5">
                {qrDataUri && (
                  <img
                    src={qrDataUri}
                    alt={`QR code linking to this patient's record, MRN ${patient.mrn}`}
                    className="h-24 w-24"
                  />
                )}
              </div>
            </div>
            <p className="mt-1 text-right text-xs text-gray-500">Scan to view record</p>

            {/* Zone 3 — secondary fields, visibly subordinate: plain label/value pairs instead of
                icon-badge rows. */}
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-200 pt-3 text-xs">
              <LabelValue label="Phone" value={patient.phone || '—'} />
              <LabelValue label="Category" value={categoryLabel(patient.category)} />
              <LabelValue
                label="Referred by"
                value={patient.referringDoctorName || patient.referralSourceName || 'Self'}
              />
              <LabelValue label="Registered" value={formatDate(patient.createdAt)} />
              <LabelValue label="Address" value={formatAddress(patient.address) || '—'} full />
            </div>

            {/* Amber for "needs attention" is already this app's print-document convention (see
                ReportDocument's critical-value banner and InvoicePrintDocument's balance-due row)
                — reused here rather than inventing a new accent color outside the sky/gray/amber
                brand family. */}
            {patient.emergencyContact?.name && (
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Emergency contact
                  </p>
                  <p className="break-words text-xs font-medium leading-snug text-amber-900">
                    {patient.emergencyContact.name}
                    {patient.emergencyContact.relationship ? ` (${patient.emergencyContact.relationship})` : ''}
                    {patient.emergencyContact.phone ? ` · ${patient.emergencyContact.phone}` : ''}
                  </p>
                </div>
              </div>
            )}

            <p className="mt-3 border-t border-gray-200 pt-2 text-xs leading-snug text-gray-500">
              Please bring this card on every visit and quote the MRN above for all enquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelValue({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="break-words font-medium text-gray-800">{value}</p>
    </div>
  );
}
