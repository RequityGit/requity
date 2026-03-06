import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');
const svgPath = join(rootDir, 'public', 'favicon.svg');

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Also generate apple-touch-icon (180x180)
  await sharp(svgPath)
    .resize(180, 180)
    .png()
    .toFile(join(rootDir, 'public', 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png');

  // Generate favicon-32x32 and favicon-16x16
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(join(rootDir, 'public', 'favicon-32x32.png'));
  console.log('Generated: favicon-32x32.png');

  await sharp(svgPath)
    .resize(16, 16)
    .png()
    .toFile(join(rootDir, 'public', 'favicon-16x16.png'));
  console.log('Generated: favicon-16x16.png');

  // Generate favicon.ico (32x32 PNG as ico is tricky - we'll use the 32px version)
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
