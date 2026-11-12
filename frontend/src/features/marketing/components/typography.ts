/**
 * Class recipes for marketing text that isn't a primitive of its own (card titles and bodies,
 * kickers, checklist bullets), so the same role is styled identically in every section. The
 * sizes are the semantic tokens in tailwind.config.js, which carry their own weight, leading
 * and tracking — a recipe here only adds colour and the odd layout utility.
 */
export const TYPE = {
  /** Larger card title (role cards, pricing plans). */
  h3: 'text-heading-3 text-foreground',
  /** Standard card title (feature, about, blog cards; analytics panels). */
  h4: 'text-heading-4 text-foreground',
  body: 'text-body text-foreground',
  /** Card body / supporting copy. */
  bodySm: 'text-pretty text-body-sm text-muted',
  caption: 'text-caption text-muted',
  /** Small uppercase kicker — the Eyebrow's type without the pill. Add the colour at the call site. */
  label: 'text-label uppercase',
  /** A checklist bullet's text (see CheckBullet in primitives.tsx). */
  bullet: 'text-body-lg font-medium text-foreground',
} as const;
