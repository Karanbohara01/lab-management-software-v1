import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { LoadingState } from '@/components/ui/PageState';

/** Lazily load a page component by its named export, keeping route files terse. */
export function lazyPage<M extends Record<string, ComponentType>>(
  loader: () => Promise<M>,
  name: keyof M & string,
) {
  const Component = lazy(async () => ({ default: (await loader())[name] as ComponentType }));
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

function PageFallback(): ReactNode {
  return (
    <div className="py-16">
      <LoadingState />
    </div>
  );
}
