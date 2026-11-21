/**
 * Demo-mode fuzzy matcher used ONLY when no backend is connected.
 * Live mode uses Aiven OpenSearch (multi_match with fuzziness AUTO) through the backend.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Same edit-distance budget as OpenSearch's fuzziness: AUTO. */
function allowedEdits(term: string): number {
  if (term.length <= 2) return 0;
  if (term.length <= 5) return 1;
  return 2;
}

function termScore(term: string, word: string): number {
  if (word === term) return 3;
  if (word.startsWith(term)) return 2.5;
  if (word.includes(term) && term.length >= 3) return 1.5;
  // compare against a same-length prefix too, so "headfone" matches "headphones"
  const d = Math.min(levenshtein(term, word), levenshtein(term, word.slice(0, term.length + 1)));
  return d <= allowedEdits(term) ? 2 - d * 0.5 : 0;
}

/** Returns a relevance score (0 = no match). Name matches weigh 3x description matches. */
export function fuzzyScore(query: string, name: string, description: string): number {
  const terms = tokenize(query);
  if (!terms.length) return 1;
  const nameWords = tokenize(name);
  const descWords = tokenize(description);
  let total = 0;
  for (const term of terms) {
    const n = Math.max(0, ...nameWords.map((w) => termScore(term, w)));
    const d = Math.max(0, ...descWords.map((w) => termScore(term, w)));
    const best = Math.max(n * 3, d);
    if (best === 0) return 0;
    total += best;
  }
  return total;
}
