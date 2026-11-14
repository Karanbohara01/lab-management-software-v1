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
    leadershipApi
      .list()
      .then((leaders) => live && setState({ status: 'ready', leaders }))
      .catch(() => live && setState({ status: 'failed', leaders: [] }));
    return () => {
      live = false;
    };
  }, []);

  return state;
}
