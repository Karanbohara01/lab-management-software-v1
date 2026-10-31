import { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Photo } from './Photo';

/**
 * The hero collage's slots. Put files with these names in `frontend/public/marketing/`
 * (specs in the README there); until a file exists its slot shows the on-brand placeholder.
 */
export const COLLAGE = {
  video: '/marketing/hero-collage-video.mp4',
  poster: '/marketing/hero-collage-video-poster.webp',
  photo1: '/marketing/hero-collage-photo-1.webp',
  photo2: '/marketing/hero-collage-photo-2.webp',
} as const;

/** How long the poster stays up before the video starts by itself. */
export const AUTOPLAY_DELAY_MS = 1500;

/** The video is 16:9 and the tile is not, so the sides are cropped — keep the monitor in view. */
const VIDEO_FOCUS = '60% 50%';

const TILE = 'rounded-3xl border-0 shadow-[0_18px_44px_-18px_rgb(15_23_42/0.35)]';

/**
 * The video slot: shows the poster with a play button, then starts the video on its own after a
 * moment (muted, which is what lets browsers allow it). Click the tile to pause or resume; the
 * speaker button turns the sound on. Visitors who ask for reduced motion get the poster only.
 */
function VideoTile({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      // A refusal (e.g. data saver) just leaves the play button for the visitor to press.
      void videoRef.current?.play().catch(() => {});
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div className={cn('relative isolate overflow-hidden bg-surface-muted', TILE, className)}>
      <Photo
        src={COLLAGE.poster}
        alt=""
        ratio="auto"
        priority
        objectPosition={VIDEO_FOCUS}
        className="absolute inset-0 rounded-none border-0"
      />
      <video
        ref={videoRef}
        src={COLLAGE.video}
        poster={COLLAGE.poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        aria-label="LIMS product tour"
        onPlay={() => {
          setPlaying(true);
          setFailed(false);
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: VIDEO_FOCUS }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause the LIMS product tour video' : 'Play the LIMS product tour video'}
        className="group absolute inset-0 grid place-items-center bg-foreground/0 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className={cn(
            'grid h-14 w-14 place-items-center rounded-full bg-white shadow-popover transition duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-16 sm:w-16',
            playing && 'pointer-events-none scale-75 opacity-0 group-hover:scale-75',
          )}
        >
          <Play className="h-6 w-6 translate-x-0.5 fill-current text-primary" aria-hidden />
        </span>
      </button>
      {playing && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Turn the video sound on' : 'Turn the video sound off'}
          className="absolute bottom-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow-popover transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>
      )}
      {failed && (
        <p role="status" className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-muted">
          Video unavailable right now.
        </p>
      )}
    </div>
  );
}

/**
 * Hero imagery: a video tile and a photo stacked on the left, one tall photo on the right.
 * The 4:3 frame is fixed, so the tiles keep their proportions at every width.
 */
export function HeroCollage() {
  return (
    <div className="grid aspect-[4/3] w-full grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
      <VideoTile className="col-start-1 row-start-1" />
      <Photo
        src={COLLAGE.photo1}
        alt="Laboratory work in progress"
        ratio="auto"
        priority
        className={cn('col-start-1 row-start-2 h-full', TILE)}
      />
      <Photo
        src={COLLAGE.photo2}
        alt="A scientist working at a laboratory microscope"
        ratio="auto"
        priority
        className={cn('col-start-2 row-span-2 row-start-1 h-full', TILE)}
      />
    </div>
  );
}
