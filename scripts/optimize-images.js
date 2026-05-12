const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const OUTPUT_DIR = path.join(ASSETS_DIR, "optimized");
const EXTENSIONS = [".jpg", ".jpeg", ".png"];
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 65;

function findImages(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === OUTPUT_DIR) continue;
      findImages(fullPath, results);
    } else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeImage(filePath) {
  const relativePath = path.relative(ASSETS_DIR, filePath);
  const relativeDir = path.dirname(relativePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  const outputDir = path.join(OUTPUT_DIR, relativeDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const originalSize = fs.statSync(filePath).size;
  const webpPath = path.join(outputDir, `${baseName}.webp`);
  const avifPath = path.join(outputDir, `${baseName}.avif`);

  const image = sharp(filePath);

  await image.clone().webp({ quality: WEBP_QUALITY }).toFile(webpPath);
  const webpSize = fs.statSync(webpPath).size;

  await image.clone().avif({ quality: AVIF_QUALITY }).toFile(avifPath);
  const avifSize = fs.statSync(avifPath).size;

  const webpSavings = ((1 - webpSize / originalSize) * 100).toFixed(1);
  const avifSavings = ((1 - avifSize / originalSize) * 100).toFixed(1);

  return {
    file: relativePath,
    originalSize,
    webpSize,
    avifSize,
    webpSavings,
    avifSavings,
  };
}

async function main() {
  console.log("🖼  Image Optimization\n");

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error("Error: assets/ directory not found.");
    process.exit(1);
  }

  const images = findImages(ASSETS_DIR);
  if (images.length === 0) {
    console.log("No images found to optimize.");
    return;
  }

  console.log(`Found ${images.length} image(s). Processing...\n`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (const img of images) {
    try {
      const result = await optimizeImage(img);
      results.push(result);
    } catch (err) {
      console.warn(`⚠ Skipping ${path.relative(ASSETS_DIR, img)}: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.log("No images were successfully optimized.");
    return;
  }

  console.log("File".padEnd(40) + "Original".padEnd(12) + "WebP".padEnd(12) + "AVIF".padEnd(12) + "WebP %".padEnd(9) + "AVIF %");
  console.log("-".repeat(95));

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalAvif = 0;

  for (const r of results) {
    totalOriginal += r.originalSize;
    totalWebp += r.webpSize;
    totalAvif += r.avifSize;
    console.log(
      r.file.padEnd(40) +
      formatBytes(r.originalSize).padEnd(12) +
      formatBytes(r.webpSize).padEnd(12) +
      formatBytes(r.avifSize).padEnd(12) +
      `${r.webpSavings}%`.padEnd(9) +
      `${r.avifSavings}%`
    );
  }

  console.log("-".repeat(95));
  console.log(
    "TOTAL".padEnd(40) +
    formatBytes(totalOriginal).padEnd(12) +
    formatBytes(totalWebp).padEnd(12) +
    formatBytes(totalAvif).padEnd(12) +
    `${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}%`.padEnd(9) +
    `${((1 - totalAvif / totalOriginal) * 100).toFixed(1)}%`
  );

  console.log(`\n✅ Optimized images saved to: assets/optimized/`);
}

main();
