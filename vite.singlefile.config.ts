import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

function inlineStudioHtml(): Plugin {
  const root = resolve(process.cwd());
  const article = readFileSync(resolve(root, 'public/decoration/article-picker.js'), 'utf8');
  const activity = readFileSync(resolve(root, 'public/decoration/activity-picker.js'), 'utf8');

  const replaceScripts = (html: string) =>
    html
      .replace('<script src="article-picker.js"></script>', `<script>${article}</script>`)
      .replace('<script src="activity-picker.js"></script>', `<script>${activity}</script>`);

  const h5 = replaceScripts(readFileSync(resolve(root, 'public/decoration/h5.html'), 'utf8'));
  const pc = replaceScripts(readFileSync(resolve(root, 'public/decoration/pc.html'), 'utf8'));
  const payload = JSON.stringify({
    '/decoration/h5.html': h5,
    '/decoration/pc.html': pc,
  });

  return {
    name: 'inline-studio-html',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('studioInline.ts')) return;
      return {
        code: `export const studioHtml = ${payload};\n`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineStudioHtml(), viteSingleFile({ removeViteModuleLoader: true })],
  base: './',
  publicDir: false,
  define: {
    'import.meta.env.VITE_SINGLEFILE': JSON.stringify('1'),
  },
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
