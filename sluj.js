/**
 * sluj.js
 * 
 * This module handles the processing of the slüj status effect.
 * The new algorithm scales the slüj damage higher by computing the damage
 * as twice the slüj level.
 *
 * Functions:
 * - applySlujEffect(enemy, logCallback):
 *     Applies a tick of slüj damage to an enemy. Increments the internal counter,
 *     checks if the effect should trigger damage based on a computed interval,
 *     applies the damage, and decreases the remaining duration.
 */

/**
 * Computes the slüj damage based on the slüj level.
 * This function scales the damage so that higher slüj levels yield more damage.
 *
 * @param {number} level - The slüj level.
 * @returns {number} - The computed damage (scales as level times 2).
 */
function computeSlujDamage(level) {
  return level * 2;
}

/**
 * Applies a tick of slüj damage to an enemy based on its slüj status effect.
 *
 * @param {object} enemy - The enemy object which has the slüj status effect.
 *        enemy.statusEffects.sluj should be an object with properties:
 *           level: number     // current slüj level
 *           duration: number  // remaining ticks for the slüj effect
 *           counter: number   // internal counter tracking ticks
 * @param {function} logCallback - Function to log messages.
 */
export function applySlujEffect(enemy, logCallback) {
  // Ensure the enemy has a valid slüj status effect.
  if (!enemy.statusEffects.sluj) return;

  const slujData = enemy.statusEffects.sluj;

  // Increment the counter to track ticks.
  slujData.counter++;

  // Determine the trigger interval based on the slüj level.
  // A higher slüj level means damage is applied more frequently.
  // For example, an interval computed as Math.max(5 - level, 1).
  const triggerInterval = Math.max(5 - slujData.level, 1);

  // If it's the correct tick, apply damage.
  if (slujData.counter % triggerInterval === 0) {
    const damage = computeSlujDamage(slujData.level);
    logCallback(`${enemy.name} takes ${damage} slüj damage due to its slüj effect!`);
    enemy.hp -= damage;
  }

  // Decrement the remaining duration on every tick.
  slujData.duration--;

  // When the effect expires, remove it.
  if (slujData.duration <= 0) {
    logCallback(`${enemy.name}'s slüj effect wears off.`);
    delete enemy.statusEffects.sluj;
  }
}