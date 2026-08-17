import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  calculateElectionResult,
  createInitialState,
  getChoiceOptions,
  INITIAL_BUDGET,
  INITIAL_DAYS,
  INITIAL_TRUST,
  selectDilemmaPromise,
} from '../src/engine';
import { MOCK_PROMISES } from '../src/mockData';

describe('Game Engine', () => {
  it('creates clean initial state with 30 days and 500 000 SEK', () => {
    const state = createInitialState();
    expect(state.phase).toBe('START');
    expect(state.day).toBe(INITIAL_DAYS);
    expect(state.budget).toBe(INITIAL_BUDGET);
    expect(state.trust).toBe(INITIAL_TRUST);
    expect(Object.keys(state.regionalSupport)).toHaveLength(5);
  });

  it('selects promise for a region', () => {
    const promise = selectDilemmaPromise(MOCK_PROMISES, 'norrland');
    expect(promise).toBeDefined();
    expect(promise.id).toBeDefined();
  });

  it('provides balanced choice options for a promise', () => {
    const promise = MOCK_PROMISES[0];
    const options = getChoiceOptions(promise, 'stockholm');

    expect(options.PROMISE.daysCost).toBe(1);
    expect(options.NUANCE.daysCost).toBe(2);
    expect(options.FACT_CHECK.daysCost).toBe(1);

    expect(options.PROMISE.budgetCost).toBeGreaterThan(0);
    expect(options.FACT_CHECK.budgetCost).toBeLessThan(0); // Donations
  });

  it('applies PROMISE choice correctly', () => {
    const state = createInitialState();
    state.currentDilemma = {
      promise: MOCK_PROMISES[0],
      regionId: 'sydsverige',
    };

    const next = applyChoice(state, 'PROMISE', 0.5);
    expect(next.day).toBe(29);
    expect(next.budget).toBe(state.budget - 15000);
    expect(next.regionalSupport.sydsverige).toBeGreaterThan(state.regionalSupport.sydsverige);
    expect(next.promisesMade).toHaveLength(1);
    expect(next.eventHistory).toHaveLength(1);
  });

  it('applies NUANCE choice correctly', () => {
    const state = createInitialState();
    state.currentDilemma = {
      promise: MOCK_PROMISES[0],
      regionId: 'stockholm',
    };

    const next = applyChoice(state, 'NUANCE', 0.5);
    expect(next.day).toBe(28); // Costs 2 days
    expect(next.budget).toBe(state.budget - 35000);
    expect(next.trust).toBeGreaterThan(state.trust);
  });

  it('applies FACT_CHECK choice correctly', () => {
    const state = createInitialState();
    state.currentDilemma = {
      promise: MOCK_PROMISES[0],
      regionId: 'norrland',
    };

    const next = applyChoice(state, 'FACT_CHECK', 0.5);
    expect(next.day).toBe(29);
    expect(next.budget).toBe(state.budget + 10000); // Donations received
    expect(next.trust).toBeGreaterThan(state.trust);
  });

  it('calculates election day results accurately', () => {
    const state = createInitialState();
    // Simulate strong campaign
    state.regionalSupport = {
      norrland: 45,
      svealand: 40,
      stockholm: 42,
      vastsverige: 44,
      sydsverige: 46,
    };
    state.trust = 75;

    const result = calculateElectionResult(state);
    expect(result.totalVotesPercent).toBeGreaterThan(30);
    expect(result.mandatesWon).toBeGreaterThan(120);
    expect(result.mandatesWon).toBeLessThanOrEqual(349);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(result.grade);
  });
});
