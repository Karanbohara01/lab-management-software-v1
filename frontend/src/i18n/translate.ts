import { createElement, Fragment, type ReactNode } from 'react';
import type { Locale } from './locale';
import { ne } from './ne';

/**
 * A dictionary is keyed by the English text itself. That choice does three things at once: the
 * source stays readable (`t('Register patient')`), a string nobody has translated yet simply
 * shows in English instead of as a bare key, and adding a language is one flat file. The cost is
 * that one English phrase gets one translation — where the same words need two renderings, the
 * caller passes a distinct key such as `'Back (navigation)'` and the English form for it.
 */
export type Dictionary = Readonly<Record<string, string>>;

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {},
  ne,
};

export type Vars = Record<string, string | number>;

/** `{name}` placeholders, filled from `vars`; anything not supplied is left as written. */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** The translated form of `key` in `locale`, with placeholders filled. Falls back to English. */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const found = DICTIONARIES[locale][key];
  return interpolate(found ?? key, vars);
}

/**
 * Like {@link translate}, but a placeholder may stand for a React element — a bold page number,
 * a link — rather than text. The translated template is split on its placeholders and the pieces
 * interleaved, so the element lands wherever the language puts it.
 */
export function translateRich(locale: Locale, key: string, vars: Record<string, ReactNode>): ReactNode[] {
  const template = DICTIONARIES[locale][key] ?? key;
  const pieces: ReactNode[] = [];
  const pattern = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    if (match.index > last) pieces.push(template.slice(last, match.index));
    const name = match[1]!;
    pieces.push(name in vars ? vars[name] : match[0]);
    last = match.index + match[0].length;
  }
  if (last < template.length) pieces.push(template.slice(last));
  // Keyed so a caller can spread this straight into JSX children without a "missing key" warning.
  return pieces.map((piece, i) => createElement(Fragment, { key: i }, piece));
}

/** Whether a translation exists, for tests that guard against the dictionary drifting. */
export function hasTranslation(locale: Locale, key: string): boolean {
  return key in DICTIONARIES[locale];
}
