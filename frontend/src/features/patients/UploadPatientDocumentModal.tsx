import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileText, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { ApiError } from '@/types/api';
import { patientsApi } from './api';
import {
  type PatientDocument,
  type PatientDocumentType,
  PATIENT_DOCUMENT_TYPE_LABEL,
} from './types';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(180),
  documentType: z.enum([
    'PRESCRIPTION',
    'PRIOR_REPORT',
    'CLINICAL_NOTE',
    'INSURANCE_ID',
    'IMAGING',
    'OTHER',
  ]),
  documentDate: z.string().optional(),
  doctorOrFacility: z.string().max(180).optional(),
  notes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

const DOCUMENT_TYPE_OPTIONS = Object.entries(PATIENT_DOCUMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label })
);

interface UploadPatientDocumentModalProps {
  open: boolean;
  patientId: number;
  onClose: () => void;
  onSuccess: (document: PatientDocument) => void;
}

export function UploadPatientDocumentModal({
  open,
  patientId,
  onClose,
  onSuccess,
}: UploadPatientDocumentModalProps) {
  const t = useT();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      documentType: 'PRESCRIPTION',
      documentDate: new Date().toISOString().slice(0, 10),
      doctorOrFacility: '',
      notes: '',
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(t('File size exceeds the 25 MB limit'));
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setFileError(null);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedFile) {
      setFileError(t('Please select a file to upload'));
      return;
    }

    try {
      const doc = await patientsApi.documents.upload(
        patientId,
        {
          title: values.title.trim(),
          documentType: values.documentType as PatientDocumentType,
          documentDate: values.documentDate || null,
          doctorOrFacility: values.doctorOrFacility?.trim() || null,
          notes: values.notes?.trim() || null,
        },
        selectedFile
      );
      toast.success(t('Document uploaded successfully'));
      onSuccess(doc);
      handleClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('Failed to upload document');
      toast.error(msg);
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('Upload Medical Document')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="upload-patient-doc-form" loading={isSubmitting}>
            {t('Upload Document')}
          </Button>
        </>
      }
    >
      <form id="upload-patient-doc-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {/* File Dropzone */}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            {t('File (PDF, PNG, JPG, WEBP — up to 25MB)')}
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${isDragging
                ? 'border-primary bg-primary/5'
                : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-border hover:border-primary/50 hover:bg-surface-muted/40'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatFileSize(selectedFile.size)} · {selectedFile.type || 'file'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="py-3">
                <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                <div className="mt-2 text-xs font-medium text-foreground">
                  {t('Click or drag & drop document here')}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {t('Supports prescriptions, scan reports, X-rays & referral letters')}
                </div>
              </div>
            )}
          </div>
          {fileError && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Input
          label={t('Document Title')}
          placeholder={t('e.g. Patan Hospital Prescription, Past Lipid Report')}
          error={errors.title?.message}
          {...register('title')}
        />

        {/* Type & Date Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label={t('Document Category')}
            options={DOCUMENT_TYPE_OPTIONS}
            error={errors.documentType?.message}
            {...register('documentType')}
          />
          <Input
            label={t('Document Date')}
            type="date"
            error={errors.documentDate?.message}
            {...register('documentDate')}
          />
        </div>

        {/* Doctor or Facility */}
        <Input
          label={t('Doctor / Issuing Hospital')}
          placeholder={t('e.g. Dr. A. Sharma, Teaching Hospital')}
          error={errors.doctorOrFacility?.message}
          {...register('doctorOrFacility')}
        />

        {/* Notes */}
        <Textarea
          label={t('Clinical Notes / Remarks')}
          placeholder={t('e.g. Patient referred for fasting lipid follow-up…')}
          rows={3}
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
