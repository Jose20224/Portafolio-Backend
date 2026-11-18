import type { PortfolioImageMimeType } from './dto/storage.dto.js';

/** Detects the actual binary signature rather than trusting the browser MIME header. */
export function detectPortfolioImageMime(bytes: Buffer): PortfolioImageMimeType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) return 'image/jpeg';

  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) return 'image/png';

  if (bytes.length >= 6) {
    const signature = bytes.toString('ascii', 0, 6);
    if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif';
  }

  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';

  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(bytes.toString('ascii', 8, 12))
  ) return 'image/avif';

  return null;
}
