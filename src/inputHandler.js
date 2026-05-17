import { state } from './state.js';
import { logMessage, recordAttack } from './logger.js';
import { renderBattlefield } from './renderer.js';
import { showScreen } from './screenManager.js';
import { updateHeroDisplay, selectHero } from './partySelectUI.js';
import { updateModeUpHeroDisplay } from './modeUpUI.js';
import {
  startGame, activateCheat, restartGame, worldMapCheatCode,
  applyCurrentModeUp, startSummitMode, startEmanationsMode,
} from './gameFlow.js';
import { moveSelectionLeft, moveSelectionRight, selectCurrentNode } from './worldMap.js';
import { playNextSong, playPreviousSong, togglePlayPause } from './emanations.js';

const cheatSequence = ['ArrowLeft','ArrowLeft','ArrowRight','ArrowRight','ArrowUp','ArrowUp','ArrowDown','Space'];
const worldMapCheat = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','Space'];
let cheatBuffer = [];

const keyActions = {
  title: {
    Space: () => {
      showScreen('party');
      updateHeroDisplay();
      document.getElementById('hero-select-music').play().catch(() => {});
    },
  },
  party: {
    ArrowLeft: () => {
      state.heroIndex = (state.heroIndex - 1 + state.allHeroes.length) % state.allHeroes.length;
      updateHeroDisplay();
    },
    ArrowRight: () => {
      state.heroIndex = (state.heroIndex + 1) % state.allHeroes.length;
      updateHeroDisplay();
    },
    Space: () => {
      if (state.selectedHeroes.length < 3 || !state.selectedHeroes.includes(state.heroIndex)) {
        selectHero();
      } else {
        startGame();
      }
      updateHeroDisplay();
    },
  },
  battle: {
    Space: () => {
      state.battleEngine.awaitingAttackDirection = true;
      logMessage(`${state.party[state.battleEngine.currentUnit].name} is ready to attack! Choose a direction.`);
      renderBattlefield();
    },
    ArrowUp: async () => {
      if (state.battleEngine.awaitingAttackDirection) {
        await state.battleEngine.attackInDirection(0, -1, state.party[state.battleEngine.currentUnit], recordAttack);
      } else {
        state.battleEngine.moveUnit(0, -1);
      }
      renderBattlefield();
    },
    ArrowDown: async () => {
      if (state.battleEngine.awaitingAttackDirection) {
        await state.battleEngine.attackInDirection(0, 1, state.party[state.battleEngine.currentUnit], recordAttack);
      } else {
        state.battleEngine.moveUnit(0, 1);
      }
      renderBattlefield();
    },
    ArrowLeft: async () => {
      if (state.battleEngine.awaitingAttackDirection) {
        await state.battleEngine.attackInDirection(-1, 0, state.party[state.battleEngine.currentUnit], recordAttack);
      } else {
        state.battleEngine.moveUnit(-1, 0);
      }
      renderBattlefield();
    },
    ArrowRight: async () => {
      if (state.battleEngine.awaitingAttackDirection) {
        await state.battleEngine.attackInDirection(1, 0, state.party[state.battleEngine.currentUnit], recordAttack);
      } else {
        state.battleEngine.moveUnit(1, 0);
      }
      renderBattlefield();
    },
  },
  victory: { Space: () => restartGame() },
  'game-over': { Space: () => restartGame() },
  modeUp: {
    ArrowLeft: () => {
      if (state.livingHeroes.length > 0) {
        state.modeUpIndex = (state.modeUpIndex - 1 + state.livingHeroes.length) % state.livingHeroes.length;
        updateModeUpHeroDisplay();
      }
    },
    ArrowRight: () => {
      if (state.livingHeroes.length > 0) {
        state.modeUpIndex = (state.modeUpIndex + 1) % state.livingHeroes.length;
        updateModeUpHeroDisplay();
      }
    },
    Space: () => applyCurrentModeUp(),
  },
  worldMap: {
    ArrowLeft: () => moveSelectionLeft(),
    ArrowRight: () => moveSelectionRight(),
    Space: () => selectCurrentNode(activateCheat, startSummitMode, startEmanationsMode),
  },
  summitMode: {
    ArrowLeft: () => {},
    ArrowRight: () => {},
    ArrowUp: () => {},
    ArrowDown: () => {},
    Space: () => {},
  },
  emanationsMode: {
    ArrowLeft: () => playPreviousSong(),
    ArrowRight: () => playNextSong(),
    Space: () => togglePlayPause(),
  },
};

export function initInputHandler() {
  document.addEventListener('keydown', async (event) => {
    cheatBuffer.push(event.code);
    if (cheatBuffer.length > Math.max(cheatSequence.length, worldMapCheat.length)) {
      cheatBuffer.shift();
    }
    if (cheatBuffer.join() === cheatSequence.join()) {
      activateCheat();
      cheatBuffer = [];
      return;
    }
    if (cheatBuffer.slice(-worldMapCheat.length).join() === worldMapCheat.join()) {
      worldMapCheatCode();
      cheatBuffer = [];
      return;
    }
    if (document.getElementById('game-over').style.display === 'flex') {
      const action = keyActions['game-over'][event.code] || keyActions['game-over'][event.key];
      if (action) { event.preventDefault(); await action(); }
      return;
    }
    const actions = keyActions[state.currentScreen];
    const action = actions && (actions[event.code] || actions[event.key]);
    if (action) { event.preventDefault(); await action(); }
  });

  if ('ontouchstart' in window) {
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('button, a, [role="button"]')) return;
      e.preventDefault();
      const touch = e.changedTouches[0];
      const x = touch.clientX, y = touch.clientY;
      const w = window.innerWidth, h = window.innerHeight;
      let code = 'Space', key = ' ';
      if (x < w * 0.2) { code = 'ArrowLeft'; key = 'ArrowLeft'; }
      else if (x > w * 0.8) { code = 'ArrowRight'; key = 'ArrowRight'; }
      else if (y < h * 0.2) { code = 'ArrowUp'; key = 'ArrowUp'; }
      else if (y > h * 0.8) { code = 'ArrowDown'; key = 'ArrowDown'; }
      document.dispatchEvent(new KeyboardEvent('keydown', { code, key }));
    });
  }

  document.getElementById('iso-toggle-btn').addEventListener('click', () => {
    state.isometricMode = !state.isometricMode;
    if (state.battleEngine) renderBattlefield();
  });

  document.getElementById('dpad-toggle-btn').addEventListener('click', () => {
    document.getElementById('mobile-dpad').classList.toggle('dpad-visible');
  });

  document.querySelectorAll('.dpad-btn').forEach(btn => {
    const dispatch = () => {
      const keyCode = btn.dataset.key;
      const keyVal = keyCode === 'Space' ? ' ' : keyCode;
      document.dispatchEvent(new KeyboardEvent('keydown', { code: keyCode, key: keyVal, bubbles: true, cancelable: true }));
    };
    btn.addEventListener('touchstart', e => { e.preventDefault(); dispatch(); });
    btn.addEventListener('click', dispatch);
  });
}
