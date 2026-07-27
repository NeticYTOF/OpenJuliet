#!/usr/bin/env node
/**
 * OpenJuliet App Icon Generator
 * ==============================
 *
 * Generates PNG app icons in multiple sizes from the SVG source.
 * Uses `sharp` (https://sharp.pixelplumbing.com) for high-quality
 * SVG rasterisation.
 *
 * Usage:
 *   node scripts/generate-icon.js [options]
 *
 * Options:
 *   --source=<path>    SVG source file (default: resources/icon.svg)
 *   --out=<dir>        Output directory (default: resources/icons)
 *   --sizes=<list>     Comma-separated sizes (default: 16,32,48,64,128,256,512,1024)
 *   --flatten          Flatten transparent PNG onto a background colour (#1a1a2e)
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');

// ── CLI argument parsing ──────────────────────────────────────────────────
function parseArgs() {
  const args = {
    source: path.join(__dirname, '..', 'resources', 'icon.svg'),
    out: path.join(__dirname, '..', 'resources', 'icons'),
    sizes: [16, 32, 48, 64, 128, 256, 512, 1024],
    flatten: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    if (arg.startsWith('--source=')) args.source = arg.slice('--source='.length);
    if (arg.startsWith('--out=')) args.out = arg.slice('--out='.length);
    if (arg.startsWith('--sizes=')) {
      args.sizes = arg
        .slice('--sizes='.length)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);
    }
    if (arg === '--flatten') args.flatten = true;
  }

  // Normalise paths
  args.source = path.resolve(args.source);
  args.out = path.resolve(args.out);

  return args;
}

function printHelp() {
  console.log(`
OpenJuliet Icon Generator
Usage: node scripts/generate-icon.js [options]

Options:
  --source=<path>    SVG source file (default: resources/icon.svg)
  --out=<dir>        Output directory (default: resources/icons)
  --sizes=<list>     Comma-separated sizes (default: 16,32,48,64,128,256,512,1024)
  --flatten          Flatten onto the app background colour
  --help             Show this help message

Examples:
  node scripts/generate-icon.js
  node scripts/generate-icon.js --sizes=128,256,512
  node scripts/generate-icon.js --flatten --out=build/icons
`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  // Validate source
  if (!fs.existsSync(args.source)) {
    console.error(`✘ SVG source not found: ${args.source}`);
    console.error('  Ensure the file exists at resources/icon.svg or pass --source=<path>');
    process.exit(1);
  }

  // Load sharp (with helpful error if missing)
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('✘ Sharp library is required for icon generation.');
    console.error('  Install it with: npm install --save-dev sharp');
    console.error('  Or if already installed: npm rebuild sharp');
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(args.out, { recursive: true });

  const sizes = args.sizes.sort((a, b) => a - b);
  let successCount = 0;

  console.log(`\n  Source: ${path.relative(process.cwd(), args.source)}`);
  console.log(`  Output: ${path.relative(process.cwd(), args.out)}`);
  console.log(`  Sizes:  ${sizes.join(', ')}`);
  console.log(`  Flatten: ${args.flatten ? 'yes' : 'no'}\n`);

  for (const size of sizes) {
    const outputFile = path.join(args.out, `icon-${size}x${size}.png`);
    const label = `${size}×${size}`;

    try {
      let pipeline = sharp(args.source).resize(size, size);

      if (args.flatten) {
        // Flatten onto the app's background colour for opaque icons
        pipeline = pipeline.flatten({ background: '#1a1a2e' });
      }

      await pipeline.png().toFile(outputFile);
      const stat = fs.statSync(outputFile);
      const fileSizeKB = (stat.size / 1024).toFixed(1);
      console.log(`  ✔ ${label.padEnd(8)} → ${path.relative(process.cwd(), outputFile)}  (${fileSizeKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ✘ ${label.padEnd(8)} Failed: ${err.message}`);
    }
  }

  const total = sizes.length;
  console.log(`\n  Done: ${successCount}/${total} icons generated in ${path.relative(process.cwd(), args.out)}/\n`);

  if (successCount < total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
