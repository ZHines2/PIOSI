import { state } from './state.js';
import { fadeOut } from './audioManager.js';
import { initWorldMap } from './worldMap.js';
import { createEmanationsUI } from './emanations.js';

export function showScreen(screen) {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('party-select').style.display = 'none';
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('victory').style.display = 'none';
  document.getElementById('world-map').style.display = 'none';
  document.getElementById('mode-up-window').style.display = 'none';
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('summit-mode').style.display = 'none';
  document.getElementById('emanations-mode').style.display = 'none';

  if (screen === 'title') {
    document.getElementById('title-screen').style.display = 'flex';
  } else if (screen === 'party') {
    document.getElementById('party-select').style.display = 'block';
  } else if (screen === 'battle') {
    document.getElementById('game-container').style.display = 'block';
  } else if (screen === 'victory') {
    document.getElementById('victory').style.display = 'block';
  } else if (screen === 'worldMap') {
    document.getElementById('world-map').style.display = 'flex';
    initWorldMap();
  } else if (screen === 'modeUp') {
    document.getElementById('mode-up-window').style.display = 'flex';
  } else if (screen === 'summitMode') {
    document.getElementById('summit-mode').style.display = 'flex';
  } else if (screen === 'emanationsMode') {
    Array.from(document.getElementsByTagName('audio'))
      .filter(a => a.id !== 'emanations-audio')
      .forEach(a => fadeOut(a));
    document.getElementById('emanations-mode').style.display = 'flex';
    createEmanationsUI();
  }
  state.currentScreen = screen;
}
