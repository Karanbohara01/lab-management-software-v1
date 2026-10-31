import { describe, expect, it } from 'vitest';
import { FEATURES } from '../data';
import { POSTS, formatPostDate, getPost, latestPosts, readingMinutes } from './posts';

describe('blog seed content', () => {
  it('has a healthy handful of posts', () => {
    expect(POSTS.length).toBeGreaterThanOrEqual(6);
  });

  it('gives every post a unique, URL-safe slug', () => {
    const slugs = POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('fills in every field, with card-sized titles and excerpts', () => {
    for (const p of POSTS) {
      expect(p.title.trim().length).toBeGreaterThan(10);
      expect(p.title.length).toBeLessThanOrEqual(90);
      expect(p.excerpt.trim().length).toBeGreaterThan(40);
      expect(p.excerpt.length).toBeLessThanOrEqual(220);
      expect(p.category.trim()).not.toBe('');
    }
  });

  it('uses real calendar dates', () => {
    for (const p of POSTS) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const d = new Date(`${p.date}T00:00:00Z`);
      expect(Number.isNaN(d.getTime())).toBe(false);
      expect(d.toISOString().slice(0, 10)).toBe(p.date); // e.g. rules out 2026-02-31
    }
  });

  it('illustrates every post with an image that actually ships', () => {
    const shipped = new Set(FEATURES.map((f) => f.image));
    for (const p of POSTS) expect(shipped.has(p.image)).toBe(true);
  });

  it('writes real articles: an intro, at least one section, and no empty blocks', () => {
    for (const p of POSTS) {
      expect(p.body.length).toBeGreaterThanOrEqual(5);
      expect(p.body[0]!.type).toBe('p');
      expect(p.body.some((b) => b.type === 'h2')).toBe(true);
      for (const b of p.body) {
        if (b.type === 'ul' || b.type === 'ol') {
          expect(b.items.length).toBeGreaterThan(0);
          for (const item of b.items) expect(item.trim()).not.toBe('');
        } else {
          expect(b.text.trim()).not.toBe('');
        }
      }
    }
  });

  it('lists newest first and can cap the count', () => {
    const all = latestPosts();
    expect(all).toHaveLength(POSTS.length);
    for (let i = 1; i < all.length; i++) expect(all[i - 1]!.date >= all[i]!.date).toBe(true);
    expect(latestPosts(3).map((p) => p.slug)).toEqual(all.slice(0, 3).map((p) => p.slug));
  });

  it('looks posts up by slug', () => {
    expect(getPost(POSTS[0]!.slug)).toBe(POSTS[0]);
    expect(getPost('no-such-article')).toBeUndefined();
    expect(getPost(undefined)).toBeUndefined();
  });

  it('computes reading time from the text (about 200 words a minute, never under a minute)', () => {
    for (const p of POSTS) {
      const words = p.body
        .map((b) => (b.type === 'ul' || b.type === 'ol' ? b.items.join(' ') : b.text))
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length;
      expect(readingMinutes(p)).toBe(Math.max(1, Math.ceil(words / 200)));
      expect(readingMinutes(p)).toBeLessThan(10);
    }
  });

  it('formats dates the way the cards show them, without timezone drift', () => {
    expect(formatPostDate('2026-10-27')).toBe('27 Oct 2026');
    expect(formatPostDate('2026-01-01')).toBe('1 Jan 2026');
  });
});
