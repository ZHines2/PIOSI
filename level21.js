/**
 * level21.js
 *
 * This file defines the configuration for level 21, which is a pseudo endless mode.
 * Enemies are drawn from a pool with varying base stats that increase in difficulty
 * depending on the number of turns taken.
 */

// Helper function to generate a random integer within a range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate enemies with increasing difficulty based on turns taken
function generateEnemies(turnsTaken) {
  const baseStats = {
    attack: 5,
    range: 1,
    hp: 20,
    agility: 2
  };

  const difficultyMultiplier = 1 + Math.floor(turnsTaken / 10);

  const enemies = [];
  for (let i = 0; i < 5; i++) {
    enemies.push({
      name: `Enemy ${i + 1}`,
      symbol: "⚔",
      attack: baseStats.attack * difficultyMultiplier,
      range: baseStats.range,
      hp: baseStats.hp * difficultyMultiplier,
      agility: baseStats.agility * difficultyMultiplier,
      x: getRandomInt(0, 9),
      y: getRandomInt(0, 9)
    });
  }

  return enemies;
}

// Function to handle wall collapse, spawn new enemies, and reset wall HP
function handleWallCollapse(turnsTaken, logCallback) {
  logCallback('The Wall Collapses!');
  const newEnemies = generateEnemies(turnsTaken);
  const newWallHP = 100 + turnsTaken * 10; // Reset wall HP to a higher number
  logCallback(`New enemies have spawned and the wall HP has been reset to ${newWallHP}!`);
  return { newEnemies, newWallHP };
}

export const level21 = {
  level: 21,
  title: "Level 21: Pseudo Endless Mode",
  rows: 10,
  cols: 10,
  wallHP: 100,
  generateEnemies: true,
  enemyGenerator: (rows, cols, turnsTaken) => generateEnemies(turnsTaken),
  handleWallCollapse: (turnsTaken, logCallback) => handleWallCollapse(turnsTaken, logCallback)
};
