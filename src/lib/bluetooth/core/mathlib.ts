/**
 * Minimal TypeScript port of csTimer's mathlib.js
 * Only includes CubieCube class and essential utilities needed for Bluetooth cube integration
 */

export const SOLVED_FACELET = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

/**
 * Represents a Rubik's Cube state using corner and edge permutation/orientation
 */
export class CubieCube {
	ca: number[]; // corner array: 8 corners, each stores perm (0-7) and ori (0-2)
	ea: number[]; // edge array: 12 edges, each stores perm (0-11) and ori (0-1)
	ct: number[]; // center array: 6 centers

	constructor() {
		this.ca = [0, 1, 2, 3, 4, 5, 6, 7];
		this.ea = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
		this.ct = [0, 1, 2, 3, 4, 5];
	}

	/**
	 * Initialize cube from corner and edge arrays
	 */
	init(ca: number[], ea: number[]): CubieCube {
		this.ca = ca.slice();
		this.ea = ea.slice();
		return this;
	}

	/**
	 * Check if this cube is equal to another
	 */
	isEqual(c?: CubieCube): boolean {
		c = c || CubieCube.SOLVED;
		for (let i = 0; i < 8; i++) {
			if (this.ca[i] !== c.ca[i]) {
				return false;
			}
		}
		for (let i = 0; i < 12; i++) {
			if (this.ea[i] !== c.ea[i]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Set this cube to the inverse of another cube
	 */
	invFrom(cc: CubieCube): CubieCube {
		for (let edge = 0; edge < 12; edge++) {
			this.ea[cc.ea[edge] >> 1] = (edge << 1) | (cc.ea[edge] & 1);
		}
		for (let corn = 0; corn < 8; corn++) {
			this.ca[cc.ca[corn] & 0x7] = corn | ((0x20 >> (cc.ca[corn] >> 3)) & 0x18);
		}
		return this;
	}

	/**
	 * Convert cube to facelet string representation
	 */
	toFaceCube(cFacelet?: number[][], eFacelet?: number[][], ctFacelet?: number[], withOri?: boolean): string {
		const perm = this.toPerm(cFacelet, eFacelet, ctFacelet, withOri);
		const ts = "URFDLB";
		const f: string[] = [];
		for (let i = 0; i < 54; i++) {
			f[i] = ts[~~(perm[i] / 9)];
		}
		return f.join("");
	}

	/**
	 * Convert cube to permutation representation
	 */
	private toPerm(cFacelet?: number[][], eFacelet?: number[][], ctFacelet?: number[], withOri?: boolean): number[] {
		cFacelet = cFacelet || CubieCube.cFacelet;
		eFacelet = eFacelet || CubieCube.eFacelet;
		ctFacelet = ctFacelet || CubieCube.ctFacelet;
		const f: number[] = [];
		for (let i = 0; i < 54; i++) {
			f[i] = i;
		}
		let obj: CubieCube = this;
		if (withOri && (obj as any).ori) {
			obj = new CubieCube();
			const rot = CubieCube.rotCube[CubieCube.rotMulI[0][(this as any).ori]];
			CubieCube.CubeMult(this, rot, obj);
			for (let i = 0; i < 6; i++) {
				f[ctFacelet[i]] = ctFacelet[(rot as any).ct[i]];
			}
		}
		for (let c = 0; c < 8; c++) {
			const j = obj.ca[c] & 0x7; // cornercubie with index j is at
			const ori = obj.ca[c] >> 3; // Orientation of this cubie
			for (let n = 0; n < 3; n++)
				f[cFacelet[c][(n + ori) % 3]] = cFacelet[j][n];
		}
		for (let e = 0; e < 12; e++) {
			const j = obj.ea[e] >> 1; // edgecubie with index j is at edgeposition
			const ori = obj.ea[e] & 1; // Orientation of this cubie
			for (let n = 0; n < 2; n++)
				f[eFacelet[e][(n + ori) % 2]] = eFacelet[j][n];
		}
		return f;
	}

	/**
	 * Initialize cube from facelet string
	 */
	fromFacelet(facelet: string, cFacelet?: number[][], eFacelet?: number[][]): number | CubieCube {
		cFacelet = cFacelet || CubieCube.cFacelet;
		eFacelet = eFacelet || CubieCube.eFacelet;
		let count = 0;
		const f: number[] = [];
		const centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
		for (let i = 0; i < 54; ++i) {
			f[i] = centers.indexOf(facelet[i]);
			if (f[i] === -1) {
				return -1;
			}
			count += 1 << (f[i] << 2);
		}
		if (count !== 0x999999) {
			return -1;
		}
		let col1, col2, i, j, ori;
		for (i = 0; i < 8; ++i) {
			for (ori = 0; ori < 3; ++ori)
				if (f[cFacelet[i][ori]] === 0 || f[cFacelet[i][ori]] === 3)
					break;
			col1 = f[cFacelet[i][(ori + 1) % 3]];
			col2 = f[cFacelet[i][(ori + 2) % 3]];
			for (j = 0; j < 8; ++j) {
				if (col1 === ~~(cFacelet[j][1] / 9) && col2 === ~~(cFacelet[j][2] / 9)) {
					this.ca[i] = j | ((ori % 3) << 3);
					break;
				}
			}
		}
		for (i = 0; i < 12; ++i) {
			for (j = 0; j < 12; ++j) {
				if (f[eFacelet[i][0]] === ~~(eFacelet[j][0] / 9) && f[eFacelet[i][1]] === ~~(eFacelet[j][1] / 9)) {
					this.ea[i] = j << 1;
					break;
				}
				if (f[eFacelet[i][0]] === ~~(eFacelet[j][1] / 9) && f[eFacelet[i][1]] === ~~(eFacelet[j][0] / 9)) {
					this.ea[i] = (j << 1) | 1;
					break;
				}
			}
		}
		return this;
	}

	/**
	 * Verify cube state is valid
	 */
	verify(): number {
		let mask = 0;
		let sum = 0;
		const ep: number[] = [];
		for (let e = 0; e < 12; e++) {
			mask |= (1 << 8) << (this.ea[e] >> 1);
			sum ^= this.ea[e] & 1;
			ep.push(this.ea[e] >> 1);
		}
		const cp: number[] = [];
		for (let c = 0; c < 8; c++) {
			mask |= 1 << (this.ca[c] & 7);
			sum += (this.ca[c] >> 3) << 1;
			cp.push(this.ca[c] & 0x7);
		}
		if (mask !== 0xfffff || sum % 6 !== 0 ||
			getNParity(getNPerm(ep, 12), 12) !== getNParity(getNPerm(cp, 8), 8)) {
			return -1;
		}
		return 0;
	}

	/**
	 * Apply a move string to the cube
	 */
	selfMoveStr(moveStr: string, isInv?: boolean): number | undefined {
		const CubeMoveRE = /^\s*([URFDLB]w?|[EMSyxz]|2-2[URFDLB]w)(['2]?)(@\d+)?\s*$/;
		const m = CubeMoveRE.exec(moveStr);
		if (!m) {
			return;
		}
		const face = m[1];
		let pow = "2'".indexOf(m[2] || '-') + 2;
		if (isInv) {
			pow = 4 - pow;
		}
		if (m[3]) {
			(this as any).tstamp = ~~m[3].slice(1);
		}
		(this as any).ori = (this as any).ori || 0;
		const axis = 'URFDLB'.indexOf(face);
		if (axis !== -1) {
			let move = axis * 3 + (pow % 4) - 1;
			move = CubieCube.rotMulM[(this as any).ori][move];
			CubieCube.CubeMult(this, CubieCube.moveCube[move], tmpCubie);
			this.init(tmpCubie.ca, tmpCubie.ea);
			return move;
		}
		return undefined;
	}

	/**
	 * Calculate hash code for this cube state
	 */
	hashCode(): number {
		let ret = 0;
		for (let i = 0; i < 20; i++) {
			ret = 0 | (ret * 31 + (i < 12 ? this.ea[i] : this.ca[i - 12]));
		}
		return ret;
	}

	// Static properties
	static SOLVED = new CubieCube();

	static cFacelet = [
		[8, 9, 20], // URF
		[6, 18, 38], // UFL
		[0, 36, 47], // ULB
		[2, 45, 11], // UBR
		[29, 26, 15], // DFR
		[27, 44, 24], // DLF
		[33, 53, 42], // DBL
		[35, 17, 51]  // DRB
	];

	static eFacelet = [
		[5, 10], // UR
		[7, 19], // UF
		[3, 37], // UL
		[1, 46], // UB
		[32, 16], // DR
		[28, 25], // DF
		[30, 43], // DL
		[34, 52], // DB
		[23, 12], // FR
		[21, 41], // FL
		[50, 39], // BL
		[48, 14]  // BR
	];

	static ctFacelet = [4, 13, 22, 31, 40, 49]; // centers

	static EdgeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
		for (let ed = 0; ed < 12; ed++) {
			prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ (b.ea[ed] & 1);
		}
	}

	static CornMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
		for (let corn = 0; corn < 8; corn++) {
			const ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
			prod.ca[corn] = (a.ca[b.ca[corn] & 7] & 7) | (ori << 3);
		}
	}

	static CentMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
		prod.ct = [];
		for (let cent = 0; cent < 6; cent++) {
			prod.ct[cent] = a.ct[b.ct[cent]];
		}
	}

	static CubeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void {
		CubieCube.CornMult(a, b, prod);
		CubieCube.EdgeMult(a, b, prod);
	}

	// Move cubes (simplified version)
	static moveCube: CubieCube[] = (() => {
		const moveCube: CubieCube[] = [];
		for (let i = 0; i < 18; i++) {
			moveCube[i] = new CubieCube();
		}
		moveCube[0].init([3, 0, 1, 2, 4, 5, 6, 7], [6, 0, 2, 4, 8, 10, 12, 14, 16, 18, 20, 22]);
		moveCube[3].init([20, 1, 2, 8, 15, 5, 6, 19], [16, 2, 4, 6, 22, 10, 12, 14, 8, 18, 20, 0]);
		moveCube[6].init([9, 21, 2, 3, 16, 12, 6, 7], [0, 19, 4, 6, 8, 17, 12, 14, 3, 11, 20, 22]);
		moveCube[9].init([0, 1, 2, 3, 5, 6, 7, 4], [0, 2, 4, 6, 10, 12, 14, 8, 16, 18, 20, 22]);
		moveCube[12].init([0, 10, 22, 3, 4, 17, 13, 7], [0, 2, 20, 6, 8, 10, 18, 14, 16, 4, 12, 22]);
		moveCube[15].init([0, 1, 11, 23, 4, 5, 18, 14], [0, 2, 4, 23, 8, 10, 12, 21, 16, 18, 7, 15]);
		for (let a = 0; a < 18; a += 3) {
			for (let p = 0; p < 2; p++) {
				CubieCube.CubeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
			}
		}
		return moveCube;
	})();

	// Rotation cubes (simplified - only what's needed)
	static rotCube: CubieCube[] = [];
	static rotMulI: number[][] = [];
	static rotMulM: number[][] = [];
}

// Temporary cube for operations
const tmpCubie = new CubieCube();

// Helper functions
function getNPerm(arr: number[], n: number): number {
	let idx = 0;
	const vall = 0x76543210;
	let valh = 0xfedcba98;
	for (let i = 0; i < n - 1; i++) {
		const v = arr[i] << 2;
		idx *= n - i;
		if (v >= 32) {
			idx += (valh >> (v - 32)) & 0xf;
			valh -= 0x11111110 << (v - 32);
		} else {
			idx += (vall >> v) & 0xf;
			valh -= 0x11111111;
		}
	}
	return idx;
}

function getNParity(idx: number, n: number): number {
	let p = 0;
	for (let i = n - 2; i >= 0; --i) {
		p ^= idx % (n - i);
		idx = ~~(idx / (n - i));
	}
	return p & 1;
}

// Initialize rotation tables (minimal version)
(() => {
	const u4 = new CubieCube().init([3, 0, 1, 2, 7, 4, 5, 6], [6, 0, 2, 4, 14, 8, 10, 12, 23, 17, 19, 21]);
	u4.ct = [0, 5, 1, 3, 2, 4];
	const f2 = new CubieCube().init([5, 4, 7, 6, 1, 0, 3, 2], [12, 10, 8, 14, 4, 2, 0, 6, 18, 16, 22, 20]);
	f2.ct = [3, 4, 2, 0, 1, 5];
	const urf = new CubieCube().init([8, 20, 13, 17, 19, 15, 22, 10], [3, 16, 11, 18, 7, 22, 15, 20, 1, 9, 13, 5]);
	urf.ct = [2, 0, 1, 5, 3, 4];

	const c = new CubieCube();
	c.ct = [0, 1, 2, 3, 4, 5];
	const d = new CubieCube();
	const rotCube: CubieCube[] = [];
	for (let i = 0; i < 24; i++) {
		rotCube[i] = new CubieCube().init(c.ca, c.ea);
		rotCube[i].ct = c.ct.slice();
		CubieCube.CubeMult(c, u4, d);
		CubieCube.CentMult(c, u4, d);
		c.init(d.ca, d.ea);
		c.ct = d.ct.slice();
		if (i % 4 === 3) {
			CubieCube.CubeMult(c, f2, d);
			CubieCube.CentMult(c, f2, d);
			c.init(d.ca, d.ea);
			c.ct = d.ct.slice();
		}
		if (i % 8 === 7) {
			CubieCube.CubeMult(c, urf, d);
			CubieCube.CentMult(c, urf, d);
			c.init(d.ca, d.ea);
			c.ct = d.ct.slice();
		}
	}

	const rotHash: number[] = [];
	const rotMult: number[][] = [];
	const rotMulI: number[][] = [];
	const rotMulM: number[][] = [];
	for (let i = 0; i < 24; i++) {
		rotHash[i] = rotCube[i].hashCode();
		rotMult[i] = [];
		rotMulI[i] = [];
		rotMulM[i] = [];
	}
	const movHash: number[] = [];
	for (let i = 0; i < 18; i++) {
		movHash[i] = CubieCube.moveCube[i].hashCode();
	}
	for (let i = 0; i < 24; i++) {
		for (let j = 0; j < 24; j++) {
			CubieCube.CubeMult(rotCube[i], rotCube[j], c);
			const k = rotHash.indexOf(c.hashCode());
			rotMult[i][j] = k;
			rotMulI[k][j] = i;
		}
	}
	for (let i = 0; i < 24; i++) {
		for (let j = 0; j < 18; j++) {
			CubieCube.CubeMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
			CubieCube.CubeMult(c, rotCube[i], d);
			const k = movHash.indexOf(d.hashCode());
			rotMulM[i][j] = k;
		}
	}

	CubieCube.rotCube = rotCube;
	CubieCube.rotMulI = rotMulI;
	CubieCube.rotMulM = rotMulM;
})();

/**
 * Create an array with computed values
 */
export function valuedArray<T>(length: number, valueOrFn: T | ((index: number) => T)): T[] {
	const arr: T[] = [];
	const isFn = typeof valueOrFn === 'function';
	for (let i = 0; i < length; i++) {
		arr[i] = isFn ? (valueOrFn as (index: number) => T)(i) : (valueOrFn as T);
	}
	return arr;
}
