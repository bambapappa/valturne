import type {
  ChoiceOption,
  ElectionResult,
  EventHistoryRecord,
  GameState,
  PromiseData,
  PromiseMadeRecord,
  RegionId,
  StrategicChoice,
} from './types';
import { REGIONS } from './mockData';

export const INITIAL_DAYS = 30;
export const INITIAL_BUDGET = 500000; // 500 000 SEK
export const INITIAL_TRUST = 50; // 50%
export const INITIAL_REGIONAL_SUPPORT = 20; // 20% in all regions

export function createInitialState(): GameState {
  const initialSupport: Record<RegionId, number> = {
    norrland: INITIAL_REGIONAL_SUPPORT,
    svealand: INITIAL_REGIONAL_SUPPORT,
    stockholm: INITIAL_REGIONAL_SUPPORT,
    vastsverige: INITIAL_REGIONAL_SUPPORT,
    sydsverige: INITIAL_REGIONAL_SUPPORT,
  };

  return {
    phase: 'START',
    day: INITIAL_DAYS,
    budget: INITIAL_BUDGET,
    trust: INITIAL_TRUST,
    currentRegionId: null,
    regionalSupport: initialSupport,
    promisesMade: [],
    eventHistory: [],
    currentDilemma: null,
    lastOutcome: null,
    electionResult: null,
  };
}

/**
 * Symmetrically picks a promise for the selected region.
 * Uses deterministic or uniform selection that balances parties and categories.
 */
export function selectDilemmaPromise(
  promises: PromiseData[],
  regionId: RegionId,
  usedPromiseIds: Set<string> = new Set(),
  partyHistory: string[] = []
): PromiseData {
  if (promises.length === 0) {
    throw new Error('Promise pool cannot be empty');
  }

  const region = REGIONS[regionId];
  const unusedPromises = promises.filter((p) => !usedPromiseIds.has(p.id));
  const pool = unusedPromises.length > 0 ? unusedPromises : promises;

  // Track party counts to maintain strict party balance
  const partyCounts: Record<string, number> = {};
  for (const party of partyHistory) {
    partyCounts[party] = (partyCounts[party] || 0) + 1;
  }

  // Score candidate promises: prefer less frequent parties and matching regional priority categories
  const scored = pool.map((p) => {
    const mainParty = p.parties[0] ?? 's';
    const partyUsage = partyCounts[mainParty] || 0;
    const categoryMatch = region.primaryCategories.includes(p.category) ? 2 : 0;
    // Lower score is better (fewer times party used, priority category bonus)
    const score = partyUsage * 3 - categoryMatch + (Math.random() * 0.8);
    return { promise: p, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].promise;
}

/**
 * Returns the three symmetric choices for a dilemma.
 */
export function getChoiceOptions(promise: PromiseData, regionId: RegionId): Record<StrategicChoice, ChoiceOption> {
  const region = REGIONS[regionId];
  const isPriority = region.primaryCategories.includes(promise.category);
  const priorityMultiplier = isPriority ? 1.25 : 1.0;

  const msek = Math.abs(promise.cost.msek_base);
  const costLabel = msek > 0 ? `${(msek / 1000).toFixed(1)} mdr kr` : 'Regelreform / budgetneutral';

  return {
    PROMISE: {
      type: 'PROMISE',
      title: 'Ge ett skarpt vallöfte',
      tagline: 'Satsa offensivt och lova konkret förändring',
      description: `Lova att genomföra satsningen (${costLabel}). Ger stark omedelbar respons bland regionens väljare, men sätter press på budgetdisciplinen och granskas hårdare i media.`,
      daysCost: 1,
      budgetCost: 15000,
      trustDeltaMin: 0,
      trustDeltaMax: 2,
      supportDeltaMin: Math.round(8 * priorityMultiplier),
      supportDeltaMax: Math.round(14 * priorityMultiplier),
      riskFactor: 0.35,
    },
    NUANCE: {
      type: 'NUANCE',
      title: 'Nyansera och förankra',
      tagline: 'Kräv gedigen beredning och bred samling',
      description: `Betona att frågan kräver noggranna konsekvensanalyser och samråd med sakkunniga. Kostar mer kampanjtid och resurser, men bygger långsiktigt och stabilt förtroendekapital.`,
      daysCost: 2,
      budgetCost: 35000,
      trustDeltaMin: 5,
      trustDeltaMax: 8,
      supportDeltaMin: Math.round(4 * priorityMultiplier),
      supportDeltaMax: Math.round(7 * priorityMultiplier),
      riskFactor: 0.05,
    },
    FACT_CHECK: {
      type: 'FACT_CHECK',
      title: 'Fokusera på facit & granskning',
      tagline: 'Jämför mot verkligt utfall och riksdagens beslut',
      description: `Lyft fram hur partierna faktiskt röstat och vad reformen kostar enligt utlovat.se. Välkomnas av faktaorienterade väljare, genererar gräsrotsdonationer (+10 000 kr) och stärker trovärdigheten.`,
      daysCost: 1,
      budgetCost: -10000, // Donation gain
      trustDeltaMin: 6,
      trustDeltaMax: 10,
      supportDeltaMin: Math.round(3 * priorityMultiplier),
      supportDeltaMax: Math.round(6 * priorityMultiplier),
      riskFactor: 0.0,
    },
  };
}

/**
 * Applies a strategic choice to the current game state.
 */
export function applyChoice(
  state: GameState,
  choice: StrategicChoice,
  randomSeed = Math.random(),
  scrutinyRoll = Math.random()
): GameState {
  if (!state.currentDilemma) {
    throw new Error('Cannot apply choice without an active dilemma');
  }

  const { promise, regionId } = state.currentDilemma;
  const options = getChoiceOptions(promise, regionId);
  const opt = options[choice];

  // Calculate deltas
  const daysCost = opt.daysCost;
  const budgetCost = opt.budgetCost;

  const trustRange = opt.trustDeltaMax - opt.trustDeltaMin;
  let trustDelta = opt.trustDeltaMin + Math.round(randomSeed * trustRange);

  const supportRange = opt.supportDeltaMax - opt.supportDeltaMin;
  const supportDelta = opt.supportDeltaMin + Math.round(randomSeed * supportRange);

  // Check if media scrutiny triggers
  let mediaScrutiny = false;
  let scrutinyMessage = '';

  if (choice === 'PROMISE') {
    const totalPromisedBefore = state.promisesMade.reduce((acc, p) => acc + p.costMsek, 0);
    const addedCost = promise.cost.msek_base;
    const totalWithNew = totalPromisedBefore + addedCost;

    // Scrutiny probability increases if promises accumulate rapidly
    const scrutinyThreshold = opt.riskFactor + (state.promisesMade.length * 0.08);
    if (scrutinyRoll < scrutinyThreshold) {
      mediaScrutiny = true;
      if (totalWithNew > 40000) {
        trustDelta -= 8;
        scrutinyMessage = `Medierna granskar reformnotan: Totalt har kampanjen nu lovat satsningar för ${(totalWithNew / 1000).toFixed(1)} mdr kr. Ledarsidor ifrågasätter finansieringskalkylen (-8% förtroende).`;
      } else if (state.budget < 100000) {
        trustDelta -= 5;
        scrutinyMessage = `Ekonomijournalister ifrågasätter kampanjens budgetdisciplin när kampanjkassan sinar (-5% förtroende).`;
      } else {
        trustDelta += 2;
        scrutinyMessage = `Granskningen visar att förslaget är väl underbyggt och har tydlig partipolitisk förankring i riksdagen (+2% förtroende).`;
      }
    }
  } else if (choice === 'FACT_CHECK') {
    mediaScrutiny = true;
    scrutinyMessage = `Faktagranskningen från utlovat.se uppmärksammas i lokalpressen: "Saklig och transparent genomgång av förslaget och dess historiska underlag."`;
  }

  // Update values
  const newDay = Math.max(0, state.day - daysCost);
  const newBudget = state.budget - budgetCost;
  const newTrust = Math.max(0, Math.min(100, state.trust + trustDelta));

  const currentRegional = state.regionalSupport[regionId] ?? 20;
  const newRegionalSupport: Record<RegionId, number> = {
    ...state.regionalSupport,
    [regionId]: Math.max(0, Math.min(100, currentRegional + supportDelta)),
  };

  const newPromisesMade: PromiseMadeRecord[] =
    choice === 'PROMISE'
      ? [
          ...state.promisesMade,
          {
            promise,
            regionId,
            day: newDay,
            choice,
            costMsek: promise.cost.msek_base,
          },
        ]
      : state.promisesMade;

  const historyRecord: EventHistoryRecord = {
    day: newDay,
    regionId,
    promise,
    choice,
    trustDelta,
    supportDelta,
    budgetDelta: -budgetCost,
    mediaScrutiny,
    scrutinyMessage: scrutinyMessage || undefined,
  };

  const isGameOver = newDay <= 0 || newBudget <= 0;
  const nextPhase = isGameOver ? 'ELECTION_DAY' : 'FACT_CHECK';

  const nextState: GameState = {
    ...state,
    phase: nextPhase,
    day: newDay,
    budget: newBudget,
    trust: newTrust,
    regionalSupport: newRegionalSupport,
    promisesMade: newPromisesMade,
    eventHistory: [...state.eventHistory, historyRecord],
    lastOutcome: {
      record: historyRecord,
      choiceOption: opt,
    },
  };

  if (isGameOver) {
    nextState.electionResult = calculateElectionResult(nextState);
  }

  return nextState;
}

/**
 * Calculates final election day outcome based on regional support, national trust, and promise discipline.
 */
export function calculateElectionResult(state: GameState): ElectionResult {
  const regions = Object.values(REGIONS);

  let weightedSupportSum = 0;
  const regionalResults: Record<RegionId, { percent: number; mandatesWon: number; totalMandates: number }> = {} as any;

  // Trust modifier: 50% trust is neutral (1.0). 100% trust is +25% boost, 0% trust is -25% penalty.
  const trustModifier = 0.75 + (state.trust / 100) * 0.5;

  let totalMandatesWon = 0;

  for (const reg of regions) {
    const rawSupport = state.regionalSupport[reg.id] ?? 20;
    // Calculate final voting percent for this region
    const modifiedPercent = Math.max(2.0, Math.min(65.0, rawSupport * trustModifier));
    const regionalMandates = Math.round((modifiedPercent / 100) * reg.mandates);

    regionalResults[reg.id] = {
      percent: parseFloat(modifiedPercent.toFixed(1)),
      mandatesWon: regionalMandates,
      totalMandates: reg.mandates,
    };

    weightedSupportSum += modifiedPercent * reg.electorateWeight;
    totalMandatesWon += regionalMandates;
  }

  const totalVotesPercent = parseFloat(weightedSupportSum.toFixed(1));
  // Total mandates capped at 349
  const mandatesWon = Math.min(349, Math.max(0, totalMandatesWon));

  // Discipline score (0-100): Evaluates balanced budgeting and reasonable promise volume
  const totalPromisedMsek = state.promisesMade.reduce((acc, p) => acc + p.costMsek, 0);
  const promiseCount = state.promisesMade.length;

  let disciplinePenalty = 0;
  if (totalPromisedMsek > 50000) {
    disciplinePenalty += Math.min(40, (totalPromisedMsek - 50000) / 2000);
  }
  if (state.budget < 50000) {
    disciplinePenalty += 20;
  }
  const disciplineScore = Math.max(0, Math.min(100, Math.round(100 - disciplinePenalty)));

  // Final score formula
  const finalScore = Math.round(mandatesWon * 100 + state.trust * 30 + disciplineScore * 20);

  // Grade classification
  let grade = 'C';
  let gradeTitle = 'Vindkänslig valturné';
  let gradeDescription =
    'Kampanjen nådde fram till vissa väljargrupper men saknade den övergripande trovärdigheten eller budgetdisciplinen för att bilda stabil majoritet.';

  if (mandatesWon >= 175 && state.trust >= 65) {
    grade = 'S';
    gradeTitle = 'Statsmannamässig jordskredsseger';
    gradeDescription =
      'Historisk valframgång! Du kombinerade skarp regional närvaro med oklanderligt förtroendekapital och välbalanserad reformagenda.';
  } else if (mandatesWon >= 150 && state.trust >= 55) {
    grade = 'A';
    gradeTitle = 'Skicklig strateg & regeringsbildare';
    gradeDescription =
      'Ett mycket starkt valresultat som ger utmärkt förhandlingsläge i riksdagen. Kampanjen navigerade sakfrågorna med stor precision.';
  } else if (mandatesWon >= 120 || state.trust >= 50) {
    grade = 'B';
    gradeTitle = 'Stabil och folklig kampanj';
    gradeDescription =
      'Ett solitt valresultat med god regional representation, även om vissa reformer och budgetavvägningar skapade debatt under slutspurten.';
  } else if (mandatesWon < 70 || state.trust < 30) {
    grade = 'D';
    gradeTitle = 'Budgetkris & väljartapp';
    gradeDescription =
      'Kampanjen drabbades av granskningar och tappade fart i slutspurten. Varken budgeten eller förtroendekapitalet räckte hela vägen till valdagen.';
  }

  return {
    totalVotesPercent,
    mandatesWon,
    regionalResults,
    trustFinal: state.trust,
    budgetLeft: state.budget,
    totalPromisedMsek,
    promiseCount,
    disciplineScore,
    grade,
    gradeTitle,
    gradeDescription,
    finalScore,
  };
}
