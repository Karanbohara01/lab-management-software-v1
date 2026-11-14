/**
 * Shrinks a chosen photo to a small square JPEG, as a data URI, ready to store.
 *
 * Photos come straight off a phone or camera — often several MB — but a profile picture is shown
 * at 100–200px, so it is cropped to the centre square and scaled down in the browser before it is
 * sent. That keeps what is stored (and what every visitor to the landing page downloads) to a few
 * tens of KB.
 */

export const MAX_PHOTO_SOURCE_BYTES = 8 * 1024 * 1024;

export interface SquareCrop {
  /** Left/top of the square within the source image, and its side length. */
  sx: number;
  sy: number;
  side: number;
}

/** The largest centred square that fits inside a `width` x `height` image. */
export function centreSquare(width: number, height: number): SquareCrop {
  const side = Math.min(width, height);
  return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), side };
}

export type PhotoProblem = 'not-an-image' | 'too-large' | 'unreadable';

export class PhotoError extends Error {
  constructor(readonly problem: PhotoProblem) {
    super(problem);
  }
}

/** `size` is the edge of the resulting square in px; 480 stays sharp on a 2x screen at 200px. */
export async function fileToSquareJpegDataUri(file: File, size = 480, quality = 0.85): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) throw new PhotoError('not-an-image');
  if (file.size > MAX_PHOTO_SOURCE_BYTES) throw new PhotoError('too-large');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoError('unreadable');
  }
  try {
    const { sx, sy, side } = centreSquare(bitmap.width, bitmap.height);
    const edge = Math.min(size, side); // never blow a small photo up
    const canvas = document.createElement('canvas');
    canvas.width = edge;
    canvas.height = edge;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('unreadable');
    ctx.fillStyle = '#ffffff'; // a transparent PNG would otherwise turn black as a JPEG
    ctx.fillRect(0, 0, edge, edge);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}
