import { ApiError } from '@/types/api';
import { resultsApi, type ApproveOverrides, type VerifyOverrides } from './api';

/** The error code the backend uses for "parameters still blank" — distinct from the other 409s these endpoints raise. */
export const RESULT_INCOMPLETE = 'RESULT_INCOMPLETE';

export type OverrideOutcome = { ok: true; overridden: boolean } | { ok: false };

interface Prompts {
  /** Asked when the result is incomplete; the server's message (which names the blank parameters) is prepended. */
  incomplete: string;
  /** Asked for the endpoint's other 409 (self-verification, or an out-of-control QC lock). */
  other: string;
}

/**
 * Verifies a result, and for each 409 the server raises, asks the person the question that
 * specific conflict calls for — a blank panel and verifying one's own entry are different
 * decisions and must not share one prompt — then retries with the documented reason. Resolves
 * {@code ok: false} if they cancel either prompt; any non-409 error is rethrown for the caller's
 * own toast.
 */
export async function verifyWithPrompts(id: number, prompts: Prompts, initial: VerifyOverrides = {}): Promise<OverrideOutcome> {
  const overrides: VerifyOverrides = { ...initial };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await resultsApi.verify(id, overrides);
      return { ok: true, overridden: !!(overrides.incompleteOverrideReason || overrides.selfVerifyOverrideReason) };
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 409) throw err;
      const reason = window.prompt(`${err.message}\n\n${err.code === RESULT_INCOMPLETE ? prompts.incomplete : prompts.other}`);
      if (!reason || !reason.trim()) return { ok: false };
      if (err.code === RESULT_INCOMPLETE) overrides.incompleteOverrideReason = reason.trim();
      else overrides.selfVerifyOverrideReason = reason.trim();
    }
  }
  return { ok: false };
}

export async function approveWithPrompts(id: number, prompts: Prompts, initial: ApproveOverrides = {}): Promise<OverrideOutcome> {
  const overrides: ApproveOverrides = { ...initial };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await resultsApi.approve(id, overrides);
      return { ok: true, overridden: !!(overrides.incompleteOverrideReason || overrides.qcOverrideReason) };
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 409) throw err;
      const reason = window.prompt(`${err.message}\n\n${err.code === RESULT_INCOMPLETE ? prompts.incomplete : prompts.other}`);
      if (!reason || !reason.trim()) return { ok: false };
      if (err.code === RESULT_INCOMPLETE) overrides.incompleteOverrideReason = reason.trim();
      else overrides.qcOverrideReason = reason.trim();
    }
  }
  return { ok: false };
}
