import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SpecimenCollectionGuide } from './SpecimenCollectionGuide';

describe('SpecimenCollectionGuide', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(<SpecimenCollectionGuide items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('groups tests by specimen type and displays tube names', () => {
    const { getByText } = render(
      <SpecimenCollectionGuide
        items={[
          { testName: 'Complete Blood Count', testCode: 'CBC', specimenType: 'BLOOD_EDTA' },
          { testName: 'Glycated Hemoglobin', testCode: 'HBA1C', specimenType: 'BLOOD_EDTA' },
          { testName: 'Lipid Profile', testCode: 'LIPID', specimenType: 'BLOOD_SERUM' },
          { testName: 'Routine Urine Examination', testCode: 'URINE_RE', specimenType: 'URINE' },
        ]}
      />
    );

    expect(getByText('Phlebotomy & Sample Guide')).toBeInTheDocument();
    expect(getByText('K2/K3 EDTA')).toBeInTheDocument();
    expect(getByText('Serum / Clot Activator (SST)')).toBeInTheDocument();
    expect(getByText('Urine (Sterile)')).toBeInTheDocument();
    expect(getByText('CBC, HBA1C')).toBeInTheDocument();
  });

  it('shows order of draw guideline when multiple blood tubes are required', () => {
    const { getByText } = render(
      <SpecimenCollectionGuide
        items={[
          { testName: 'Complete Blood Count', testCode: 'CBC', specimenType: 'BLOOD_EDTA' },
          { testName: 'Lipid Profile', testCode: 'LIPID', specimenType: 'BLOOD_SERUM' },
        ]}
      />
    );

    expect(getByText(/Clinical order of draw/)).toBeInTheDocument();
  });
});
