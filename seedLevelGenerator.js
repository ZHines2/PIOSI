/**
 * seedLevelGenerator.js
 *
 * This module implements a seed-based system to generate game level configurations.
 * Each level is generated based on a numeric seed so that the same seed always produces
 * the same level layout. Level properties include grid dimensions, wallHP,
 * and an array of enemy configurations with random stats and positions.
 *
 * This module uses a simple pseudo-random number generator (PRNG) called mulberry32.
 */

// A simple PRNG using the mulberry32 algorithm.
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a level configuration based on the provided seed.
 *
 * @param {number} seed - A numeric seed value.
 * @returns {object} An object representing the level configuration.
 */
function generateLevelFromSeed(seed) {
  const rand = mulberry32(seed);

  // Generate grid dimensions between 5 and 15.
  const rows = Math.floor(rand() * 11) + 5;
  const cols = Math.floor(rand() * 11) + 5;
  // Generate wallHP between 20 and 220.
  const wallHP = Math.floor(rand() * 200) + 20;
  // Generate a number of enemies between 1 and 5.
  const numberOfEnemies = Math.floor(rand() * 5) + 1;

  // Generate enemy configurations.
  const enemySymbols = ["*", "!", "X", "O"];
  const enemies = [];

  for (let i = 0; i < numberOfEnemies; i++) {
    enemies.push({
      name: `Enemy #${i + 1}`,
      symbol: enemySymbols[Math.floor(rand() * enemySymbols.length)],
      attack: Math.floor(rand() * 10) + 1,
      range: Math.floor(rand() * 2) + 1,
      hp: Math.floor(rand() * 50) + 10,
      agility: Math.floor(rand() * 3) + 1,
      // Ensure enemy positions are within bounds.
      x: Math.floor(rand() * cols),
      y: Math.floor(rand() * rows)
    });
  }

  return {
    level: seed, // Using the seed as the level identifier.
    title: `Level Generated from Seed: ${seed}`,
    rows,
    cols,
    wallHP,
    enemies
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateLevelFromSeed };
} else {
  window.generateLevelFromSeed = generateLevelFromSeed;
}