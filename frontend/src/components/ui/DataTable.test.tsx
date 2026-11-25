import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DataTable } from './DataTable';

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name', cell: (r: { id: number; name: string; amount: number }) => r.name },
    { key: 'amount', header: 'Amount', cell: (r: { id: number; name: string; amount: number }) => `$${r.amount}`, numeric: true },
  ];

  const rows = [
    { id: 1, name: 'CBC Test', amount: 450 },
    { id: 2, name: 'Lipid Profile', amount: 1200 },
  ];

  it('renders rows and columns properly', () => {
    const { getAllByText } = render(
      <BrowserRouter>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />
      </BrowserRouter>
    );
    expect(getAllByText('CBC Test').length).toBeGreaterThan(0);
    expect(getAllByText('$1200').length).toBeGreaterThan(0);
    expect(getAllByText('Name').length).toBeGreaterThan(0);
    expect(getAllByText('Amount').length).toBeGreaterThan(0);
  });

  it('renders skeleton rows when loading is true', () => {
    const { container } = render(
      <BrowserRouter>
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={true} loadingRows={3} />
      </BrowserRouter>
    );
    // Table header is still present
    const ths = container.querySelectorAll('th');
    expect(ths.length).toBe(2);
    // Skeleton elements are rendered
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders emptyState when rows is empty and not loading', () => {
    const { getByText } = render(
      <BrowserRouter>
        <DataTable
          columns={columns}
          rows={[]}
          rowKey={(r) => r.id}
          loading={false}
          emptyState={<div>No records found</div>}
        />
      </BrowserRouter>
    );
    expect(getByText('No records found')).toBeInTheDocument();
  });
});
