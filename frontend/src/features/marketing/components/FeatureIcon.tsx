import { cn } from '@/lib/cn';

/**
 * A feature's illustration on its soft tile — shared by the Features cards and the navbar's
 * features menu so they always match. The illustrations are full-colour with their own outlines,
 * so the tile only tints slightly on hover (it doesn't invert like a single-colour glyph would).
 * Decorative (`alt=""`): the feature's title always sits next to it. The parent needs the
 * `group` class for the hover tint.
 */
export function FeatureIcon({
  src,
  className,
  imgClassName,
}: {
  src: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20',
        className,
      )}
    >
      <img
        src={src}
        width={160}
        height={160}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn('select-none', imgClassName)}
      />
    </span>
  );
}
