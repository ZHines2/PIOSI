/**
 * Modern Game State Manager using ES6 classes and modern patterns
 */
export class GameStateManager {
  constructor() {
    this.currentScreen = 'title-screen';
    this.currentLevel = 1;
    this.party = [];
    this.enemies = [];
    this.playerScore = 0;
    this.maxScore = 0;
    this.discoveredZones = new Set(['0,0,0']); // Start with initial zone
    this.gameStarted = false;
    this.attackMode = false;
    this.currentHeroIndex = 0;
    
    // Constants
    this.SCORE_PER_SCENE_DISCOVERY = 50;
    this.GRID_SIZE = 10;
    this.TILE_WIDTH = 50;
    this.TILE_HEIGHT = 24;
    
    // Event listeners for state changes
    this.listeners = new Map();
  }

  /**
   * Add event listener for state changes
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit state change event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Change current screen
   * @param {string} screenName - New screen name
   */
  changeScreen(screenName) {
    const oldScreen = this.currentScreen;
    this.currentScreen = screenName;
    this.emit('screenChange', { from: oldScreen, to: screenName });
  }

  /**
   * Set party members
   * @param {Array<Hero>} heroes - Array of hero instances
   */
  setParty(heroes) {
    this.party = heroes;
    this.emit('partyChange', this.party);
  }

  /**
   * Add hero to party
   * @param {Hero} hero - Hero to add
   */
  addToParty(hero) {
    if (this.party.length < 3) {
      this.party.push(hero);
      this.emit('partyChange', this.party);
      return true;
    }
    return false;
  }

  /**
   * Remove hero from party
   * @param {number} index - Index of hero to remove
   */
  removeFromParty(index) {
    if (index >= 0 && index < this.party.length) {
      const removed = this.party.splice(index, 1)[0];
      this.emit('partyChange', this.party);
      return removed;
    }
    return null;
  }

  /**
   * Get current active hero
   * @returns {Hero|null} - Current hero or null
   */
  getCurrentHero() {
    return this.party[this.currentHeroIndex] || null;
  }

  /**
   * Switch to next hero
   */
  nextHero() {
    if (this.party.length > 0) {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.party.length;
      this.emit('heroChange', this.getCurrentHero());
    }
  }

  /**
   * Switch to previous hero
   */
  previousHero() {
    if (this.party.length > 0) {
      this.currentHeroIndex = this.currentHeroIndex === 0 
        ? this.party.length - 1 
        : this.currentHeroIndex - 1;
      this.emit('heroChange', this.getCurrentHero());
    }
  }

  /**
   * Update player score
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.playerScore += points;
    this.emit('scoreChange', { score: this.playerScore, maxScore: this.maxScore });
  }

  /**
   * Discover new scene/zone
   * @param {string} zoneId - Zone identifier
   */
  discoverZone(zoneId) {
    if (!this.discoveredZones.has(zoneId)) {
      this.discoveredZones.add(zoneId);
      this.maxScore += this.SCORE_PER_SCENE_DISCOVERY;
      this.emit('zoneDiscovered', { zoneId, maxScore: this.maxScore });
    }
  }

  /**
   * Start new level
   * @param {number} levelNumber - Level number to start
   * @param {Array<Enemy>} enemies - Level enemies
   */
  startLevel(levelNumber, enemies = []) {
    this.currentLevel = levelNumber;
    this.enemies = [...enemies];
    this.attackMode = false;
    
    // Reset all heroes for new level
    this.party.forEach(hero => hero.startTurn());
    this.currentHeroIndex = 0;
    
    this.emit('levelStart', { level: levelNumber, enemies: this.enemies });
  }

  /**
   * Toggle attack mode
   */
  toggleAttackMode() {
    this.attackMode = !this.attackMode;
    this.emit('attackModeChange', this.attackMode);
  }

  /**
   * Get alive heroes
   * @returns {Array<Hero>} - Array of living heroes
   */
  getAliveHeroes() {
    return this.party.filter(hero => hero.isAlive());
  }

  /**
   * Get dead heroes
   * @returns {Array<Hero>} - Array of dead heroes
   */
  getDeadHeroes() {
    return this.party.filter(hero => !hero.isAlive());
  }

  /**
   * Check if game is over (all heroes dead)
   * @returns {boolean} - Whether game is over
   */
  isGameOver() {
    return this.party.length > 0 && this.getAliveHeroes().length === 0;
  }

  /**
   * Check if level is complete (all enemies defeated)
   * @returns {boolean} - Whether level is complete
   */
  isLevelComplete() {
    return this.enemies.filter(enemy => enemy.hp > 0).length === 0;
  }

  /**
   * Generate comprehensive game state report
   * @returns {Object} - Detailed game state report
   */
  generateStateReport() {
    const currentHero = this.getCurrentHero();
    const aliveHeroes = this.getAliveHeroes();
    const deadHeroes = this.getDeadHeroes();
    const aliveEnemies = this.enemies.filter(enemy => enemy.hp > 0);
    
    return {
      timestamp: new Date().toISOString(),
      gameSession: {
        playerScore: this.playerScore,
        maxScore: this.maxScore,
        discoveredZones: this.discoveredZones.size,
        totalEnemies: this.enemies.length,
        gameStarted: this.gameStarted,
      },
      currentLocation: {
        scene: this.currentLevel,
        sceneType: 'battle', // Could be expanded for different scene types
        enemiesPresent: aliveEnemies.length,
        potionAvailable: false, // TODO: Add potion system
      },
      party: {
        activeHero: currentHero ? {
          name: currentHero.name,
          position: `${currentHero.x},${currentHero.y}`,
          hp: currentHero.hp,
          movePoints: currentHero.movePoints,
        } : null,
        aliveHeroes: aliveHeroes.length,
        deadHeroes: deadHeroes.length,
        heroDetails: this.party.map(hero => ({
          name: hero.name,
          hp: hero.hp,
          maxHp: hero.maxHp,
          alive: hero.isAlive(),
          position: `${hero.x},${hero.y}`,
        })),
      },
      enemies: aliveEnemies.map(enemy => ({
        name: enemy.name,
        hp: enemy.hp,
        position: `${enemy.x},${enemy.y}`,
      })),
      gameState: {
        currentScreen: this.currentScreen,
        attackMode: this.attackMode,
        gameOver: this.isGameOver(),
        levelComplete: this.isLevelComplete(),
      },
    };
  }
}