import './style.css';
import type { GameState, PartyData, PromiseData, RegionId, StrategicChoice } from './types';
import { loadGameData } from './api';
import { applyChoice, createInitialState, selectDilemmaPromise } from './engine';
import { clearGameState, getHighScores, loadGameState, saveGameState, saveHighScore } from './storage';
import {
  renderAboutModal,
  renderElectionDayView,
  renderEventView,
  renderFactCheckView,
  renderHeader,
  renderMapView,
  renderStartView,
} from './ui';

class ValturneApp {
  private state: GameState;
  private promises: PromiseData[] = [];
  private partiesMap: Map<string, PartyData> = new Map();
  private isFallback = false;
  private selectedRegionId: RegionId | null = null;
  private showAboutModal = false;
  private appEl: HTMLElement;

  constructor() {
    const el = document.getElementById('app');
    if (!el) throw new Error('Missing #app root element');
    this.appEl = el;

    const saved = loadGameState();
    this.state = saved || createInitialState();
  }

  public async init() {
    this.renderLoading('Hämtar aktuell data från utlovat.se...');
    const data = await loadGameData();
    this.promises = data.promises;
    this.isFallback = data.isFallback;
    this.partiesMap = new Map(data.parties.map((p) => [p.code, p]));

    this.render();
    this.bindEvents();
  }

  private renderLoading(msg: string) {
    this.appEl.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4">
        <div class="text-center space-y-3">
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300 font-mono">${msg}</p>
        </div>
      </div>
    `;
  }

  public render() {
    let mainViewHtml = '';
    const highScores = getHighScores();

    switch (this.state.phase) {
      case 'START':
        mainViewHtml = renderStartView(highScores);
        break;
      case 'MAP':
        mainViewHtml = renderMapView(this.state, this.selectedRegionId);
        break;
      case 'EVENT':
        mainViewHtml = renderEventView(this.state, this.partiesMap);
        break;
      case 'FACT_CHECK':
        mainViewHtml = renderFactCheckView(this.state, this.partiesMap);
        break;
      case 'ELECTION_DAY':
        if (this.state.electionResult) {
          mainViewHtml = renderElectionDayView(this.state.electionResult);
        }
        break;
    }

    const headerHtml = renderHeader(this.state);
    const aboutHtml = this.showAboutModal ? renderAboutModal() : '';

    this.appEl.innerHTML = `
      <div class="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        ${headerHtml}
        <main class="flex-1 w-full">
          ${mainViewHtml}
        </main>
        <footer class="py-6 px-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>Valturné • En neutral valsimulator inför riksdagsvalet 2026</p>
          <p>
            Data: <a href="https://utlovat.se" target="_blank" rel="noopener noreferrer" class="underline hover:text-indigo-600">utlovat.se</a> (CC-BY-4.0) • Källkod: <a href="https://github.com/bambapappa/valturne" target="_blank" rel="noopener noreferrer" class="underline hover:text-indigo-600">bambapappa/valturne</a> (Apache 2.0)
          </p>
          ${this.isFallback ? '<p class="text-[10px] text-amber-600 dark:text-amber-400">Offline/Fallback-läge aktivt</p>' : ''}
        </footer>
        ${aboutHtml}
      </div>
    `;

    this.attachDomListeners();
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.showAboutModal) {
        this.showAboutModal = false;
        this.render();
      }
    });
  }

  private attachDomListeners() {
    // Start game button
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.state = createInitialState();
        this.state.phase = 'MAP';
        saveGameState(this.state);
        this.render();
      });
    }

    // About modal toggles
    const openAboutBtn = document.getElementById('btn-open-about');
    const openAboutStartBtn = document.getElementById('btn-open-about-start');
    if (openAboutBtn) {
      openAboutBtn.addEventListener('click', () => {
        this.showAboutModal = true;
        this.render();
      });
    }
    if (openAboutStartBtn) {
      openAboutStartBtn.addEventListener('click', () => {
        this.showAboutModal = true;
        this.render();
      });
    }

    const closeAboutBtn = document.getElementById('btn-close-about');
    const closeAboutBottomBtn = document.getElementById('btn-close-about-bottom');
    if (closeAboutBtn) {
      closeAboutBtn.addEventListener('click', () => {
        this.showAboutModal = false;
        this.render();
      });
    }
    if (closeAboutBottomBtn) {
      closeAboutBottomBtn.addEventListener('click', () => {
        this.showAboutModal = false;
        this.render();
      });
    }

    // Map region clicks
    const regionSvgGroups = this.appEl.querySelectorAll('.region-group');
    regionSvgGroups.forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-region-id') as RegionId;
        if (id) {
          this.selectedRegionId = id;
          this.render();
        }
      });
    });

    const regionCards = this.appEl.querySelectorAll('[data-region-card]');
    regionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-region-card') as RegionId;
        if (id) {
          this.selectedRegionId = id;
          this.render();
        }
      });
    });

    // Confirm Region / Start Dilemma
    const confirmRegionBtn = document.getElementById('btn-confirm-region');
    if (confirmRegionBtn) {
      confirmRegionBtn.addEventListener('click', () => {
        const regionId = (confirmRegionBtn.getAttribute('data-region-id') as RegionId) || this.selectedRegionId || 'stockholm';
        this.startDilemma(regionId);
      });
    }

    // Dilemma Choice Buttons (A, B, C)
    const choiceButtons = this.appEl.querySelectorAll('[data-choice]');
    choiceButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-choice') as StrategicChoice;
        if (choice) {
          this.handleChoice(choice);
        }
      });
    });

    // Next Turn Button
    const nextTurnBtn = document.getElementById('btn-next-turn');
    if (nextTurnBtn) {
      nextTurnBtn.addEventListener('click', () => {
        if (this.state.day <= 0 || this.state.budget <= 0) {
          this.state.phase = 'ELECTION_DAY';
        } else {
          this.state.phase = 'MAP';
          this.state.currentDilemma = null;
        }
        saveGameState(this.state);
        this.render();
      });
    }

    // Restart game
    const restartBtn = document.getElementById('btn-restart-game');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        clearGameState();
        this.state = createInitialState();
        this.render();
      });
    }

    // Save Highscore
    const saveScoreBtn = document.getElementById('btn-save-score');
    if (saveScoreBtn && this.state.electionResult) {
      saveScoreBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('input-player-name') as HTMLInputElement;
        const name = nameInput?.value.trim() || 'Kampanjledare';
        if (this.state.electionResult) {
          saveHighScore({
            playerName: name,
            finalScore: this.state.electionResult.finalScore,
            mandatesWon: this.state.electionResult.mandatesWon,
            totalVotesPercent: this.state.electionResult.totalVotesPercent,
            trustFinal: this.state.electionResult.trustFinal,
            gradeTitle: this.state.electionResult.gradeTitle,
          });
          saveScoreBtn.innerText = '✓ Sparat!';
          (saveScoreBtn as HTMLButtonElement).disabled = true;
          saveScoreBtn.classList.add('opacity-70', 'cursor-not-allowed');
        }
      });
    }
  }

  private startDilemma(regionId: RegionId) {
    const usedPromiseIds = new Set(this.state.promisesMade.map((p) => p.promise.id));
    const partyHistory = this.state.eventHistory.map((h) => h.promise.parties[0]);

    const promise = selectDilemmaPromise(this.promises, regionId, usedPromiseIds, partyHistory);

    this.state.currentRegionId = regionId;
    this.state.currentDilemma = {
      promise,
      regionId,
    };
    this.state.phase = 'EVENT';
    saveGameState(this.state);
    this.render();
  }

  private handleChoice(choice: StrategicChoice) {
    this.state = applyChoice(this.state, choice);
    saveGameState(this.state);
    this.render();
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ValturneApp();
  app.init();
});
