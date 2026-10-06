// Converts the 5 ad source images (src/assets, 1080x1350 PNG) into responsive AVIF + WebP
// at 540w and 1080w for the landing page. Run with `npm run images`; outputs are committed.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/images/ads';
const WIDTHS = [540, 1080];

await mkdir(OUT, { recursive: true });
for (let n = 1; n <= 5; n++) {
  const src = `src/assets/FP_FranciscoAllende_Ad${n}_Image.png`;
  for (const w of WIDTHS) {
    const img = sharp(src).resize({ width: w });
    await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${OUT}/ad${n}-${w}.avif`);
    await img.clone().webp({ quality: 72, effort: 6 }).toFile(`${OUT}/ad${n}-${w}.webp`);
  }
  console.log(`ad${n} done`);
}
