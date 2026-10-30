import { useEffect } from 'react';
import { PRODUCT_NAME } from './data';

const DEFAULT_TITLE = `Pathology Management Software | ${PRODUCT_NAME}`;
const DEFAULT_DESCRIPTION =
  'LIMS is a laboratory information management system for pathology labs, diagnostic centers and hospital laboratories — patients, orders, samples, results, reports, billing and e-Billing in one connected platform.';

function upsertMeta(key: 'name' | 'property', keyValue: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${keyValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, keyValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

interface SeoOptions {
  title?: string;
  description?: string;
  /** Path of this page, for the canonical URL. */
  path?: string;
}

/** Sets marketing SEO tags (defaults describe the landing page); restores the app title on unmount. */
export function useSeo({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, path = '/' }: SeoOptions = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:image', `${window.location.origin}/marketing/labos-og.png`);
    upsertMeta('name', 'twitter:card', 'summary_large_image');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + path;

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path]);
}
