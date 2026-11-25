import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PricingSummary } from './PricingSummary';

describe('PricingSummary', () => {
  it('renders subtotal and total payable correctly', () => {
    const { getByText } = render(
      <PricingSummary
        pricing={{
          subtotal: 1500,
          discountType: 'NONE',
          discountValue: 0,
          discountAmount: 0,
          taxableAmount: 1500,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 1500,
        }}
      />
    );

    expect(getByText('Subtotal')).toBeInTheDocument();
    expect(getByText('Total payable')).toBeInTheDocument();
  });

  it('renders discount row and savings notice when discount is present', () => {
    const { getByText } = render(
      <PricingSummary
        pricing={{
          subtotal: 2000,
          discountType: 'PERCENT',
          discountValue: 10,
          discountAmount: 200,
          taxableAmount: 1800,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 1800,
        }}
      />
    );

    expect(getByText('Discount (10%)')).toBeInTheDocument();
    expect(getByText(/Saved/)).toBeInTheDocument();
  });
});
