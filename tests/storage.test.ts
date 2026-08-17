import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllStorage,
  clearGameState,
  getHighScores,
  loadGameState,
  saveGameState,
  saveHighScore,
} from '../src/storage';
import { createInitialState } from '../src/engine';

describe('Storage Module', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('saves and retrieves highscores in descending order', () => {
    expect(getHighScores()).toEqual([]);

    saveHighScore({
      playerName: 'Player 1',
      finalScore: 12000,
      mandatesWon: 130,
      totalVotesPercent: 37.5,
      trustFinal: 60,
      gradeTitle: 'Stabil kampanj',
    });

    saveHighScore({
      playerName: 'Player 2',
      finalScore: 18000,
      mandatesWon: 180,
      totalVotesPercent: 51.2,
      trustFinal: 85,
      gradeTitle: 'Jordskredsseger',
    });

    const scores = getHighScores();
    expect(scores).toHaveLength(2);
    expect(scores[0].playerName).toBe('Player 2'); // Highest first
    expect(scores[1].playerName).toBe('Player 1');
  });

  it('saves, loads and clears game state', () => {
    const state = createInitialState();
    state.day = 14;
    state.budget = 240000;

    saveGameState(state);
    const loaded = loadGameState();
    expect(loaded).toBeDefined();
    expect(loaded?.day).toBe(14);
    expect(loaded?.budget).toBe(240000);

    clearGameState();
    expect(loadGameState()).toBeNull();
  });
});
