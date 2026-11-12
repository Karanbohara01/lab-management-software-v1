import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MoneyTable, type MoneyColumn } from './MoneyTable';

interface Row {
  name: string;
  times: number;
  billed: number;
}

const COLUMNS: MoneyColumn<Row>[] = [
  { key: 'name', header: 'Test', align: 'left', sortValue: (r) => r.name, cell: (r) => r.name },
  { key: 'times', header: 'Times billed', amount: (r) => r.times, total: true, format: 'count' },
  { key: 'billed', header: 'Billed', amount: (r) => r.billed, total: true },
];

// Two of these are deliberately awkward: a third of a rupee each, so a footer summed from the
// rounded cells would disagree with one summed from the raw values.
const ROWS: Row[] = [
  { name: 'Lipid Profile', times: 2, billed: 1200.005 },
  { name: 'Complete Blood Count', times: 14, billed: 8280.004 },
  { name: 'Antinuclear Antibody', times: 7, billed: 7500 },
];

const body = () => within(screen.getByRole('table').querySelector('tbody')!);
const footer = () => within(screen.getByRole('table').querySelector('tfoot')!);
const firstColumn = () =>
  Array.from(screen.getByRole('table').querySelectorAll('tbody tr td:first-child')).map((c) => c.textContent);

describe('MoneyTable', () => {
  afterEach(cleanup);

  it('says so when there is nothing to show', () => {
    render(<MoneyTable columns={COLUMNS} rows={[]} rowKey={(r) => r.name} emptyMessage="No tests were billed." />);
    expect(screen.getByText('No tests were billed.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders money to two decimals and counts as whole numbers', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} />);
    expect(body().getByText('7,500.00')).toBeInTheDocument();
    // A count is a number of things, not an amount of money.
    expect(body().getByText('14')).toBeInTheDocument();
    expect(body().queryByText('14.00')).toBeNull();
  });

  it('totals from the raw values, not from the rounded cells', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} />);
    // 1200.005 + 8280.004 + 7500 = 16980.009 -> 16,980.01
    expect(footer().getByText('16,980.01')).toBeInTheDocument();
    expect(footer().getByText('23')).toBeInTheDocument();
  });

  it('sorts descending on the first click of a column and reverses on the second', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} />);
    const header = screen.getByRole('button', { name: /Times billed/ });

    fireEvent.click(header);
    expect(firstColumn()).toEqual(['Complete Blood Count', 'Antinuclear Antibody', 'Lipid Profile']);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(header);
    expect(firstColumn()).toEqual(['Lipid Profile', 'Antinuclear Antibody', 'Complete Blood Count']);
    expect(header.closest('th')).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sorts text columns alphabetically', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} />);
    fireEvent.click(screen.getByRole('button', { name: /Test/ }));
    expect(firstColumn()).toEqual(['Lipid Profile', 'Complete Blood Count', 'Antinuclear Antibody']);
  });

  it('opens on the column it was told to sort by', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} initialSort={{ key: 'billed' }} />);
    expect(firstColumn()).toEqual(['Complete Blood Count', 'Antinuclear Antibody', 'Lipid Profile']);
  });

  it('caps the rows shown but still totals every one of them', () => {
    render(<MoneyTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.name} initialSort={{ key: 'billed' }} maxRows={2} />);
    expect(firstColumn()).toHaveLength(2);
    // The footer is the whole set, not just what is on screen.
    expect(footer().getByText('16,980.01')).toBeInTheDocument();
    expect(screen.getByText(/Showing the top 2 of 3/)).toBeInTheDocument();
  });
});
