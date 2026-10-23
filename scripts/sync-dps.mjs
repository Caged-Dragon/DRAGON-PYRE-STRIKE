// Copies the canonical shared module (shared/dps) into every app's src/dps.
// Each app stays self-contained so it can be deployed from its own folder.
// Edit shared/dps only, then run:  node scripts/sync-dps.mjs
import { cpSync, rmSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APPS = ['Dragon-pyre-strike', 'dragon-strike-shooter-site', 'ember-wyrm-site', 'drakebreaker-site', 'dragon-flight-site', '2042', 'soduko', 'tictactoe'];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'shared', 'dps');
for (const app of APPS) {
  const dest = join(root, app, 'src', 'dps');
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
  copyFileSync(join(root, 'shared', '.env.example'), join(root, app, '.env.example'));
  console.log(`synced ${readdirSync(dest).length} files -> ${app}/src/dps`);
}
copyFileSync(join(root, 'shared', '.env.example'), join(root, '.env.example'));
