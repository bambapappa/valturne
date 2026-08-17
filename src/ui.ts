import type {
  ElectionResult,
  GameState,
  PartyData,
  RegionId,
  StrategicChoice,
} from './types';
import { REGIONS } from './mockData';
import { getChoiceOptions } from './engine';
import { renderSwedenMapSvg } from './map';
import { getHighScores } from './storage';

export interface UiCallbacks {
  onStartGame: () => void;
  onSelectRegion: (id: RegionId) => void;
  onConfirmRegion: (id: RegionId) => void;
  onMakeChoice: (choice: StrategicChoice) => void;
  onNextTurn: () => void;
  onRestart: () => void;
  onOpenAbout: () => void;
  onCloseAbout: () => void;
}

export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
}

export function formatMSEK(amount: number): string {
  if (amount === 0) return '0 kr';
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1)} mdr kr`;
  }
  return `${amount} mnkr`;
}

export function renderHeader(state: GameState): string {
  const isStarted = state.phase !== 'START';
  if (!isStarted) return '';

  const trustPercent = Math.round(state.trust);
  let trustColor = 'bg-emerald-500';
  if (trustPercent < 35) trustColor = 'bg-rose-500';
  else if (trustPercent < 55) trustColor = 'bg-amber-500';

  const totalPromised = state.promisesMade.reduce((sum, p) => sum + p.costMsek, 0);

  return `
    <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-sm">
      <div class="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-mono">
        <!-- Brand & Day -->
        <div class="flex items-center gap-3">
          <span class="font-bold tracking-tight text-base sm:text-lg font-sans text-slate-900 dark:text-white">
            🗳️ VALTURNÉ
          </span>
          <div class="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
            Dag ${state.day} / 30 kvar
          </div>
        </div>

        <!-- Resources -->
        <div class="flex items-center gap-3 sm:gap-6">
          <!-- Budget -->
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Kampanjkassa</span>
            <span class="font-bold ${state.budget < 50000 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}">
              ${formatSEK(state.budget)}
            </span>
          </div>

          <!-- Trust Meter -->
          <div class="flex flex-col min-w-[90px] sm:min-w-[120px]">
            <div class="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <span>Förtroende</span>
              <span class="font-bold">${trustPercent}%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-0.5">
              <div class="${trustColor} h-full transition-all duration-300" style="width: ${trustPercent}%"></div>
            </div>
          </div>

          <!-- Promises count/cost -->
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Avgivna löften</span>
            <span class="font-bold text-slate-700 dark:text-slate-300">
              ${state.promisesMade.length} st (${formatMSEK(totalPromised)})
            </span>
          </div>

          <!-- Info Button -->
          <button id="btn-open-about" class="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Om spelet & neutralitet">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  `;
}

export function renderStartView(highScores: ReturnType<typeof getHighScores>): string {
  const highScoresHtml =
    highScores.length > 0
      ? `
      <div class="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60">
        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          🏆 Tidigare toppresultat
        </h3>
        <div class="space-y-2">
          ${highScores
            .slice(0, 5)
            .map(
              (hs, i) => `
            <div class="flex items-center justify-between text-xs sm:text-sm bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-2xs">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-slate-400">#${i + 1}</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">${hs.playerName}</span>
                <span class="text-xs text-slate-500">(${hs.gradeTitle})</span>
              </div>
              <div class="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                ${hs.mandatesWon} mandat (${hs.totalVotesPercent}%)
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
      : '';

  return `
    <div class="max-w-2xl mx-auto py-8 sm:py-12 px-4">
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-200/60">
          <span>🇸🇪</span> Inför riksdagsvalet 2026 • 100% Partipolitiskt neutralt
        </div>
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Valturné
        </h1>
        <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          Du är kampanjledare under de sista <strong>30 dagarna</strong> före valet. Res mellan Sveriges regioner, hantera budget och förtroendekapital, och fatta strategiska beslut baserade på verkliga vallöften från <span class="font-semibold text-indigo-600 dark:text-indigo-400">utlovat.se</span>.
        </p>
      </div>

      <!-- Core Mechanics Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-8">
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div class="text-2xl mb-1.5">🗺️</div>
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">5 Regioner</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Res runt och adressera lokala hjärtefrågor från Norrland till Sydsverige.</p>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div class="text-2xl mb-1.5">⚖️</div>
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">3 Strategier</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Ge skarpa vallöften, förankra med eftertanke eller granska mot verkligt facit.</p>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div class="text-2xl mb-1.5">🔍</div>
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">Öppen Data</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Drivs av partiernas faktiska löften och kalkyler från utlovat.se (CC-BY-4.0).</p>
        </div>
      </div>

      <!-- Start Action -->
      <div class="space-y-3">
        <button id="btn-start-game" class="w-full min-h-[52px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-150 hover:shadow-lg cursor-pointer">
          <span>🚀 Starta valturnén (30 dagar kvar)</span>
        </button>

        <div class="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
          <button id="btn-open-about-start" class="hover:underline hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            ℹ️ Om spelet & neutralitetskontrakt
          </button>
          <span>•</span>
          <span>Licensierat under Apache 2.0</span>
        </div>
      </div>

      ${highScoresHtml}
    </div>
  `;
}

export function renderMapView(state: GameState, selectedRegionId: RegionId | null): string {
  const activeRegionId = selectedRegionId || state.currentRegionId || 'stockholm';
  const activeRegion = REGIONS[activeRegionId];

  const regionCardsHtml = Object.values(REGIONS)
    .map((r) => {
      const isSelected = r.id === activeRegionId;
      const sup = Math.round(state.regionalSupport[r.id] ?? 20);

      return `
        <button data-region-card="${r.id}" 
                class="text-left w-full p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }">
          <div class="flex items-center justify-between">
            <span class="font-bold text-sm text-slate-900 dark:text-white">${r.name}</span>
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              sup >= 35
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : sup >= 25
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
            }">${sup}%</span>
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>${r.mandates} mandat</span>
            <span class="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-semibold">1 dag • 15 tkr</span>
          </div>
        </button>
      `;
    })
    .join('');

  return `
    <div class="max-w-4xl mx-auto py-4 sm:py-6 px-4">
      <div class="mb-4">
        <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          Välj nästa kampanjstopp
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Klicka på kartan eller i listan för att välja var du vill hålla kampanjmöte och bemöta väljarnas frågor.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <!-- Interactive Map Column -->
        <div class="md:col-span-6 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div class="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2 text-center">
            Sverigekartan (Väljarstöd)
          </div>
          ${renderSwedenMapSvg({
            selectedRegionId: activeRegionId,
            regionalSupport: state.regionalSupport,
            onSelectRegion: () => {},
          })}
        </div>

        <!-- Region Details & Actions Column -->
        <div class="md:col-span-6 space-y-4">
          <!-- Region Selector Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
            ${regionCardsHtml}
          </div>

          <!-- Active Region Detail Box -->
          <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">Vald region</span>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">${activeRegion.fullName}</h3>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-500">Mandat i riksdagen</span>
                <div class="font-mono font-bold text-slate-800 dark:text-slate-200">${activeRegion.mandates} st</div>
              </div>
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ${activeRegion.description}
            </p>

            <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <span class="text-[10px] font-bold font-mono uppercase text-slate-400">Regionala hjärtefrågor</span>
              <div class="flex flex-wrap gap-1.5 mt-1.5">
                ${activeRegion.primaryCategories
                  .map(
                    (cat) => `
                  <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs capitalize font-medium">
                    ${cat}
                  </span>
                `
                  )
                  .join('')}
              </div>
            </div>

            <button id="btn-confirm-region" 
                    data-region-id="${activeRegion.id}"
                    class="w-full min-h-[48px] mt-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <span>🎤 Håll kampanjmöte i ${activeRegion.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderEventView(
  state: GameState,
  partiesMap: Map<string, PartyData>
): string {
  if (!state.currentDilemma) return '';

  const { promise, regionId } = state.currentDilemma;
  const region = REGIONS[regionId];
  const options = getChoiceOptions(promise, regionId);
  const party = partiesMap.get(promise.parties[0]) || {
    code: 's',
    name: 'Riksdagsparti',
    color: '#4f46e5',
    color_text: '#4f46e5',
    block: '',
  };

  const msek = Math.abs(promise.cost.msek_base);
  const costLabel = msek > 0 ? `${(msek / 1000).toFixed(1)} mdr kr` : 'Regelreform';

  return `
    <div class="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <!-- Breadcrumb / Context -->
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <span>📍 Kampanjmöte i <strong>${region.name}</strong></span>
          <span>•</span>
          <span class="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold capitalize">
            ${promise.category}
          </span>
        </div>
        <div class="font-mono">
          Dag ${state.day} kvar
        </div>
      </div>

      <!-- Dilemma Statement Card -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-1.5 self-stretch rounded-full" style="background-color: ${party.color}"></div>
          <div class="space-y-2 flex-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold px-2 py-0.5 rounded" style="background-color: ${party.color}20; color: ${party.color_text}">
                Löfte från ${party.name}
              </span>
              <span class="text-xs font-mono text-slate-500">
                Beräknad reformkostnad: <strong>${costLabel}</strong>
              </span>
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              "${promise.title}"
            </h2>
            ${
              promise.quote && promise.quote !== promise.title
                ? `<blockquote class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1">
                    ${promise.quote}
                  </blockquote>`
                : ''
            }
          </div>
        </div>

        <div class="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg flex items-center justify-between">
          <span>Källa: <a href="${promise.source.url}" target="_blank" rel="noopener noreferrer" class="underline hover:text-indigo-600">${promise.source.domain}</a> via <strong class="text-indigo-600">utlovat.se</strong> (CC-BY-4.0)</span>
          <span>Status: <strong class="capitalize text-slate-700 dark:text-slate-300">${promise.status}</strong></span>
        </div>
      </div>

      <!-- Strategic Choice Cards -->
      <div class="space-y-3">
        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
          Hur vill du agera som kampanjledare?
        </h3>

        <div class="grid grid-cols-1 gap-3.5">
          <!-- Choice A: PROMISE -->
          <button data-choice="PROMISE" 
                  class="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">A</span>
                  <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    ${options.PROMISE.title}
                  </h4>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300">
                  ${options.PROMISE.description}
                </p>
              </div>
              <div class="text-right text-xs font-mono space-y-0.5 shrink-0">
                <div class="text-emerald-600 dark:text-emerald-400 font-bold">+${options.PROMISE.supportDeltaMin}–${options.PROMISE.supportDeltaMax}% stöd</div>
                <div class="text-slate-500">1 dag • -15 tkr</div>
                <div class="text-amber-600 dark:text-amber-400 text-[10px]">Granskningsrisk: Hög</div>
              </div>
            </div>
          </button>

          <!-- Choice B: NUANCE -->
          <button data-choice="NUANCE" 
                  class="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">B</span>
                  <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    ${options.NUANCE.title}
                  </h4>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300">
                  ${options.NUANCE.description}
                </p>
              </div>
              <div class="text-right text-xs font-mono space-y-0.5 shrink-0">
                <div class="text-indigo-600 dark:text-indigo-400 font-bold">+${options.NUANCE.trustDeltaMin}–${options.NUANCE.trustDeltaMax}% tillit</div>
                <div class="text-slate-500">2 dagar • -35 tkr</div>
                <div class="text-emerald-600 dark:text-emerald-400 text-[10px]">Låg risk</div>
              </div>
            </div>
          </button>

          <!-- Choice C: FACT_CHECK -->
          <button data-choice="FACT_CHECK" 
                  class="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1 flex-1">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">C</span>
                  <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    ${options.FACT_CHECK.title}
                  </h4>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300">
                  ${options.FACT_CHECK.description}
                </p>
              </div>
              <div class="text-right text-xs font-mono space-y-0.5 shrink-0">
                <div class="text-indigo-600 dark:text-indigo-400 font-bold">+${options.FACT_CHECK.trustDeltaMin}–${options.FACT_CHECK.trustDeltaMax}% tillit</div>
                <div class="text-emerald-600 dark:text-emerald-400 font-bold">+10 tkr donation</div>
                <div class="text-slate-500">1 dag • 0 risk</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderFactCheckView(state: GameState, partiesMap: Map<string, PartyData>): string {
  if (!state.lastOutcome) return '';

  const { record, choiceOption } = state.lastOutcome;
  const region = REGIONS[record.regionId];
  const party = partiesMap.get(record.promise.parties[0]) || {
    name: 'Riksdagsparti',
    color: '#4f46e5',
    color_text: '#4f46e5',
  };

  const isPositiveTrust = record.trustDelta >= 0;
  const isPositiveBudget = record.budgetDelta >= 0;

  return `
    <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div class="text-center space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200/60">
          ✓ Val genomfört • ${choiceOption.title}
        </div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Kampanjstoppets resultat
        </h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Region: <strong>${region.name}</strong> • Återstående dagar: <strong>${state.day} dagar</strong>
        </p>
      </div>

      <!-- Metric Impact Grid -->
      <div class="grid grid-cols-3 gap-3">
        <!-- Support Delta -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] uppercase font-bold font-mono text-slate-400">Lokalt stöd</span>
          <div class="text-xl sm:text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            +${record.supportDelta}%
          </div>
          <span class="text-[10px] text-slate-500">Nu ${Math.round(state.regionalSupport[record.regionId])}% i ${region.name}</span>
        </div>

        <!-- Trust Delta -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] uppercase font-bold font-mono text-slate-400">Förtroende</span>
          <div class="text-xl sm:text-2xl font-mono font-bold ${isPositiveTrust ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'} mt-1">
            ${isPositiveTrust ? `+${record.trustDelta}` : record.trustDelta}%
          </div>
          <span class="text-[10px] text-slate-500">Nu ${Math.round(state.trust)}% nationellt</span>
        </div>

        <!-- Budget Delta -->
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] uppercase font-bold font-mono text-slate-400">Kassa</span>
          <div class="text-xl sm:text-2xl font-mono font-bold ${isPositiveBudget ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'} mt-1">
            ${isPositiveBudget ? `+${record.budgetDelta / 1000} tkr` : `${record.budgetDelta / 1000} tkr`}
          </div>
          <span class="text-[10px] text-slate-500">${formatSEK(state.budget)} kvar</span>
        </div>
      </div>

      <!-- Scrutiny message / Media feedback -->
      ${
        record.mediaScrutiny && record.scrutinyMessage
          ? `
        <div class="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1">
          <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <span>📰 Mediegranskning & Ledarkommentar</span>
          </div>
          <p class="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
            ${record.scrutinyMessage}
          </p>
        </div>
      `
          : ''
      }

      <!-- Fact check deep dive box -->
      <div class="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            🔍 Faktaunderlag från utlovat.se
          </span>
          <span class="text-slate-400 font-mono">${record.promise.id}</span>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          ${record.promise.cost.calculation || 'Förslaget har analyserats av utlovat.se baserat på offentliga källor och riksdagens handlingar.'}
        </p>

        <div class="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ursprungligt löfte från: <strong class="text-slate-700 dark:text-slate-300">${party.name}</strong></span>
          <a href="${record.promise.source.url}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 font-semibold underline hover:text-indigo-800">
            Läs fullständig granskning →
          </a>
        </div>
      </div>

      <!-- Continue Action -->
      <button id="btn-next-turn" 
              class="w-full min-h-[50px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer">
        <span>➡️ Fortsätt turnén (${state.day} dagar kvar)</span>
      </button>
    </div>
  `;
}

export function renderElectionDayView(result: ElectionResult): string {
  const isMajority = result.mandatesWon >= 175;

  let gradeBadgeColor = 'bg-emerald-500';
  if (result.grade === 'A') gradeBadgeColor = 'bg-indigo-500';
  else if (result.grade === 'B') gradeBadgeColor = 'bg-blue-500';
  else if (result.grade === 'C') gradeBadgeColor = 'bg-amber-500';
  else if (result.grade === 'D') gradeBadgeColor = 'bg-rose-500';

  const regionalRows = Object.entries(result.regionalResults)
    .map(([regId, data]) => {
      const region = REGIONS[regId as RegionId];
      return `
        <div class="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <span class="font-bold text-slate-800 dark:text-slate-200">${region.name}</span>
            <span class="text-[11px] text-slate-400 ml-1">(${region.mandates} m)</span>
          </div>
          <div class="flex items-center gap-3 font-mono">
            <span class="text-slate-600 dark:text-slate-300">${data.percent}%</span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400 min-w-[70px] text-right">${data.mandatesWon} mandat</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <!-- Election Night Hero -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-200">
          🗳️ SLUTRESULTAT • VALDAGEN 2026
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          ${result.mandatesWon} Mandat i Riksdagen
        </h1>
        <p class="text-base text-slate-600 dark:text-slate-300">
          Totalt valresultat: <strong>${result.totalVotesPercent}%</strong> av rösterna i riket.
          ${isMajority ? '🎉 <strong class="text-emerald-600">Egen majoritet uppnådd (>175 mandat)!</strong>' : 'Kräver koalitionsförhandlingar för att nå 175 mandat.'}
        </p>
      </div>

      <!-- Grade & Evaluation Card -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <span class="text-xs font-mono uppercase font-bold text-slate-400">Betyg på valturnén</span>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white">${result.gradeTitle}</h3>
          </div>
          <div class="${gradeBadgeColor} text-white font-mono font-extrabold text-2xl w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            ${result.grade}
          </div>
        </div>
        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          ${result.gradeDescription}
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono font-bold">Slutligt förtroende</span>
            <div class="font-mono font-bold text-slate-800 dark:text-slate-200 text-base">${Math.round(result.trustFinal)}%</div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono font-bold">Löftesdisciplin</span>
            <div class="font-mono font-bold text-slate-800 dark:text-slate-200 text-base">${result.disciplineScore} / 100</div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono font-bold">Löftessumma</span>
            <div class="font-mono font-bold text-slate-800 dark:text-slate-200 text-base">${formatMSEK(result.totalPromisedMsek)}</div>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase font-mono font-bold">Kassa kvar</span>
            <div class="font-mono font-bold text-slate-800 dark:text-slate-200 text-base">${formatSEK(result.budgetLeft)}</div>
          </div>
        </div>
      </div>

      <!-- Regional Breakdown -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
        <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Mandatfördelning per region
        </h4>
        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          ${regionalRows}
        </div>
      </div>

      <!-- High Score input & restart -->
      <div class="bg-indigo-50/80 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
        <h4 class="text-sm font-bold text-indigo-950 dark:text-indigo-200">
          Spara ditt kampanjresultat
        </h4>
        <div class="flex flex-col sm:flex-row gap-2">
          <input type="text" id="input-player-name" placeholder="Ditt kampanjnamn / initialer" value="Kampanjledare" maxlength="24"
                 class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button id="btn-save-score" 
                  class="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow transition-colors cursor-pointer shrink-0">
            💾 Spara i topplistan
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-2">
        <button id="btn-restart-game" 
                class="flex-1 min-h-[50px] bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <span>🔄 Spela en ny valturné</span>
        </button>
      </div>
    </div>
  `;
}

export function renderAboutModal(): string {
  return `
    <div id="about-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div class="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚖️</span>
            <h3 class="font-bold text-base text-slate-900 dark:text-white">Om Valturné & Neutralitetskontrakt</h3>
          </div>
          <button id="btn-close-about" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1">1. Partipolitisk och ideologisk neutralitet</h4>
            <p>
              Spelet värderar varken vänster-, höger-, liberala, konservativa eller gröna sakfrågor som "rätt" eller "fel". Spelets mekanik mäter spelarens <strong>trovärdighet (förtroendekapital)</strong>, <strong>resurshantering</strong> och <strong>konsekvens</strong>. Alla riksdagspartier och sakområden representeras symmetriskt och opartiskt.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1">2. Datakälla & Kreditering (CC-BY-4.0)</h4>
            <p>
              All data om partiernas vallöften, kostnadsberäkningar och riksdagsfacit hämtas från det öppna API:et på <a href="https://utlovat.se" target="_blank" rel="noopener noreferrer" class="text-indigo-600 font-semibold underline">utlovat.se</a> under licensen <strong>Creative Commons Attribution 4.0 International (CC-BY-4.0)</strong>.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1">3. Licens</h4>
            <p>
              Källkoden för Valturné är öppen källkod och licensierad under <strong>Apache License 2.0</strong>.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1">4. Verifiering och tester</h4>
            <p>
              Projektet innehåller automatiserade neutralitetstester (<code class="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">neutrality.test.ts</code>) som genomför 10 000 simulerade drag för att matematiskt bevisa att inget parti eller politisk inriktning ges speltekniska fördelar.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-right">
          <button id="btn-close-about-bottom" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer">
            Stäng
          </button>
        </div>
      </div>
    </div>
  `;
}
