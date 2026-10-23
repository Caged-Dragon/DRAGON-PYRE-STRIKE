// Verifies that every site in the Dragon Realm is wired to the others.
//   node scripts/check-ecosystem.mjs          static checks on this repo
//   node scripts/check-ecosystem.mjs --live   also requests every deployed address
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
// folder -> slug it registers with <AuthProvider site="...">
const APPS = {
  'Dragon-pyre-strike': 'hub',
  'dragon-strike-shooter-site': 'dragon-strike',
  'ember-wyrm-site': 'ember-wyrm',
  'drakebreaker-site': 'drakebreaker',
  'dragon-flight-site': 'dragon-flight',
  '2042': 'dragon-2048',
  soduko: 'dragon-sudoku',
  tictactoe: 'dragon-tictactoe',
};

let failures = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { failures++; console.log('  ✗', m); };
const check = (c, pass, fail) => (c ? ok(pass) : bad(fail));

const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(f)) continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const hashDir = (dir) => {
  const h = createHash('sha1');
  for (const f of readdirSync(dir).sort()) h.update(f).update(readFileSync(join(dir, f)));
  return h.digest('hex').slice(0, 10);
};

console.log('\n[1] Shared module (shared/dps) is identical in every app');
const canon = hashDir(join(root, 'shared/dps'));
for (const app of Object.keys(APPS)) {
  const d = join(root, app, 'src/dps');
  check(existsSync(d) && hashDir(d) === canon, `${app}`, `${app}: src/dps is out of date — run: node scripts/sync-dps.mjs`);
}

console.log('\n[2] Each app is connected to the shared account system');
for (const [app, slug] of Object.entries(APPS)) {
  const pkg = JSON.parse(read(`${app}/package.json`));
  check(pkg.dependencies?.['@supabase/supabase-js'], `${app}: supabase-js installed`, `${app}: missing @supabase/supabase-js`);
  const main = read(`${app}/src/main.tsx`);
  check(main.includes(`<AuthProvider site="${slug}">`), `${app}: AuthProvider site="${slug}"`, `${app}: main.tsx must render <AuthProvider site="${slug}">`);
  if (slug !== 'hub') {
    const src = walk(join(root, app, 'src')).filter((f) => /\.(tsx?)$/.test(f) && !f.includes('/dps/'));
    check(src.some((f) => readFileSync(f, 'utf8').includes('<DragonDock')), `${app}: DragonDock (account, theme, feedback, exit)`, `${app}: no <DragonDock> rendered`);
  }
}

console.log('\n[3] Guests store nothing: no direct browser storage outside the shared module');
for (const app of Object.keys(APPS)) {
  const hits = walk(join(root, app, 'src'))
    .filter((f) => /\.(tsx?)$/.test(f) && !f.includes('/dps/'))
    .filter((f) => /\b(localStorage|sessionStorage|indexedDB)\b/.test(readFileSync(f, 'utf8')));
  check(!hits.length, `${app}`, `${app}: uses browser storage directly in ${hits.map((h) => h.replace(root, '')).join(', ')}`);
}

console.log('\n[4] Hub lists every game');
const catalogue = read('Dragon-pyre-strike/src/data/games.ts');
for (const slug of Object.values(APPS).filter((s) => s !== 'hub')) check(catalogue.includes(`siteUrl('${slug}')`), slug, `hub catalogue is missing ${slug}`);

console.log('\n[5] Every app is an installable PWA (manifest, offline worker, icons)');
for (const app of Object.keys(APPS)) {
  const pub = join(root, app, 'public');
  let m = null;
  try { m = JSON.parse(read(`${app}/public/manifest.webmanifest`)); } catch { /* reported below */ }
  check(m && m.name && m.start_url && m.display === 'standalone', `${app}: manifest`, `${app}: public/manifest.webmanifest missing or invalid — run: node scripts/sync-pwa.mjs`);
  check(existsSync(join(pub, 'sw.js')), `${app}: service worker`, `${app}: public/sw.js missing`);
  const icons = ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png'].filter((f) => !existsSync(join(pub, 'icons', f)));
  check(!icons.length, `${app}: icons`, `${app}: missing icons ${icons.join(', ')}`);
  check(read(`${app}/index.html`).includes('rel="manifest"'), `${app}: index.html links the manifest`, `${app}: index.html has no manifest link`);
  const v = existsSync(join(root, app, 'vercel.json')) ? read(`${app}/vercel.json`) : '';
  check(v.includes('/sw.js'), `${app}: vercel.json serves sw.js uncached`, `${app}: vercel.json missing sw.js headers`);
}
check(read('Dragon-pyre-strike/src/App.tsx').includes('/store'), 'hub has the /store page', 'hub is missing the /store route');
const envCanon = read('shared/.env.example');
for (const app of Object.keys(APPS)) check(existsSync(join(root, app, '.env.example')) && read(`${app}/.env.example`) === envCanon, `${app}: .env.example`, `${app}: .env.example out of date — run: node scripts/sync-dps.mjs`);

console.log('\n[6] Repository hygiene');
const sql = walk(root).filter((f) => extname(f) === '.sql');
check(!sql.length, 'no SQL files in the repository', `SQL files found: ${sql.join(', ')}`);

if (process.argv.includes('--live')) {
  console.log('\n[7] Deployed addresses respond');
  const cfg = read('shared/dps/config.ts');
  const urls = [...cfg.matchAll(/pick\('VITE_[A-Z0-9_]+', '([^']+)'\)/g)].map((m) => m[1]);
  for (const u of urls) {
    try {
      const r = await fetch(u, { redirect: 'follow' });
      check(r.ok, `${u} (${r.status})`, `${u} answered ${r.status}`);
    } catch (e) {
      bad(`${u} unreachable (${e.message}) — deploy it or set its VITE_* address`);
    }
  }
}

console.log(failures ? `\n${failures} problem(s) found.\n` : '\nAll checks passed.\n');
process.exit(failures ? 1 : 0);
