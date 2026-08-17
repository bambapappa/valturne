import { describe, expect, it } from 'vitest';
import { asCategory, asParty, loadGameData, validateParties, validatePromises } from '../src/api';

describe('API Module', () => {
  it('normalizes categories and parties correctly', () => {
    expect(asCategory('skatter')).toBe('skatter');
    expect(asCategory('invalid-category')).toBe('övrigt');

    expect(asParty('m')).toBe('m');
    expect(asParty('invalid-party')).toBe('s');
  });

  it('validates promise payload from raw data', () => {
    const raw = {
      data: [
        {
          id: 'p-1',
          title: 'Test promise',
          slug: 'test-promise',
          parties: ['s', 'v'],
          category: 'välfärd',
          cost: { msek_base: 5000 },
          quote: 'Test quote',
        },
      ],
    };

    const validated = validatePromises(raw);
    expect(validated).toHaveLength(1);
    expect(validated[0].id).toBe('p-1');
    expect(validated[0].category).toBe('välfärd');
    expect(validated[0].cost.msek_base).toBe(5000);
    expect(validated[0].parties).toEqual(['s', 'v']);
  });

  it('validates party payload and filters invalid parties', () => {
    const raw = {
      data: [
        { code: 's', name: 'Socialdemokraterna', color: '#EE2020' },
        { code: 'm', name: 'Moderaterna', color: '#1B5CB3' },
        { code: 'xyz', name: 'Unknown Party', color: '#000000' },
      ],
    };

    const validated = validateParties(raw);
    expect(validated).toHaveLength(2);
    expect(validated.map((p) => p.code)).toEqual(['s', 'm']);
  });

  it('falls back to mock data gracefully when API fails or times out', async () => {
    const result = await loadGameData({
      promisesUrl: 'http://localhost:9999/non-existent-api',
      partiesUrl: 'http://localhost:9999/non-existent-api',
      timeoutMs: 100,
    });

    expect(result.isFallback).toBe(true);
    expect(result.promises.length).toBeGreaterThanOrEqual(8);
    expect(result.parties.length).toBe(8);
  });
});
