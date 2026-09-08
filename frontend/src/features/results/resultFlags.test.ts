import { describe, expect, it } from 'vitest';
import { flagLabel, flagTone } from './types';

describe('result flag helpers', () => {
  it('maps critical flags to the critical tone', () => {
    expect(flagTone('CRITICAL_LOW')).toBe('critical');
    expect(flagTone('CRITICAL_HIGH')).toBe('critical');
    expect(flagLabel('CRITICAL_LOW')).toBe('Critical low');
  });

  it('maps abnormal-but-not-critical flags to warning', () => {
    expect(flagTone('LOW')).toBe('warning');
    expect(flagTone('HIGH')).toBe('warning');
    expect(flagTone('ABNORMAL')).toBe('warning');
  });

  it('treats NORMAL as success and NONE as neutral with no label', () => {
    expect(flagTone('NORMAL')).toBe('success');
    expect(flagTone('NONE')).toBe('neutral');
    expect(flagLabel('NONE')).toBe('');
  });
});
