import { useState, useRef } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { ApiError } from '@/types/api';
import { inquiriesApi } from './api';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type TicketCategory,
  type TicketPriority,
  type TicketDetail,
} from './types';

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (ticket: TicketDetail) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CreateTicketModal({ open, onClose, onCreated }: CreateTicketModalProps) {
  const t = useT();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('TECHNICAL_ISSUE');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      toast.error(t('Attachment size cannot exceed 15 MB'));
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(selected);
      setPreviewUrl(objUrl);
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    handleFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const reset = () => {
    setSubject('');
    setCategory('TECHNICAL_ISSUE');
    setPriority('MEDIUM');
    setMessage('');
    removeFile();
  };

  const categoryOptions: SelectOption[] = (Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((cat) => ({
    value: cat,
    label: t(CATEGORY_LABELS[cat]),
  }));

  const priorityOptions: SelectOption[] = (Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => ({
    value: p,
    label: t(PRIORITY_LABELS[p]),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error(t('Subject is required'));
      return;
    }
    if (!message.trim()) {
      toast.error(t('Message is required'));
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await inquiriesApi.clinic.create({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim(),
        file: file || undefined,
      });
      toast.success(t('Inquiry ticket submitted successfully'));
      reset();
      onCreated(ticket);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to create ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Submit Support Inquiry')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t('Subject')} *
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('e.g., Unable to sync analyzer or billing receipt format')}
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('Category')}
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            options={categoryOptions}
          />

          <Select
            label={t('Priority')}
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            options={priorityOptions}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {t('Message & Description')} *
          </label>
          <Textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('Describe the problem, error message, steps taken, or what assistance you need from the platform engineering team...')}
            required
          />
        </div>

        {/* Attachment Upload Zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            {t('Attachment (Screenshot / Log / PDF)')}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.txt,.log,.csv,.json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-primary/50 hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-primary" />
              <span>{t('Click to attach screenshot, error log, or PDF document (max 15MB)')}</span>
            </button>
          ) : (
            <div className="flex items-center justify-between p-3 bg-surface-muted border border-border rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded object-cover border border-border shrink-0"
                  />
                ) : file.type.startsWith('image/') ? (
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate">
                  <div className="text-sm font-medium text-foreground truncate">{file.name}</div>
                  <div className="text-xs text-muted">{formatBytes(file.size)}</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={removeFile}
                className="text-muted hover:text-danger shrink-0 ml-2"
                aria-label={t('Remove file')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            {t('Cancel')}
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            {t('Submit Inquiry')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
