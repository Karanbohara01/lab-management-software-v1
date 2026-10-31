import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SidebarBrand } from './SidebarBrand';

const useBranding = vi.fn();
vi.mock('@/hooks/useBranding', () => ({ useBranding: () => useBranding() }));

describe('SidebarBrand', () => {
  afterEach(() => {
    cleanup();
    useBranding.mockReset();
  });

  it("shows the clinic's name, and its initials when it has no logo", () => {
    useBranding.mockReturnValue({ status: 'ready', branding: { name: 'Nami Healthcare Center', logoDataUri: null } });
    render(<SidebarBrand collapsed={false} />);

    expect(screen.getByText('Nami Healthcare Center')).toBeInTheDocument();
    expect(screen.getByText('NH')).toBeInTheDocument();
    expect(screen.queryByText('LIMS')).toBeNull();
  });

  it("shows the clinic's logo when it has one", () => {
    useBranding.mockReturnValue({
      status: 'ready',
      branding: { name: 'Nami Healthcare Center', logoDataUri: 'data:image/png;base64,AAAA' },
    });
    const { container } = render(<SidebarBrand collapsed={false} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
    expect(screen.queryByText('NH')).toBeNull();
  });

  it('keeps just the logo or initials when the sidebar is collapsed, still named for assistive tech', () => {
    useBranding.mockReturnValue({ status: 'ready', branding: { name: 'Nami Healthcare Center', logoDataUri: null } });
    render(<SidebarBrand collapsed />);

    expect(screen.queryByText('Nami Healthcare Center')).toBeNull();
    expect(screen.getByText('NH')).toBeInTheDocument();
    expect(screen.getByTitle('Nami Healthcare Center')).toBeInTheDocument();
  });

  it('shows a quiet placeholder while the name loads — not the wrong name', () => {
    useBranding.mockReturnValue({ status: 'loading', branding: null });
    render(<SidebarBrand collapsed={false} />);

    expect(screen.queryByText('LIMS')).toBeNull();
    expect(screen.queryByText('Pathology Management')).toBeNull();
  });

  it("falls back to the product's own name if the clinic's can't be loaded or is blank", () => {
    useBranding.mockReturnValue({ status: 'failed', branding: null });
    const { rerender } = render(<SidebarBrand collapsed={false} />);
    expect(screen.getByText('LIMS')).toBeInTheDocument();

    useBranding.mockReturnValue({ status: 'ready', branding: { name: '   ', logoDataUri: null } });
    rerender(<SidebarBrand collapsed={false} />);
    expect(screen.getByText('LIMS')).toBeInTheDocument();
  });
});
