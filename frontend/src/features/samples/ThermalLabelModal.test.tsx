import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThermalLabelModal } from './ThermalLabelModal';

describe('ThermalLabelModal', () => {
  it('renders modal with preset options and specimen info', () => {
    render(
      <ThermalLabelModal
        open={true}
        onClose={vi.fn()}
        barcodeValue="ACC-20261120-001"
        patientName="Ram Bahadur"
        patientMrn="MRN-101"
        patientGender="MALE"
        patientAge={35}
        specimen="Whole Blood (EDTA)"
      />
    );

    expect(screen.getByText('Print Barcode Label')).toBeInTheDocument();
    expect(screen.getByText('50 × 25 mm (Vacutainer Tube)')).toBeInTheDocument();
    expect(screen.getAllByText('ACC-20261120-001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ram Bahadur').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('M · 35y')).toBeInTheDocument();
  });

  it('allows changing copies count and triggers print', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue({
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
    } as any);

    render(
      <ThermalLabelModal
        open={true}
        onClose={vi.fn()}
        barcodeValue="ACC-20261120-001"
        patientName="Ram Bahadur"
        patientMrn="MRN-101"
        specimen="Whole Blood (EDTA)"
      />
    );

    const printButton = screen.getByRole('button', { name: /Print 1 Label/i });
    expect(printButton).toBeInTheDocument();
    fireEvent.click(printButton);

    expect(windowOpenSpy).toHaveBeenCalled();
    windowOpenSpy.mockRestore();
  });
});
