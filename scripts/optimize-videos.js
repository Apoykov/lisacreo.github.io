const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const sharp = require("sharp");

const VIDEO_DIR = path.join(__dirname, "..", "assets", "video");
const OUTPUT_DIR = path.join(__dirname, "..", "assets", "optimized", "video");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) reject(new Error(`${cmd} failed: ${err.message}\n${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function checkFfmpeg() {
  try {
    await run("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

async function optimizeVideo(filePath) {
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const outputMp4 = path.join(OUTPUT_DIR, `${baseName}.mp4`);
  const posterJpg = path.join(OUTPUT_DIR, `${baseName}.jpg`);
  const posterWebp = path.join(OUTPUT_DIR, `${baseName}.webp`);

  const originalSize = fs.statSync(filePath).size;

  await run("ffmpeg", [
    "-y", "-i", filePath,
    "-c:v", "libx264", "-crf", "28", "-preset", "slow",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outputMp4,
  ]);

  await run("ffmpeg", [
    "-y", "-i", filePath,
    "-ss", "1", "-frames:v", "1",
    "-q:v", "2",
    posterJpg,
  ]);

  try {
    await sharp(posterJpg).webp({ quality: 80 }).toFile(posterWebp);
  } catch (err) {
    console.warn(`  ⚠ WebP poster failed for ${baseName}: ${err.message}`);
  }

  if (!fs.existsSync(outputMp4) || !fs.existsSync(posterJpg)) {
    throw new Error(`Missing expected output for ${baseName}`);
  }

  const optimizedSize = fs.statSync(outputMp4).size;
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  return { file: path.basename(filePath), originalSize, optimizedSize, savings };
}

async function main() {
  console.log("🎬 Video Optimization\n");

  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    console.error("Error: ffmpeg is not installed or not in PATH.");
    console.error("Install it with: brew install ffmpeg");
    process.exit(1);
  }

  if (!fs.existsSync(VIDEO_DIR)) {
    console.log(`No video directory found at: ${VIDEO_DIR}`);
    console.log("Nothing to optimize.");
    return;
  }

  const videos = fs.readdirSync(VIDEO_DIR)
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .map((f) => path.join(VIDEO_DIR, f));

  if (videos.length === 0) {
    console.log("No .mp4 files found in assets/video/");
    return;
  }

  console.log(`Found ${videos.length} video(s). Processing...\n`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results = [];
  for (const vid of videos) {
    try {
      const result = await optimizeVideo(vid);
      results.push(result);
      console.log(`✓ ${result.file}`);
    } catch (err) {
      console.warn(`⚠ Skipping ${path.basename(vid)}: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.log("\nNo videos were successfully optimized.");
    return;
  }

  console.log("\n" + "File".padEnd(35) + "Original".padEnd(12) + "Optimized".padEnd(12) + "Savings");
  console.log("-".repeat(70));

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const r of results) {
    totalOriginal += r.originalSize;
    totalOptimized += r.optimizedSize;
    console.log(
      r.file.padEnd(35) +
      formatBytes(r.originalSize).padEnd(12) +
      formatBytes(r.optimizedSize).padEnd(12) +
      `${r.savings}%`
    );
  }

  console.log("-".repeat(70));
  console.log(
    "TOTAL".padEnd(35) +
    formatBytes(totalOriginal).padEnd(12) +
    formatBytes(totalOptimized).padEnd(12) +
    `${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`
  );

  console.log(`\n✅ Optimized videos and posters saved to: assets/optimized/video/`);
}

main();
