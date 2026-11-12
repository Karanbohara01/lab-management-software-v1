import { describe, expect, it } from 'vitest';
import { formatFileSize, isFinished, isRunning, JOB_STATUS_LABEL, ROW_STATUS_LABEL } from './types';

describe('import job state', () => {
  it('knows when the server still owns the job', () => {
    expect(isRunning('ANALYSING')).toBe(true);
    expect(isRunning('IMPORTING')).toBe(true);
    expect(isRunning('READY')).toBe(false);
    expect(isRunning('UPLOADED')).toBe(false);
    expect(isRunning('COMPLETED')).toBe(false);
  });

  it('knows when nothing further will happen on its own', () => {
    expect(isFinished('COMPLETED')).toBe(true);
    expect(isFinished('CANCELLED')).toBe(true);
    expect(isFinished('FAILED')).toBe(true);
    expect(isFinished('IMPORTING')).toBe(false);
  });

  it('names every state a job and a row can be in', () => {
    // A missing label would render as blank in the history table.
    expect(Object.values(JOB_STATUS_LABEL).every((l) => l.length > 0)).toBe(true);
    expect(Object.values(ROW_STATUS_LABEL).every((l) => l.length > 0)).toBe(true);
  });
});

describe('formatFileSize', () => {
  it('reads sizes the way a person would say them', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
