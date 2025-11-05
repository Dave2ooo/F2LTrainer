import { describe, it, expect } from 'vitest';
import { casesStatic } from './casesStatic';
import type { CaseId, GroupId } from './types/group';

describe('Algorithm Selection Validation', () => {
	it('should have valid algorithm pools for all cases', () => {
		const groupIds: GroupId[] = ['basic', 'basicBack', 'advanced', 'expert'];

		for (const groupId of groupIds) {
			const cases = casesStatic[groupId];

			for (const [caseIdStr, caseData] of Object.entries(cases)) {
				const caseId = Number(caseIdStr) as CaseId;
				const algPool = caseData.algPool;

				// Every case should have at least one algorithm
				expect(algPool.length).toBeGreaterThan(0);

				// All algorithms should be non-empty strings
				for (const alg of algPool) {
					expect(typeof alg).toBe('string');
					expect(alg.length).toBeGreaterThan(0);
				}
			}
		}
	});

	it('case 39 in basic group should have 4 algorithms', () => {
		const basicCase39 = casesStatic.basic[39];
		expect(basicCase39).toBeDefined();
		expect(basicCase39.algPool.length).toBe(4);

		// Valid indices should be 0, 1, 2, 3
		// Index 4 would be out of bounds
		expect(basicCase39.algPool[0]).toBeDefined();
		expect(basicCase39.algPool[1]).toBeDefined();
		expect(basicCase39.algPool[2]).toBeDefined();
		expect(basicCase39.algPool[3]).toBeDefined();
		expect(basicCase39.algPool[4]).toBeUndefined();
	});
});
