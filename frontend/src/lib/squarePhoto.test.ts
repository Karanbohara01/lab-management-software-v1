import { describe, expect, it } from 'vitest';
import { centreSquare, fileToSquareJpegDataUri, MAX_PHOTO_SOURCE_BYTES, PhotoError } from './squarePhoto';

describe('centreSquare', () => {
  it('takes the middle of a landscape photo', () => {
    expect(centreSquare(1600, 900)).toEqual({ sx: 350, sy: 0, side: 900 });
  });

  it('takes the middle of a portrait photo', () => {
    expect(centreSquare(900, 1600)).toEqual({ sx: 0, sy: 350, side: 900 });
  });

  it('leaves a square photo whole', () => {
    expect(centreSquare(500, 500)).toEqual({ sx: 0, sy: 0, side: 500 });
  });
});

describe('fileToSquareJpegDataUri', () => {
  const fileOf = (type: string, bytes = 10) => new File([new Uint8Array(bytes)], 'photo', { type });

  it('refuses something that is not an image', async () => {
    await expect(fileToSquareJpegDataUri(fileOf('application/pdf'))).rejects.toMatchObject({
      problem: 'not-an-image',
    });
  });

  it('refuses an SVG, which is not a photo and can carry script', async () => {
    await expect(fileToSquareJpegDataUri(fileOf('image/svg+xml'))).rejects.toBeInstanceOf(PhotoError);
  });

  it('refuses a huge file before trying to read it', async () => {
    await expect(fileToSquareJpegDataUri(fileOf('image/jpeg', MAX_PHOTO_SOURCE_BYTES + 1))).rejects.toMatchObject({
      problem: 'too-large',
    });
  });
});
