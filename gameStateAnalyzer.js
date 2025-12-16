/**
 * gameStateAnalyzer.js
 * 
 * Advanced game state analysis module using agentic technology principles.
 * This module provides comprehensive analysis of the game state including:
 * - Hero and enemy positions, stats, and status effects
 * - Battlefield layout and environmental factors
 * - Turn order and game flow
 * - Strategic recommendations based on current state
 * 
 * The analyzer acts as an autonomous agent that can observe and report on
 * game state without interfering with game logic.
 */

// Constants for normalization factors
const HP_NORMALIZATION_FACTOR_HERO = 100;
const HP_NORMALIZATION_FACTOR_ENEMY = 50;
const AGILITY_DIVISOR = 10; // For agility normalization in effectiveness calculation

/**
 * GameStateAnalyzer class - Main analyzer agent
 */
export class GameStateAnalyzer {
  constructor() {
    this.stateHistory = [];
    this.maxHistoryLength = 50;
    this.analysisCallbacks = [];
  }

  /**
   * Helper method to get live heroes from a battle engine
   * @private
   */
  _getLiveHeroes(battleEngine) {
    if (!battleEngine || !battleEngine.party) return [];
    return battleEngine.getLiveHeroes ? battleEngine.getLiveHeroes() : 
           battleEngine.party.filter(h => h.hp > 0 && !h.persistentDeath);
  }

  /**
   * Analyze the current battle state
   * @param {Object} battleEngine - The battle engine instance
   * @returns {Object} Comprehensive state analysis
   */
  analyzeBattleState(battleEngine) {
    if (!battleEngine) {
      return { error: "No battle engine provided" };
    }

    const timestamp = Date.now();
    
    const analysis = {
      timestamp,
      mode: "battle",
      heroes: this.analyzeHeroes(battleEngine.party, battleEngine.currentUnit),
      enemies: this.analyzeEnemies(battleEngine.enemies),
      battlefield: this.analyzeBattlefield(battleEngine),
      turnState: this.analyzeTurnState(battleEngine),
      strategicAssessment: this.generateStrategicAssessment(battleEngine),
      gameFlow: this.analyzeGameFlow(battleEngine)
    };

    this.recordState(analysis);
    this.notifyCallbacks(analysis);
    
    return analysis;
  }

  /**
   * Analyze hero party state
   */
  analyzeHeroes(party, currentUnitIndex) {
    if (!party || !Array.isArray(party)) return [];
    
    return party.map((hero, index) => ({
      index,
      name: hero.name,
      symbol: hero.symbol,
      isActive: index === currentUnitIndex,
      isAlive: hero.hp > 0 && !hero.persistentDeath,
      isPersistentlyDead: !!hero.persistentDeath,
      position: { x: hero.x, y: hero.y },
      stats: {
        hp: hero.hp,
        attack: hero.attack,
        range: hero.range,
        agility: hero.agility,
        heal: hero.heal || 0,
        burn: hero.burn || 0,
        sluj: hero.sluj || 0,
        ghis: hero.ghis || 0,
        trick: hero.trick || 0,
        yeet: hero.yeet || 0,
        swarm: hero.swarm || 0,
        spicy: hero.spicy || 0,
        armor: hero.armor || 0,
        spore: hero.spore || 0,
        chain: hero.chain || 0,
        caprice: hero.caprice || 0,
        fate: hero.fate || 0,
        rage: hero.rage || 0,
        bulk: hero.bulk || 0,
        psych: hero.psych || 0,
        ankh: hero.ankh || 0,
        rise: hero.rise || 0,
        dodge: hero.dodge || 0,
        bomba: hero.bomba || 0
      },
      statusEffects: hero.statusEffects || {},
      combatEffectiveness: this.calculateCombatEffectiveness(hero),
      threats: [], // To be filled with nearby enemy analysis
      opportunities: [] // To be filled with strategic opportunities
    }));
  }

  /**
   * Analyze enemy state
   */
  analyzeEnemies(enemies) {
    if (!enemies || !Array.isArray(enemies)) return [];
    
    return enemies.map(enemy => ({
      name: enemy.name,
      symbol: enemy.symbol,
      position: { x: enemy.x, y: enemy.y },
      stats: {
        hp: enemy.hp,
        attack: enemy.attack,
        range: enemy.range || 1,
        agility: enemy.agility || 1,
        dodge: enemy.dodge || 0
      },
      statusEffects: enemy.statusEffects || {},
      threatLevel: this.calculateThreatLevel(enemy),
      isWeakened: enemy.hp < (enemy.maxHp || enemy.hp) * 0.3,
      dialogue: enemy.dialogue || []
    }));
  }

  /**
   * Analyze battlefield state
   */
  analyzeBattlefield(battleEngine) {
    return {
      dimensions: {
        rows: battleEngine.rows,
        cols: battleEngine.cols
      },
      wallHP: battleEngine.wallHP,
      wallIntegrity: battleEngine.wallHP > 0 ? battleEngine.wallHP / 100 : 0,
      grid: this.analyzeGrid(battleEngine.battlefield, battleEngine.rows, battleEngine.cols),
      items: this.findItems(battleEngine.battlefield, battleEngine.rows, battleEngine.cols),
      density: this.calculateDensity(battleEngine)
    };
  }

  /**
   * Analyze the battlefield grid
   */
  analyzeGrid(battlefield, rows, cols) {
    if (!battlefield) return { cells: [], analysis: "No battlefield data" };
    
    const cells = [];
    let emptyCount = 0;
    let wallCount = 0;
    let occupiedCount = 0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = battlefield[y][x];
        cells.push({ x, y, content: cell });
        
        if (cell === '.') emptyCount++;
        else if (cell === 'ᚙ' || cell === '█') wallCount++;
        else occupiedCount++;
      }
    }
    
    return {
      totalCells: rows * cols,
      emptyCount,
      wallCount,
      occupiedCount,
      openSpaceRatio: emptyCount / (rows * cols)
    };
  }

  /**
   * Find items on the battlefield
   */
  findItems(battlefield, rows, cols) {
    const items = [];
    
    if (!battlefield) return items;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = battlefield[y][x];
        if (cell === 'ౚ') {
          items.push({ type: 'vittle', position: { x, y }, healValue: 10 });
        } else if (cell === 'ඉ') {
          items.push({ type: 'mushroom', position: { x, y }, healValue: 5 });
        }
      }
    }
    
    return items;
  }

  /**
   * Analyze turn state
   */
  analyzeTurnState(battleEngine) {
    const currentHero = battleEngine.party[battleEngine.currentUnit];
    
    return {
      currentUnitIndex: battleEngine.currentUnit,
      currentHeroName: currentHero ? currentHero.name : "Unknown",
      movePointsRemaining: battleEngine.movePoints,
      awaitingAttackDirection: battleEngine.awaitingAttackDirection,
      isTransitioning: battleEngine.transitioningLevel,
      turnPhase: battleEngine.awaitingAttackDirection ? "attack_selection" : 
                 battleEngine.movePoints > 0 ? "movement" : "turn_end"
    };
  }

  /**
   * Generate strategic assessment
   */
  generateStrategicAssessment(battleEngine) {
    const liveHeroes = this._getLiveHeroes(battleEngine);
    const enemies = battleEngine.enemies;
    
    const avgHeroHP = liveHeroes.reduce((sum, h) => sum + h.hp, 0) / (liveHeroes.length || 1);
    const avgEnemyHP = enemies.reduce((sum, e) => sum + e.hp, 0) / (enemies.length || 1);
    
    const heroStrength = liveHeroes.reduce((sum, h) => sum + h.attack + h.hp, 0);
    const enemyStrength = enemies.reduce((sum, e) => sum + e.attack + e.hp, 0);
    
    let situation = "neutral";
    if (heroStrength > enemyStrength * 1.5) situation = "favorable";
    else if (heroStrength < enemyStrength * 0.7) situation = "dire";
    else if (heroStrength > enemyStrength * 1.2) situation = "advantageous";
    else if (heroStrength < enemyStrength * 0.85) situation = "challenging";
    
    return {
      situation,
      heroCount: liveHeroes.length,
      enemyCount: enemies.length,
      averageHeroHP: Math.round(avgHeroHP),
      averageEnemyHP: Math.round(avgEnemyHP),
      powerBalance: heroStrength / (enemyStrength || 1),
      wallStatus: battleEngine.wallHP > 0 ? "intact" : "collapsed",
      recommendations: this.generateRecommendations(battleEngine, situation)
    };
  }

  /**
   * Generate tactical recommendations
   */
  generateRecommendations(battleEngine, situation) {
    const recommendations = [];
    const currentHero = battleEngine.party[battleEngine.currentUnit];
    
    if (!currentHero || currentHero.hp <= 0) {
      return ["No active hero available"];
    }
    
    // Check hero HP
    if (currentHero.hp < 10) {
      recommendations.push(`${currentHero.name} is low on HP - seek healing items`);
    }
    
    // Check for nearby enemies
    const nearbyEnemies = battleEngine.enemies.filter(e => 
      Math.abs(e.x - currentHero.x) <= currentHero.range && 
      Math.abs(e.y - currentHero.y) <= currentHero.range
    );
    
    if (nearbyEnemies.length > 0) {
      recommendations.push(`${nearbyEnemies.length} enemies in attack range`);
    }
    
    // Situation-specific recommendations
    if (situation === "dire") {
      recommendations.push("Critical situation - focus on survival and defensive positioning");
    } else if (situation === "favorable") {
      recommendations.push("Advantageous position - press the attack on weakened enemies");
    }
    
    // Check for special abilities
    if (currentHero.heal && currentHero.heal > 0) {
      const damagedAllies = battleEngine.party.filter(h => 
        h.hp > 0 && h.hp < 20 && h !== currentHero
      );
      if (damagedAllies.length > 0) {
        recommendations.push("Healing ability available - consider supporting damaged allies");
      }
    }
    
    return recommendations.length > 0 ? recommendations : ["Continue with current strategy"];
  }

  /**
   * Analyze game flow and progression
   */
  analyzeGameFlow(battleEngine) {
    return {
      stateHistoryLength: this.stateHistory.length,
      recentTrends: this.analyzeRecentTrends(),
      gamePhase: this.determineGamePhase(battleEngine),
      momentum: this.calculateMomentum()
    };
  }

  /**
   * Analyze recent trends in the game
   */
  analyzeRecentTrends() {
    if (this.stateHistory.length < 2) {
      return { trend: "insufficient_data", changes: [] };
    }
    
    const recentStates = this.stateHistory.slice(-5);
    const heroHPTrend = this.calculateTrend(recentStates.map(s => 
      s.heroes ? s.heroes.reduce((sum, h) => sum + (h.stats?.hp || 0), 0) : 0
    ));
    
    const enemyCountTrend = this.calculateTrend(recentStates.map(s => 
      s.enemies ? s.enemies.length : 0
    ));
    
    return {
      heroHPTrend: heroHPTrend > 0 ? "improving" : heroHPTrend < 0 ? "declining" : "stable",
      enemyCountTrend: enemyCountTrend > 0 ? "increasing" : enemyCountTrend < 0 ? "decreasing" : "stable"
    };
  }

  /**
   * Calculate trend from series of values
   */
  calculateTrend(values) {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    return last - first;
  }

  /**
   * Determine current game phase
   */
  determineGamePhase(battleEngine) {
    const liveHeroes = this._getLiveHeroes(battleEngine);
    const enemyCount = battleEngine.enemies.length;
    
    if (enemyCount === 0 && battleEngine.wallHP <= 0) return "victory_imminent";
    if (liveHeroes.length <= 1) return "critical";
    if (enemyCount > liveHeroes.length * 2) return "defensive";
    if (enemyCount < liveHeroes.length) return "offensive";
    return "balanced";
  }

  /**
   * Calculate current momentum
   */
  calculateMomentum() {
    if (this.stateHistory.length < 3) return 0;
    
    const recent = this.stateHistory.slice(-3);
    let momentum = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prevEnemies = recent[i-1].enemies?.length || 0;
      const currEnemies = recent[i].enemies?.length || 0;
      momentum += (prevEnemies - currEnemies); // Positive if defeating enemies
    }
    
    return momentum;
  }

  /**
   * Calculate combat effectiveness of a hero
   */
  calculateCombatEffectiveness(hero) {
    if (!hero || hero.hp <= 0) return 0;
    
    // Base combat score: attack power × range × mobility factor
    const baseScore = hero.attack * hero.range * (hero.agility / AGILITY_DIVISOR);
    // HP factor: normalize current HP to a 0-1 scale (heroes typically have up to ~100 HP)
    const hpFactor = hero.hp / HP_NORMALIZATION_FACTOR_HERO;
    const specialAbilities = (hero.heal || 0) + (hero.burn || 0) + (hero.chain || 0) + 
                            (hero.yeet || 0) + (hero.swarm || 0);
    
    return baseScore * hpFactor + specialAbilities;
  }

  /**
   * Calculate threat level of an enemy
   */
  calculateThreatLevel(enemy) {
    if (!enemy || enemy.hp <= 0) return 0;
    
    const baseScore = enemy.attack * (enemy.range || 1) * (enemy.agility || 1);
    // HP factor: normalize current HP (enemies typically have lower HP than heroes, ~50)
    const hpFactor = enemy.hp / HP_NORMALIZATION_FACTOR_ENEMY;
    
    return baseScore * hpFactor;
  }

  /**
   * Calculate battlefield density
   */
  calculateDensity(battleEngine) {
    const totalUnits = battleEngine.party.length + battleEngine.enemies.length;
    const totalCells = battleEngine.rows * battleEngine.cols;
    return totalUnits / totalCells;
  }

  /**
   * Record state in history
   */
  recordState(state) {
    this.stateHistory.push(state);
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }
  }

  /**
   * Register callback for state updates
   */
  onStateUpdate(callback) {
    if (typeof callback === 'function') {
      this.analysisCallbacks.push(callback);
    }
  }

  /**
   * Notify all registered callbacks
   */
  notifyCallbacks(analysis) {
    this.analysisCallbacks.forEach(callback => {
      try {
        callback(analysis);
      } catch (error) {
        console.error("Error in state analysis callback:", error);
      }
    });
  }

  /**
   * Get formatted state report
   */
  getFormattedReport(analysis) {
    if (!analysis) return "No analysis available";
    
    const lines = [];
    lines.push("=== GAME STATE ANALYSIS ===");
    lines.push(`Mode: ${analysis.mode}`);
    lines.push(`Timestamp: ${new Date(analysis.timestamp).toLocaleTimeString()}`);
    lines.push("");
    
    if (analysis.heroes) {
      lines.push("HEROES:");
      analysis.heroes.filter(h => h.isAlive).forEach(hero => {
        const status = hero.isActive ? "[ACTIVE]" : "";
        lines.push(`  ${status} ${hero.name}: HP ${hero.stats.hp} at (${hero.position.x},${hero.position.y})`);
      });
      lines.push("");
    }
    
    if (analysis.enemies) {
      lines.push("ENEMIES:");
      analysis.enemies.forEach(enemy => {
        lines.push(`  ${enemy.name}: HP ${enemy.stats.hp} at (${enemy.position.x},${enemy.position.y}) [Threat: ${enemy.threatLevel.toFixed(1)}]`);
      });
      lines.push("");
    }
    
    if (analysis.battlefield) {
      lines.push("BATTLEFIELD:");
      lines.push(`  Dimensions: ${analysis.battlefield.dimensions.rows}x${analysis.battlefield.dimensions.cols}`);
      lines.push(`  Wall HP: ${analysis.battlefield.wallHP}`);
      lines.push(`  Open Space: ${(analysis.battlefield.grid.openSpaceRatio * 100).toFixed(1)}%`);
      lines.push("");
    }
    
    if (analysis.strategicAssessment) {
      lines.push("STRATEGIC ASSESSMENT:");
      lines.push(`  Situation: ${analysis.strategicAssessment.situation}`);
      lines.push(`  Power Balance: ${analysis.strategicAssessment.powerBalance.toFixed(2)}`);
      lines.push("  Recommendations:");
      analysis.strategicAssessment.recommendations.forEach(rec => {
        lines.push(`    - ${rec}`);
      });
    }
    
    return lines.join("\n");
  }

  /**
   * Analyze Summit Mode state
   */
  analyzeSummitState(summitMode) {
    if (!summitMode || !summitMode.allHeroes) {
      return { error: "No summit mode data provided" };
    }

    const timestamp = Date.now();
    const aliveHeroes = summitMode.allHeroes.filter(h => h.hp > 0);
    const teams = this.analyzeTeams(aliveHeroes);
    
    const analysis = {
      timestamp,
      mode: "summit",
      totalHeroes: summitMode.allHeroes.length,
      aliveHeroes: aliveHeroes.length,
      teams,
      mapSize: summitMode.mapSize,
      turnOrder: summitMode.turnOrder?.map(h => h.name) || [],
      currentTurnIndex: summitMode.turnIndex,
      dominantTeam: this.findDominantTeam(teams),
      battlePhase: this.determineSummitPhase(teams)
    };

    this.recordState(analysis);
    this.notifyCallbacks(analysis);
    
    return analysis;
  }

  /**
   * Analyze teams in Summit Mode
   */
  analyzeTeams(heroes) {
    const teamMap = new Map();
    
    heroes.forEach(hero => {
      if (!teamMap.has(hero.team)) {
        teamMap.set(hero.team, {
          teamId: hero.team,
          members: [],
          totalHP: 0,
          totalStrength: 0
        });
      }
      
      const team = teamMap.get(hero.team);
      team.members.push(hero.name);
      team.totalHP += hero.hp;
      team.totalStrength += (hero.attack || 0) + (hero.hp || 0);
    });
    
    return Array.from(teamMap.values());
  }

  /**
   * Find dominant team
   */
  findDominantTeam(teams) {
    if (!teams || teams.length === 0) return null;
    
    return teams.reduce((dominant, team) => 
      team.members.length > dominant.members.length ? team : dominant
    );
  }

  /**
   * Determine Summit Mode phase
   */
  determineSummitPhase(teams) {
    if (teams.length === 1) return "victory";
    if (teams.length <= 3) return "endgame";
    if (teams.length <= 10) return "consolidation";
    return "early_chaos";
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.stateHistory = [];
  }

  /**
   * Export state history
   */
  exportHistory() {
    return JSON.stringify(this.stateHistory, null, 2);
  }
}

/**
 * Global analyzer instance
 */
export const globalAnalyzer = new GameStateAnalyzer();

/**
 * Convenience function to log state analysis
 */
export function logStateAnalysis(analysis) {
  if (!analysis) return;
  
  console.group("🎮 Game State Analysis");
  console.log("Mode:", analysis.mode);
  console.log("Timestamp:", new Date(analysis.timestamp).toLocaleTimeString());
  
  if (analysis.heroes) {
    console.group("Heroes");
    analysis.heroes.filter(h => h.isAlive).forEach(hero => {
      console.log(`${hero.isActive ? '▶' : '•'} ${hero.name}: HP ${hero.stats.hp}, Effectiveness: ${hero.combatEffectiveness.toFixed(1)}`);
    });
    console.groupEnd();
  }
  
  if (analysis.enemies && analysis.enemies.length > 0) {
    console.group("Enemies");
    analysis.enemies.forEach(enemy => {
      console.log(`• ${enemy.name}: HP ${enemy.stats.hp}, Threat: ${enemy.threatLevel.toFixed(1)}`);
    });
    console.groupEnd();
  }
  
  if (analysis.strategicAssessment) {
    console.group("Strategic Assessment");
    console.log("Situation:", analysis.strategicAssessment.situation);
    console.log("Power Balance:", analysis.strategicAssessment.powerBalance.toFixed(2));
    console.log("Recommendations:", analysis.strategicAssessment.recommendations);
    console.groupEnd();
  }
  
  console.groupEnd();
}
