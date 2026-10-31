# Landing-page photography

Drop licensed / project-owned photography here using the **exact filenames**
below. Until a file exists, the `<Photo>` component renders an on-brand
placeholder (no broken images), so the site builds and ships without them.

Reference paths in code are already wired (`src/features/marketing/data.ts` →
`IMAGES`). No code change is needed when the files land — just add them here.

| Filename | Used in | Subject | Notes |
|---|---|---|---|
| `laboratory-sample-processing.webp` | Problem section | Technician holding a sample tube, with floating paper-form / spreadsheet / payment-card / report icons each crossed out | Conveys disconnected tools. 747 × 412, shown uncropped at that ratio — if you replace it with a different shape, update `ratio` in `sections/Problem.tsx` |
| `laboratory-technician-samples.webp` | Sample-tracking showcase | Technician handling barcoded specimen tubes at the bench | Supports the software story, not a hero |
| `pathologist-reviewing-results.webp` | Result-management showcase | Pathologist reviewing diagnostic data at a workstation | Keep smaller than the product UI |
| `modern-diagnostic-laboratory.webp` | (reserved) lab environment | Clean modern analyser bench, no people | Optional |
| `hero-collage-video.mp4` | Hero collage — top-left tile | Autoplays muted ~1.5 s after the page loads, loops; click pauses, speaker button unmutes | H.264 MP4 with the index at the front (faststart), under ~5 MB. Currently 1280 × 720 (16:9): the tile is ~4:3, so the sides are cropped — `VIDEO_FOCUS` in `components/HeroCollage.tsx` picks which part stays in view |
| `hero-collage-video-poster.webp` | Hero collage — top-left tile | Still shown before the video starts (and for visitors who prefer reduced motion) | Use the video's first frame so nothing jumps; same shape as the video |
| `hero-collage-photo-1.webp` | Hero collage — bottom-left tile | Photo | Landscape, ~4:3, at least 800 × 600 |
| `hero-collage-photo-2.webp` | Hero collage — right tile (tall) | Photo | Portrait, ~2:3, at least 640 × 960 |
| `labos-og.png` | Social preview (`og:image`) | LIMS dashboard on a clean background | 1200 × 630 |

## Specifications

- **Format:** WebP (AVIF also fine — add `.avif` siblings and extend `srcSet`).
- **Dimensions:** long edge ~1600 px; provide `-800w` and `-1200w` variants if
  you want responsive `srcSet` (optional).
- **Weight:** target < 180 KB each after compression. Never ship > 400 KB.
- **Aspect:** the component crops with `object-fit: cover`; frame the subject
  with headroom so `object-position` tweaks are rarely needed.
- **Treatment (keep consistent across all photos):**
  - natural lighting, clean composition, minimal clutter
  - cool clinical palette — blues / neutrals / soft green
  - real laboratory equipment and realistic professionals
  - no staged smiles-at-camera, handshakes, stethoscopes, hospital exteriors

## Licensing

Only add images you have the right to use (owned, or a stock licence covering
web marketing). Keep the licence record with the project.
