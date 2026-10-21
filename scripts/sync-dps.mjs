// Copies the canonical shared module (shared/dps) into every app's src/dps.
// Each app stays self-contained (so it can be built/deployed from its own folder);
// edit shared/dps only, then run:  node scripts/sync-dps.mjs
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'shared', 'dps');
const apps = ['playx', 'ember-wyrm-site', 'drakebreaker-site', 'dragon-flight-site', 'dragon-strike-shooter-site'];

for (const app of apps) {
  const dest = join(root, app, 'src', 'dps');
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  console.log(`synced ${readdirSync(dest).length} files -> ${app}/src/dps`);
}
