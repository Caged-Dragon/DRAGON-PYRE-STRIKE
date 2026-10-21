// Verifies that every site in the Dragon Realm is wired to the others and to the central database.
//   node scripts/check-ecosystem.mjs          static checks on this repo
//   node scripts/check-ecosystem.mjs --live   also requests every deployed URL
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const APPS = {
  hub: 'playx',
  'ember-wyrm': 'ember-wyrm-site',
  drakebreaker: 'drakebreaker-site',
  'dragon-flight': 'dragon-flight-site',
  'dragon-strike': 'dragon-strike-shooter-site',
};

let failures = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { failures++; console.log('  ✗', m); };
const check = (cond, pass, fail) => (cond ? ok(pass) : bad(fail));

/* ---- 1. shared module identical everywhere ---- */
console.log('\n[1] Shared module (shared/dps) is identical in every app');
const hashDir = (dir) => {
  const h = createHash('sha1');
  for (const f of readdirSync(dir).sort()) h.update(f).update(readFileSync(join(dir, f)));
  return h.digest('hex').slice(0, 10);
};
const canon = hashDir(join(root, 'shared/dps'));
for (const [name, dir] of Object.entries(APPS)) {
  const d = join(root, dir, 'src/dps');
  check(existsSync(d) && hashDir(d) === canon, `${name}: in sync`, `${name}: src/dps differs from shared/dps — run node scripts/sync-dps.mjs`);
}

/* ---- 2. one central database ---- */
console.log('\n[2] One central Supabase project');
const cfg = read('shared/dps/config.ts');
const dbUrl = cfg.match(/SUPABASE_URL = '([^']+)'/)?.[1];
check(!!dbUrl, `central database: ${dbUrl}`, 'SUPABASE_URL missing in shared/dps/config.ts');
for (const [name, dir] of Object.entries(APPS)) {
  const stray = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      if (f === 'node_modules' || f === 'dist' || f === 'dps') continue;
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f) && /supabase\.co|VITE_SUPABASE|createClient\(/.test(readFileSync(p, 'utf8'))) stray.push(p.replace(root + '/', ''));
    }
  };
  walk(join(root, dir, 'src'));
  check(stray.length === 0, `${name}: no private database client or keys`, `${name}: own Supabase config found in ${stray.join(', ')}`);
  check(!existsSync(join(root, dir, '.env')) && !existsSync(join(root, dir, '.env.example')) && !existsSync(join(root, dir, 'supabase')), `${name}: no env/database files`, `${name}: has env or supabase files`);
}

/* ---- 3. site registry matches the hub catalogue ---- */
console.log('\n[3] Site URLs agree (shared config ⇄ hub catalogue)');
const sites = [...cfg.matchAll(/slug: '([^']+)', title: '[^']*', tagline: '[^']*', url: '([^']+)'/g)].map((m) => ({ slug: m[1], url: m[2] }));
const hubUrl = cfg.match(/HUB_URL = '([^']+)'/)?.[1];
const games = read('playx/src/data/games.ts');
for (const s of sites) {
  const block = games.split(`slug: '${s.slug}'`)[1] ?? '';
  const hubExt = block.match(/externalUrl: '([^']+)'/)?.[1];
  check(hubExt === s.url, `${s.slug}: hub opens ${s.url}`, `${s.slug}: hub externalUrl (${hubExt}) ≠ config (${s.url})`);
}
check(sites.length === 4, `4 standalone game sites registered + hub (${hubUrl})`, `expected 4 standalone sites, found ${sites.length}`);

/* ---- 4. every game links back to the hub, signs in centrally and reports scores ---- */
console.log('\n[4] Each game: central login, exit-to-hub, score reporting');
const all = (dir) => {
  const out = [];
  const walk = (d) => { for (const f of readdirSync(d)) { if (f === 'node_modules' || f === 'dist') continue; const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && out.push(readFileSync(p, 'utf8')); } };
  walk(join(root, dir, 'src'));
  return out.join('\n');
};
for (const [name, dir] of Object.entries(APPS)) {
  const code = all(dir);
  check(/<AuthProvider>/.test(read(`${dir}/src/main.tsx`)), `${name}: wrapped in the central AuthProvider`, `${name}: main.tsx is missing <AuthProvider>`);
  if (name === 'hub') { check(/reportRun\(/.test(code), 'hub: reports scores', 'hub: no reportRun'); continue; }
  check(/exitToHub\(/.test(code), `${name}: has an Exit-to-hub control`, `${name}: no exitToHub() call`);
  check(/<DragonDock/.test(code), `${name}: shows the Realm map dock`, `${name}: no <DragonDock>`);
  check(/reportRun\(/.test(code), `${name}: reports scores to the shared leaderboard`, `${name}: no reportRun() call`);
}

/* ---- 5. live (optional) ---- */
if (process.argv.includes('--live')) {
  console.log('\n[5] Deployed sites respond');
  for (const url of [hubUrl, ...sites.map((s) => s.url)]) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      check(r.ok, `${r.status} ${url}`, `${r.status} ${url}`);
    } catch (e) {
      bad(`unreachable ${url} (${e.message})`);
    }
  }
}

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll connectivity checks passed.');
process.exit(failures ? 1 : 0);
