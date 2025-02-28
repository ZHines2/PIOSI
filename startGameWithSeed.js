/**
 * startGameWithSeed.js
 *
 * This module shows how to integrate the seed-based level generator into the game flow.
 * After party selection, the player is prompted for a numeric seed,
 * which will be used to generate a suite of 25 levels.
 *
 * The first level is then started by setting up the battle engine with the generated level configuration.
 */

import { generateLevelFromSeed } from './seedLevelGenerator.js';
import { BattleEngine } from './battleEngine.js';

export function startGameWithSeed(party, logMessage, onLevelComplete, onGameOver) {
  // Prompt the player to enter a numeric seed.
  const input = prompt("Enter a numeric seed to generate 25 levels:");
  const baseSeed = parseInt(input, 10);
  if (isNaN(baseSeed)) {
    alert("Invalid seed. Please enter a valid number.");
    return null;
  }
  
  // Generate an array of 25 level configurations.
  const levelsSuite = [];
  for (let i = 0; i < 25; i++) {
    const currentSeed = baseSeed + i;
    const levelConfig = generateLevelFromSeed(currentSeed);
    levelsSuite.push(levelConfig);
  }
  console.log("Generated 25 Levels:", levelsSuite);
  
  // Initialize the first level from the suite.
  const currentLevelConfig = levelsSuite[0];
  const battleEngine = new BattleEngine(
    party,
    currentLevelConfig.enemies,
    currentLevelConfig.rows,
    currentLevelConfig.cols,
    currentLevelConfig.wallHP,
    logMessage,
    onLevelComplete,
    onGameOver
  );
  
  // You might store the levelsSuite and the current level index globally.
  return { battleEngine, levelsSuite, currentLevelIndex: 0 };
}