/**
 * applyKnockback.js
 *
 * This file contains the logic for applying knockback (yeet) effects to enemies.
 * The function `applyKnockback` is used to handle the knockback logic for modularity.
 */

/**
 * Applies knockback (yeet) to an enemy.
 * @param {Object} enemy - The enemy to apply knockback to.
 * @param {number} dx - The x-direction of the knockback.
 * @param {number} dy - The y-direction of the knockback.
 * @param {number} yeet - The knockback distance.
 * @param {number} attack - The attack power of the hero applying the knockback.
 * @param {Array} battlefield - The battlefield grid.
 * @param {Function} logCallback - The callback function for logging messages.
 * @param {Function} isWithinBounds - The function to check if a position is within bounds.
 */
export function applyKnockback(enemy, dx, dy, yeet, attack, battlefield, logCallback, isWithinBounds) {
  // Store the enemy's original position for relative movement.
  const originalX = enemy.x;
  const originalY = enemy.y;
  for (let i = 1; i <= yeet; i++) {
    const newX = originalX + dx * i;
    const newY = originalY + dy * i;
    if (!isWithinBounds(newX, newY)) {
      logCallback(`${enemy.name} is knocked back into the wall and takes ${attack} damage!`);
      enemy.hp -= attack;
      break;
    }
    if (battlefield[newY][newX] === 'ᚙ' || battlefield[newY][newX] === '█') {
      logCallback(`${enemy.name} collides with the wall during knockback and takes ${attack} damage!`);
      enemy.hp -= attack;
      break;
    }
    if (battlefield[newY][newX] === '.') {
      // Clear the enemy's previous position.
      battlefield[enemy.y][enemy.x] = '.';
      // Update enemy's position.
      enemy.x = newX;
      enemy.y = newY;
      battlefield[newY][newX] = enemy.symbol;
    }
  }
}
