import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PatientDocumentsTab } from './PatientDocumentsTab';
import { patientsApi } from './api';
import type { PatientDocument } from './types';

vi.mock('./api', () => ({
  patientsApi: {
    documents: {
      list: vi.fn(),
      upload: vi.fn(),
      downloadUrl: vi.fn(
        (pid, did, inline) => `/api/patients/${pid}/documents/${did}/download${inline ? '?inline=true' : ''}`
      ),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    hasPermission: () => true,
  }),
}));

const mockDocs: PatientDocument[] = [
  {
    id: 1,
    patientId: 10,
    title: 'Hospital Prescription',
    documentType: 'PRESCRIPTION',
    documentDate: '2026-11-20',
    doctorOrFacility: 'Dr. Sharma',
    notes: 'Prescription for CBC and Thyroid profile',
    fileName: 'rx_nov20.pdf',
    fileType: 'application/pdf',
    fileSizeBytes: 1024 * 400,
    uploadedBy: 'admin',
    uploadedAt: '2026-11-20T10:00:00Z',
  },
  {
    id: 2,
    patientId: 10,
    title: 'Chest X-Ray',
    documentType: 'IMAGING',
    documentDate: '2026-11-18',
    doctorOrFacility: 'Teaching Hospital',
    notes: 'Normal lung fields',
    fileName: 'xray.png',
    fileType: 'image/png',
    fileSizeBytes: 1024 * 1024 * 1.5,
    uploadedBy: 'technician',
    uploadedAt: '2026-11-18T09:30:00Z',
  },
];

describe('PatientDocumentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient medical documents list with category badges', async () => {
    vi.mocked(patientsApi.documents.list).mockResolvedValueOnce(mockDocs);

    render(<PatientDocumentsTab patientId={10} />);

    await waitFor(() => {
      expect(screen.getByText('Hospital Prescription')).toBeInTheDocument();
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });

    expect(screen.getByText('rx_nov20.pdf · 400.0 KB')).toBeInTheDocument();
    expect(screen.getByText('xray.png · 1.5 MB')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sharma')).toBeInTheDocument();
    expect(screen.getByText('Teaching Hospital')).toBeInTheDocument();
  });

  it('filters documents when searching by text query', async () => {
    vi.mocked(patientsApi.documents.list).mockResolvedValueOnce(mockDocs);

    render(<PatientDocumentsTab patientId={10} />);

    await waitFor(() => {
      expect(screen.getByText('Hospital Prescription')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search documents, doctors, notes/i);
    fireEvent.change(searchInput, { target: { value: 'X-Ray' } });

    expect(screen.queryByText('Hospital Prescription')).not.toBeInTheDocument();
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
  });

  it('renders empty state when no documents exist', async () => {
    vi.mocked(patientsApi.documents.list).mockResolvedValueOnce([]);

    render(<PatientDocumentsTab patientId={10} />);

    await waitFor(() => {
      expect(screen.getByText('No Medical Documents Uploaded')).toBeInTheDocument();
    });

    expect(screen.getByText('Upload First Document')).toBeInTheDocument();
  });

  it('opens delete confirmation modal and calls delete API', async () => {
    vi.mocked(patientsApi.documents.list).mockResolvedValueOnce(mockDocs);
    vi.mocked(patientsApi.documents.delete).mockResolvedValueOnce();

    render(<PatientDocumentsTab patientId={10} />);

    await waitFor(() => {
      expect(screen.getByText('Hospital Prescription')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete Document');
    fireEvent.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete this document?')).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: 'Confirm Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(patientsApi.documents.delete).toHaveBeenCalledWith(10, 1);
    });
  });
});
