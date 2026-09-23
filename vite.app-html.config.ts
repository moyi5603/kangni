import { readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const APPS = ['incentive', 'medal', 'forum', 'mailbox', 'care'] as const;
type AppKey = (typeof APPS)[number];

const app = process.env.KN_APP as AppKey | undefined;
if (!app || !APPS.includes(app)) {
  throw new Error('KN_APP must be incentive, medal, forum, mailbox or care');
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function inlineForumPublicAssets(): Plugin {
  const dir = resolve(process.cwd(), 'public/forum');
  const replacements = readdirSync(dir).flatMap((name) => {
    const mime = MIME[extname(name).toLowerCase()];
    if (!mime) return [];
    const data = readFileSync(resolve(dir, name)).toString('base64');
    const uri = `data:${mime};base64,${data}`;
    const publicPath = `/forum/${name}`;
    return [
      [`'${publicPath}'`, `'${uri}'`],
      [`"${publicPath}"`, `"${uri}"`],
    ] as const;
  });

  return {
    name: 'inline-forum-public-assets',
    transform(code, id) {
      if (!id.includes('/features/forum/')) return;
      let next = code;
      for (const [from, to] of replacements) {
        if (next.includes(from)) next = next.split(from).join(to);
      }
      if (next === code) return;
      return { code: next, map: null };
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    ...(app === 'forum' || app === 'mailbox' ? [inlineForumPublicAssets()] : []),
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  base: './',
  publicDir: false,
  define: {
    'import.meta.env.VITE_SINGLEFILE': JSON.stringify('1'),
  },
  build: {
    outDir: `dist-app-${app}`,
    emptyOutDir: true,
    minify: false,
    cssMinify: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(process.cwd(), `index.${app}.html`),
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
