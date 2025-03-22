/**
 * burn.js
 *
 * This module handles the processing of the burn status effect.
 * The new algorithm scales the burn damage higher by computing the damage
 * as twice the burn level.
 *
 * Functions:
 * - applyBurn(enemy, logCallback):
 *     Applies a tick of burn damage to an enemy. Increments the internal counter,
 *     checks if the effect should trigger damage based on a computed interval,
 *     applies the damage, and decreases the remaining duration.
 */

/**
 * Computes the burn damage based on the burn level.
 * This function scales the damage so that higher burn levels yield more damage.
 *
 * @param {number} level - The burn level.
 * @returns {number} - The computed damage (scales as level times 2).
 */
function computeBurnDamage(level) {
  return level * 2;
}

/**
 * Applies a tick of burn damage to an enemy based on its burn status effect.
 *
 * @param {object} enemy - The enemy object which has the burn status effect.
 *        enemy.statusEffects.burn should be an object with properties:
 *           level: number     // current burn level
 *           duration: number  // remaining ticks for the burn effect
 *           counter: number   // internal counter tracking ticks
 * @param {function} logCallback - Function to log messages.
 */
export function applyBurn(enemy, logCallback) {
  // Ensure the enemy has a valid burn status effect.
  if (!enemy.statusEffects.burn) return;

  const burnData = enemy.statusEffects.burn;

  // Increment the counter to track ticks.
  burnData.counter++;

  // Determine the trigger interval based on the burn level.
  // A higher burn level means damage is applied more frequently.
  // For example, an interval computed as Math.max(5 - level, 1).
  const triggerInterval = Math.max(5 - burnData.level, 1);

  // If it's the correct tick, apply damage.
  if (burnData.counter % triggerInterval === 0) {
    const damage = computeBurnDamage(burnData.level);
    logCallback(`${enemy.name} takes ${damage} burn damage due to its burn effect!`);
    enemy.hp -= damage;
  }

  // Decrement the remaining duration on every tick.
  burnData.duration--;

  // When the effect expires, remove it.
  if (burnData.duration <= 0) {
    logCallback(`${enemy.name}'s burn effect wears off.`);
    delete enemy.statusEffects.burn;
  }
}
