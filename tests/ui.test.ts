import { describe, expect, it } from 'vitest';
import { DEFAULT_PARTIES, MOCK_PROMISES } from '../src/mockData';
import { createInitialState } from '../src/engine';
import {
  formatMSEK,
  formatSEK,
  renderAboutModal,
  renderElectionDayView,
  renderEventView,
  renderFactCheckView,
  renderHeader,
  renderMapView,
  renderStartView,
} from '../src/ui';

describe('UI Views', () => {
  const partiesMap = new Map(DEFAULT_PARTIES.map((p) => [p.code, p]));

  it('formats SEK and MSEK currencies nicely', () => {
    expect(formatSEK(500000)).toContain('500 000');
    expect(formatMSEK(4800)).toBe('4.8 mdr kr');
    expect(formatMSEK(500)).toBe('500 mnkr');
    expect(formatMSEK(0)).toBe('0 kr');
  });

  it('renders start view correctly', () => {
    const html = renderStartView([]);
    expect(html).toContain('Valturné');
    expect(html).toContain('Starta valturnén');
  });

  it('renders header when game is active', () => {
    const state = createInitialState();
    state.phase = 'MAP';
    const html = renderHeader(state);
    expect(html).toContain('Dag 30');
    expect(html).toContain('Kampanjkassa');
  });

  it('renders map view with all regions', () => {
    const state = createInitialState();
    state.phase = 'MAP';
    const html = renderMapView(state, 'stockholm');
    expect(html).toContain('Välj nästa kampanjstopp');
    expect(html).toContain('Stockholm');
  });

  it('renders event view with 3 choices', () => {
    const state = createInitialState();
    state.currentDilemma = {
      promise: MOCK_PROMISES[0],
      regionId: 'stockholm',
    };
    const html = renderEventView(state, partiesMap);
    expect(html).toContain('data-choice="PROMISE"');
    expect(html).toContain('data-choice="NUANCE"');
    expect(html).toContain('data-choice="FACT_CHECK"');
  });

  it('renders fact check and debrief view', () => {
    const state = createInitialState();
    state.lastOutcome = {
      record: {
        day: 29,
        regionId: 'stockholm',
        promise: MOCK_PROMISES[0],
        choice: 'PROMISE',
        trustDelta: 2,
        supportDelta: 10,
        budgetDelta: -15000,
        mediaScrutiny: false,
      },
      choiceOption: {
        type: 'PROMISE',
        title: 'Ge ett skarpt vallöfte',
        tagline: '',
        description: '',
        daysCost: 1,
        budgetCost: 15000,
        trustDeltaMin: 0,
        trustDeltaMax: 2,
        supportDeltaMin: 8,
        supportDeltaMax: 14,
        riskFactor: 0.35,
      },
    };
    const html = renderFactCheckView(state, partiesMap);
    expect(html).toContain('Kampanjstoppets resultat');
    expect(html).toContain('+10%');
    expect(html).toContain('Faktaunderlag från utlovat.se');
  });

  it('renders election day view', () => {
    const result = {
      totalVotesPercent: 42.5,
      mandatesWon: 155,
      regionalResults: {
        norrland: { percent: 40, mandatesWon: 18, totalMandates: 44 },
        svealand: { percent: 42, mandatesWon: 25, totalMandates: 58 },
        stockholm: { percent: 45, mandatesWon: 35, totalMandates: 77 },
        vastsverige: { percent: 43, mandatesWon: 38, totalMandates: 86 },
        sydsverige: { percent: 42, mandatesWon: 39, totalMandates: 84 },
      },
      trustFinal: 70,
      budgetLeft: 120000,
      totalPromisedMsek: 18000,
      promiseCount: 3,
      disciplineScore: 90,
      grade: 'A',
      gradeTitle: 'Skicklig strateg',
      gradeDescription: 'Ett mycket starkt valresultat.',
      finalScore: 18500,
    };
    const html = renderElectionDayView(result);
    expect(html).toContain('155 Mandat i Riksdagen');
    expect(html).toContain('Skicklig strateg');
    expect(html).toContain('42.5%');
  });

  it('renders about and neutrality modal', () => {
    const html = renderAboutModal();
    expect(html).toContain('Partipolitisk och ideologisk neutralitet');
    expect(html).toContain('utlovat.se');
    expect(html).toContain('Apache License 2.0');
  });
});
