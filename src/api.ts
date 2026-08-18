import type { Category, PartyCode, PartyData, PromiseData } from './types';
import { DEFAULT_PARTIES, MOCK_PROMISES } from './mockData';

const VALID_CATEGORIES: Category[] = [
  'välfärd',
  'utbildning',
  'skatter',
  'klimat-miljö',
  'rättsväsende',
  'migration',
  'infrastruktur',
  'försvar',
  'övrigt',
];

const VALID_PARTIES: PartyCode[] = ['s', 'm', 'sd', 'c', 'v', 'kd', 'l', 'mp'];

export function asCategory(x: unknown): Category {
  return VALID_CATEGORIES.includes(x as Category) ? (x as Category) : 'övrigt';
}

export function asParty(x: unknown): PartyCode {
  return VALID_PARTIES.includes(x as PartyCode) ? (x as PartyCode) : 's';
}

export function validatePromises(raw: unknown): PromiseData[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = Array.isArray((raw as { data?: unknown[] }).data)
    ? (raw as { data: unknown[] }).data
    : Array.isArray(raw)
      ? raw
      : [];

  return list
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as { id?: unknown }).id === 'string')
    .map((p) => {
      const partiesRaw = Array.isArray(p.parties) ? p.parties : [];
      const parties = partiesRaw.map(asParty);
      const costRaw = p.cost && typeof p.cost === 'object' ? (p.cost as Record<string, unknown>) : {};
      const sourceRaw = p.source && typeof p.source === 'object' ? (p.source as Record<string, unknown>) : {};

      return {
        id: String(p.id),
        title: typeof p.title === 'string' ? p.title : '',
        slug: typeof p.slug === 'string' ? p.slug : String(p.id),
        parties: parties.length > 0 ? parties : ['s'],
        category: asCategory(p.category),
        status: typeof p.status === 'string' ? p.status : 'aktiv',
        cost: {
          msek_base: Number(costRaw.msek_base) || 0,
          type: typeof costRaw.type === 'string' ? costRaw.type : undefined,
          period: typeof costRaw.period === 'string' ? costRaw.period : undefined,
          calculation: typeof costRaw.calculation === 'string' ? costRaw.calculation : undefined,
        },
        quote: typeof p.quote === 'string' ? p.quote : (typeof p.title === 'string' ? p.title : ''),
        source: {
          url: typeof sourceRaw.url === 'string' ? sourceRaw.url : `https://utlovat.se/lofte/${p.id}`,
          domain: typeof sourceRaw.domain === 'string' ? sourceRaw.domain : 'utlovat.se',
        },
      };
    });
}

export function validateParties(raw: unknown): PartyData[] {
  if (!raw || typeof raw !== 'object') return [];
  const list = Array.isArray((raw as { data?: unknown[] }).data)
    ? (raw as { data: unknown[] }).data
    : Array.isArray(raw)
      ? raw
      : [];

  return list
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && VALID_PARTIES.includes(p.code as PartyCode))
    .map((p) => ({
      code: p.code as PartyCode,
      name: typeof p.name === 'string' ? p.name : String(p.code).toUpperCase(),
      color: typeof p.color === 'string' ? p.color : '#888888',
      color_text: typeof p.color_text === 'string' ? p.color_text : '#111111',
      block: typeof p.block === 'string' ? p.block : '',
      mandate_2022: typeof p.mandate_2022 === 'number' ? p.mandate_2022 : undefined,
      votes_2022: typeof p.votes_2022 === 'number' ? p.votes_2022 : undefined,
    }));
}

export const DEFAULT_PROMISES_URL = 'https://utlovat.se/api/v1/promises.json';
export const DEFAULT_PARTIES_URL = 'https://utlovat.se/api/v1/parties.json';

export async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export interface GameDataPayload {
  promises: PromiseData[];
  parties: PartyData[];
  isFallback: boolean;
}

export async function loadGameData(options?: {
  promisesUrl?: string;
  partiesUrl?: string;
  timeoutMs?: number;
}): Promise<GameDataPayload> {
  try {
    const [rawPromises, rawParties] = await Promise.all([
      fetchWithTimeout(options?.promisesUrl ?? DEFAULT_PROMISES_URL, options?.timeoutMs),
      fetchWithTimeout(options?.partiesUrl ?? DEFAULT_PARTIES_URL, options?.timeoutMs),
    ]);

    const validatedPromises = validatePromises(rawPromises);
    const validatedParties = validateParties(rawParties);

    if (validatedPromises.length >= 8 && validatedParties.length >= 8) {
      return {
        promises: validatedPromises,
        parties: validatedParties,
        isFallback: false,
      };
    }
    throw new Error('Incomplete data payload from API');
  } catch (_err) {
    // Graceful offline fallback
    return {
      promises: MOCK_PROMISES,
      parties: DEFAULT_PARTIES,
      isFallback: true,
    };
  }
}
