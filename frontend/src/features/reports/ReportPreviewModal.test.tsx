import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ReportPreviewModal } from './ReportPreviewModal';

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

vi.mock('./api', () => ({
  reportsApi: {
    release: vi.fn(),
  },
}));

vi.mock('./ReportDocument', () => ({
  ReportDocument: ({ report }: any) => <div>Mocked Report Document {report.reportNumber}</div>,
}));

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

describe('ReportPreviewModal', () => {
  const mockReport: any = {
    id: 99,
    reportNumber: 'RPT-2026-99',
    orderId: 10,
    orderNumber: 'ORD-10',
    patientName: 'Shyam KC',
    patientMrn: 'MRN-999',
    status: 'GENERATED',
    reportType: 'FINAL',
    reportVersion: 1,
    signedBy: null,
  };

  it('renders report preview with title and document content', () => {
    renderWithRouter(
      <ReportPreviewModal
        open={true}
        onClose={vi.fn()}
        report={mockReport}
      />
    );

    expect(screen.getByText(/Report Preview · RPT-2026-99/)).toBeInTheDocument();
    expect(screen.getByText(/Shyam KC · Order ORD-10/)).toBeInTheDocument();
    expect(screen.getByText('Mocked Report Document RPT-2026-99')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign & Release/i })).toBeInTheDocument();
  });
});
