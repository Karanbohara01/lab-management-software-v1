import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeaturesMenu } from './FeaturesMenu';
import { FEATURES, NAV_ITEMS } from '../data';

const item = NAV_ITEMS.find((i) => i.hasFeatureMenu)!;
const firstFeature = FEATURES[0]!;
const thirdFeature = FEATURES[2]!;

function renderMenu() {
  render(
    <MemoryRouter>
      <ul>
        <FeaturesMenu item={item} linkClassName="" />
      </ul>
    </MemoryRouter>,
  );
  return screen.getByRole('link', { name: item.label });
}

describe('FeaturesMenu', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('is only wired to the Features nav item', () => {
    expect(item.label).toBe('Features');
    expect(NAV_ITEMS.filter((i) => i.hasFeatureMenu)).toHaveLength(1);
  });

  it('lists every product feature, each linking to the section that covers it', () => {
    renderMenu();
    for (const feature of FEATURES) {
      expect(screen.getByRole('link', { name: feature.title })).toHaveAttribute('href', feature.href);
    }
  });

  it('starts closed, opens on hover, and closes shortly after the pointer leaves', () => {
    const trigger = renderMenu();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.mouseEnter(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseLeave(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true'); // still inside the grace period
    act(() => vi.advanceTimersByTime(200));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('stays open if the pointer comes back within the grace period', () => {
    const trigger = renderMenu();
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    act(() => vi.advanceTimersByTime(50));
    fireEvent.mouseEnter(screen.getByRole('link', { name: firstFeature.title })); // crossed into the panel
    act(() => vi.advanceTimersByTime(500));
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens on keyboard focus and closes on Escape', () => {
    const trigger = renderMenu();
    fireEvent.focus(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes when focus moves out of the menu', () => {
    const trigger = renderMenu();
    fireEvent.focus(trigger);
    fireEvent.blur(trigger, { relatedTarget: document.body });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps open when focus moves from the link into the panel', () => {
    const trigger = renderMenu();
    fireEvent.focus(trigger);
    fireEvent.blur(trigger, { relatedTarget: screen.getByRole('link', { name: firstFeature.title }) });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes when a feature is chosen', () => {
    const trigger = renderMenu();
    fireEvent.mouseEnter(trigger);
    fireEvent.click(screen.getByRole('link', { name: thirdFeature.title }));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
