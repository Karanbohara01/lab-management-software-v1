import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { VerifyReportPage } from './VerifyReportPage';
import { reportsApi } from './api';

vi.mock('./api', () => ({
  reportsApi: {
    verify: vi.fn(),
    getDocumentByToken: vi.fn(),
  },
}));

vi.mock('./ReportDocument', () => ({
  ReportDocument: ({ report }: any) => (
    <div data-testid="mock-report-document">Mocked Report Document: {report.reportNumber}</div>
  ),
}));

function renderPage(token = 'valid-token-123') {
  const router = createMemoryRouter(
    [
      {
        path: '/verify/:token',
        element: <VerifyReportPage />,
      },
    ],
    {
      initialEntries: [`/verify/${token}`],
    }
  );
  return render(<RouterProvider router={router} />);
}

describe('VerifyReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders not verified alert when token is invalid or not found', async () => {
    vi.mocked(reportsApi.verify).mockResolvedValueOnce({
      valid: false,
      reportNumber: null as any,
      reportVersion: 0,
      reportType: null as any,
      status: null as any,
      patientMrn: null,
      maskedPatientName: null,
      patientGender: null,
      patientAgeYears: null,
      orderNumber: null,
      testNames: [],
      laboratoryName: null,
      laboratoryAddress: null,
      laboratoryPhone: null,
      laboratoryEmail: null,
      panNumber: null,
      accreditationNumber: null,
      contentHash: null,
      signedBy: null,
      signerCredentials: null,
      signedAt: null,
      releasedAt: null,
    });

    renderPage('invalid-token');

    await waitFor(() => {
      expect(screen.getByText('Report Not Verified')).toBeInTheDocument();
    });
    expect(screen.getByText(/No genuine record matches this verification code/i)).toBeInTheDocument();
  });

  it('renders genuine report details with lab branding and masked patient name', async () => {
    vi.mocked(reportsApi.verify).mockResolvedValueOnce({
      valid: true,
      reportNumber: 'RPT-2026-0042',
      reportVersion: 1,
      reportType: 'FINAL',
      status: 'RELEASED',
      patientMrn: 'MRN-777',
      maskedPatientName: 'K**** B*****',
      patientGender: 'MALE',
      patientAgeYears: 29,
      orderNumber: 'ORD-999',
      testNames: ['Complete Blood Count (CBC)', 'Lipid Panel'],
      laboratoryName: 'Apex Diagnostic Laboratory',
      laboratoryAddress: 'Baneshwor, Kathmandu',
      laboratoryPhone: '+977-1-4444444',
      laboratoryEmail: 'info@apexdx.com',
      panNumber: '304958291',
      accreditationNumber: 'NABL-MED-2026',
      contentHash: 'a1b2c3d4e5f67890abcdef1234567890abcdef12',
      signedBy: 'Dr. Sarah Jenkins',
      signerCredentials: 'MD Pathologist (NMC 12345)',
      signedAt: '2026-11-20T08:00:00Z',
      releasedAt: '2026-11-20T08:00:00Z',
    });

    renderPage('valid-token-123');

    await waitFor(() => {
      expect(screen.getByText('Verified Genuine Diagnostic Report')).toBeInTheDocument();
    });

    expect(screen.getByText('Apex Diagnostic Laboratory')).toBeInTheDocument();
    expect(screen.getByText('Baneshwor, Kathmandu')).toBeInTheDocument();
    expect(screen.getByText('NABL-MED-2026')).toBeInTheDocument();
    expect(screen.getByText('RPT-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('K**** B*****')).toBeInTheDocument();
    expect(screen.getByText('MRN-777')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count (CBC)')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('a1b2c3d4e5f67890abcdef1234567890abcdef12')).toBeInTheDocument();
  });

  it('allows viewing full diagnostic document and triggers document load', async () => {
    vi.mocked(reportsApi.verify).mockResolvedValueOnce({
      valid: true,
      reportNumber: 'RPT-2026-0042',
      reportVersion: 1,
      reportType: 'FINAL',
      status: 'RELEASED',
      patientMrn: 'MRN-777',
      maskedPatientName: 'K**** B*****',
      patientGender: 'MALE',
      patientAgeYears: 29,
      orderNumber: 'ORD-999',
      testNames: ['Complete Blood Count (CBC)'],
      laboratoryName: 'Apex Diagnostic Laboratory',
      laboratoryAddress: null,
      laboratoryPhone: null,
      laboratoryEmail: null,
      panNumber: null,
      accreditationNumber: null,
      contentHash: 'hash-abc-123',
      signedBy: 'Dr. Sarah Jenkins',
      signerCredentials: null,
      signedAt: null,
      releasedAt: null,
    });

    vi.mocked(reportsApi.getDocumentByToken).mockResolvedValueOnce({
      id: 42,
      reportNumber: 'RPT-2026-0042',
      orderId: 999,
      orderNumber: 'ORD-999',
      patientId: 10,
      patientName: 'Karan Bohara',
      patientMrn: 'MRN-777',
      patientGender: 'MALE',
      patientAgeYears: 29,
      referringDoctorName: null,
      status: 'RELEASED',
      reportType: 'FINAL',
      verificationToken: 'valid-token-123',
      contentHash: 'hash-abc-123',
      signedBy: 'Dr. Sarah Jenkins',
      signerCredentials: null,
      signedAt: null,
      reportVersion: 1,
      hasCritical: false,
      generatedAt: '2026-11-20T07:00:00Z',
      generatedBy: 'admin',
      releasedAt: '2026-11-20T08:00:00Z',
      releasedBy: 'dr.jenkins',
      deliveredAt: null,
      deliveredBy: null,
      deliveryMethod: null,
      deliveryRecipient: null,
      laboratory: {
        name: 'Apex Diagnostic Laboratory',
        addressLine: null,
        city: null,
        phone: null,
        email: null,
        panNumber: null,
        accreditationNumber: null,
        reportFooter: null,
        logoDataUri: null,
        printLetterhead: true,
      },
      signatories: [],
      tests: [],
    });

    renderPage('valid-token-123');

    await waitFor(() => {
      expect(screen.getByText('View Diagnostic Document')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Diagnostic Document'));

    await waitFor(() => {
      expect(reportsApi.getDocumentByToken).toHaveBeenCalledWith('valid-token-123');
      expect(screen.getByTestId('mock-report-document')).toBeInTheDocument();
      expect(screen.getByText(/Mocked Report Document: RPT-2026-0042/i)).toBeInTheDocument();
    });
  });

  it('triggers browser print when print button is clicked', async () => {
    vi.mocked(reportsApi.verify).mockResolvedValueOnce({
      valid: true,
      reportNumber: 'RPT-2026-0042',
      reportVersion: 1,
      reportType: 'FINAL',
      status: 'RELEASED',
      patientMrn: 'MRN-777',
      maskedPatientName: 'K**** B*****',
      patientGender: 'MALE',
      patientAgeYears: 29,
      orderNumber: 'ORD-999',
      testNames: [],
      laboratoryName: null,
      laboratoryAddress: null,
      laboratoryPhone: null,
      laboratoryEmail: null,
      panNumber: null,
      accreditationNumber: null,
      contentHash: null,
      signedBy: null,
      signerCredentials: null,
      signedAt: null,
      releasedAt: null,
    });

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    renderPage('valid-token-123');

    await waitFor(() => {
      expect(screen.getByText('Print / Save PDF')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Print / Save PDF'));
    expect(printSpy).toHaveBeenCalled();

    printSpy.mockRestore();
  });
});
