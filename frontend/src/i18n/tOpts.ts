import { getLocale } from './locale';
import { translate } from './translate';

export type Opt<T extends string> = { value: T; label: string };

/**
 * Translates a `{value,label}[]` options array's labels for the current locale — for `<Select>`s
 * built from enum-like option lists. `value` (the actually-stored/transmitted data, and the
 * dictionary lookup key for `label`) is always left untouched; only the display label passes
 * through `translate()`.
 */
export function tOpts<T extends string>(opts: Opt<T>[]): Opt<T>[] {
  const locale = getLocale();
  return opts.map((o) => ({ ...o, label: translate(locale, o.label) }));
}
