import { state } from './state.js';
import { logMessage, clearLog } from './logger.js';
import { renderBattlefield } from './renderer.js';
import { showScreen } from './screenManager.js';
import { fadeOut, stopAudio } from './audioManager.js';
import { updateModeUpHeroDisplay } from './modeUpUI.js';
import { applyModeUp } from './modeup.js';
import { BattleEngine } from './battleEngine.js';
import { SummitMode } from './summitMode.js';

export function initializeBattle() {
  const settings = state.getLevel(state.level);
  if (!settings) {
    showScreen('victory');
    return;
  }
  const { rows, cols, wallHP, title, enemies: levelEnemies } = settings;
  document.getElementById('level-title').textContent = title;
  state.enemies = levelEnemies;
  state.battleEngine = new BattleEngine(
    state.party, state.enemies,
    rows, cols, wallHP,
    logMessage, onLevelComplete, onGameOver
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
    showScreen('victory');
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
  document.getElementById('game-over').style.display = 'flex';
  stopAudio(document.getElementById('level-6-music'));
}

export function showModeUpWindow() {
  state.livingHeroes = state.party.filter(h => h.hp > 0);
  if (state.livingHeroes.length === 0) {
    setTimeout(initializeBattle, 500);
    return;
  }
  state.modeUpIndex = 0;
  showScreen('modeUp');
  updateModeUpHeroDisplay();
  if (state.level === 4) fadeOut(document.getElementById('background-music'));
}

export function applyCurrentModeUp() {
  if (state.livingHeroes.length > 0) {
    applyModeUp(state.livingHeroes[state.modeUpIndex], state.level, state.party, logMessage);
    showScreen('battle');
    state.level++;
    setTimeout(initializeBattle, 2000);
  }
}

export function startGame() {
  if (state.selectedHeroes.length !== 3) {
    alert('Select exactly 3 heroes!');
    return;
  }
  const heroSelectMusic = document.getElementById('hero-select-music');
  const backgroundMusic = document.getElementById('background-music');
  fadeOut(heroSelectMusic, () => backgroundMusic.play().catch(() => {}));
  state.party = state.selectedHeroes.map(i => Object.assign({}, state.allHeroes[i]));
  state.party.sort((a, b) => b.agility - a.agility);
  initializeBattle();
  showScreen('battle');
}

export function restartGame() {
  state.level = 1;
  state.selectedHeroes = [];
  state.party = [];
  state.heroIndex = 0;
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
  showScreen('title');
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
  const summitMode = new SummitMode(logCallback, onGameOver, () => showScreen('victory'));
  summitMode.start();
  showScreen('summitMode');
}

export function startEmanationsMode() {
  showScreen('emanationsMode');
}
