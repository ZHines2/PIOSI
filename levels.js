/**
 * levels.js
 *
 * Tutorial:
 * This module defines game level configurations in a scalable and maintainable way.
 * Each level object includes:
 *   - level: numeric identifier
 *   - title: descriptive title
 *   - rows & cols: grid dimensions
 *   - wallHP: structural health to break through
 *   - enemies: array of enemy configuration objects (optional)
 *   - generateEnemies: boolean for dynamic enemy placement (optional)
 *   - enemyGenerator: function for generating enemies dynamically (optional)
 *
 * Modification for Cheat Level:
 * A special “Cheat Level” (level 99) is added at the end of this file.
 * When the cheat code is detected in the main game, you can override the normal flow
 * to load this cheat level.
 */

export const levelSettings = [
  {
    level: 1,
    title: "Level 1: The Breaking Wall",
    rows: 5,
    cols: 10,
    wallHP: 20,
    enemies: []
  },
  {
    level: 2,
    title: "Level 2: The Reinforced Barricade",
    rows: 7,
    cols: 12,
    wallHP: 40,
    enemies: [
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 3
      },
      {
        name: "Brigand",
        symbol: "Җ",
        attack: 3,
        range: 1,
        hp: 12,
        agility: 2,
        enemyXOffset: 5
      }
    ]
  },
  {
    level: 3,
    title: "Level 3: The Vertical Corridor",
    rows: 14,
    cols: 3,
    wallHP: 60,
    generateEnemies: true,
    enemyGenerator: (rows, cols) => {
      const enemies = [];
      for (let col = 0; col < cols; col++) {
        enemies.push({
          name: "Buckleman",
          symbol: "⛨",
          attack: 1,
          range: 1,
          hp: 20,
          agility: 1,
          x: col,
          y: Math.floor(rows / 2)
        });
      }
      return enemies;
    }
  },
  {
    level: 4,
    title: "Level 4: Outside the Gratt",
    rows: 3,
    cols: 15,
    wallHP: 70,
    enemies: [
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 0 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 11, y: 1 },
      { name: "Buckleman", symbol: "⛨", attack: 1, range: 1, hp: 20, agility: 1, x: 8, y: 2 },
      { name: "Brigand", symbol: "Җ", attack: 3, range: 1, hp: 12, agility: 2, x: 12, y: 2 }
    ]
  },
  // Additional levels could go here.

  // Cheat Level: A special secret branch.
  {
    level: 99,
    title: "Level ௧: Further Introspection",
    rows: 15,
    cols: 15,
    wallHP: 100,
    enemies: [
      {
        name: "Shadow Duelist",
        symbol: "Ξ",
        attack: 5,
        range: 1,
        hp: 25,
        agility: 3,
        x: 10,
        y: 10
      },
      {
        name: "Spectral Archer",
        symbol: "↭",
        attack: 4,
        range: 3,
        hp: 15,
        agility: 2,
        x: 8,
        y: 2
      }
    ]
  }
];

/**
 * getLevel
 *
 * Returns a level configuration object based on the given level number.
 * - If generateEnemies is true, use enemyGenerator; otherwise use the static array.
 * - If any enemy has enemyXOffset, compute its x as (cols - enemyXOffset) and y as the center row.
 *
 * @param {number} levelNumber - The level to load.
 * @returns {object|null} The configured level object, or null if not found.
 */
export function getLevel(levelNumber) {
  const level = levelSettings.find(ls => ls.level === levelNumber);
  if (!level) return null;
  let enemies;

  if (level.generateEnemies && typeof level.enemyGenerator === "function") {
    enemies = level.enemyGenerator(level.rows, level.cols);
  } else {
    enemies = (level.enemies || []).map(enemy => {
      if (enemy.enemyXOffset !== undefined) {
        return {
          ...enemy,
          x: level.cols - enemy.enemyXOffset,
          y: Math.floor(level.rows / 2)
        };
      }
      return enemy;
    });
  }

  return {
    rows: level.rows,
    cols: level.cols,
    wallHP: level.wallHP,
    title: level.title,
    enemies
  };
}
