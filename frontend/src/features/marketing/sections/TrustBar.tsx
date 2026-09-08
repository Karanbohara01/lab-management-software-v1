import { Check } from 'lucide-react';
import { TRUST_POINTS } from '../data';
import { Reveal } from '../components/Reveal';

export function TrustBar() {
  return (
    <section aria-label="Platform capabilities" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Reveal>
          <ul className="grid gap-x-6 gap-y-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
