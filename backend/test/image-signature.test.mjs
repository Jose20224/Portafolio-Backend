import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPortfolioImageMime } from '../dist/storage/image-signature.js';

test('detects supported image signatures from the file bytes', () => {
  assert.equal(detectPortfolioImageMime(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg');
  assert.equal(
    detectPortfolioImageMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/png',
  );
  assert.equal(detectPortfolioImageMime(Buffer.from('GIF89a', 'ascii')), 'image/gif');

  const webp = Buffer.alloc(12);
  webp.write('RIFF', 0, 'ascii');
  webp.write('WEBP', 8, 'ascii');
  assert.equal(detectPortfolioImageMime(webp), 'image/webp');

  const avif = Buffer.alloc(12);
  avif.write('ftyp', 4, 'ascii');
  avif.write('avif', 8, 'ascii');
  assert.equal(detectPortfolioImageMime(avif), 'image/avif');
});

test('rejects unknown and truncated image signatures', () => {
  assert.equal(detectPortfolioImageMime(Buffer.from('not-an-image')), null);
  assert.equal(detectPortfolioImageMime(Buffer.from([0xff, 0xd8])), null);
  assert.equal(detectPortfolioImageMime(Buffer.alloc(0)), null);
});
