import {
  ArrowRight,
  Check,
  CreditCard,
  Database,
  EyeOff,
  FileText,
  FolderCog,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Section } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { Photo } from '../components/Photo';
import { CONNECTED_WORKFLOW, IMAGES, TRADITIONAL_WORKFLOW } from '../data';

/** Each pain point gets its own icon, as a round tile on its card — alternating the logo's navy and teal. */
const PAIN_POINTS: { text: string; icon: LucideIcon; tone: string }[] = [
  { text: 'Paper-heavy workflows and duplicate data entry', icon: FileText, tone: 'bg-primary/10 text-primary' },
  { text: 'Billing disconnected from the laboratory', icon: CreditCard, tone: 'bg-success/10 text-success' },
  { text: 'No clear view of where a sample is', icon: EyeOff, tone: 'bg-primary/10 text-primary' },
  { text: 'Result verification that slips through the cracks', icon: ShieldCheck, tone: 'bg-success/10 text-success' },
  { text: 'Reports scattered across machines and folders', icon: FolderCog, tone: 'bg-primary/10 text-primary' },
  { text: 'Financial records that never quite reconcile', icon: Database, tone: 'bg-success/10 text-success' },
];

export function Problem() {
  return (
    <Section id="solutions">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-14">
        <div>
          <Reveal>
            <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Laboratory operations shouldn&apos;t depend on <span className="text-primary">disconnected systems.</span>
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Most labs run on a patchwork of registers, spreadsheets, a billing package and a reporting tool that
              don&apos;t talk to each other. The cost is time, errors and lost revenue.
            </p>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            {/* Shown at the photo's own 747:412 shape, uncropped — the crossed-out icons that run
                across it are the point, and a 4:3 crop would cut the right-hand ones off. */}
            <Photo
              src={IMAGES.problem.src}
              alt={IMAGES.problem.alt}
              ratio="747 / 412"
              width={747}
              height={412}
              objectPosition="center"
              className="border-0 shadow-[0_24px_50px_-28px_rgb(15_23_42/0.45)]"
            />
          </Reveal>
        </div>

        <Reveal delay={120}>
          <ul className="space-y-3.5">
            {PAIN_POINTS.map(({ text, icon: Icon, tone }) => (
              <li
                key={text}
                className="flex items-center gap-4 rounded-2xl bg-surface px-4 py-3.5 shadow-[0_6px_20px_-10px_rgb(15_23_42/0.22)]"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="flex-1 text-base font-medium text-foreground">{text}</span>
                <X className="h-5 w-5 shrink-0 text-red-500" aria-hidden />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Traditional workflow</p>
            <ul className="mt-3 space-y-2">
              {TRADITIONAL_WORKFLOW.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <span className="flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-primary/10 text-primary md:rotate-0">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Connected workflow</p>
            <ul className="mt-3 space-y-2">
              {CONNECTED_WORKFLOW.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
