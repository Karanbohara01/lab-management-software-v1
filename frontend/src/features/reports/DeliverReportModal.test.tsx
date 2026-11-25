import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeliverReportModal, cleanNepalPhoneForWhatsApp, buildWhatsAppLink } from './DeliverReportModal';
import { reportsApi } from './api';

vi.mock('./api', () => ({
  reportsApi: {
    deliver: vi.fn().mockResolvedValue({ id: 1, status: 'DELIVERED' }),
  },
}));

describe('DeliverReportModal & WhatsApp Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WhatsApp helpers', () => {
    it('normalizes 10-digit Nepal mobile numbers to 977 country code', () => {
      expect(cleanNepalPhoneForWhatsApp('9851232567')).toBe('9779851232567');
      expect(cleanNepalPhoneForWhatsApp('+977-9841234567')).toBe('9779841234567');
      expect(cleanNepalPhoneForWhatsApp('09841234567')).toBe('9779841234567');
    });

    it('builds proper wa.me link with encoded text', () => {
      const url = buildWhatsAppLink('9851232567', 'Namaste Pratik, report ready');
      expect(url).toContain('https://wa.me/9779851232567');
      expect(url).toContain('text=Namaste%20Pratik%2C%20report%20ready');
    });
  });

  describe('DeliverReportModal component', () => {
    it('renders with WhatsApp Direct preselected and populated with patient info', () => {
      render(
        <DeliverReportModal
          open={true}
          onClose={vi.fn()}
          reportId={42}
          reportNumber="REP-2026-0001"
          patientName="Pratik Bhusal"
          patientPhone="9851232567"
          verificationToken="abc-token-123"
          labName="Apex Diagnostics"
          onDone={vi.fn()}
        />
      );

      expect(screen.getByText('Deliver report')).toBeInTheDocument();
      expect(screen.getByDisplayValue('9851232567')).toBeInTheDocument();
      expect(screen.getByText(/Message preview/i)).toBeInTheDocument();
      expect(screen.getByText(/Open in WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Record delivery only/i)).toBeInTheDocument();
      expect(screen.getByText(/Copy message/i)).toBeInTheDocument();
    });

    it('triggers window.open with wa.me link and records delivery when Open in WhatsApp clicked', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const onDoneMock = vi.fn();
      const onCloseMock = vi.fn();

      render(
        <DeliverReportModal
          open={true}
          onClose={onCloseMock}
          reportId={42}
          reportNumber="REP-2026-0001"
          patientName="Pratik Bhusal"
          patientPhone="9851232567"
          verificationToken="abc-token-123"
          labName="Apex Diagnostics"
          onDone={onDoneMock}
        />
      );

      const openButton = screen.getByRole('button', { name: /Open in WhatsApp/i });
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(windowOpenSpy).toHaveBeenCalledWith(
          expect.stringContaining('https://wa.me/9779851232567'),
          '_blank'
        );
        expect(reportsApi.deliver).toHaveBeenCalledWith(42, 'WHATSAPP_DIRECT', '9851232567');
        expect(onDoneMock).toHaveBeenCalled();
        expect(onCloseMock).toHaveBeenCalled();
      });

      windowOpenSpy.mockRestore();
    });

    it('records delivery only when Record delivery only button clicked', async () => {
      const onDoneMock = vi.fn();
      const onCloseMock = vi.fn();

      render(
        <DeliverReportModal
          open={true}
          onClose={onCloseMock}
          reportId={42}
          reportNumber="REP-2026-0001"
          patientName="Pratik Bhusal"
          patientPhone="9851232567"
          onDone={onDoneMock}
        />
      );

      const recordButton = screen.getByRole('button', { name: /Record delivery only/i });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(reportsApi.deliver).toHaveBeenCalledWith(42, 'WHATSAPP_DIRECT', '9851232567');
        expect(onDoneMock).toHaveBeenCalled();
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });
});
