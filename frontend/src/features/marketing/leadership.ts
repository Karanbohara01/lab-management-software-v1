import { useEffect, useState } from 'react';
import { httpClient } from '@/api/client';

/** A leadership profile as the public "About us" section receives it (named profiles only). */
export interface Leader {
  id: number;
  name: string;
  title: string;
  description: string | null;
  photoDataUri: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  threadsUrl: string | null;
}

export const leadershipApi = {
  list: () => httpClient.get<Leader[]>('/public/leadership').then((r) => r.data),
};

/**
 * The navbar (for the team's portraits) and the About section both want this list, and the photos
 * make it a sizeable response — so while one request is in flight, the other shares it rather than
 * asking again. (Keyed by the function itself, so a test that replaces `leadershipApi.list` is never
 * handed an earlier test's request.)
 */
let inFlight: { fetcher: typeof leadershipApi.list; promise: Promise<Leader[]> } | null = null;

function loadLeaders(): Promise<Leader[]> {
  const fetcher = leadershipApi.list;
  if (inFlight?.fetcher !== fetcher) {
    const promise = fetcher().finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    inFlight = { fetcher, promise };
  }
  return inFlight.promise;
}

export type LeadershipState =
  | { status: 'loading'; leaders: [] }
  | { status: 'ready'; leaders: Leader[] }
  | { status: 'failed'; leaders: [] };

/**
 * Fetches the leadership profiles once when the section mounts. A visitor on a slow or offline
 * connection must never see an error on a marketing page, so a failure simply means no profiles
 * are shown.
 */
export function useLeadership(): LeadershipState {
  const [state, setState] = useState<LeadershipState>({ status: 'loading', leaders: [] });

  useEffect(() => {
    let live = true;
    loadLeaders()
      .then((leaders) => live && setState({ status: 'ready', leaders }))
      .catch(() => live && setState({ status: 'failed', leaders: [] }));
    return () => {
      live = false;
    };
  }, []);

  return state;
}
