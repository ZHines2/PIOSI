/**
 * pickup.js
 *
 * Defines the base Pickup class and specialized pickup types.
 */

export class Pickup {
  constructor(x, y, symbol) {
    this.x = x;
    this.y = y;
    this.symbol = symbol;
  }

  /**
   * Apply the pickup's effect to the given hero.
   * Subclasses should override this method to provide a specific effect.
   *
   * @param {object} hero - The hero object that picked up the item.
   * @param {function} logCallback - A callback function for logging events.
   */
  applyEffect(hero, logCallback) {
    // Base pickup does nothing.
  }
}

export class Vittle extends Pickup {
  /**
   * Creates a new Vittle pickup.
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {number} healthBoost - The amount of health to restore.
   * @param {string} symbol - The symbol to display on the board (default 'ౚ').
   */
  constructor(x, y, healthBoost, symbol = 'ౚ') {
    super(x, y, symbol);
    this.healthBoost = healthBoost;
  }

  applyEffect(hero, logCallback) {
    hero.hp += this.healthBoost;
    if (typeof logCallback === 'function') {
      logCallback(
        `${hero.name} picks up a vittle for ${this.healthBoost} HP! (New HP: ${hero.hp})`
      );
    }
  }
}

export class MushroomPickup extends Pickup {
  /**
   * Creates a new Mushroom Pickup.
   *
   * This pickup always increases health by 1.
   *
   * @param {number} x - X coordinate.
   * @param {number} y - Y coordinate.
   * @param {string} symbol - The symbol to display on the board (default 'ඉ').
   */
  constructor(x, y, symbol = 'ඉ') {
    super(x, y, symbol);
    this.healthBoost = 1;
  }

  applyEffect(hero, logCallback) {
    hero.hp += this.healthBoost;
    if (typeof logCallback === 'function') {
      logCallback(
        `${hero.name} picks up a mushroom for ${this.healthBoost} HP! (New HP: ${hero.hp})`
      );
    }
  }
}