import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const APP_NAME = 'LIMS';

interface PageTitleContextValue {
  title: string | undefined;
  setTitle: (title: string | undefined) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

/** Hosts the current page's title for the breadcrumb, the Back labels of links leaving this page, and the tab. */
export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | undefined>(undefined);
  const value = useMemo(() => ({ title, setTitle }), [title]);
  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

/**
 * Publishes a page's title. PageHeader calls this for every page, so a page only needs to call it
 * itself when it has no PageHeader. Also sets document.title ("Sita Rai · LIMS") and restores the
 * previous one on unmount, so the tab, history entries and bookmarks are named after the page.
 */
export function usePageTitle(title: string | undefined) {
  const ctx = useContext(PageTitleContext);
  const setTitle = ctx?.setTitle;
  useEffect(() => {
    if (!title) return;
    setTitle?.(title);
    const previous = document.title;
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = previous;
      setTitle?.(undefined);
    };
  }, [title, setTitle]);
}

/** The title the current page published (undefined before it has, or outside the app shell). */
export function useCurrentPageTitle(): string | undefined {
  return useContext(PageTitleContext)?.title;
}
