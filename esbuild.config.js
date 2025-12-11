/**
 * esbuild configuration for bundling
 * Bundles both extension.ts and webview editor into single files
 */

const esbuild = require('esbuild');

const isProduction = process.argv.includes('--minify');
const isWatch = process.argv.includes('--watch');

const baseConfig = {
  bundle: true,
  sourcemap: !isProduction,
  minify: isProduction,
  external: ['vscode'],
};

async function build() {
  // Build extension
  const extensionContext = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/extension.ts'],
    outfile: 'out/extension.js',
    format: 'cjs',
    platform: 'node',
  });

  // Build webview editor
  const webviewContext = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/webview/editor.ts'],
    outfile: 'out/editor.js',
    format: 'iife',
    platform: 'browser',
    globalName: 'editor',
  });

  if (isWatch) {
    await extensionContext.watch();
    await webviewContext.watch();
    console.log('Watching for changes...');
  } else {
    await extensionContext.rebuild();
    await webviewContext.rebuild();
    await extensionContext.dispose();
    await webviewContext.dispose();
    console.log('Build complete');
  }
}

build().catch(() => process.exit(1));
