import { readdir, mkdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";
import sharp from "sharp";

const SRC_DIR = new URL("../../artifacts/app/public/blog/", import.meta.url).pathname;
const WIDTHS = [480, 800, 1200, 1600];

async function main() {
  const entries = await readdir(SRC_DIR);
  const pngs = entries.filter((f) => f.endsWith(".png"));
  await mkdir(SRC_DIR, { recursive: true });
  for (const file of pngs) {
    const { name } = parse(file);
    const inPath = join(SRC_DIR, file);
    const meta = await sharp(inPath).metadata();
    const srcWidth = meta.width ?? 1600;
    for (const w of WIDTHS) {
      if (w > srcWidth + 50) continue;
      const out = join(SRC_DIR, `${name}-${w}.webp`);
      await sharp(inPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(out);
      const s = await stat(out);
      console.log(`${out}  ${(s.size / 1024).toFixed(1)} KB`);
    }
    const fallback = join(SRC_DIR, `${name}.webp`);
    await sharp(inPath).webp({ quality: 80 }).toFile(fallback);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
