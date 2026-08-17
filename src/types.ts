export type PartyCode = 's' | 'm' | 'sd' | 'c' | 'v' | 'kd' | 'l' | 'mp';

export type Category =
  | 'välfärd'
  | 'utbildning'
  | 'skatter'
  | 'klimat-miljö'
  | 'rättsväsende'
  | 'migration'
  | 'infrastruktur'
  | 'försvar'
  | 'övrigt';

export interface PartyData {
  code: PartyCode;
  name: string;
  color: string;
  color_text: string;
  block: string;
  mandate_2022?: number;
  votes_2022?: number;
}

export interface PromiseData {
  id: string;
  title: string;
  slug: string;
  parties: PartyCode[];
  category: Category;
  status: string;
  cost: {
    msek_base: number;
    type?: string;
    period?: string;
    calculation?: string;
  };
  quote: string;
  source: {
    url: string;
    domain: string;
  };
}

export type RegionId = 'norrland' | 'svealand' | 'stockholm' | 'vastsverige' | 'sydsverige';

export interface RegionInfo {
  id: RegionId;
  name: string;
  fullName: string;
  description: string;
  electorateWeight: number; // Share of national electorate (sum = 1.0)
  mandates: number; // Total mandates from region (sum = 349)
  primaryCategories: Category[]; // Regional priority issues
  x: number; // Percentage coordinate for map (0-100)
  y: number; // Percentage coordinate for map (0-100)
}

export type StrategicChoice = 'PROMISE' | 'NUANCE' | 'FACT_CHECK';

export interface ChoiceOption {
  type: StrategicChoice;
  title: string;
  tagline: string;
  description: string;
  daysCost: number;
  budgetCost: number; // Positive = cost, negative = gain (donations)
  trustDeltaMin: number;
  trustDeltaMax: number;
  supportDeltaMin: number;
  supportDeltaMax: number;
  riskFactor: number; // Probability of media scrutiny
}

export interface PromiseMadeRecord {
  promise: PromiseData;
  regionId: RegionId;
  day: number;
  choice: StrategicChoice;
  costMsek: number;
}

export interface EventHistoryRecord {
  day: number;
  regionId: RegionId;
  promise: PromiseData;
  choice: StrategicChoice;
  trustDelta: number;
  supportDelta: number;
  budgetDelta: number;
  mediaScrutiny: boolean;
  scrutinyMessage?: string;
}

export interface ElectionResult {
  totalVotesPercent: number;
  mandatesWon: number; // out of 349
  regionalResults: Record<RegionId, { percent: number; mandatesWon: number; totalMandates: number }>;
  trustFinal: number;
  budgetLeft: number;
  totalPromisedMsek: number;
  promiseCount: number;
  disciplineScore: number; // 0–100
  grade: string;
  gradeTitle: string;
  gradeDescription: string;
  finalScore: number;
}

export type GamePhase = 'START' | 'MAP' | 'EVENT' | 'FACT_CHECK' | 'ELECTION_DAY';

export interface GameState {
  phase: GamePhase;
  day: number; // 30 down to 0
  budget: number; // SEK (e.g. 500,000)
  trust: number; // 0 to 100
  currentRegionId: RegionId | null;
  regionalSupport: Record<RegionId, number>; // 0 to 100%
  promisesMade: PromiseMadeRecord[];
  eventHistory: EventHistoryRecord[];
  currentDilemma: {
    promise: PromiseData;
    regionId: RegionId;
  } | null;
  lastOutcome: {
    record: EventHistoryRecord;
    choiceOption: ChoiceOption;
  } | null;
  electionResult: ElectionResult | null;
}

export interface HighScoreRecord {
  id: string;
  date: string;
  playerName: string;
  finalScore: number;
  mandatesWon: number;
  totalVotesPercent: number;
  trustFinal: number;
  gradeTitle: string;
}
