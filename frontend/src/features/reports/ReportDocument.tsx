import { Fragment } from 'react';
import type { ReportDetail, ReportParameterLine } from './types';

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
  return (
    <div id="report-print" className="mx-auto max-w-3xl bg-white p-8 text-[13px] text-black">
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
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
          </div>
        </div>
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
        <section key={test.testCode} className="mt-4 break-inside-avoid">
          <div className="flex items-baseline justify-between border-b border-black">
            <h2 className="text-sm font-bold uppercase">{test.testName}</h2>
            <span className="text-[11px]">{test.departmentName}</span>
          </div>
          <p className="text-[11px] text-gray-600">
            {[
              test.method && `Method: ${test.method}`,
              test.specimen && `Specimen: ${test.specimen.replace(/_/g, ' ')}`,
              test.accessionNumber && `Accession: ${test.accessionNumber}`,
            ]
              .filter(Boolean)
              .join('   ')}
          </p>

          <table className="mt-1 w-full text-xs">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="py-1">Investigation</th>
                <th className="py-1">Result</th>
                <th className="py-1">Unit</th>
                <th className="py-1">Reference range</th>
              </tr>
            </thead>
            <tbody>
              {test.parameters.map((p) => {
                const mark = flagMark(p.flag);
                return (
                  <Fragment key={p.name}>
                    <tr className="border-b border-gray-200">
                      <td className="py-1">{p.name}</td>
                      <td className="py-1 font-semibold">
                        {p.value ?? '—'}
                        {mark && <span className={`ml-1 ${mark.className}`}>{mark.text}</span>}
                      </td>
                      <td className="py-1">{p.unit ?? ''}</td>
                      <td className="py-1">{p.referenceText ?? ''}</td>
                    </tr>
                    {p.comment && (
                      <tr>
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

      <footer className="mt-8 border-t border-black pt-3 text-[11px] text-gray-700">
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
          <p className="mt-1">
            Verify this report at{' '}
            <span className="font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/app/verify/{report.verificationToken}
            </span>
            {report.contentHash ? ` · SHA-256 ${report.contentHash.slice(0, 16)}…` : ''}
          </p>
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
