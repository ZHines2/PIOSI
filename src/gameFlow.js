import { state } from './state.js';
import { logMessage, clearLog } from './logger.js';
import { renderBattlefield } from './renderer.js';
import { showScreen } from './screenManager.js';
import { fadeOut, stopAudio } from './audioManager.js';
import { updateModeUpHeroDisplay } from './modeUpUI.js';
import { applyModeUp, getModeUpOptions } from './modeup.js';
import { BattleEngine } from './battleEngine.js';
import { SummitMode } from './summitMode.js';
import { getGriotReaction } from './griot.js';

export function initializeBattle() {
  const settings = state.getLevel(state.level);
  if (!settings) {
    showScreen('victory');
    return;
  }
  const { rows, cols, wallHP, title, enemies: levelEnemies, layout } = settings;
  document.getElementById('level-title').textContent = title;
  state.enemies = levelEnemies;
  state.battleEngine = new BattleEngine(
    state.party, state.enemies,
    rows, cols, wallHP,
    logMessage, onLevelComplete, onGameOver,
    layout || null
  );
  renderBattlefield();

  if (state.level === 5) document.getElementById('level-5-music').play().catch(() => {});
  if (state.level === 6) document.getElementById('level-6-music').play().catch(() => {});
  if (state.level === 99) {
    logMessage('Entering Level 99: The Hidden Arena!');
    showScreen('battle');
  }
}

export function onLevelComplete() {
  const worldMapEnabled = state.loadedManifest ? state.loadedManifest.modes.worldMap : true;
  if (state.level === 99) {
    logMessage('The veil of introspection lifts...');
    logMessage("You've broken through! The eternal wall falls!");
    _showVictoryWithGriot();
  } else if (state.level === 20 && worldMapEnabled) {
    logMessage('Level 20 complete! Entering the world map...');
    showScreen('worldMap');
  } else {
    logMessage(`Level ${state.level} complete!`);
    showModeUpWindow();
  }
  if (state.level === 5) fadeOut(document.getElementById('level-5-music'));
}

export function onGameOver() {
  stopAudio(document.getElementById('level-6-music'));
  getGriotReaction().then(line => {
    const el = document.getElementById('game-over-griot');
    if (el) el.textContent = line;
  }).catch(() => {});
  document.getElementById('game-over').style.display = 'flex';
}

function _showVictoryWithGriot() {
  getGriotReaction().then(line => {
    const el = document.getElementById('victory-griot');
    if (el) el.textContent = line;
  }).catch(() => {});
  showScreen('victory');
}

export function showModeUpWindow() {
  state.livingHeroes = state.party.filter(h => h.hp > 0);
  if (state.livingHeroes.length === 0) {
    setTimeout(initializeBattle, 500);
    return;
  }
  state.modeUpIndex = 0;
  state.modeUpOptionIndex = 0;
  showScreen('modeUp');
  updateModeUpHeroDisplay();
  if (state.level === 4) fadeOut(document.getElementById('background-music'));
}

export function applyCurrentModeUp() {
  if (state.livingHeroes.length > 0) {
    const hero = state.livingHeroes[state.modeUpIndex];
    const options = getModeUpOptions(hero, state.level);
    const chosenBuff = options[state.modeUpOptionIndex] || options[0];
    applyModeUp(hero, state.level, state.party, logMessage, chosenBuff);

    // Mode Up ceremony: pulse the window before transitioning
    const win = document.getElementById('mode-up-window');
    if (win) win.classList.add('modeup-pulse');
    setTimeout(() => {
      if (win) win.classList.remove('modeup-pulse');
      showScreen('battle');
      state.level++;
      setTimeout(initializeBattle, 2000);
    }, 600);
  }
}

export function startGame() {
  if (state.selectedHeroes.length < 1) {
    return; // Start button only appears when ≥1 hero selected; no alert needed
  }
  const heroSelectMusic = document.getElementById('hero-select-music');
  const backgroundMusic = document.getElementById('background-music');
  fadeOut(heroSelectMusic, () => backgroundMusic.play().catch(() => {}));
  state.party = state.selectedHeroes.map(i => Object.assign({}, state.allHeroes[i]));
  state.party.sort((a, b) => (b.agility || 0) - (a.agility || 0));
  initializeBattle();
  showScreen('battle');
}

export function restartGame() {
  state.level = 1;
  state.selectedHeroes = [];
  state.party = [];
  state.heroIndex = 0;
  state.modeUpOptionIndex = 0;
  state.cheatActive = false;
  clearLog();
  document.getElementById('game-over').style.display = 'none';
  stopAudio(document.getElementById('background-music'));
  stopAudio(document.getElementById('level-5-music'));
  stopAudio(document.getElementById('level-6-music'));
  const heroSelectMusic = document.getElementById('hero-select-music');
  heroSelectMusic.currentTime = 0;
  heroSelectMusic.volume = 1;
  heroSelectMusic.play().catch(() => {});
  showScreen('party');
  // Re-import updateHeroDisplay dynamically to avoid circular dep
  import('./partySelectUI.js').then(m => m.updateHeroDisplay()).catch(() => {});
}

export function activateCheat() {
  if (!state.cheatActive) {
    state.cheatActive = true;
    console.log('Cheat code detected! Activating Level 99: The Hidden Arena!');
    state.level = 99;
    initializeBattle();
  }
}

export function worldMapCheatCode() {
  if (state.loadedManifest && !state.loadedManifest.modes.worldMap) {
    console.log('World map is disabled in CORE mode.');
    return;
  }
  console.log('World Map cheat code detected! Opening THE BROADLANDS!');
  showScreen('worldMap');
}

export function startSummitMode() {
  const logCallback = message => {
    const logDiv = document.getElementById('summit-log');
    logDiv.innerHTML += `<p>${message}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
  };
  const summitMode = new SummitMode(logCallback, onGameOver, () => _showVictoryWithGriot());
  summitMode.start();
  showScreen('summitMode');
}

export function startEmanationsMode() {
  showScreen('emanationsMode');
}
