import { readFileSync, writeFileSync } from 'fs';

const imgDir = 'img-2026-03-08-从用户痛点到蓝海市场-AI驱动的创业新思路';
const images = ['p1-cover.png','p2-painpoint.png','p3-ai-revolution.png','p4-framework.png','p5-case.png','p6-cta.png'];

for (const img of images) {
  const buffer = readFileSync(`${imgDir}/${img}`);
  const b64 = buffer.toString('base64');
  writeFileSync(`${img}.b64`, b64);
  console.log(`${img} done`);
}
