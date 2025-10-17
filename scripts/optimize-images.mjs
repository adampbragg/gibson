#!/usr/bin/env node
/*
  Build-time image optimizer
  - Scans public/images (recursively)
  - Emits optimized WebP copies to public/optimized/images with max width 1920, quality 80
  - Skips SVG (copied as-is)
  - Skips files that are unchanged (based on mtime and size comparison)
*/
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(ROOT, 'public', 'images');
const OUT_DIR = path.join(ROOT, 'public', 'optimized', 'images');

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tif', '.tiff']);
const COPY_AS_IS_EXT = new Set(['.svg']);

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return await walk(full);
    return full;
  }));
  return files.flat();
}

async function needsBuild(src, out) {
  try {
    const [s, o] = await Promise.all([fsp.stat(src), fsp.stat(out)]);
    // Rebuild if source is newer or output is empty
    return s.mtimeMs > o.mtimeMs || o.size === 0;
  } catch {
    return true;
  }
}

async function optimizeRaster(srcPath, outPath) {
  const dir = path.dirname(outPath);
  await ensureDir(dir);
  const doBuild = await needsBuild(srcPath, outPath);
  if (!doBuild) return 'skipped';
  const img = sharp(srcPath, { failOn: 'none' });
  await img
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
  return 'built';
}

async function copyFile(srcPath, outPath) {
  const dir = path.dirname(outPath);
  await ensureDir(dir);
  const doBuild = await needsBuild(srcPath, outPath);
  if (!doBuild) return 'skipped';
  await fsp.copyFile(srcPath, outPath);
  return 'copied';
}

async function run() {
  const exists = fs.existsSync(SRC_DIR);
  if (!exists) {
    console.log(`[optimize-images] No images directory found at ${SRC_DIR}. Skipping.`);
    return;
  }
  const allFiles = (await walk(SRC_DIR)).filter(Boolean);
  let built = 0, skipped = 0, copied = 0;
  for (const file of allFiles) {
    const rel = path.relative(SRC_DIR, file);
    const ext = path.extname(file).toLowerCase();
    // Output path keeps subfolder structure, converts filename to .webp for rasters
    const outRel = COPY_AS_IS_EXT.has(ext)
      ? rel
      : path.join(path.dirname(rel), `${path.parse(rel).name}.webp`);
    const outPath = path.join(OUT_DIR, outRel);

    try {
      if (COPY_AS_IS_EXT.has(ext)) {
        const res = await copyFile(file, outPath);
        if (res === 'skipped') skipped++; else copied++;
      } else if (RASTER_EXT.has(ext)) {
        const res = await optimizeRaster(file, outPath);
        if (res === 'skipped') skipped++; else built++;
      } else {
        // ignore other file types
        skipped++;
      }
    } catch (err) {
      console.warn(`[optimize-images] Failed for ${file}:`, err?.message || err);
    }
  }
  console.log(`[optimize-images] Done. built=${built} copied=${copied} skipped=${skipped}`);
}

run().catch((e) => {
  console.error('[optimize-images] Fatal:', e);
  process.exit(1);
});
