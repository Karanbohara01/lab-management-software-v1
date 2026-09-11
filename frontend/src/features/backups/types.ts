export type BackupStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface BackupRun {
  id: number;
  status: BackupStatus;
  startedAt: string;
  completedAt: string | null;
  fileSizeBytes: number | null;
  tableCount: number | null;
  rowCount: number | null;
  errorMessage: string | null;
  triggeredBy: string | null;
}

export const BACKUP_STATUS_TONE: Record<BackupStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  RUNNING: 'info',
  SUCCEEDED: 'success',
  FAILED: 'danger',
};

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
