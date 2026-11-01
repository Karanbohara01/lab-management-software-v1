import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's stock utilities. Our semantic type tokens
 * (tailwind.config.js `fontSize`) also start with `text-`, and without this registration it
 * classifies them as *colours* — so `cn('text-primary-foreground', 'text-button')` would drop
 * the colour as a "conflict" (dark text on a navy button), and `cn('text-body-sm text-muted')`
 * would drop the size. Keep this list in step with the fontSize keys in tailwind.config.js.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-1',
            'display-2',
            'display-3',
            'heading-2',
            'heading-3',
            'heading-4',
            'lead',
            'body-lg',
            'body',
            'body-sm',
            'caption',
            'label',
            'price',
            'button',
            'button-lg',
          ],
        },
      ],
    },
  },
});

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
