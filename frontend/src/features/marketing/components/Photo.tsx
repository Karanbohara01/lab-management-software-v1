import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Faint dot grid used as a subtle texture on brand surfaces (masked, low opacity). */
export const SCIENCE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='1' fill='%230ea5e9' fill-opacity='0.5'/%3E%3C/svg%3E\")";

export interface PhotoProps {
  /** Path under `/marketing/` — see `frontend/public/marketing/README.md`. */
  src: string;
  alt: string;
  /** Aspect ratio (e.g. '4 / 3'). Reserves space so there is no layout shift. */
  ratio?: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  /** Set on an above-the-fold image so it is not lazy-loaded. */
  priority?: boolean;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

/**
 * Contextual photography slot.
 *
 * Renders an on-brand placeholder until a licensed asset is placed in
 * `frontend/public/marketing/` (filenames + specs in the README there). If the
 * asset is missing the <img> `onError` hides it and the placeholder shows
 * through, so the page never displays a broken image.
 */
export function Photo({
  src,
  alt,
  ratio = '4 / 3',
  className,
  imgClassName,
  objectPosition,
  priority = false,
  srcSet,
  sizes,
  width,
  height,
}: PhotoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure
      className={cn(
        'relative isolate overflow-hidden rounded-2xl border border-border bg-surface-muted',
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      {/* On-brand placeholder shown until a real asset exists at `src`. */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(199_89%_40%/0.14),hsl(210_40%_96%/0.4)_45%,hsl(152_60%_36%/0.12))]"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40"
        style={{ backgroundImage: SCIENCE_TEXTURE }}
      />
      <span aria-hidden className="absolute inset-0 -z-10 flex items-center justify-center">
        <FlaskConical className="h-10 w-10 text-primary/25" strokeWidth={1.25} />
      </span>

      {!failed && (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
          style={objectPosition ? { objectPosition } : undefined}
        />
      )}

      {failed && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface/95 to-transparent px-3 pb-2 pt-6 text-[11px] leading-snug text-muted">
          <span className="line-clamp-2">{alt}</span>
        </figcaption>
      )}
    </figure>
  );
}
