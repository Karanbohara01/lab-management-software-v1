import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBarcodeScanner } from './useBarcodeScanner';

describe('useBarcodeScanner', () => {
  it('triggers onScan when characters arrive rapidly followed by Enter', () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan, { maxIntervalMs: 50, minChars: 3 }));

    const barcode = 'SMP123';
    // Simulate rapid barcode scanner keystrokes (10ms apart)
    for (const char of barcode) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    }
    // Enter key completes scan
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onScan).toHaveBeenCalledWith('SMP123');
  });

  it('does NOT trigger onScan when keys arrive slowly (human typing)', async () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan, { maxIntervalMs: 20, minChars: 3 }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true }));

    // Wait longer than maxIntervalMs
    await new Promise((r) => setTimeout(r, 40));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onScan).not.toHaveBeenCalled();
  });

  it('does not trigger onScan when buffer length is less than minChars', () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner(onScan, { minChars: 5 }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onScan).not.toHaveBeenCalled();
  });
});
