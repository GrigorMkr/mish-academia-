import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(file, 'utf8');
const key = '<div class="about__mosaic">';
const start = h.indexOf(key);
const end = h.indexOf('<article class="about-card about-card--muted">', start);
if (start < 0 || end < 0) {
  throw new Error('markers');
}
const head = h.slice(0, start + key.length);
const tail = h.slice(end);
const mid = h.slice(start + key.length, end);
const lime = mid.match(/<article class="about-card about-card--lime">[\s\S]*?<\/article>/);
const deep = mid.match(/<article class="about-card about-card--deep">[\s\S]*?<\/article>/);
if (!lime || !deep) {
  throw new Error('cards');
}
const newMid = `\n            ${deep[0]}\n\n            ${lime[0]}\n\n            `;
fs.writeFileSync(file, head + newMid + tail);
