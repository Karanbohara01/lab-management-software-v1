import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CriticalCallbackModal } from './CriticalCallbackModal';

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('./api', () => ({
  resultsApi: {
    logCriticalCallback: vi.fn(),
    waiveCriticalCallback: vi.fn(),
  },
}));

describe('CriticalCallbackModal', () => {
  const mockResult: any = {
    id: 1,
    testCode: 'K_SERUM',
    patientName: 'Jane Doe',
    patientMrn: 'MRN-001',
    values: [
      {
        parameterId: 10,
        parameterName: 'Potassium',
        valueNumeric: 7.2,
        valueText: null,
        unit: 'mmol/L',
        flag: 'CRITICAL_HIGH',
        referenceText: '3.5 - 5.0',
      },
    ],
  };

  it('displays the critical parameters readout to read back over the phone', () => {
    const { getByText } = render(
      <CriticalCallbackModal
        open={true}
        onClose={vi.fn()}
        result={mockResult}
        onLogged={vi.fn()}
      />
    );
    expect(getByText('Values to Read Back')).toBeInTheDocument();
    expect(getByText('Potassium')).toBeInTheDocument();
    expect(getByText('7.2 mmol/L')).toBeInTheDocument();
    expect(getByText('(Ref: 3.5 - 5.0)')).toBeInTheDocument();
  });

  it('populates role when quick-select chip is clicked', () => {
    const { getByText, getByDisplayValue } = render(
      <CriticalCallbackModal
        open={true}
        onClose={vi.fn()}
        result={mockResult}
        onLogged={vi.fn()}
      />
    );
    const chip = getByText('Treating Doctor');
    fireEvent.click(chip);
    expect(getByDisplayValue('Treating Doctor')).toBeInTheDocument();
  });
});
