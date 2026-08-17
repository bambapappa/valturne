import { describe, expect, it } from 'vitest';
import { applyChoice, createInitialState, selectDilemmaPromise } from '../src/engine';
import { DEFAULT_PARTIES, MOCK_PROMISES, REGIONS } from '../src/mockData';
import type { RegionId, StrategicChoice } from '../src/types';

describe('Neutrality Contract & Symmetrical Representation', () => {
  it('guarantees uniform and balanced party distribution across 10 000 dilemma selections', () => {
    const partyCounts: Record<string, number> = {};
    for (const p of DEFAULT_PARTIES) {
      partyCounts[p.code] = 0;
    }

    const regions = Object.keys(REGIONS) as RegionId[];
    let history: string[] = [];
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const regionId = regions[i % regions.length];
      const promise = selectDilemmaPromise(MOCK_PROMISES, regionId, new Set(), history);
      const party = promise.parties[0];
      partyCounts[party] = (partyCounts[party] || 0) + 1;
      history.push(party);
      if (history.length > 50) history.shift();
    }

    const expectedPerParty = iterations / DEFAULT_PARTIES.length; // 1250 per party
    const allowedDeviation = expectedPerParty * 0.15; // Max 15% tolerance

    for (const p of DEFAULT_PARTIES) {
      const count = partyCounts[p.code];
      expect(count).toBeGreaterThan(expectedPerParty - allowedDeviation);
      expect(count).toBeLessThan(expectedPerParty + allowedDeviation);
    }
  });

  it('demonstrates strategic balance across different pure gameplay styles', () => {
    const playTour = (strategy: StrategicChoice) => {
      let state = createInitialState();
      state.phase = 'MAP';
      const regions = Object.keys(REGIONS) as RegionId[];
      let regIdx = 0;

      while (state.day > 0 && state.budget > 0) {
        const regionId = regions[regIdx % regions.length];
        const promise = selectDilemmaPromise(MOCK_PROMISES, regionId);
        state.currentDilemma = { promise, regionId };
        state = applyChoice(state, strategy, 0.5);
        regIdx++;
      }
      return state;
    };

    const promiseGame = playTour('PROMISE');
    const nuanceGame = playTour('NUANCE');
    const factCheckGame = playTour('FACT_CHECK');

    // Strategic tradeoff verifications:
    // 1. PROMISE strategy yields higher short-term local support but consumes budget and accumulates promise volume
    expect(promiseGame.promisesMade.length).toBeGreaterThan(0);

    // 2. NUANCE strategy maximizes trust but consumes time (days) and budget
    expect(nuanceGame.trust).toBeGreaterThanOrEqual(promiseGame.trust);

    // 3. FACT_CHECK strategy maintains high cash/donations and high trust
    expect(factCheckGame.budget).toBeGreaterThan(promiseGame.budget);
    expect(factCheckGame.trust).toBeGreaterThan(50);
  });

  it('ensures party affiliation is strictly cosmetic in choice mechanics', () => {
    // Two identical promises differing only by party affiliation must yield identical mechanical deltas
    const promiseA = { ...MOCK_PROMISES[0], parties: ['s' as const] };
    const promiseB = { ...MOCK_PROMISES[0], parties: ['m' as const] };

    const stateA = createInitialState();
    stateA.currentDilemma = { promise: promiseA, regionId: 'stockholm' };
    const nextA = applyChoice(stateA, 'PROMISE', 0.5, 0.5);

    const stateB = createInitialState();
    stateB.currentDilemma = { promise: promiseB, regionId: 'stockholm' };
    const nextB = applyChoice(stateB, 'PROMISE', 0.5, 0.5);

    expect(nextA.trust).toBe(nextB.trust);
    expect(nextA.budget).toBe(nextB.budget);
    expect(nextA.regionalSupport.stockholm).toBe(nextB.regionalSupport.stockholm);
  });
});
