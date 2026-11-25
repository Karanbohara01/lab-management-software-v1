import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PatientResultsTab } from './PatientResultsTab';
import { resultsApi } from '@/features/results/api';

vi.mock('@/features/results/api', () => ({
  resultsApi: {
    list: vi.fn(),
  },
}));

function renderWithRouter(ui: React.ReactElement) {
  const router = createMemoryRouter([{ path: '/', element: ui }]);
  return render(<RouterProvider router={router} />);
}

describe('PatientResultsTab', () => {
  it('renders patient test results properly', async () => {
    vi.mocked(resultsApi.list).mockResolvedValueOnce({
      content: [
        {
          id: 101,
          orderId: 1,
          orderNumber: 'ORD-001',
          sampleId: 1,
          accessionNumber: 'ACC-001',
          patientId: 42,
          patientName: 'Ram Sharma',
          patientMrn: 'MRN-42',
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          departmentName: 'Hematology',
          resultMode: 'NUMERIC_STRUCTURED',
          status: 'APPROVED',
          priority: 'ROUTINE',
          dueAt: null,
          overdue: false,
          autoVerified: false,
          criticalAckRequired: false,
          hasAbnormal: false,
          hasCritical: false,
          complete: true,
          createdAt: '2026-11-20T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 50,
    } as any);

    const { getAllByText } = renderWithRouter(<PatientResultsTab patientId={42} />);

    await waitFor(() => {
      expect(getAllByText('Complete Blood Count').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('CBC').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Hematology').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('Approved').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders empty state when patient has no results', async () => {
    vi.mocked(resultsApi.list).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 50,
    } as any);

    const { getByText } = renderWithRouter(<PatientResultsTab patientId={42} />);

    await waitFor(() => {
      expect(getByText('No test results')).toBeInTheDocument();
    });
  });
});
