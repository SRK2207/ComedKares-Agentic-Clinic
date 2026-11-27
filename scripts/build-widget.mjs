import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const widgetSrc = path.join(rootDir, 'src', 'widget', 'index.ts');
const widgetCss = path.join(rootDir, 'src', 'widget', 'styles.css');
const outputDir = path.join(rootDir, 'public');
const outputFile = path.join(outputDir, 'widget.js');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let cssContent = '';
if (fs.existsSync(widgetCss)) {
  cssContent = fs.readFileSync(widgetCss, 'utf-8');
}

const isWatch = process.argv.includes('--watch');

async function build() {
  try {
    const result = await esbuild.build({
      entryPoints: [widgetSrc],
      bundle: true,
      minify: true,
      sourcemap: false,
      target: ['es2020'],
      format: 'iife',
      outfile: outputFile,
      define: {
        'process.env.NODE_ENV': '"production"',
        '__INLINE_WIDGET_CSS__': JSON.stringify(cssContent),
      },
      logLevel: 'info',
    });
    console.log(`[build-widget] Successfully bundled widget to ${outputFile}`);
  } catch (error) {
    console.error('[build-widget] Bundle failed:', error);
    process.exit(1);
  }
}

build();
