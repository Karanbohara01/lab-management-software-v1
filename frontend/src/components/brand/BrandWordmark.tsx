import { cn } from '@/lib/cn';

/**
 * The "LIMS" wordmark (navy, teal "I"), served from `public/logo-wordmark.png` — swap that one
 * file to change it everywhere (width/height below are its intrinsic size, so the browser can
 * reserve the space before it loads; update them if the replacement has a different aspect
 * ratio). Sits beside `BrandMark`. Decorative (`alt=""`): the link that wraps it carries the
 * accessible name.
 */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <img
      src="/logo-wordmark.png"
      width={507}
      height={119}
      alt=""
      draggable={false}
      className={cn('w-auto select-none', className)}
    />
  );
}
