/**
 * Modern Hero class with ES6+ features
 */
export class Hero {
  constructor(heroData) {
    this.name = heroData.name;
    this.symbol = heroData.symbol;
    this.sprite = heroData.sprite;
    this.attack = heroData.attack;
    this.range = heroData.range;
    this.agility = heroData.agility;
    this.maxHp = heroData.hp;
    this.hp = heroData.hp;
    
    // Position and state
    this.x = 0;
    this.y = 0;
    this.movePoints = this.agility;
    this.hasAttacked = false;
    
    // Special abilities - modern object destructuring with defaults
    this.abilities = {
      heal: heroData.heal || 0,
      burn: heroData.burn || 0,
      sluj: heroData.sluj || 0,
      ghis: heroData.ghis || 0,
      trick: heroData.trick || 0,
      yeet: heroData.yeet || 0,
      swarm: heroData.swarm || 0,
      spicy: heroData.spicy || 0,
      armor: heroData.armor || 0,
      spore: heroData.spore || 0,
      chain: heroData.chain || 0,
      caprice: heroData.caprice || 0,
      fate: heroData.fate || 0,
      rage: heroData.rage || 0,
      bulk: heroData.bulk || 0,
      psych: heroData.psych || 0,
      ankh: heroData.ankh || 0,
      rise: heroData.rise || 0,
      dodge: heroData.dodge || 0,
      bomba: heroData.bomba || 0,
      // Boolean abilities
      torcher: heroData.torcher || false,
      shrink: heroData.shrink || false,
      joke: heroData.joke || false,
      meat: heroData.meat || false,
      tarot: heroData.tarot || false,
      nonseq: heroData.nonseq || false,
      reactsToHistory: heroData.reactsToHistory || false,
    };
  }

  /**
   * Reset hero for new turn
   */
  startTurn() {
    this.movePoints = this.agility;
    this.hasAttacked = false;
  }

  /**
   * Move hero to new position
   * @param {number} newX - New X coordinate
   * @param {number} newY - New Y coordinate
   * @returns {boolean} - Success of move
   */
  moveTo(newX, newY) {
    if (this.movePoints > 0) {
      this.x = newX;
      this.y = newY;
      this.movePoints--;
      return true;
    }
    return false;
  }

  /**
   * Calculate distance to target
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {number} - Distance to target
   */
  distanceTo(targetX, targetY) {
    return Math.abs(this.x - targetX) + Math.abs(this.y - targetY);
  }

  /**
   * Check if target is in attack range
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {boolean} - Whether target is in range
   */
  canAttack(targetX, targetY) {
    return !this.hasAttacked && this.distanceTo(targetX, targetY) <= this.range;
  }

  /**
   * Perform attack on target
   * @param {Object} target - Target to attack
   * @returns {number} - Damage dealt
   */
  attack(target) {
    if (!this.canAttack(target.x, target.y)) {
      return 0;
    }
    
    this.hasAttacked = true;
    let damage = this.attack;
    
    // Apply chain damage if applicable
    if (this.abilities.chain > 0) {
      damage += this.abilities.chain;
    }
    
    return damage;
  }

  /**
   * Take damage
   * @param {number} damage - Damage to take
   * @returns {boolean} - Whether hero is still alive
   */
  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp > 0;
  }

  /**
   * Heal the hero
   * @param {number} amount - Amount to heal
   */
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  /**
   * Check if hero is alive
   * @returns {boolean} - Whether hero is alive
   */
  isAlive() {
    return this.hp > 0;
  }

  /**
   * Get complete hero stats for display
   * @returns {string} - Formatted stats string
   */
  getStatsDisplay() {
    const stats = [
      `Attack: ${this.attack}`,
      `Range: ${this.range}`,
      `Agility: ${this.agility}`,
      `HP: ${this.hp}/${this.maxHp}`,
      ...Object.entries(this.abilities)
        .filter(([, value]) => value > 0 || value === true)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
    ];
    return stats.join(' | ');
  }
}