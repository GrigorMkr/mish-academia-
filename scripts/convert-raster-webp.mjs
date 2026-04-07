import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.join(import.meta.dirname, '..', 'assets');
const pngNames = [
  'hero-top-1.png',
  'hero-top-2.png',
  'hero-bottom-right.png',
  'hero-portrait-2.png',
  'about-teacher-figma.png',
  'about-decor-ellipse-figma.png',
  'about-seal-figma.png',
  'avatar-1665.png',
  'avatar-1666.png',
  'avatar-1667.png',
  'avatar-1670.png',
  'cert-light-1.png',
  'cert-light-2.png',
  'cert-light-3.png',
  'cert-light-4.png',
  'cert-light-5.png',
  'cert-light-6.png',
];

for (const name of pngNames) {
  const input = path.join(assetsDir, name);
  if (!fs.existsSync(input)) {
    continue;
  }
  const output = path.join(assetsDir, name.replace(/\.png$/i, '.webp'));
  await sharp(input).webp({ quality: 88 }).toFile(output);
}
