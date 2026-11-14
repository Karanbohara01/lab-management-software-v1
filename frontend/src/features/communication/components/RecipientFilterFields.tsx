import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { useQuery } from '@/hooks/useQuery';
import { departmentsApi } from '@/features/departments/api';
import { PatientMultiPicker, type PickedPatient } from './PatientMultiPicker';
import { RECIPIENT_FILTER_LABEL, type RawRecipient, type RecipientFilter, type SmsRecipientFilterType } from '../types';
import { useT } from '@/i18n';

const FILTER_TYPES = Object.keys(RECIPIENT_FILTER_LABEL) as SmsRecipientFilterType[];

function toInstant(dateOnly: string, endOfDay: boolean): string {
  return new Date(`${dateOnly}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();
}

/** Parses "phone,name" / "phone" lines (CSV export or pasted list) into raw recipients. */
function parseLines(text: string): RawRecipient[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phone, name] = line.split(',').map((s) => s.trim());
      return { phone: phone ?? '', name: name || undefined };
    })
    .filter((r) => r.phone);
}

export function RecipientFilterFields({
  value,
  onChange,
}: {
  value: RecipientFilter;
  onChange: (next: RecipientFilter) => void;
}) {
  const t = useT();
  const { data: departments } = useQuery(() => departmentsApi.list(true), []);
  const [pickedPatients, setPickedPatients] = useState<PickedPatient[]>([]);
  const [pastedList, setPastedList] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const setType = (type: SmsRecipientFilterType) => onChange({ type });

  const onFileChosen = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    onChange({ ...value, rawRecipients: parseLines(text) });
  };

  return (
    <div className="space-y-4">
      <Select
        label={t('Who should receive this?')}
        options={FILTER_TYPES.map((ft) => ({ value: ft, label: t(RECIPIENT_FILTER_LABEL[ft]) }))}
        value={value.type}
        onChange={(e) => setType(e.target.value as SmsRecipientFilterType)}
      />

      {value.type === 'ALL_PATIENTS' && (
        <p className="text-sm text-muted">{t('Every active patient on file with a valid phone number.')}</p>
      )}

      {(value.type === 'REGISTERED_IN_RANGE' || value.type === 'VISITED_IN_RANGE') && (
        <DateRangePicker
          label={t('Date range')}
          value={value.from && value.to ? { from: value.from.slice(0, 10), to: value.to.slice(0, 10) } : null}
          onChange={(r) => onChange({ ...value, from: toInstant(r.from, false), to: toInstant(r.to, true) })}
          maxDate={new Date()}
        />
      )}

      {value.type === 'UPCOMING_APPOINTMENTS' && (
        <Input
          type="date"
          label={t('Up to (optional, defaults to the next 30 days)')}
          value={value.to?.slice(0, 10) ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value ? toInstant(e.target.value, true) : undefined })}
        />
      )}

      {value.type === 'NOT_VISITED_IN_DAYS' && (
        <Input
          type="number"
          min={1}
          label={t('Days since last visit')}
          value={value.notVisitedDays ?? ''}
          onChange={(e) => onChange({ ...value, notVisitedDays: e.target.value ? Number(e.target.value) : undefined })}
        />
      )}

      {value.type === 'DEPARTMENT_OR_CATEGORY' && (
        <div className="space-y-3">
          <Select
            label={t('Department')}
            placeholder={t('Choose a department')}
            options={(departments ?? []).map((d) => ({ value: d.name, label: d.name }))}
            value={value.departmentName ?? ''}
            onChange={(e) => onChange({ ...value, departmentName: e.target.value })}
          />
          <DateRangePicker
            label={t('Ordered within (optional)')}
            value={value.from && value.to ? { from: value.from.slice(0, 10), to: value.to.slice(0, 10) } : null}
            onChange={(r) => onChange({ ...value, from: toInstant(r.from, false), to: toInstant(r.to, true) })}
            maxDate={new Date()}
          />
        </div>
      )}

      {value.type === 'MANUAL_SELECTION' && (
        <PatientMultiPicker
          selected={pickedPatients}
          onChange={(next) => {
            setPickedPatients(next);
            onChange({ ...value, patientIds: next.map((p) => p.id) });
          }}
        />
      )}

      {value.type === 'FILE_IMPORT' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileChosen(file);
            }}
          />
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden />
            {t('Choose a CSV file')}
          </Button>
          <p className="text-xs text-muted">
            {t('One recipient per line: phone, or phone,name. {count} recipient(s) loaded{file}', {
              count: value.rawRecipients?.length ?? 0,
              file: fileName ? ` (${fileName})` : '',
            })}
          </p>
        </div>
      )}

      {value.type === 'CUSTOM_PHONE_LIST' && (
        <div className="space-y-2">
          <Textarea
            label={t('Phone numbers')}
            rows={6}
            placeholder={t('98XXXXXXXX\n98XXXXXXXX, Optional name')}
            value={pastedList}
            onChange={(e) => {
              setPastedList(e.target.value);
              onChange({ ...value, rawRecipients: parseLines(e.target.value) });
            }}
          />
          <p className="text-xs text-muted">{t('{count} recipient(s) recognised', { count: value.rawRecipients?.length ?? 0 })}</p>
        </div>
      )}
    </div>
  );
}
