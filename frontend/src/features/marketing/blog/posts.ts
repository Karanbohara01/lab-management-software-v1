/** A paragraph, a section heading, or a bulleted / numbered list. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

export interface Post {
  /** URL segment: /blog/<slug>. Unique, lowercase, hyphenated. */
  slug: string;
  title: string;
  /** One or two sentences for the card and the page's meta description. */
  excerpt: string;
  category: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  /** Illustration from `public/marketing/features/`, used on the card and the article. */
  image: string;
  body: Block[];
}

/*
 * Seed content. It's written from what LIMS actually does (so nothing here promises a feature the
 * product doesn't have) plus general laboratory practice. Replace or extend it as real posts are
 * written — everything on the Blogs section, /blog and /blog/<slug> is driven from this list.
 */
export const POSTS: Post[] = [
  {
    slug: 'how-a-sample-moves-through-the-lab',
    title: 'From registration to report: how a sample moves through the lab',
    excerpt:
      'Eleven steps connect the front desk to the pathologist’s sign-off. Here is what happens at each one — and where labs usually lose time.',
    category: 'Workflow',
    date: '2026-10-27',
    image: '/marketing/features/laboratory-workflow.png',
    body: [
      {
        type: 'p',
        text: 'Every result a patient receives is the end of a chain: someone registered them, someone ordered the tests, a sample was collected, labelled, processed, measured, checked and signed off. When that chain lives in registers and spreadsheets, each hand-off is a place for a delay or a mistake. A connected workflow does not remove the steps — it removes the re-keying between them.',
      },
      { type: 'h2', text: 'The eleven steps' },
      {
        type: 'ol',
        items: [
          'Registration — the patient gets one record and an MRN, so history and previous reports are a search away.',
          'Lab order — tests or profiles are picked and priced; confirming the order is what sets everything downstream in motion.',
          'Billing — an invoice is raised from the confirmed order instead of being typed again from a slip.',
          'Sample collection — a sample is created for each tube the order needs, and collection is recorded against it.',
          'Barcode tracking — each sample carries a unique accession number and a barcode.',
          'Processing — samples land on their department’s worklist.',
          'Result entry — values are entered against each parameter and compared with the reference range.',
          'Verification — flagged values are reviewed before results move on.',
          'Pathologist approval — the approver signs off, and any later amendment keeps its history.',
          'Report — a consolidated report is built from the approved results.',
          'Payment and e-Billing — payments are recorded against the invoice and any e-Billing submission is tracked.',
        ],
      },
      { type: 'h2', text: 'Where labs lose time' },
      {
        type: 'p',
        text: 'Three places come up again and again: re-entering the same details at the front desk, at billing and at the bench; not knowing where a sample is when a patient phones; and results waiting for a sign-off nobody realised was pending. Each is a visibility problem more than a speed problem — which is why every stage should show its queue to the people who need it.',
      },
      {
        type: 'p',
        text: 'A useful first exercise: write down your own version of the steps above and mark every place where information is copied by hand. Those hand-offs are the ones worth fixing first.',
      },
    ],
  },
  {
    slug: 'why-every-sample-needs-an-accession-number',
    title: 'Why every sample needs an accession number (and a barcode)',
    excerpt:
      'A name on a tube is not an identifier. A unique accession number and a scannable barcode make a sample traceable from the draw station to the report.',
    category: 'Sample tracking',
    date: '2026-10-20',
    image: '/marketing/features/barcode-tracking.png',
    body: [
      {
        type: 'p',
        text: 'Two patients can share a name. A handwritten label can smudge. An accession number — one unique code per sample — removes the ambiguity: it identifies the tube, not the person, and everything that happens to that sample is recorded against it.',
      },
      { type: 'h2', text: 'What a good identifier does' },
      {
        type: 'ul',
        items: [
          'Never repeats — each sample gets its own number, issued by the system rather than chosen by hand.',
          'Travels with the tube — it is printed on the label, so it is there at the bench without anyone copying it.',
          'Can be scanned — a barcode turns identification into a scan instead of a typing exercise.',
          'Links everything — the patient, the order, the tests, the results and the report all point back to it.',
        ],
      },
      { type: 'h2', text: 'Scan, don’t type' },
      {
        type: 'p',
        text: 'LIMS creates a sample the moment an order is confirmed, each with a unique accession number and a Code128 barcode. Scanning it — or looking the number up — shows where the sample is and what has happened to it so far, on a tracking timeline.',
      },
      { type: 'h2', text: 'Habits that make it work' },
      {
        type: 'ul',
        items: [
          'Label at the point of collection, not later.',
          'Scan on receipt at the lab, so the status updates when the tube arrives.',
          'Treat a mismatch — the wrong tube, a missing label — as a stop, not a workaround.',
        ],
      },
      {
        type: 'p',
        text: 'The point is not the barcode itself. It is that nobody has to remember anything: the identity is on the tube, and the record follows it.',
      },
    ],
  },
  {
    slug: 'reference-ranges-and-critical-values-explained',
    title: 'Reference ranges and critical values, explained',
    excerpt:
      'A result only means something next to the right range. Here is how age- and sex-specific ranges, abnormal flags and critical values fit together.',
    category: 'Results',
    date: '2026-10-13',
    image: '/marketing/features/result-management.png',
    body: [
      {
        type: 'p',
        text: 'A haemoglobin of 12 g/dL means something different for an adult man, an adult woman and a newborn. A number on its own is not a result; a number next to the right reference range is.',
      },
      { type: 'h2', text: 'Reference ranges' },
      {
        type: 'p',
        text: 'A reference range is the interval in which most healthy people of a given group fall. Many tests use different ranges by age and sex, so a lab needs to choose the right one for each patient instead of printing one range for everybody. LIMS stores ranges per test parameter and resolves the matching one automatically from the patient’s age and sex.',
      },
      { type: 'h2', text: 'Abnormal versus critical' },
      {
        type: 'p',
        text: 'Two flags often get mixed up. An abnormal result falls outside the reference range and is worth noting on the report. A critical result is so far outside it that it may need action quickly — a phone call to the clinician rather than a line in a report. Labs usually set critical limits per test, as separate low and high thresholds.',
      },
      { type: 'h2', text: 'Letting the system do the comparing' },
      {
        type: 'ul',
        items: [
          'Ranges are applied automatically as values are entered.',
          'Abnormal and critical results are flagged on the entry screen and in the report.',
          'Flagged values are reviewed at verification, before anything is approved.',
        ],
      },
      {
        type: 'p',
        text: 'Automation does not replace the judgement of the technician or the pathologist. It makes sure the comparison is never skipped, so their attention goes to the results that need it. (This is general information for laboratory teams, not medical advice.)',
      },
    ],
  },
  {
    slug: 'billing-that-follows-the-laboratory-workflow',
    title: 'Billing that follows the laboratory workflow',
    excerpt:
      'When invoices are typed up from order slips, a lab’s income and its work drift apart. Raise the invoice from the order instead.',
    category: 'Billing',
    date: '2026-10-06',
    image: '/marketing/features/billing-payments.png',
    body: [
      {
        type: 'p',
        text: 'In many labs the test order and the bill live in two places: a slip for the bench and a ledger for the counter. Every difference between them — a test added later, a discount agreed verbally — turns into a reconciliation job at the end of the month.',
      },
      { type: 'h2', text: 'One order, one price' },
      {
        type: 'p',
        text: 'In LIMS the invoice is raised straight from the confirmed order. Prices come from the test catalogue, and discount and tax are applied on top, so the amount is calculated by the system rather than retyped.',
      },
      { type: 'h2', text: 'Getting paid, in practice' },
      {
        type: 'ul',
        items: [
          'Partial payments — record what was paid now and see what is still owed.',
          'Numbered per fiscal year — invoice numbers run in sequence within each fiscal year and are not reused.',
          'Refunds with a second pair of eyes — one person requests a refund and a different person approves it.',
          'A guard against overpayment — a payment cannot exceed what is owed.',
        ],
      },
      { type: 'h2', text: 'What to check in your own lab' },
      {
        type: 'p',
        text: 'Take last month’s invoices and compare ten of them with the original orders. If any differ, find out where the difference was introduced — that is the hand-off to fix.',
      },
    ],
  },
  {
    slug: 'keeping-an-honest-e-billing-trail',
    title: 'Keeping an honest e-Billing trail',
    excerpt:
      'Pending, submitted, accepted, failed: why every invoice should show exactly where it stands with the tax authority — and nothing more optimistic.',
    category: 'e-Billing',
    date: '2026-09-29',
    image: '/marketing/features/ird-e-billing.png',
    body: [
      {
        type: 'p',
        text: 'Electronic billing adds one more step to every invoice: telling the tax authority about it. For a laboratory the practical question is not only “did we send it?” but “what happened when we did?”',
      },
      { type: 'h2', text: 'States, not guesses' },
      {
        type: 'p',
        text: 'An invoice can be not yet submitted, pending, submitted, accepted, failed, or flagged as a duplicate. Showing the real state — rather than a vague “done” — means nobody has to guess whether a bill needs attention.',
      },
      {
        type: 'ul',
        items: [
          'Every attempt is logged, with what was sent and what came back.',
          'There is no automatic resubmission after a success — a duplicate is worse than a delay.',
          'Retrying a failed submission is a deliberate choice, not something that happens silently.',
          'A bill filed manually through the IRD portal can be recorded as exactly that.',
        ],
      },
      { type: 'h2', text: 'Don’t let billing wait on a remote system' },
      {
        type: 'p',
        text: 'Submission is kept separate from creating an invoice and taking payment, so a slow or unavailable service never stops the front desk from billing a patient. The invoice is issued first; the submission follows and is tracked.',
      },
      { type: 'h2', text: 'A note on registration' },
      {
        type: 'p',
        text: 'Being able to submit is not the same as being registered. Registration with the tax authority is a separate process, done directly with them; software can support the workflow but cannot substitute for it. LIMS is built to track the process honestly, and does not claim a certification it does not hold.',
      },
    ],
  },
  {
    slug: 'batches-expiry-and-fefo-for-laboratory-inventory',
    title: 'Never lose track of reagents: batches, expiry and FEFO',
    excerpt:
      'Using the batch that expires first is not just tidy — it keeps reagents from being thrown away unused.',
    category: 'Inventory',
    date: '2026-09-22',
    image: '/marketing/features/inventory.png',
    body: [
      {
        type: 'p',
        text: 'A reagent past its expiry date is not a saving; it is a result you cannot trust and a cost you have already paid. Most waste in a laboratory store has one cause: stock is used in the order it arrived on the shelf, not the order in which it expires.',
      },
      { type: 'h2', text: 'Track by batch, not just by item' },
      {
        type: 'p',
        text: 'Two boxes of the same kit can carry different expiry dates. Recording stock by batch — each with its own quantity and expiry — lets you see which box to reach for.',
      },
      { type: 'h2', text: 'First-expiry, first-out' },
      {
        type: 'p',
        text: 'FEFO means issuing from the batch that expires soonest. LIMS applies it when stock is issued, and every movement — received, issued, adjusted, discarded — goes into a ledger with a running balance, so the number on the screen can always be traced back to what actually happened.',
      },
      { type: 'h2', text: 'Alerts that arrive before the problem' },
      {
        type: 'ul',
        items: [
          'Low stock — before the bench runs out.',
          'Expiring soon — while there is still time to use it.',
          'Expired — flagged so it is not used by mistake.',
        ],
      },
      {
        type: 'p',
        text: 'Ordering follows the same logic: purchase orders can be raised, submitted and received straight into inventory, so a delivery updates the stock without a second entry.',
      },
    ],
  },
];

/** Newest first. */
export function latestPosts(count?: number): Post[] {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return count === undefined ? sorted : sorted.slice(0, count);
}

export function getPost(slug: string | undefined): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Every word of the article, for the reading-time estimate. */
function wordCount(post: Post): number {
  const text = post.body
    .map((b) => (b.type === 'ul' || b.type === 'ol' ? b.items.join(' ') : b.text))
    .join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/** Reading time at ~200 words a minute — computed, not hand-typed, so it can't drift from the text. */
export function readingMinutes(post: Post): number {
  return Math.max(1, Math.ceil(wordCount(post) / 200));
}

export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
