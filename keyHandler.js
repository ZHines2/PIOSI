/**
 * keyHandler.js
 *
 * This file contains the logic for handling key events for different game screens.
 * The `handleKeyDown` function is exported and used in `index.html`.
 */

import { renderBattlefield } from './renderer.js';
import { logMessage } from './logger.js';
import { recordAttack } from './index.js';
import { moveSelectionLeft, moveSelectionRight, selectCurrentNode } from './worldMap.js';
import { playPreviousSong, playNextSong, togglePlayPause } from './emanations.js';

let battleEngine;
let party;
let livingHeroes;
let modeUpIndex;
let currentScreen;
let selectedHeroes;
let heroIndex;
let allHeroes;
let level;
let cheatActive;
let cheatBuffer;
let cheatSequence;
let worldMapCheat;

export function handleKeyDown(event) {
  const keyActions = {
    title: {
      Space: () => {
        showScreen("party");
        updateHeroDisplay();
        document.getElementById("hero-select-music").play().catch(() => {});
      }
    },
    party: {
      ArrowLeft: () => {
        heroIndex = (heroIndex - 1 + allHeroes.length) % allHeroes.length;
        updateHeroDisplay();
      },
      ArrowRight: () => {
        heroIndex = (heroIndex + 1) % allHeroes.length;
        updateHeroDisplay();
      },
      Space: () => {
        if (
          selectedHeroes.length < 3 ||
          !selectedHeroes.includes(heroIndex)
        ) {
          selectHero();
        } else {
          startGame();
        }
        updateHeroDisplay();
      }
    },
    battle: {
      Space: () => {
        battleEngine.awaitingAttackDirection = true;
        logMessage(
          `${party[battleEngine.currentUnit].name} is ready to attack! Choose a direction.`
        );
        renderBattlefield();
      },
      ArrowUp: async () => {
        if (battleEngine.awaitingAttackDirection) {
          await battleEngine.attackInDirection(
            0,
            -1,
            party[battleEngine.currentUnit],
            recordAttack
          );
        } else {
          battleEngine.moveUnit(0, -1);
        }
        renderBattlefield();
      },
      ArrowDown: async () => {
        if (battleEngine.awaitingAttackDirection) {
          await battleEngine.attackInDirection(
            0,
            1,
            party[battleEngine.currentUnit],
            recordAttack
          );
        } else {
          battleEngine.moveUnit(0, 1);
        }
        renderBattlefield();
      },
      ArrowLeft: async () => {
        if (battleEngine.awaitingAttackDirection) {
          await battleEngine.attackInDirection(
            -1,
            0,
            party[battleEngine.currentUnit],
            recordAttack
          );
        } else {
          battleEngine.moveUnit(-1, 0);
        }
        renderBattlefield();
      },
      ArrowRight: async () => {
        if (battleEngine.awaitingAttackDirection) {
          await battleEngine.attackInDirection(
            1,
            0,
            party[battleEngine.currentUnit],
            recordAttack
          );
        } else {
          battleEngine.moveUnit(1, 0);
        }
        renderBattlefield();
      }
    },
    victory: {
      Space: () => restartGame()
    },
    "game-over": {
      Space: () => restartGame()
    },
    modeUp: {
      ArrowLeft: () => {
        if (livingHeroes.length > 0) {
          modeUpIndex =
            (modeUpIndex - 1 + livingHeroes.length) % livingHeroes.length;
          updateModeUpHeroDisplay();
        }
      },
      ArrowRight: () => {
        if (livingHeroes.length > 0) {
          modeUpIndex = (modeUpIndex + 1) % livingHeroes.length;
          updateModeUpHeroDisplay();
        }
      },
      Space: () => {
        applyCurrentModeUp();
      }
    },
    worldMap: {
      ArrowLeft: () => {
        moveSelectionLeft();
      },
      ArrowRight: () => {
        moveSelectionRight();
      },
      Space: () => {
        selectCurrentNode(activateCheat, startSummitMode, startEmanationsMode);
      }
    },
    summitMode: {
      ArrowLeft: () => {
        // Handle left arrow key in summit mode
      },
      ArrowRight: () => {
        // Handle right arrow key in summit mode
      },
      ArrowUp: () => {
        // Handle up arrow key in summit mode
      },
      ArrowDown: () => {
        // Handle down arrow key in summit mode
      },
      Space: () => {
        // Handle spacebar in summit mode
      }
    },
    emanationsMode: {
      ArrowLeft: () => {
        playPreviousSong();
      },
      ArrowRight: () => {
        playNextSong();
      },
      Space: () => {
        // Toggle play/pause on space key press
        togglePlayPause();
      }
    }
  };

  const actions = keyActions[currentScreen];
  if (actions && actions[event.key]) {
    actions[event.key]();
  }

  // Handle cheat code detection
  cheatBuffer.push(event.key);
  if (cheatBuffer.length > cheatSequence.length) {
    cheatBuffer.shift();
  }
  if (cheatBuffer.join("") === cheatSequence.join("")) {
    activateCheat();
  }

  // Handle world map cheat code detection
  if (cheatBuffer.join("") === worldMapCheat.join("")) {
    worldMapCheatCode();
  }
}
