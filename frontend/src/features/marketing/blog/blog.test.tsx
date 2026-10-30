import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogIndexPage } from './BlogIndexPage';
import { BlogPostPage } from './BlogPostPage';
import { Blogs } from '../sections/Blogs';
import { POSTS, latestPosts } from './posts';

function stubBrowser() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'), // reveal animations show immediately; no observer needed
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('blog pages', () => {
  beforeEach(stubBrowser);
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('/blog lists every post as a card linking to its article, newest first', () => {
    renderAt('/blog');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Guides and updates for laboratory teams.');
    const links = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/blog/'))
      .map((a) => a.getAttribute('href'));
    expect(links).toEqual(latestPosts().map((p) => `/blog/${p.slug}`));
    expect(document.title).toBe('Blog | LIMS');
  });

  it('an article page shows the post, with a way back and the other articles beneath it', () => {
    const post = POSTS[1]!;
    renderAt(`/blog/${post.slug}`);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(post.title);
    expect(screen.getByText(post.category)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /all articles/i })).toHaveAttribute('href', '/blog');
    expect(within(screen.getByRole('heading', { level: 1 }).parentElement!).getByText(/min read/)).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
    expect(document.title).toBe(`${post.title} | LIMS`);

    const more = within(screen.getByRole('complementary', { name: 'More articles' }));
    const cards = more.getAllByRole('link');
    expect(cards).toHaveLength(3);
    expect(cards.map((a) => a.getAttribute('href'))).not.toContain(`/blog/${post.slug}`);
  });

  it('renders the whole body: headings, paragraphs and lists', () => {
    const post = POSTS[0]!;
    renderAt(`/blog/${post.slug}`);
    for (const block of post.body) {
      if (block.type === 'h2') expect(screen.getByRole('heading', { level: 2, name: block.text })).toBeInTheDocument();
      else if (block.type === 'p') expect(screen.getByText(block.text)).toBeInTheDocument();
      else for (const item of block.items) expect(screen.getByText(item)).toBeInTheDocument();
    }
  });

  it('an unknown address says so kindly and links back to the list', () => {
    renderAt('/blog/this-does-not-exist');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We couldn’t find that article.');
    expect(screen.getByRole('link', { name: /all articles/i })).toHaveAttribute('href', '/blog');
    expect(document.title).toBe('Article not found | LIMS');
  });
});

describe('Blogs section on the landing page', () => {
  beforeEach(stubBrowser);
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows the three newest posts and a link to the rest', () => {
    render(
      <MemoryRouter>
        <Blogs />
      </MemoryRouter>,
    );
    const newest = latestPosts(3);
    const hrefs = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h?.startsWith('/blog/'));
    expect(hrefs).toEqual(newest.map((p) => `/blog/${p.slug}`));
    expect(screen.getByRole('link', { name: /view all articles/i })).toHaveAttribute('href', '/blog');
    expect(screen.queryByText(/no articles yet/i)).toBeNull();
  });
});
