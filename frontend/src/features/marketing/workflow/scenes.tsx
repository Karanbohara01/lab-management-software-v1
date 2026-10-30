import type { CSSProperties, ReactNode } from 'react';

/** Stagger index for the entrance animations (`--d` × 0.3s in workflow.css). */
const d = (n: number): CSSProperties => ({ '--d': n }) as CSSProperties;

/** Bar widths for the decorative barcode; even positions are dark, odd are gaps. */
const BARS = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 2, 1, 3, 1, 2, 1, 1, 3];

/** 7×7 decorative QR — '1' is a dark module. */
const QR_ROWS = ['1111101', '1000110', '1011011', '0100101', '1101110', '1000011', '1111010'];

/*
 * One illustration per workflow step, in the same order as WORKFLOW_STEPS (a test keeps the two
 * lists the same length). The Billing scene is the original design's, verbatim (six tests,
 * "Rs.", total Rs. 4,520 — "Rs. 1100" is unpunctuated there too); the order and receipt scenes
 * reuse those tests and that total so the demo hangs together.
 */
export const SCENES: ReadonlyArray<() => ReactNode> = [
  // 1 · Patient registration
  () => (
    <div className="lw-card">
      <div className="lw-row">
        <div className="lw-avatar lw-pop">SR</div>
        <div className="lw-col">
          <span className="lw-label">New patient · MRN</span>
          <span className="lw-mono lw-type" style={d(1)}>P000242</span>
        </div>
      </div>
      {[
        ['Name', 'Sita Rai'],
        ['Age / sex', '34 · Female'],
        ['Phone', '98410 00002'],
      ].map(([label, value], i) => (
        <div className="lw-field" key={label}>
          <span className="lw-label">{label}</span>
          <span className="lw-input">
            <span className="lw-fill-text" style={d(i + 2)}>{value}</span>
          </span>
        </div>
      ))}
    </div>
  ),

  // 2 · Lab order
  () => (
    <div className="lw-card">
      <span className="lw-label">Select tests</span>
      <div className="lw-chips">
        {['CBC', 'LFT', 'RFT', 'Lipid profile', 'TSH', 'HbA1c'].map((t, i) => (
          <span className="lw-chip lw-pop" style={d(i + 1)} key={t}>{t}</span>
        ))}
      </div>
      <span className="lw-pill-sm lw-fade-up" style={d(7)}>✓ Order confirmed</span>
      <p className="lw-note lw-fade-up" style={d(8)}>Samples, invoice and worklist are created automatically.</p>
    </div>
  ),

  // 3 · Billing
  () => (
    <div className="lw-card">
      {[
        ['CBC', 'Rs. 450'],
        ['LFT', 'Rs. 900'],
        ['RFT', 'Rs. 850'],
        ['Lipid profile', 'Rs. 1100'],
        ['TSH', 'Rs. 700'],
        ['HbA1c', 'Rs. 520'],
      ].map(([name, amount], i) => (
        <div className="lw-line lw-slide-in" style={d(i)} key={name}>
          <span>{name}</span>
          <span>{amount}</span>
        </div>
      ))}
      <div className="lw-total lw-fade-up" style={d(7)}><span>Total</span><span>Rs. 4,520</span></div>
    </div>
  ),

  // 4 · Sample collection
  () => (
    <div className="lw-center">
      <div className="lw-syringe"><span /></div>
      <div className="lw-tubes">
        {['#8b5cf6', '#ef4444', '#8b5cf6'].map((cap, i) => (
          <div className="lw-tube" style={d(i)} key={i}>
            <div className="lw-tube-cap" style={{ background: cap }} />
            <div className="lw-tube-body"><div className="lw-tube-liquid" style={d(i)} /></div>
          </div>
        ))}
      </div>
      <p className="lw-note lw-fade-up" style={d(4)}>Sample S000242 · collected</p>
    </div>
  ),

  // 5 · Barcode tracking
  () => (
    <div className="lw-center">
      <div className="lw-barcode-wrap lw-pop">
        <div className="lw-barcode">
          {BARS.map((w, i) => (
            <span key={i} style={{ width: w * 2, background: i % 2 === 0 ? '#0f172a' : 'transparent' }} />
          ))}
        </div>
        <span className="lw-scanline" />
      </div>
      <span className="lw-mono lw-fade-up" style={d(2)}>S000242</span>
      <p className="lw-note lw-fade-up" style={d(3)}>Scan at any point to see where the sample is.</p>
    </div>
  ),

  // 6 · Processing
  () => (
    <div className="lw-center">
      <div className="lw-centrifuge">
        <div className="lw-rotor">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <span key={deg} style={{ transform: `rotate(${deg}deg)` }} />
          ))}
        </div>
      </div>
      <p className="lw-note lw-fade-up" style={d(1)}>On the bench · Haematology worklist</p>
    </div>
  ),

  // 7 · Result entry
  () => (
    <div className="lw-card">
      <div className="lw-line is-head"><span>Complete Blood Count</span><span>Reference</span></div>
      {[
        ['Haemoglobin', '9.8 g/dL', '12.0–15.0', true],
        ['WBC', '7.4 ×10³/µL', '4.0–11.0', false],
        ['Platelets', '245 ×10³/µL', '150–450', false],
      ].map(([name, value, range, flagged], i) => (
        <div className="lw-line lw-fade-up" style={d(i + 1)} key={String(name)}>
          <span>{name}</span>
          <span>
            {flagged ? (
              <>
                <span className="lw-flag">{value}</span>
                <span className="lw-flag-tag">LOW</span>
              </>
            ) : (
              value
            )}{' '}
            <small>{range}</small>
          </span>
        </div>
      ))}
    </div>
  ),

  // 8 · Verification
  () => (
    <div className="lw-card">
      {['Reference ranges applied', 'Abnormal values flagged', 'Critical values reviewed', 'Marked as Verified'].map(
        (text, i) => (
          <div className="lw-check" key={text}>
            <span className="lw-tick" style={d(i)}>✓</span>
            <span className="lw-fade-up" style={d(i)}>{text}</span>
          </div>
        ),
      )}
      <div className="lw-badge is-green lw-fade-up" style={d(5)}>Ready for approval</div>
    </div>
  ),

  // 9 · Pathologist approval
  () => (
    <div className="lw-card lw-doc">
      <div className="lw-row"><span className="lw-label">Pathology report · Sita Rai</span></div>
      {[88, 100, 72, 92].map((w, i) => (
        <span className="lw-doc-line lw-grow-x" style={{ ...d(i), width: `${w}%` }} key={i} />
      ))}
      <svg className="lw-signature" viewBox="0 0 150 46" aria-hidden>
        <path d="M4 32C14 8 24 8 28 28S44 40 52 18S70 10 78 30S100 38 112 16L146 24" />
      </svg>
      <span className="lw-label">Pathologist</span>
      <span className="lw-stamp">APPROVED</span>
    </div>
  ),

  // 10 · Report
  () => (
    <div className="lw-center">
      <div className="lw-printer">
        <div className="lw-paper">
          <div className="lw-paper-head">LIMS REPORT</div>
          {[0, 1, 2, 3, 4].map((i) => (
            <span className="lw-doc-line" key={i} />
          ))}
          <span className="lw-paper-pdf">PDF</span>
        </div>
        <div className="lw-printer-body" />
      </div>
      <p className="lw-note lw-fade-up" style={d(4)}>On your letterhead · print- and PDF-ready</p>
    </div>
  ),

  // 11 · Payment / e-Billing
  () => (
    <div className="lw-card lw-receipt lw-drop">
      <div className="lw-row" style={{ justifyContent: 'space-between' }}>
        <div className="lw-col">
          <span className="lw-label">Payment received</span>
          <span className="lw-mono">INV-2082/83-000124</span>
        </div>
        <span className="lw-pill-sm">✓ Paid</span>
      </div>
      <div className="lw-total"><span>Total</span><span>Rs. 4,520</span></div>
      <div className="lw-qr lw-pop" style={d(2)} aria-hidden>
        {QR_ROWS.flatMap((row, r) =>
          [...row].map((bit, c) => <span key={`${r}-${c}`} className={bit === '1' ? undefined : 'is-off'} />),
        )}
      </div>
      <div className="lw-badge is-green lw-fade-up" style={d(3)}>e-Billing submission tracked</div>
    </div>
  ),
];

/** The sentence under each step's title, in WORKFLOW_STEPS order. */
export const STEP_COPY: readonly string[] = [
  'Register in seconds — an MRN is generated automatically, and the patient’s contact, referral and history live in one record.',
  'Pick tests or profiles; pricing, discount and tax are worked out for you. Confirm the order and everything downstream is created.',
  'Charges are calculated automatically from the test price list, with discounts and VAT applied.',
  'Samples are generated the moment an order is confirmed. Collect each one and record the collection against it.',
  'Every sample gets a unique accession number and a Code128 barcode, so you can scan or look one up and see exactly where it is.',
  'Each sample lands on its department’s worklist, so the bench always knows what is waiting and what is done.',
  'Enter values against each parameter. Reference ranges resolve for the patient’s age and sex, and abnormal or critical results are flagged.',
  'Flags get reviewed and results are marked Verified before they can be approved — nothing skips a stage.',
  'The pathologist reviews and approves. If something is amended afterwards, the full history is kept.',
  'A consolidated report is built from the approved results on your letterhead — print-ready, PDF-ready, with release and delivery tracked.',
  'Record payments against the invoice and follow the e-Billing submission — pending, submitted, accepted or failed — in one place.',
];
