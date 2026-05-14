const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = process.argv[2];
const outputDir = process.argv[3];

// 小红书竖版: 1080x1440 (3:4)
const TARGET_W = 1080;
const TARGET_H = 1440;
const BAR_H = (TARGET_H - TARGET_W * 720 / 1280) / 2;

async function processFile(filePath, outputPath) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  // Calculate center crop to get 1080x720 (maintaining original height ratio)
  const cropW = Math.round(metadata.width * TARGET_W / 1280);
  const cropH = Math.round(metadata.height * 720 / 1280);
  const left = Math.round((metadata.width - cropW) / 2);
  const top = Math.round((metadata.height - cropH) / 2);

  const cropped = await image.extract({ left, top, width: cropW, height: cropH }).toBuffer();
  
  const resized = await sharp(cropped).resize(TARGET_W, 720, { fit: 'cover' }).toBuffer();

  // Create top and bottom bars with gradient-like effect (subtle dark)
  const topBar = await sharp({
    create: {
      width: TARGET_W,
      height: Math.round(BAR_H),
      channels: 3,
      background: { r: 15, g: 15, b: 20 }
    }
  }).png().toBuffer();

  const bottomBar = await sharp({
    create: {
      width: TARGET_W,
      height: Math.round(BAR_H),
      channels: 3,
      background: { r: 15, g: 15, b: 20 }
    }
  }).png().toBuffer();

  // Composite: top bar + image + bottom bar
  await sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 3,
      background: { r: 15, g: 15, b: 20 }
    }
  })
    .composite([
      { input: topBar, top: 0, left: 0 },
      { input: resized, top: Math.round(BAR_H), left: 0 },
      { input: bottomBar, top: Math.round(BAR_H) + 720, left: 0 },
    ])
    .png()
    .toFile(outputPath);
  
  console.log(`Created: ${path.basename(outputPath)}`);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, `xhs-${file}`);
    await processFile(inputPath, outputPath);
  }
  
  console.log(`\nDone! ${files.length} files processed.`);
}

main().catch(console.error);
