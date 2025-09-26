/**
 * @typedef {Object} Hero
 * @property {string} name - The hero's name
 * @property {string} symbol - The hero's symbol
 * @property {string} sprite - Path to the hero's sprite
 * @property {number} attack - Attack damage
 * @property {number} range - Attack range
 * @property {number} agility - Movement speed/agility
 * @property {number} hp - Hit points
 * @property {number} maxHp - Maximum hit points
 * @property {number} x - Current X position
 * @property {number} y - Current Y position
 * @property {number} movePoints - Remaining movement points
 * @property {boolean} hasAttacked - Whether hero has attacked this turn
 * @property {Object} abilities - Special abilities and stats
 */

/**
 * @typedef {Object} Enemy
 * @property {string} name - The enemy's name
 * @property {string} symbol - The enemy's symbol
 * @property {number} attack - Attack damage
 * @property {number} range - Attack range
 * @property {number} hp - Hit points
 * @property {number} maxHp - Maximum hit points
 * @property {number} agility - Movement speed
 * @property {number} x - Current X position
 * @property {number} y - Current Y position
 * @property {Array<string>} dialogue - Enemy dialogue options
 */

/**
 * @typedef {Object} Level
 * @property {number} level - Level number
 * @property {string} title - Level title
 * @property {number} rows - Grid height
 * @property {number} cols - Grid width
 * @property {number} wallHP - Wall hit points
 * @property {Array<Enemy>} enemies - Enemy array
 * @property {Function} [enemyGenerator] - Dynamic enemy generator
 * @property {Array<Array<string>>} [layout] - Level layout
 */

/**
 * @typedef {Object} GameState
 * @property {string} currentScreen - Current game screen
 * @property {number} currentLevel - Current level number
 * @property {Array<Hero>} party - Player's party
 * @property {Array<Enemy>} enemies - Current enemies
 * @property {number} playerScore - Player's score
 * @property {number} maxScore - Maximum possible score
 * @property {Set<string>} discoveredZones - Discovered zones
 * @property {boolean} gameStarted - Whether game has started
 * @property {boolean} attackMode - Whether in attack mode
 */

export {};