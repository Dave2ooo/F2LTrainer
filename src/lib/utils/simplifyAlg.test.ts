import { describe, it, expect } from 'vitest';
import { simplifyAlg } from './simplifyAlg';

describe('simplifyAlg', () => {
	it('simplifies basic cancellations', () => {
		expect(simplifyAlg("U U'")).toBe('');
		expect(simplifyAlg('U U')).toBe('U2');
		expect(simplifyAlg('U U U')).toBe("U'");
		expect(simplifyAlg('U2 U2')).toBe('');
	});

	it("merges moves separated by same-axis moves (U D U')", () => {
		// U (1) + U' (3) = 4 = 0 turns. D' remains.
		expect(simplifyAlg("U D' U'")).toBe("D'");
	});

	it("merges moves separated by same-axis moves (U' u' U)", () => {
		// U' (3) + U (1) = 0. u' remains.
		expect(simplifyAlg("U' u' U")).toBe("u'");
	});

	it('respects different axes boundaries', () => {
		// U and U' are separated by R (different axis)
		expect(simplifyAlg("U R U'")).toBe("U R U'");
	});

	it('handles multiple groups', () => {
		expect(simplifyAlg("U D' U' R L R' F B F'")).toBe("D' L B");
	});

	it('handles wide moves on same axis', () => {
		// u and U share UD axis
		// u U u' -> u cancels u' -> U
		expect(simplifyAlg("u U u'")).toBe('U');
	});

	it('handles rotations on same axis', () => {
		// y is UD axis.
		// y U y' -> U (if we just sum them? Wait. y rotates the center.
		// But physically U is top face.
		// Our simplify logic purely merges based on symbol.
		// y U y' -> U.
		// This is chemically correct for the ALGORITHM string:
		// "y U y'" means rotate Y, turn U, rotate Y'.
		// This is NOT equivalent to U if we execute it.
		// Wait.
		// y U y' -> Rotate cube, turn Top, Rotate back.
		// This effectively turns the face that ends up at Top.
		// If I do y (Top is still Top), U (turn top), y' (Top is still Top).
		// The net result on the cube state is a Top turn.
		// So y U y' == U.
		// Our logic: [y, U, y'] -> Sort -> [y, y', U]. y/y' cancel. U remains.
		// Returns "U". Correct.
		expect(simplifyAlg("y U y'")).toBe('U');
	});

	it('handles complex example', () => {
		// U D R L F B U' D'
		// Groups: [U, D], [R, L], [F, B], [U', D']
		// Wait, [U, D] and [U', D'] are separated.
		// So [U, D] -> U D.
		// [R, L] -> R L.
		// [F, B] -> F B.
		// [U', D'] -> U' D'.
		// Result: U D R L F B U' D'.
		// Moves cannot jump over R/L/F/B.
		expect(simplifyAlg("U D R L F B U' D'")).toBe("U D R L F B U' D'");
	});

	it('simplifies 4 turns to 0', () => {
		expect(simplifyAlg('U U U U')).toBe('');
		expect(simplifyAlg('U2 U2')).toBe('');
		expect(simplifyAlg("U' U' U' U'")).toBe('');
	});

	it('ignores parentheses/grouping (treats as break)', () => {
		// Should not merge U across (R)
		expect(simplifyAlg("U (R) U'")).toBe("U (R) U'");
	});
});
