// Loose fuzzy matching (PLAN.md D15). Every query token must match one of
// the entry's fields; how well it matches sets the score. Deliberately
// simple: prefix beats word-start beats substring beats subsequence.

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return needle.length === 0;
}

/** 0 when a token matches nothing. Higher is better. */
export function tokenScore(token: string, field: string): number {
  if (!token) return 0;
  if (field === token) return 5;
  if (field.startsWith(token)) return 4;
  if (field.includes(` ${token}`)) return 3;
  if (field.includes(token)) return 2;
  if (token.length >= 3 && isSubsequence(token, field)) return 1;
  return 0;
}

export function score(query: string, fields: readonly string[]): number {
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  const norm = fields.map(normalize);
  let total = 0;
  for (const [i, token] of tokens.entries()) {
    let best = 0;
    for (const [j, f] of norm.entries()) {
      // The first field is the title; matches there count a little more.
      const s = tokenScore(token, f) * (j === 0 ? 1.5 : 1);
      if (s > best) best = s;
    }
    if (best === 0) return 0;
    // Earlier tokens matter more than later ones.
    total += best / (1 + i * 0.1);
  }
  return total;
}

/** Items that match, best first, ties broken by original order. */
export function search<T>(
  query: string,
  items: readonly T[],
  fieldsOf: (item: T) => readonly string[],
): T[] {
  const scored = items
    .map((item, index) => ({ item, index, s: score(query, fieldsOf(item)) }))
    .filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s || a.index - b.index);
  return scored.map((x) => x.item);
}
