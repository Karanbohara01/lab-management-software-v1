import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ReportGenerationModal } from './ReportGenerationModal';
import { reportsApi } from './api';

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('./api', () => ({
  reportsApi: {
    generate: vi.fn(),
  },
}));

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

describe('ReportGenerationModal', () => {
  const mockReport: any = {
    id: 101,
    reportNumber: 'REP-2026-0101',
    orderId: 42,
    orderNumber: 'ORD-42',
    patientName: 'Ram Sharma',
    patientMrn: 'MRN-42',
    status: 'GENERATED',
    reportType: 'FINAL',
    reportVersion: 1,
    tests: [{ testCode: 'CBC' }, { testCode: 'LFT' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and automatically triggers generation in test environment', async () => {
    vi.mocked(reportsApi.generate).mockResolvedValue(mockReport);
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    renderWithRouter(
      <ReportGenerationModal
        open={true}
        orderId={42}
        orderNumber="ORD-42"
        patientName="Ram Sharma"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(reportsApi.generate).toHaveBeenCalledWith(42, false);

    await waitFor(() => {
      expect(screen.getByText('Report Ready')).toBeInTheDocument();
    });

    expect(screen.getByText('REP-2026-0101')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(mockReport);
  });

  it('handles generation error and lets user retry', async () => {
    vi.mocked(reportsApi.generate)
      .mockRejectedValueOnce(new Error('Sample not fully verified'))
      .mockResolvedValueOnce(mockReport);

    renderWithRouter(
      <ReportGenerationModal
        open={true}
        orderId={42}
        orderNumber="ORD-42"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Could not generate report')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Report Ready')).toBeInTheDocument();
    });
  });
});
