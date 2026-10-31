import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AUTOPLAY_DELAY_MS, COLLAGE, HeroCollage } from './HeroCollage';

function stubBrowser(reducedMotion = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reducedMotion && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** jsdom does not play media; let a test say whether the element counts as paused. */
function setPaused(video: HTMLVideoElement, paused: boolean) {
  Object.defineProperty(video, 'paused', { configurable: true, get: () => paused });
}

const PLAY = /play the lims product tour video/i;
const PAUSE = /pause the lims product tour video/i;

describe('HeroCollage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('has a video slot with a play button and two photo slots', () => {
    stubBrowser();
    const { container } = render(<HeroCollage />);
    expect(container.querySelector('video')).toHaveAttribute('src', COLLAGE.video);
    expect(screen.getByRole('button', { name: PLAY })).toBeInTheDocument();
    expect(screen.getAllByRole('img').map((p) => p.getAttribute('src'))).toEqual([COLLAGE.photo1, COLLAGE.photo2]);
  });

  it('starts the video by itself after a short beat — muted and looping', () => {
    stubBrowser();
    const { container } = render(<HeroCollage />);
    const video = container.querySelector('video')!;
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);

    act(() => void vi.advanceTimersByTime(AUTOPLAY_DELAY_MS - 100));
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(200));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it('waits for a press instead of autoplaying when the visitor prefers reduced motion', () => {
    stubBrowser(true);
    render(<HeroCollage />);
    act(() => void vi.advanceTimersByTime(AUTOPLAY_DELAY_MS * 4));
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: PLAY })).toBeInTheDocument();
  });

  it('plays on a press, then pauses on the next, bringing the play button back', () => {
    stubBrowser();
    const { container } = render(<HeroCollage />);
    const video = container.querySelector('video')!;
    setPaused(video, true);

    fireEvent.click(screen.getByRole('button', { name: PLAY }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    setPaused(video, false);
    fireEvent.play(video);
    fireEvent.click(screen.getByRole('button', { name: PAUSE }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);

    fireEvent.pause(video);
    expect(screen.getByRole('button', { name: PLAY })).toBeInTheDocument();
  });

  it('offers a sound button only while playing, and it unmutes', () => {
    stubBrowser();
    const { container } = render(<HeroCollage />);
    const video = container.querySelector('video')!;
    expect(screen.queryByRole('button', { name: /video sound/i })).toBeNull();

    fireEvent.play(video);
    fireEvent.click(screen.getByRole('button', { name: /turn the video sound on/i }));

    expect(video.muted).toBe(false);
    expect(screen.getByRole('button', { name: /turn the video sound off/i })).toBeInTheDocument();
  });

  it('says so, and keeps the play button, if the video cannot be loaded', () => {
    stubBrowser();
    const { container } = render(<HeroCollage />);

    fireEvent.error(container.querySelector('video')!);

    expect(screen.getByRole('status')).toHaveTextContent(/video unavailable/i);
    expect(screen.getByRole('button', { name: PLAY })).toBeInTheDocument();
  });
});
