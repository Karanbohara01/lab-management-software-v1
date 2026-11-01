import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { publishBranding, useBranding } from './useBranding';

const useAuth = vi.fn();
const getBranding = vi.fn();
vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => useAuth() }));
vi.mock('@/features/settings/api', () => ({ settingsApi: { getBranding: () => getBranding() } }));

// The cache is shared across the whole module, so each test signs in as a different user.
let nextUserId = 1000;

describe('useBranding', () => {
  let userId: number;
  beforeEach(() => {
    userId = nextUserId++;
    useAuth.mockReturnValue({ user: { id: userId } });
    getBranding.mockReset();
  });
  afterEach(cleanup);

  it('loads the clinic once, however many places show it', async () => {
    getBranding.mockResolvedValue({ name: 'Nami Healthcare Center', logoDataUri: null });
    const desktop = renderHook(() => useBranding());
    const drawer = renderHook(() => useBranding());

    expect(desktop.result.current.status).toBe('loading');
    await waitFor(() => expect(desktop.result.current.status).toBe('ready'));

    expect(getBranding).toHaveBeenCalledTimes(1);
    expect(desktop.result.current.branding?.name).toBe('Nami Healthcare Center');
    expect(drawer.result.current.branding?.name).toBe('Nami Healthcare Center');
  });

  it('reports a failure so the header can fall back', async () => {
    getBranding.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useBranding());

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.branding).toBeNull();
  });

  it("never shows the previous user's clinic after someone else signs in", async () => {
    getBranding.mockResolvedValueOnce({ name: 'First Clinic', logoDataUri: null });
    const { result, rerender } = renderHook(() => useBranding());
    await waitFor(() => expect(result.current.branding?.name).toBe('First Clinic'));

    getBranding.mockResolvedValueOnce({ name: 'Second Clinic', logoDataUri: null });
    useAuth.mockReturnValue({ user: { id: userId + 5000 } });
    rerender();

    expect(result.current.branding).toBeNull(); // not "First Clinic" while the new one loads
    await waitFor(() => expect(result.current.branding?.name).toBe('Second Clinic'));
  });

  it('updates straight away when the settings page publishes a new name or logo', async () => {
    getBranding.mockResolvedValue({ name: 'Old Name', logoDataUri: null });
    const { result } = renderHook(() => useBranding());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => publishBranding(userId, { name: 'New Name', logoDataUri: 'data:image/png;base64,AAAA' }));

    expect(result.current.branding).toEqual({ name: 'New Name', logoDataUri: 'data:image/png;base64,AAAA' });
    expect(getBranding).toHaveBeenCalledTimes(1);
  });
});
