import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { PatientDetail } from './types';
import { formatAddress, formatDate } from './format';
import { bloodGroupLabel, categoryLabel } from './constants';

/**
 * Printable patient card + registration slip. Rendered off-screen; `window.print()`
 * plus the `#patient-print` rule in index.css isolates it on the page.
 */
export function PatientCard({ patient, labName }: { patient: PatientDetail; labName?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, patient.mrn, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 46,
        width: 1.8,
      });
    } catch {
      /* leave empty */
    }
  }, [patient.mrn]);

  const age =
    patient.ageYears != null
      ? `${patient.ageYears} yrs`
      : patient.approximateAgeYears != null
        ? `~${patient.approximateAgeYears} yrs`
        : '—';

  return (
    <div id="patient-print" className="hidden print:block">
      {/* Same fixed brand-colored accent as InvoicePrintDocument/ReportDocument — a literal
          Tailwind shade, never the app's theme-variable `primary` token, so a printed card looks
          the same regardless of the viewer's light/dark mode setting. */}
      <div className="h-2 bg-sky-600" aria-hidden />
      <div className="mx-auto max-w-md p-5 font-sans text-black">
        <div className="flex items-start justify-between border-b-2 border-sky-700 pb-2">
          <div>
            <p className="text-sm font-bold uppercase text-sky-900">{labName || 'Laboratory'}</p>
            <p className="text-[10px] text-gray-600">Patient registration card</p>
          </div>
          <p className="text-[10px] text-gray-600">{formatDate(new Date().toISOString())}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold">
              {patient.salutation ? `${patient.salutation} ` : ''}
              {patient.fullName}
            </p>
            {patient.nameLocal && <p className="text-sm">{patient.nameLocal}</p>}
            <p className="mt-1 text-xs text-gray-600">
              {age} · {patient.gender} · {bloodGroupLabel(patient.bloodGroup)}
            </p>
          </div>
          <div className="text-right">
            <svg ref={svgRef} className="h-12 w-40" role="img" aria-label={`Barcode ${patient.mrn}`} />
            <p className="font-mono text-sm font-bold tracking-widest text-sky-900">{patient.mrn}</p>
          </div>
        </div>

        <div className="mt-3 bg-gray-50 p-2">
          <table className="w-full text-[11px]">
            <tbody>
              <tr>
                <td className="w-28 py-0.5 font-semibold text-gray-700">Phone</td>
                <td>{patient.phone || '—'}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold text-gray-700">Category</td>
                <td>{categoryLabel(patient.category)}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-semibold text-gray-700">Referred by</td>
                <td>{patient.referringDoctorName || patient.referralSourceName || 'Self'}</td>
              </tr>
              <tr>
                <td className="py-0.5 align-top font-semibold text-gray-700">Address</td>
                <td>{formatAddress(patient.address) || '—'}</td>
              </tr>
              {patient.emergencyContact?.name && (
                <tr>
                  <td className="py-0.5 align-top font-semibold text-gray-700">Emergency</td>
                  <td>
                    {patient.emergencyContact.name}
                    {patient.emergencyContact.relationship ? ` (${patient.emergencyContact.relationship})` : ''}
                    {patient.emergencyContact.phone ? ` · ${patient.emergencyContact.phone}` : ''}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-0.5 font-semibold text-gray-700">Registered</td>
                <td>{formatDate(patient.createdAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 border-t border-sky-700 pt-2 text-[9px] leading-tight text-gray-600">
          Please bring this card on every visit. Quote the MRN {patient.mrn} for all enquiries.
        </p>
      </div>
    </div>
  );
}
