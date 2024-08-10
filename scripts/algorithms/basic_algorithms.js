const basicAlgorithms = {
  1: ["U (R U' R')", "R' F R F'", "U2 (R U2 R')", "y' U f R' f'"],
  2: [
    "y U' (L' U L)",
    "y' U' (R' U R)",
    "F R' F' R",
    "U' (F' U F)",
    "d' L' U L",
    "r U R' U' M",
    "F l' U' l",
    "y U' (f' L f)",
  ],
  3: ["y (L' U' L)", "y2 f' L' f", "y' (R' U' R)", "F' U' F"],
  4: ["(R U R')", "y F U F'", "y' f R f'"],
  5: [
    "(U' R U R') U2 (R U' R')",
    "(U' R U R') U (R' F R F')",
    "F2 (L' U' L U) F2",
    "L U' R U L' R' U2 R U' R'",
    "U' (R U R') U' R U2 R'",
  ],
  6: [
    "U' (r U' R' U) (R U r')",
    "d (R' U' R) U2' (R' U R)",
    "y' (U R' U' R) U2 (R' U R)",
    "y' (U R' U' R) U' y (F R' F' R)",
    "U2 (R' F R F')2 U2 (R U R')",
    "R2 (B U B' U') R2",
    "y F2 (R U R' U') F2",
  ],
  7: ["U' (R U2' R') U2 (R U' R')", "(U' R U2 R')2", "M' U' M U2 r U' r'", "R U B U2 B' U R'"],
  8: [
    "d (R' U2 R) U2' (R' U R)",
    "(r' U2) (R2 U R2 U r)",
    "(U F' U2 F)2",
    "y' U (R' U2 R) U2 (R' U R)",
    "U (R' F R F')2 (R U' R')",
    "y' R' U' F' U2 F U' R",
  ],
  9: [
    "U' (R U' R') d (R' U' R)",
    "d (R' U' R U') (R' U' R)",
    "y2 U' (L U' L') d (L' U' L)",
    "U r U R' U' R2 r' U' R'",
    "U' R U' R' U2 M R U' R' U M'",
    "F (R U R' U') F' R U' R'",
    "(U F' U' F) U' (F' U' F)",
    "y F2 (U R U' R') F2",
  ],
  10: [
    "U' (R U R' U) (R U R')",
    "U2 (R U' R' U') (R U R')",
    "R d' R U R' U2 F'",
    "U F' U F U' R U R'",
    "d R' U R d' R U R'",
    "y2 B2 (U' R' U R) B2",
  ],
  11: [
    "U' (R U2' R') d (R' U' R)",
    "U' (R U2' R') U (F' U' F)",
    "(y) L' d L' U2 L U2 F",
    "U' R U2 R' U2 M R U' R' U M'",
    "U (F R' F' R)2 U' R U R'",
    "(y') R U2 R2 U' R2 U' R'",
    "U' l F U' R U l' U R'",
  ],
  12: [
    "R U' R' U R U' R' U2 R U' R'",
    "R' U2 R2 U R2 U R",
    "d (R' U2 R) d' (R U R')",
    "R U2 R' U2' R U2' R' U2' R U' R'",
    "y (F U') (R U2 R' U2') F'",
    "(U R U' R') U' (R U R' U') (R U R')",
    "R U R' U (R' F R F') (R U R')",
  ],
  13: [
    "d (R' U R U') (R' U' R)",
    "y' U (R' U R U') (R' U' R)",
    "(U F' U F) U' (F' U' F)",
    "M' U' (R U R') U' (R U2 r')",
    "(R U' R') U (R' F R F') (R U' R')",
    "(R U R') d' (L' U' L U) (L' U' L)",
    "(R U' R' U2) (R U' l U' R' U l')",
  ],
  14: ["U' (R U' R' U) (R U R')", "d' F U' F' d R U R'"],
  15: [
    "R' D' R U' R' D R (U R U' R')",
    "M U (L F' L') U' M'",
    "R B L U' L' B' R'",
    "(F' U F) U2 (R U R')",
    "U (R' F R F') U (R U R')",
    "y' (R' U R U') d' (R U R')",
    "y (L' U L) U2 y' (R U R')",
    "(L R) F U F' U' (L' R')",
    "F' U L' U L U2 F",
    "R U2 B U B' U R'",
    "R U2 R' U R U R' U R U' R'",
    "R U R' U2 R U' R' U R U' R'",
    "R U' R U2' R2' U' R2 U' R2'",
    "U' R2 U2 R U' R' U R' U2 R2",
    "U2 (R U R' U') R U2 R' U R U R'",
    "U' R' U2 R' U R' U' R U2 R",
    "R U' R U2 R2 U' R2 U' R2",
  ],
  16: [
    "U F (U R U' R') F' (R U R')",
    "(R U' R' U) d (R' U' R)",
    "(R U' R') U2 (F' U' F)",
    "(U') (R U2 M' U' R' U) (R U r')",
    "(U) R (F R U R' U' F') R'",
    "(U) M' (U R U' r') (U' R U R')",
    "y' U R U2 R U' R U R' U2 R'",
    "y M U' R' F R U M' y'",
  ],
  17: ["(R U2 R') U' (R U R')", "F' U' F U F' U' F U2 R U' R'", "F' U' F U F' U' F U R' F R F'"],
  18: [
    "y' (R' U2 R) U (R' U' R)",
    "y (L' U2 L) U (L' U' L)",
    "(R U R' U') R U2 R' U y (L' U L)",
    "(R U R' U') (R U R' U') F R' F' R",
    "F' U2 F U F' U' F",
    "(R' F R F') (R U' R' U) (R U' R')",
  ],
  19: ["U (R U2 R') U (R U' R')", "U R U2 R2 (F R F')", "(R U' R' U)2 R U R'", "(R U2 R' U') U' (R U' R' U) (R U R')"],
  20: [
    "d' L' U2 L (U' L' U L)",
    "y' U' (R' U2 R) U' (R' U R)",
    "U' F' U2 F2 (R' F' R)",
    "y2 d' (R' U2 R) U' (R' U R)",
    "U' (R U R' U) (F' L' U2 L F)",
    "U' (R U' R2' F R F') (R U' R')",
    "y' (R' U R U')2 R' U' R",
    "U' (R U' R' U) (R U') (l U' R' U l')",
    "R U R' U2 R U R' U2 F' U F",
  ],
  21: [
    "(R U' R') U2 (R U R')",
    "U2 (R U R' U) (R U' R')",
    "R B U2 B' R'",
    "U2 R x' U' R U x R2'",
    "U F R U R' U' R' F' R",
  ],
  22: [
    "r U' r' U2 r U r'",
    "y' (R' U R) U2 (R' U' R)",
    "F' L' U2 L F",
    "y' U2 (R' U' R U') (R' U R)",
    "y2 U' d' (R' U' R U') (R' U R)",
    "r U' r' U2 r U r'",
    "U F R U R' U' F' R U R' U2'",
    "d2 y' R' U' R U' R' U R",
  ],
  23: [
    "R U' R' U' (R U R') U2 (R U R')",
    "U2 R2 U2 (R' U' R U') R2",
    "U (F R' F' R) U (R U R')",
    "U (R U' R') U' (R U' R' U R U' R')",
    "(R U R' U') U' (R U R' U') (R U R')",
    "(R U2 R') (F' U F) U' (R U R')",
    "R2 U R' U R U2 R' U' R'",
  ],
  24: [
    "F U (R U' R' F') (R U' R')",
    "(R U R') d (R' U R U') (R' U R)",
    "U F' L' U L F R U R'",
    "y' (R' U' R U) U (R' U' R U) (R' U' R)",
    "y' U2 R2 U2 (R U R' U) R2",
    "U' (R U) (R2' F R F') (R U' R')",
    "U' (R U R' U) (R U') (l U' R' U l')",
    "U2 F2 U2 (F U F' U) F2",
    "d' (F' L F L') U' (L' U' L)",
    "y (L' U' L U) U (L' U' L U) (L' U' L )",
    "y L2 U' L U' L' U2 L U L",
    "(R U R' U) (R U R' U') (F R' F' R)",
    "(R U R' U) (R U R' U') y (L F' L' F)",
    "(R U R' U) (R U R' d') (L F' L' F)",
    "(R U R' U) (R U2 R') y (L' U2 L)",
    "(R U R' U) (R U2 R') F' U2 F",
  ],
  25: [
    "U' (R' F R F') (R U R')",
    "R' U' R' U' R' U R U R",
    "d' (L' U L) d (R U' R')",
    "d' (L' U L) (F' L F L')",
    "y U' (L' U' L) U (F U F')",
    "U' (F' U F) U (R U' R')",
    "U' M' U R U' r' (R U R')",
    "R U2 R' U R U2 R' U2 R U' R'",
    "R U R' U2 R U R' U2 R U' R'",
    "R' F' R U R U' R' F",
    "(U') F' R U R' U' R' F R",
    "(R U' R' U') (R U' R' U) (R U R')",
    "y' (l' U' l U) (l F' l' F)",
    "(U) (R' U' R' U') R2 (U R U R)",
    "(U2) (R' U' R' U' R U R U R)",
    "y U R' u' R U' R' U u R",
    "y' U' R' U R r' U' R U M'",
  ],
  26: [
    "U (R U' R') (F R' F' R)",
    "y' R U R U R U' R' U' R'",
    "(R U R' U')2 (R' F R F')2",
    "U (R U' R') d' (L' U L)",
    "U (R U' R') U' (F' U F)",
    "U R U (r' R U' R' U M')",
    "U R U' M' U R' U' M",
    "y' (U') R U R U R2 U' R' U' R'",
    "y' (U2) R U R U R' U' R' U' R'",
    "r U r' U2 r U r' U2 r U' r'",
    "y (r U r' U') (r' F r F')",
    "y U (L F' L' F) (L' U' L)",
  ],
  27: ["(R U' R' U) (R U' R')", "(R U' R2) (F R F')", "F' U' F U2 (R U' R')"],
  28: [
    "(R U R' U') F R' F' R",
    "(R U R') d (R' U2 R)",
    "y' (R' U R U') (R' U R)",
    "(R U R') U (F' U2 F)",
    "R U2 l U' R' U l'",
    "(R U R') U l2 F' l' U l'",
    "(F' U F2) (R' F' R)",
    "(U2) R' F R F2 L' U2 L F",
    "(R U' R') U' (R' F R F') (R U' R')",
  ],
  29: [
    "(R' F R F') (U R U' R')",
    "(R' F R F')2",
    "y' (R' U' R U) (R' U' R)",
    "U2 (R U' R') y' (R' U' R)",
    "M' U R U' r' U (R U' R')",
  ],
  30: ["(R U R' U') (R U R')", "U2 (F' U F) (R U R')", "U' (R U2 R')U2 (R U R')"],
  31: [
    "U' (R' F R F') (R U' R')",
    "(R U' R') d (R' U R)",
    "(R U' R' U) (F' U F)",
    "U' (R' F R F') (R U' R')",
    "R U' l U' R' U l'",
    "F2 r U r' F R U' R'",
    "R U2 R' U' F R' F' R",
    "R U' R B' R' B R'",
  ],
  32: [
    "(U R U' R')3",
    "(R U R' U')2 (R U R')",
    "(R' F R F')3",
    "U2 R d' R U R' d R'",
    "U R d' R U2 R' d R'",
    "R2 U R2 U R2 U2 R2",
    "U2 R2 U2 R2 U' R2 U' R2",
    "(R U2 R') (F' U2 F) U' (R U R')",
  ],
  33: [
    "U' (R U' R') U2' (R U' R')",
    "y U' L' U' R' U L U' R",
    "(U' R U' R') U2 (R U' R')",
    "y U' (L' U' L) U2 (L' U' L)",
    "U y F U R U R' U' R U' R' F'",
    "(U' F' U' F) U2 (F' U' F)",
    "y' U' R D R' U R D' R'",
    "y U' L' U2 f' L2 f L",
    "d' L' U2 f' L2 f L",
  ],
  34: [
    "U (R U R') U2 (R U R')",
    "d (R' U R) U2 (R' U R)",
    "U (F' U F) U2 (F' U F)",
    "U' (R U2' R') U (R U R')",
    "y (U L' U L) U2 (L' U L)",
    "U y F U2 R U2 R' F'",
    "U R U2 f R2 f' R'",
  ],
  35: ["(U' R U R') d (R' U' R)", "U2 (R U' R') U' (F' U' F)", "U M' U R U' r' R U' R'", "U' l U' R U l' U R'"],
  36: [
    "U (F' U' F) U' (R U R')",
    "d (R' U' R) d' (R U R')",
    "y U2 (L' U L) U (F U F')",
    "U2 (R' F R F') U2 (R U R')",
    "y' U (R' U' R U') y (R U R')",
  ],
  38: [
    "(R U' R') d (R' U2 R) U2' (R' U R)",
    "(R' F R F') (R U' R' U) (R U' R' U2) (R U' R')",
    "(R U R') U2 (R U2 R') d (R' U' R)",
    "(R2 U2) (F R2 F') (U2 R' U R')",
  ],
  39: [
    "(R U R' U') (R U2 R') U' (R U R')",
    "(R U' R') U' (R U R') U2 (R U' R')",
    "y' (R' U' R) U2 (R' U R U') (R' U' R)",
    "y (L' U' L) U2 (L' U L U') (L' U' L)",
    "(R U2 R' U2) (R U2 R' U') R U R'",
    "R U' R' F2 L' U' L U F2",
    "(R2 U2) (R' U' R U') (R' U2 R')",
    "y' R' U2 R' U' R U' R' U2 R2",
  ],
  40: [
    "(R U' R' U) (R U2' R') U (R U' R')",
    "(R U R') U2 (R U' R' U) (R U R')",
    "(R U2) (R U R' U) (R U2 R2')",
    "y' R2 U2 R U R' U R U2 R",
  ],
  41: [
    "(r U' r' U2 r U r') (R U R')",
    "(R U' R') d (R' U' R U') (R' U' R)",
    "R U' R' U' R U' R' d R' U' R",
    "y (L' U' L U) (L' U L) U2 (F U F')",
    "(R U' R) y (U R U' R') y' R2",
    "F2 (L' U' L U) y (L U' L)",
    "R (F U R U' R' F') U' R'",
  ],
  42: [
    "(R U' R') (r U' r' U2 r U r')",
    "(R U' R' U) d (R' U' R U') (R' U R)",
    "(R U' R' U2) y' (R' U' R U' R' U R)",
    "(R U R' U') (R U' R') U2 (F' U' F)",
    "y (L' U L) d' (L U L' U) (L U L')",
    "R2 y (R U R' U') y' (R' U R')",
    "(R U' R') (F' L' U2 L F)",
    "R U (F R U R' U' F') R'",
  ],
};
