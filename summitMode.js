/**
 * summitMode.js
 *
 * This file handles Summit Mode in PIOSI – reimagined as a battle royale simulation.
 * In this simulation:
 * - All heroes are randomly placed on a 50×50 grid.
 * - Each hero starts on its own team.
 * - During each round, every hero takes a turn:
 *    • If an enemy (a hero on a different team) is within attack range, they attack.
 *    • Otherwise, they move one step toward the closest enemy.
 * - If a hero defeats another (reducing its HP to 0 or below), the defeated hero is
 *   restored to full HP and immediately joins the attacker's team.
 * - Victory is achieved when one team controls all heroes.
 *
 * Future improvements could include visual team colors (selectable from a pool of 50) and
 * player controls to override the simulation.
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.logCallback = logCallback;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Copy heroes and initialize with simulation-specific properties
    this.allHeroes = allHeroes.map((hero, index) => ({
      ...hero,
      x: Math.floor(Math.random() * this.mapSize),
      y: Math.floor(Math.random() * this.mapSize),
      hp: hero.hp || 100,
      maxHp: hero.maxHp || 100,
      team: index, // each hero starts as its own team
      defeatedBy: null // track the last hero that defeated this hero 
    }));
    this.round = 1;
    this.interval = null;
  }

  /**
   * Start the simulation.
   */
  start() {
    this.logCallback("Starting Summit Mode battle royale simulation...");
    this.printStatus();
    // Run a simulation round every 500ms
    this.interval = setInterval(() => this.simulationRound(), 500);
  }

  /**
   * Simulate one round where each alive hero takes a turn.
   */
  simulationRound() {
    this.logCallback(`--- Round ${this.round} ---`);
    let anyAction = false;
    const turnOrder = this.allHeroes.filter(hero => hero.hp > 0);
    
    for (let hero of turnOrder) {
      if (hero.hp <= 0) continue; // skip dead heroes
      // Enemies are heroes on a different team and still alive.
      const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
      
      // If no enemy remains, victory is achieved!
      if (enemies.length === 0) {
        this.logCallback(`Victory: Team ${hero.team} now controls all heroes!`);
        this.stopSimulation();
        if (this.onVictory) this.onVictory();
        return;
      }
      
      // Find the closest enemy using Manhattan distance.
      let target = null;
      let minDist = Infinity;
      for (let enemy of enemies) {
        let dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
      
      // Use hero.range as attack range; if not defined, default to 1.
      const attackRange = hero.range || 1;
      if (minDist <= attackRange) {
        // Attack phase.
        this.logCallback(`${hero.name} (Team ${hero.team}) attacks ${target.name} (Team ${target.team}) for ${hero.attack} damage.`);
        target.hp -= hero.attack;
        anyAction = true;
        if (target.hp <= 0) {
          this.logCallback(`${target.name} is defeated by ${hero.name} and joins Team ${hero.team}. HP restored.`);
          target.team = hero.team;
          target.hp = target.maxHp;
          target.defeatedBy = hero.name;
        }
      } else {
        // Movement phase: move one step toward the target.
        let dx = target.x - hero.x;
        let dy = target.y - hero.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          hero.x += dx > 0 ? 1 : -1;
        } else if (dy !== 0) {
          hero.y += dy > 0 ? 1 : -1;
        } else if (dx !== 0) {
          hero.x += dx > 0 ? 1 : -1;
        }
        this.logCallback(`${hero.name} moves to (${hero.x}, ${hero.y}).`);
        anyAction = true;
      }
    }
    this.round++;
    this.printStatus();
    // If no action occurred, end simulation.
    if (!anyAction) {
      this.logCallback("No actions possible. Ending simulation.");
      this.stopSimulation();
      if (this.onGameOver) this.onGameOver();
    }
  }

  /**
   * Stop the simulation loop.
   */
  stopSimulation() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Print current status of all heroes to the log.
   */
  printStatus() {
    this.allHeroes.forEach(hero => {
      this.logCallback(`${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) with HP: ${hero.hp}/${hero.maxHp}`);
    });
  }
}
