export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** spawned on the last move */
  isNew?: boolean;
  /** created by a merge (evolution) on the last move */
  merged?: boolean;
  /** consumed tile sliding into its merge target – removed on the next move */
  ghost?: boolean;
};

export const SIZE = 4;

let nextId = 1;
const uid = () => nextId++;

const live = (tiles: Tile[]) => tiles.filter((t) => !t.ghost);

export function emptyCells(tiles: Tile[], size = SIZE) {
  const occupied = new Set(live(tiles).map((t) => t.row * size + t.col));
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (!occupied.has(r * size + c)) cells.push({ row: r, col: c });
  return cells;
}

export function addRandomTile(tiles: Tile[], size = SIZE): Tile[] {
  const cells = emptyCells(tiles, size);
  if (!cells.length) return tiles;
  const { row, col } = cells[Math.floor(Math.random() * cells.length)];
  return [...tiles, { id: uid(), row, col, value: Math.random() < 0.9 ? 2 : 4, isNew: true }];
}

export function initGame(size = SIZE): Tile[] {
  return addRandomTile(addRandomTile([], size), size);
}

/** Rebuild tiles from a saved game, validating everything. */
export function hydrate(raw: unknown, size = SIZE): Tile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: Tile[] = [];
  for (const item of raw) {
    const { value, row, col } = (item ?? {}) as Record<string, unknown>;
    if (typeof value !== "number" || typeof row !== "number" || typeof col !== "number") continue;
    if (![value, row, col].every(Number.isInteger)) continue;
    if (row < 0 || row >= size || col < 0 || col >= size) continue;
    if (value < 2 || (value & (value - 1)) !== 0) continue;
    const key = row * size + col;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: uid(), value, row, col });
  }
  return out;
}

export type Dir = "up" | "down" | "left" | "right";

export function move(tiles: Tile[], dir: Dir, size = SIZE): { tiles: Tile[]; score: number; moved: boolean; merges: number } {
  const grid: (Tile | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (const t of live(tiles)) grid[t.row][t.col] = { id: t.id, value: t.value, row: t.row, col: t.col };

  const vertical = dir === "up" || dir === "down";
  const reverse = dir === "down" || dir === "right";
  let score = 0;
  let merges = 0;
  let moved = false;
  const result: Tile[] = [];

  for (let line = 0; line < size; line++) {
    const cells: Tile[] = [];
    for (let i = 0; i < size; i++) {
      const t = vertical ? grid[i][line] : grid[line][i];
      if (t) cells.push(t);
    }
    if (reverse) cells.reverse();

    let pos = 0;
    for (let i = 0; i < cells.length; i++, pos++) {
      const idx = reverse ? size - 1 - pos : pos;
      const row = vertical ? idx : line;
      const col = vertical ? line : idx;
      const cur = cells[i];
      const nxt = cells[i + 1];

      if (nxt && nxt.value === cur.value) {
        const value = cur.value * 2;
        // both parents slide into place, then the evolved creature appears
        result.push(
          { ...cur, row, col, ghost: true },
          { ...nxt, row, col, ghost: true },
          { id: uid(), value, row, col, merged: true }
        );
        score += value;
        merges++;
        moved = true;
        i++;
      } else {
        if (cur.row !== row || cur.col !== col) moved = true;
        result.push({ ...cur, row, col });
      }
    }
  }

  return { tiles: result, score, moved, merges };
}

export function canMove(tiles: Tile[], size = SIZE): boolean {
  const lv = live(tiles);
  if (lv.length < size * size) return true;
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  lv.forEach((t) => (grid[t.row][t.col] = t.value));
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < size && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

export const maxTile = (tiles: Tile[]) => live(tiles).reduce((m, t) => Math.max(m, t.value), 0);
