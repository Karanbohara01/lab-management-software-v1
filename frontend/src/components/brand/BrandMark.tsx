import { cn } from '@/lib/cn';

/**
 * The LIMS logo mark (clipboard, test tube and flask), served from `public/logo-mark.svg` — swap
 * that one file to change the logo everywhere. Decorative (`alt=""`): pair it with the product
 * name as text, or put an `aria-label` on the link that wraps it.
 */
export function BrandMark({ className }: { className?: string }) {
  return <img src="/logo-mark.svg" alt="" draggable={false} className={cn('w-auto select-none', className)} />;
}
