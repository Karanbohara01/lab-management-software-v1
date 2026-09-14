import { Fragment, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { ReportDetail, ReportParameterLine } from './types';

/**
 * Renders the report's verification URL as a scannable QR code, generated entirely client-side
 * (no external QR-generation API) — a printed clinical report must never depend on a network call
 * just to render its own authenticity check. Silently omits itself if generation fails (e.g. an
 * unexpected token format) rather than breaking the rest of the report.
 */
function VerificationQr({ url }: { url: string }) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 0, width: 88, errorCorrectionLevel: 'M' })
      .then((uri) => {
        if (!cancelled) setDataUri(uri);
      })
      .catch(() => {
        if (!cancelled) setDataUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUri) return null;
  return <img src={dataUri} alt="Scan to verify this report" className="h-[70px] w-[70px]" />;
}

function flagMark(flag: ReportParameterLine['flag']): { text: string; className: string } | null {
  switch (flag) {
    case 'LOW':
      return { text: 'L', className: 'text-amber-600' };
    case 'HIGH':
      return { text: 'H', className: 'text-amber-600' };
    case 'CRITICAL_LOW':
      return { text: 'LL ⚠', className: 'font-bold text-red-600' };
    case 'CRITICAL_HIGH':
      return { text: 'HH ⚠', className: 'font-bold text-red-600' };
    case 'ABNORMAL':
      return { text: '*', className: 'text-amber-600' };
    default:
      return null;
  }
}

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export function ReportDocument({ report }: { report: ReportDetail }) {
  const lab = report.laboratory;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verificationUrl = `${origin}/verify/${report.verificationToken}`;
  return (
    <>
      {/* Scoped to this route's own print context (always opened in its own tab) — Chromium's
          print engine supports @page margin boxes for running page numbers, so a multi-page
          report (e.g. several bundled tests) prints "Page X of Y" without any JS pagination.
          A position:fixed running header was tried first for patient identification on page 2+
          but proved unreliable across page boundaries in real PDF output (verified live — it
          landed at inconsistent vertical positions per page instead of repeating at the same
          spot). Replaced with the row added inside each test's own <thead> below, which rides on
          thead's already-proven repeat-per-page behavior (the column headers themselves already
          repeat correctly — same mechanism, just one more row). */}
      <style>{'@media print { @page { margin: 16mm 12mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #666; } } }'}</style>
      <div id="report-print" className="mx-auto max-w-3xl bg-white p-8 text-[13px] text-black">
        <header className={`flex items-start border-b-2 border-black pb-3 ${lab.printLetterhead ? 'justify-between' : 'justify-end'}`}>
        {lab.printLetterhead && (
          <div className="flex items-center gap-3">
            {lab.logoDataUri && <img src={lab.logoDataUri} alt="" className="h-14 w-14 object-contain" />}
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide">{lab.name}</h1>
              <p className="text-xs">
                {[lab.addressLine, lab.city].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs">
                {[lab.phone && `Tel: ${lab.phone}`, lab.email, lab.panNumber && `PAN: ${lab.panNumber}`]
                  .filter(Boolean)
                  .join('  ·  ')}
              </p>
              {lab.accreditationNumber && (
                <p className="text-xs">Accreditation No: {lab.accreditationNumber}</p>
              )}
            </div>
          </div>
        )}
        <div className="text-right text-xs">
          <p className="font-semibold">
            {report.reportType === 'PRELIMINARY' ? 'PRELIMINARY REPORT' : 'LABORATORY REPORT'}
          </p>
          <p>{report.reportNumber}</p>
          {report.reportVersion > 1 && <p className="text-red-600">Amended · v{report.reportVersion}</p>}
        </div>
      </header>

      {report.reportType === 'PRELIMINARY' && (
        <p className="mt-2 border border-red-600 bg-red-50 px-2 py-1 text-center text-[11px] font-bold uppercase text-red-700">
          Preliminary — not all requested tests are reported yet. A final report will follow.
        </p>
      )}

      <section className="grid grid-cols-2 gap-x-8 gap-y-1 border-b border-black py-3 text-xs">
        <Line label="Patient" value={report.patientName} />
        <Line label="Referred by" value={report.referringDoctorName ?? '—'} />
        <Line label="MRN" value={report.patientMrn} />
        <Line label="Order no." value={report.orderNumber} />
        <Line
          label="Age / Sex"
          value={`${report.patientAgeYears != null ? `${report.patientAgeYears} yrs` : '—'} / ${report.patientGender}`}
        />
        <Line label="Report date" value={dt(report.generatedAt)} />
      </section>

      {report.hasCritical && (
        <p className="my-2 border border-red-600 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
          ⚠ Critical value present — verbal notification protocol applies.
        </p>
      )}

      {report.tests.map((test) => (
        <section key={test.testCode} className="mt-4">
          <div className="flex items-baseline justify-between border-b border-black break-after-avoid">
            <h2 className="text-sm font-bold uppercase">{test.testName}</h2>
            <span className="text-[11px]">{test.departmentName}</span>
          </div>
          <p className="break-after-avoid text-[11px] text-gray-600">
            {[
              test.method && `Method: ${test.method}`,
              test.specimen && `Specimen: ${test.specimen.replace(/_/g, ' ')}`,
              test.accessionNumber && `Accession: ${test.accessionNumber}`,
            ]
              .filter(Boolean)
              .join('   ')}
          </p>
          {(test.collectedAt || test.receivedAt) && (
            <p className="break-after-avoid text-[11px] text-gray-600">
              {[
                test.collectedAt && `Collected: ${dt(test.collectedAt)}`,
                test.receivedAt && `Received: ${dt(test.receivedAt)}`,
              ]
                .filter(Boolean)
                .join('   ')}
            </p>
          )}

          <table className="mt-1 w-full text-xs">
            <thead>
              {/* Rides on thead's proven repeat-on-every-page print behavior (see the file-level
                  comment above) so the patient stays identified if this test's table — or any
                  test after it — spans onto a continuation page with no other patient info on it.
                  Redundant with the patient block above on page 1 itself; that's an accepted
                  trade-off (a real report showing the name twice is harmless; showing it zero
                  times on a separated page is not). */}
              <tr>
                <td colSpan={4} className="pb-1 text-[9px] uppercase tracking-wide text-gray-400">
                  {report.patientName} · MRN {report.patientMrn} · {report.reportNumber}
                </td>
              </tr>
              <tr className="border-b border-gray-400 text-left">
                <th className="py-1">Investigation</th>
                <th className="py-1">Result</th>
                <th className="py-1">Unit</th>
                <th className="py-1">Reference range</th>
              </tr>
            </thead>
            <tbody>
              {test.parameters.map((p, i) => {
                const mark = flagMark(p.flag);
                const previousHeading = i > 0 ? (test.parameters[i - 1]?.groupHeading ?? null) : null;
                const showHeading = p.groupHeading && p.groupHeading !== previousHeading;
                return (
                  <Fragment key={p.name}>
                    {showHeading && (
                      <tr className="break-inside-avoid break-after-avoid">
                        <td colSpan={4} className="bg-gray-50 py-1 pt-2 text-[11px] font-bold uppercase tracking-wide">
                          {p.groupHeading}
                        </td>
                      </tr>
                    )}
                    <tr className="break-inside-avoid border-b border-gray-200">
                      <td className={`py-1 ${p.groupHeading ? 'pl-3' : ''}`}>{p.name}</td>
                      <td className="py-1 font-semibold">
                        {p.value ?? '—'}
                        {mark && <span className={`ml-1 ${mark.className}`}>{mark.text}</span>}
                      </td>
                      <td className="py-1">{p.unit ?? ''}</td>
                      <td className="py-1">{p.referenceText ?? ''}</td>
                    </tr>
                    {p.comment && (
                      <tr className="break-inside-avoid">
                        <td colSpan={4} className="pb-1 text-[10px] italic text-gray-600">
                          {p.name}: {p.comment}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {test.comment && <p className="mt-1 text-[11px] italic">Comment: {test.comment}</p>}
          <p className="mt-1 text-[11px] text-gray-600">
            Verified by {test.verifiedBy ?? '—'} · Approved by {test.approvedBy ?? '—'}
            {test.approvedAt ? ` · ${dt(test.approvedAt)}` : ''}
          </p>
        </section>
      ))}

      <footer className="mt-8 break-inside-avoid border-t border-black pt-3 text-[11px] text-gray-700">
        <div className="mb-6 flex justify-end gap-16">
          <div className="text-center">
            <div className="h-8 w-40 border-b border-gray-500" />
            <p>Lab Technician</p>
          </div>
          <div className="text-center">
            <div className="h-8 w-40 border-b border-gray-500" />
            <p>Consultant Pathologist</p>
          </div>
        </div>
        {report.signedBy && (
          <p className="mt-1">
            Electronically signed by <span className="font-semibold">{report.signedBy}</span>
            {report.signerCredentials ? `, ${report.signerCredentials}` : ''}
            {report.signedAt ? ` on ${new Date(report.signedAt).toLocaleString()}` : ''}.
          </p>
        )}
        {report.verificationToken && (
          <div className="mt-2 flex items-start gap-3 break-inside-avoid">
            <VerificationQr url={verificationUrl} />
            <p className="flex-1">
              Scan to verify, or visit{' '}
              <span className="font-mono">
                {typeof window !== 'undefined' ? window.location.origin : ''}/verify/{report.verificationToken}
              </span>
              {report.contentHash ? (
                <>
                  <br />
                  SHA-256 {report.contentHash.slice(0, 16)}…
                </>
              ) : null}
            </p>
          </div>
        )}
        {lab.reportFooter && <p>{lab.reportFooter}</p>}
        <p className="mt-1">
          Report {report.reportNumber} · {report.reportType} · Status: {report.status}
          {report.status === 'DELIVERED' && report.deliveryMethod
            ? ` (${report.deliveryMethod}${report.deliveryRecipient ? ` → ${report.deliveryRecipient}` : ''})`
            : ''}
        </p>
      </footer>
      </div>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="inline-block w-24 font-semibold">{label}</span>
      <span>{value}</span>
    </p>
  );
}
