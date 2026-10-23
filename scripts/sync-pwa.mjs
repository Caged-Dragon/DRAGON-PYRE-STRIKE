// Writes each app's PWA files: public/manifest.webmanifest, public/sw.js, <head> tags in index.html,
// and the Vercel headers that make the service worker update correctly.
// Icons live in <app>/public/icons (see scripts/pwa/make_icons.py).
//   node scripts/sync-pwa.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// folder -> install identity
export const PWA_APPS = {
  'Dragon-pyre-strike':         { slug: 'hub', name: 'DracoPyre Strike', short: 'DracoPyre', desc: 'One Realm. Every Game. The hub and store for the Dragon Realm games.', bg: '#0a080a', theme: '#0a080a' },
  'dragon-strike-shooter-site': { slug: 'dragon-strike', name: 'Dragon Strike', short: 'Dragon Strike', desc: 'Fire the skies in a dragon shoot-’em-up.', bg: '#1a0a06', theme: '#7f1d1d' },
  'ember-wyrm-site':            { slug: 'ember-wyrm', name: 'Ember Wyrm', short: 'Ember Wyrm', desc: 'Ten lairs, one hungry wyrm — the dragon snake game.', bg: '#04100a', theme: '#04100a' },
  'drakebreaker-site':          { slug: 'drakebreaker', name: 'Drakebreaker', short: 'Drakebreaker', desc: 'Fifty levels of dragon brick-breaking.', bg: '#07040a', theme: '#07040a' },
  'dragon-flight-site':         { slug: 'dragon-flight', name: 'Dragon Flight', short: 'Dragon Flight', desc: 'Glide the gates, chase the sky.', bg: '#07060b', theme: '#07060b' },
  '2042':                       { slug: 'dragon-2048', name: 'Dragon 2048', short: 'Dragon 2048', desc: 'Merge eggs into the Dragon Lord.', bg: '#1c1008', theme: '#7c2d12' },
  soduko:                       { slug: 'dragon-sudoku', name: 'Dragon Sudoku', short: 'Dragon Sudoku', desc: 'Classic Sudoku, dragon-cave nights.', bg: '#0f172a', theme: '#0f172a' },
  tictactoe:                    { slug: 'dragon-tictactoe', name: 'Dragon Tic-Tac-Toe', short: 'Tic-Tac-Toe', desc: 'Three in a row, claw to claw.', bg: '#1c0a08', theme: '#7c2d12' },
};

const swTemplate = readFileSync(join(root, 'shared/pwa/sw.template.js'), 'utf8');

for (const [app, c] of Object.entries(PWA_APPS)) {
  const pub = join(root, app, 'public');
  mkdirSync(pub, { recursive: true });

  const manifest = {
    id: '/',
    name: c.name,
    short_name: c.short,
    description: c.desc,
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: c.bg,
    theme_color: c.theme,
    lang: 'en',
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  if (c.slug === 'hub') {
    manifest.shortcuts = [
      { name: 'Realm Store', url: '/store?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'All games', url: '/games?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Leaderboards', url: '/leaderboard?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ];
  }
  writeFileSync(join(pub, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(join(pub, 'sw.js'), swTemplate.replaceAll('__SLUG__', c.slug));

  // <head> tags (idempotent)
  const htmlPath = join(root, app, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html.replace(/\s*<!-- pwa:start -->[\s\S]*?<!-- pwa:end -->/, '');
  const hasThemeColor = /<meta\s+name="theme-color"/i.test(html);
  const tags = `
    <!-- pwa:start -->
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />${hasThemeColor ? '' : `\n    <meta name="theme-color" content="${c.theme}" />`}
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="${c.short}" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <!-- pwa:end -->`;
  html = html.replace('</head>', `${tags}\n  </head>`);
  writeFileSync(htmlPath, html);

  // Vercel headers (merged into any existing vercel.json)
  const vPath = join(root, app, 'vercel.json');
  const vercel = existsSync(vPath) ? JSON.parse(readFileSync(vPath, 'utf8')) : {};
  vercel.headers = [
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    { source: '/manifest.webmanifest', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }, { key: 'Cache-Control', value: 'public, max-age=3600' }] },
  ];
  writeFileSync(vPath, JSON.stringify(vercel, null, 2) + '\n');
  console.log('pwa ->', app);
}
