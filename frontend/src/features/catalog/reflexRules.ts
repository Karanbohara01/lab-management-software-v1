import { httpClient } from '@/api/client';

export type ReflexTrigger = 'ABNORMAL' | 'CRITICAL';

export interface ReflexRule {
  id: number;
  sourceTestId: number;
  sourceTestName: string | null;
  trigger: ReflexTrigger;
  targetTestId: number;
  targetTestName: string | null;
  note: string | null;
  active: boolean;
}

export interface ReflexRuleUpsertPayload {
  sourceTestId?: number;
  trigger: ReflexTrigger;
  targetTestId: number;
  note?: string;
  active?: boolean;
}

export const reflexRulesApi = {
  list: () => httpClient.get<ReflexRule[]>('/reflex-rules').then((r) => r.data),

  create: (payload: ReflexRuleUpsertPayload) =>
    httpClient.post<ReflexRule>('/reflex-rules', payload).then((r) => r.data),

  update: (id: number, payload: ReflexRuleUpsertPayload) =>
    httpClient.put<ReflexRule>(`/reflex-rules/${id}`, payload).then((r) => r.data),

  remove: (id: number) => httpClient.delete<void>(`/reflex-rules/${id}`).then((r) => r.data),
};
