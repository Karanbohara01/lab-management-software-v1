import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackLink } from './BackLink';

describe('BackLink', () => {
  afterEach(cleanup);

  it('is a link back to the given page, with its label', () => {
    render(
      <MemoryRouter>
        <BackLink to="/app/settings">Back to settings</BackLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Back to settings' })).toHaveAttribute('href', '/app/settings');
  });
});
