// Pairs of moves that mirror into each other.
// Kept "as const" for strong typing.
const MOVE_PAIRS = [
    ["R", "L'"],
    ["R2", "L2'"],
    ["L", "R'"],
    ["L2", "R2'"],
    ["F", "F'"],
    ["F2", "F2'"],
    ["B", "B'"],
    ["B2", "B2'"],
    ["r", "l'"],
    ["r2", "l2'"],
    ["l", "r'"],
    ["l2", "r2'"],
    ["f", "f'"],
    ["f2", "f2'"],
    ["b", "b'"],
    ["b2", "b2'"],
    ["U", "U'"],
    ["U2", "U2'"],
    ["D", "D'"],
    ["D2", "D2'"],
    ["u", "u'"],
    ["u2", "u2'"],
    ["d", "d'"],
    ["d2", "d2'"],
    ["y", "y'"],
    ["S", "S'"],
    ["S2", "S2'"],
] as const;

type MirrorMap = Readonly<Record<string, string>>;

// Build a bidirectional lookup once.
const MIRROR_MAP: MirrorMap = MOVE_PAIRS.reduce((acc, [a, b]) => {
    acc[a] = b;
    acc[b] = a;
    return acc;
}, {} as Record<string, string>);

/**
 * Mirrors a cube algorithm string by swapping each move with its mirror.
 * - Preserves original whitespace and parentheses exactly.
 * - O(1) per token via a precomputed map (no nested loops).
 *
 * Examples:
 *  mirrorAlg("( R U R' )") -> "( L' U' L )"   // given your pairs
 */
export function mirrorAlg(alg: string): string {
    if (!alg) return alg;

    // Split but KEEP delimiters, so spacing/() are preserved.
    // Groups: whitespace OR "(" OR ")".
    const tokens = alg.split(/(\s+|\(|\))/);

    const mirrored = tokens.map((t) => {
        // Keep whitespace and parentheses as-is
        if (t === "(" || t === ")" || /^\s+$/.test(t)) return t;
        // Replace token if a mirrored counterpart exists
        return MIRROR_MAP[t] ?? t;
    });

    return mirrored.join("");
}
