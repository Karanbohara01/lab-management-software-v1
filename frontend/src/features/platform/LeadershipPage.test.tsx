import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { PageTitleProvider } from '@/components/layout/PageTitleContext';
import { ToastProvider } from '@/components/ui/toast';
import { handleFor } from '@/routes/appRoutes';
import { LeadershipPage } from './LeadershipPage';
import { platformApi, type LeadershipProfile } from './api';

const NO_LINKS = { linkedinUrl: null, facebookUrl: null, instagramUrl: null, threadsUrl: null };
const CEO: LeadershipProfile = {
  id: 1, name: 'Karan Bohara', title: 'CEO & Founder', description: 'Leads the company.',
  photoDataUri: 'data:image/jpeg;base64,/9j/4AAQ', ...NO_LINKS, linkedinUrl: 'https://linkedin.com/in/karan',
  displayOrder: 1, published: true,
};
const COO: LeadershipProfile = {
  id: 2, name: '', title: 'COO & Co-Founder', description: 'Runs operations.',
  photoDataUri: null, ...NO_LINKS, displayOrder: 2, published: false,
};

function renderPage() {
  const pattern = '/app/platform/leadership';
  const router = createMemoryRouter(
    [{ path: pattern, element: <LeadershipPage />, handle: handleFor(pattern) }],
    { initialEntries: [pattern] },
  );
  return render(
    <ToastProvider>
      <PageTitleProvider>
        <RouterProvider router={router} />
      </PageTitleProvider>
    </ToastProvider>,
  );
}

const cardOf = (heading: string) => screen.getByRole('heading', { name: heading }).closest('div.space-y-5') as HTMLElement;

describe('LeadershipPage', () => {
  beforeEach(() => {
    vi.spyOn(platformApi, 'leadership').mockResolvedValue([CEO, COO]);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows every profile with whether it is on the website', async () => {
    renderPage();

    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));
    expect(within(first).getByText('Shown on website')).toBeInTheDocument();
    expect(within(first).getByLabelText('Name')).toHaveValue('Karan Bohara');
    expect(within(first).getByLabelText('Job title')).toHaveValue('CEO & Founder');

    const second = cardOf('Leader 2');
    expect(within(second).getByText('Hidden — add a name')).toBeInTheDocument();
    expect(within(second).getByLabelText('Name')).toHaveValue('');
  });

  it('saves nothing until something changes', async () => {
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeDisabled();
    fireEvent.change(within(first).getByLabelText('Name'), { target: { value: 'Karan B.' } });
    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it("sends the second profile's text to that profile (by id), trimmed", async () => {
    const update = vi.spyOn(platformApi, 'updateLeadership').mockResolvedValue({ ...COO, name: 'Namita Giri', published: true });
    renderPage();
    const second = cardOf((await screen.findByText('Leader 2'), 'Leader 2'));

    await userEvent.type(within(second).getByLabelText('Name'), '  Namita Giri ');
    await userEvent.click(within(second).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(2, {
      name: 'Namita Giri',
      title: 'COO & Co-Founder',
      description: 'Runs operations.',
      photoDataUri: null,
      ...NO_LINKS,
    });
  });

  it('shows the saved social links, and sends changed, cleared and new ones — blank as null', async () => {
    const update = vi.spyOn(platformApi, 'updateLeadership').mockResolvedValue(CEO);
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    expect(within(first).getByLabelText('LinkedIn')).toHaveValue('https://linkedin.com/in/karan');
    expect(within(first).getByLabelText('Instagram')).toHaveValue('');

    fireEvent.change(within(first).getByLabelText('LinkedIn'), { target: { value: '   ' } }); // cleared
    fireEvent.change(within(first).getByLabelText('Instagram'), { target: { value: ' instagram.com/karan ' } });
    fireEvent.change(within(first).getByLabelText('Threads'), { target: { value: 'threads.net/@karan' } });
    await userEvent.click(within(first).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![1]).toMatchObject({
      linkedinUrl: null,
      facebookUrl: null,
      instagramUrl: 'instagram.com/karan',
      threadsUrl: 'threads.net/@karan',
    });
  });

  it('counts a changed link as a change, and discard puts it back', async () => {
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));
    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeDisabled();

    fireEvent.change(within(first).getByLabelText('Facebook'), { target: { value: 'facebook.com/karan' } });
    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeEnabled();

    await userEvent.click(within(first).getByRole('button', { name: 'Discard changes' }));
    expect(within(first).getByLabelText('Facebook')).toHaveValue('');
    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('removes a photo on save, and can be undone before saving', async () => {
    const update = vi.spyOn(platformApi, 'updateLeadership').mockResolvedValue({ ...CEO, photoDataUri: null });
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    await userEvent.click(within(first).getByRole('button', { name: 'Remove photo' }));
    expect(within(first).queryByRole('button', { name: 'Remove photo' })).toBeNull();
    await userEvent.click(within(first).getByRole('button', { name: 'Discard changes' }));
    expect(within(first).getByRole('button', { name: 'Remove photo' })).toBeInTheDocument();

    await userEvent.click(within(first).getByRole('button', { name: 'Remove photo' }));
    await userEvent.click(within(first).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]![1].photoDataUri).toBeNull();
  });

  it('will not save without a job title', async () => {
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    fireEvent.change(within(first).getByLabelText('Job title'), { target: { value: '   ' } });

    expect(within(first).getByText('A job title is required')).toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it("warns that clearing a published profile's name hides it", async () => {
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    fireEvent.change(within(first).getByLabelText('Name'), { target: { value: '' } });

    expect(within(first).getByText(/will be hidden from the website/i)).toBeInTheDocument();
  });

  it('shows the server’s reason when saving fails', async () => {
    const { ApiError } = await import('@/types/api');
    vi.spyOn(platformApi, 'updateLeadership').mockRejectedValue(
      new ApiError({
        code: 'VALIDATION_FAILED',
        message: 'The photo must be a PNG, JPEG or WebP image.',
        status: 400,
        path: '/platform/leadership/1',
        timestamp: '2026-11-12T00:00:00Z',
      }),
    );
    renderPage();
    const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

    fireEvent.change(within(first).getByLabelText('Name'), { target: { value: 'Karan' } });
    await userEvent.click(within(first).getByRole('button', { name: 'Save changes' }));

    expect(await within(first).findByText('The photo must be a PNG, JPEG or WebP image.')).toBeInTheDocument();
  });

  describe('adding and removing leaders', () => {
    const addButtons = () => screen.getAllByRole('button', { name: 'Add leader' });

    it('opens a blank card for a new leader, and sends nothing until it is added', async () => {
      const create = vi.spyOn(platformApi, 'createLeadership').mockResolvedValue({ ...COO, id: 3, name: 'Sita Rai', published: true });
      renderPage();
      await screen.findByText('Leader 1');

      await userEvent.click(addButtons()[0]!);
      const card = cardOf('Leader 3');
      expect(within(card).getByText('New — not added yet')).toBeInTheDocument();
      expect(within(card).getByLabelText('Name')).toHaveValue('');
      expect(within(card).getByLabelText('Job title')).toHaveValue('');
      expect(within(card).getByRole('button', { name: 'Add leader' })).toBeDisabled(); // needs a name and a title
      expect(within(card).queryByText('A job title is required')).toBeNull(); // not nagging before they type
      expect(create).not.toHaveBeenCalled();

      await userEvent.type(within(card).getByLabelText('Name'), '  Sita Rai ');
      expect(within(card).getByRole('button', { name: 'Add leader' })).toBeDisabled();
      await userEvent.type(within(card).getByLabelText('Job title'), 'Head of Sales');
      fireEvent.change(within(card).getByLabelText('LinkedIn'), { target: { value: ' linkedin.com/in/sita ' } });
      await userEvent.click(within(card).getByRole('button', { name: 'Add leader' }));

      await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
      expect(create).toHaveBeenCalledWith({
        name: 'Sita Rai',
        title: 'Head of Sales',
        description: null,
        photoDataUri: null,
        linkedinUrl: 'linkedin.com/in/sita',
        facebookUrl: null,
        instagramUrl: null,
        threadsUrl: null,
      });
      // the list is fetched again and the unsaved card is closed
      await waitFor(() => expect(platformApi.leadership).toHaveBeenCalledTimes(2));
      expect(screen.queryByText('New — not added yet')).toBeNull();
    });

    it('cancelling a new leader closes the card without saving anything', async () => {
      const create = vi.spyOn(platformApi, 'createLeadership');
      renderPage();
      await screen.findByText('Leader 1');

      await userEvent.click(addButtons()[0]!);
      const card = cardOf('Leader 3');
      await userEvent.type(within(card).getByLabelText('Name'), 'Someone');
      await userEvent.click(within(card).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('heading', { name: 'Leader 3' })).toBeNull();
      expect(create).not.toHaveBeenCalled();
      expect(addButtons()[0]).toBeEnabled(); // and another can be started
    });

    it('allows one new leader at a time', async () => {
      renderPage();
      await screen.findByText('Leader 1');

      await userEvent.click(addButtons()[0]!);
      expect(addButtons()[0]).toBeDisabled();
    });

    it('stops offering to add once the limit is reached', async () => {
      const twelve = Array.from({ length: 12 }, (_, i) => ({ ...CEO, id: i + 1, name: `Leader ${i + 1}` }));
      vi.mocked(platformApi.leadership).mockResolvedValue(twelve);
      renderPage();
      await screen.findByText(/most leaders that can be shown \(12\)/);

      expect(addButtons()[0]).toBeDisabled();
    });

    it('shows the server’s reason when adding fails, and keeps what was typed', async () => {
      const { ApiError } = await import('@/types/api');
      vi.spyOn(platformApi, 'createLeadership').mockRejectedValue(
        new ApiError({
          code: 'VALIDATION_FAILED',
          message: 'At most 12 leaders can be shown. Remove one to add another.',
          status: 400,
          path: '/platform/leadership',
          timestamp: '2026-11-14T00:00:00Z',
        }),
      );
      renderPage();
      await screen.findByText('Leader 1');

      await userEvent.click(addButtons()[0]!);
      const card = cardOf('Leader 3');
      await userEvent.type(within(card).getByLabelText('Name'), 'Sita');
      await userEvent.type(within(card).getByLabelText('Job title'), 'Advisor');
      await userEvent.click(within(card).getByRole('button', { name: 'Add leader' }));

      expect(await within(card).findByText(/At most 12 leaders/)).toBeInTheDocument();
      expect(within(card).getByLabelText('Name')).toHaveValue('Sita');
    });

    it('asks before removing a leader, and removes that one by id', async () => {
      const remove = vi.spyOn(platformApi, 'deleteLeadership').mockResolvedValue(undefined);
      renderPage();
      const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

      await userEvent.click(within(first).getByRole('button', { name: 'Remove leader' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(/Remove Karan Bohara from the leadership profiles/)).toBeInTheDocument();
      expect(remove).not.toHaveBeenCalled();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Remove leader' }));
      await waitFor(() => expect(remove).toHaveBeenCalledWith(1));
      await waitFor(() => expect(platformApi.leadership).toHaveBeenCalledTimes(2));
    });

    it('keeps the leader when the removal is dismissed', async () => {
      const remove = vi.spyOn(platformApi, 'deleteLeadership');
      renderPage();
      const first = cardOf((await screen.findByText('Leader 1'), 'Leader 1'));

      await userEvent.click(within(first).getByRole('button', { name: 'Remove leader' }));
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(remove).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('invites adding the first leader when there are none', async () => {
      vi.mocked(platformApi.leadership).mockResolvedValue([]);
      renderPage();

      expect(await screen.findByText('No leaders yet')).toBeInTheDocument();
      await userEvent.click(addButtons()[0]!);
      expect(cardOf('Leader 1')).toBeInTheDocument();
    });
  });
});
