import { useEffect, useRef } from 'react';

export interface BarcodeScannerOptions {
  /** Minimum characters to qualify as a valid scanned barcode (default: 3) */
  minChars?: number;
  /** Maximum milliseconds between keystrokes to be considered barcode scanner hardware (default: 60ms) */
  maxIntervalMs?: number;
  /** Whether the scanner listener is currently active (default: true) */
  enabled?: boolean;
}

/**
 * Global listener for hardware barcode scanners (USB/Bluetooth HID devices).
 *
 * Hardware scanners output keystrokes in high-frequency bursts (<40ms per key)
 * followed by an Enter key. This hook differentiates human typing from scanner bursts,
 * preventing scanner keystrokes from being lost when the user hasn't clicked an input.
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  { minChars = 3, maxIntervalMs = 60, enabled = true }: BarcodeScannerOptions = {},
) {
  const bufferRef = useRef<{ char: string; time: number }[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore functional modifier keys (Ctrl, Alt, Meta, Shift, Tab, etc.)
      if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'Shift') {
        return;
      }

      const now = Date.now();
      const buffer = bufferRef.current;

      // Handle Enter (barcode transmission terminator)
      if (e.key === 'Enter') {
        if (buffer.length >= minChars) {
          // Check intervals between consecutive keystrokes
          let isBurst = true;
          for (let i = 1; i < buffer.length; i++) {
            const prev = buffer[i - 1];
            const curr = buffer[i];
            if (prev && curr && curr.time - prev.time > maxIntervalMs) {
              isBurst = false;
              break;
            }
          }

          if (isBurst) {
            e.preventDefault();
            e.stopPropagation();
            const barcode = buffer.map((item) => item.char).join('');
            bufferRef.current = [];
            onScan(barcode);
            return;
          }
        }
        bufferRef.current = [];
        return;
      }

      // Only buffer single printable characters
      if (!e.key || e.key.length !== 1) {
        bufferRef.current = [];
        return;
      }

      // If too much time has passed since last key, start a new buffer
      const last = buffer.length > 0 ? buffer[buffer.length - 1] : undefined;
      if (last && now - last.time > maxIntervalMs) {
        bufferRef.current = [{ char: e.key, time: now }];
      } else {
        buffer.push({ char: e.key, time: now });
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [onScan, minChars, maxIntervalMs, enabled]);
}
