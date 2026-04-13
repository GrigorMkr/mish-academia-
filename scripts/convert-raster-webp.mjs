import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const assetsDir = path.join(import.meta.dirname, '..', 'assets');
const pngNames = [
  'about-teacher-figma.png',
  'about-decor-ellipse-figma.png',
  'about-seal-figma.png',
  'avatar-1665.png',
  'avatar-1666.png',
  'avatar-1667.png',
  'avatar-1670.png',
];

for (const name of pngNames) {
  const input = path.join(assetsDir, name);
  if (!fs.existsSync(input)) {
    continue;
  }
  const output = path.join(assetsDir, name.replace(/\.png$/i, '.webp'));
  await sharp(input).webp({ quality: 88 }).toFile(output);
}
