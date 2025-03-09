/**
 * summitMode.js
 *
 * Revised as a turn-by-turn simulation.
 * In this simulation:
 * - All heroes are randomly placed on a 50×50 grid.
 * - Each hero starts on its own team.
 * - The simulation processes one hero turn at a time.
 *   • For each hero (if alive), if an enemy (hero on a different team) is within attack range (default 1), they attack.
 *   • Otherwise, the hero moves one step toward the closest enemy.
 * - When a hero defeats another (reducing its HP to 0 or below), the defeated hero is restored
 *   to its original spawn HP and immediately joins the attacker's team.
 * - Victory is declared when one team controls all heroes.
 *
 * After each hero turn, the grid is rendered on a fixed 800×600 canvas so you see the change before the next turn.
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    this.logLines = [];
    this.logCallback = (message) => {
      this.logLines.push(message);
      if (this.logLines.length > 50) this.logLines.shift();
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("<br>");
      }
    };

    // Create a copy of heroes with random initial positions.
    this.allHeroes = allHeroes.map((hero, index) => {
      const spawnHp = hero.hp || 100;
      return {
        ...hero,
        x: Math.floor(Math.random() * this.mapSize),
        y: Math.floor(Math.random() * this.mapSize),
        hp: spawnHp,
        originalHp: spawnHp,
        maxHp: hero.maxHp || spawnHp,
        team: index, // each hero starts on its own team
        defeatedBy: null,
        attack: hero.attack || 10,
        range: hero.range || 1,
        name: hero.name,
        symbol: hero.symbol
      };
    });

    // Prepare turn tracking: we'll process one hero turn at a time.
    this.turnIndex = 0;
    this.turnOrder = []; // will be computed at each full round.
    this.delay = 500; // delay (in ms) between turns
  }

  /**
   * Start the simulation by computing the initial turn order and processing the first turn.
   */
  start() {
    this.logCallback("Starting Summit Mode battle royale simulation...");
    this.updateTurnOrder();
    this.drawCanvas();
    this.printStatus();
    this.processTurn(); 
  }

  /**
   * Update the turn order (sorted by hero order in the array of alive heroes).
   */
  updateTurnOrder() {
    this.turnOrder = this.allHeroes.filter(hero => hero.hp > 0);
    // Optional sorting (e.g. by agility) could be added here.
    this.turnIndex = 0;
  }

  /**
   * Process a single hero turn and then update the grid.
   * Uses a recursive setTimeout to schedule the next turn.
   */
  processTurn() {
    // Refresh the turn order if we've processed all heroes in the round.
    if (this.turnIndex >= this.turnOrder.length) {
      this.updateTurnOrder();
      // If no hero is alive, end simulation.
      if (this.turnOrder.length === 0) {
        this.logCallback("No alive heroes remain. Ending simulation.");
        if (this.onGameOver) this.onGameOver();
        return;
      }
    }

    let hero = this.turnOrder[this.turnIndex];

    // If hero is dead (could happen mid-round), skip.
    if (hero.hp <= 0) {
      this.turnIndex++;
      this.scheduleNextTurn();
      return;
    }
    
    // Determine enemies: heroes on a different team that are alive.
    const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
    if (enemies.length === 0) {
      this.logCallback(`Victory: Team ${hero.team} now controls all heroes!`);
      if (this.onVictory) this.onVictory();
      return;
    }
    
    // Find the closest enemy using Manhattan distance.
    let target = null;
    let minDist = Infinity;
    for (let enemy of enemies) {
      const dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }
    
    // Process attack or move.
    const attackRange = hero.range;
    if (minDist <= attackRange) {
      this.logCallback(`${hero.name} (Team ${hero.team}) attacks ${target.name} (Team ${target.team}) for ${hero.attack} damage.`);
      target.hp -= hero.attack;
      if (target.hp <= 0) {
        this.logCallback(`${target.name} is defeated by ${hero.name} and joins Team ${hero.team}. HP restored to ${target.originalHp}.`);
        target.team = hero.team;
        target.hp = target.originalHp;
        target.defeatedBy = hero.name;
      }
    } else {
      // Move one step toward the target without collision checking.
      let dx = target.x - hero.x;
      let dy = target.y - hero.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        hero.x += dx > 0 ? 1 : -1;
      } else {
        hero.y += dy > 0 ? 1 : -1;
      }
      this.logCallback(`${hero.name} moves to (${hero.x}, ${hero.y}).`);
    }
    
    this.printStatus();
    this.drawCanvas();
    this.turnIndex++;
    this.scheduleNextTurn();
  }
  
  /**
   * Schedule processing of the next turn after a delay.
   */
  scheduleNextTurn() {
    setTimeout(() => this.processTurn(), this.delay);
  }

  /**
   * Log the current status of all heroes.
   */
  printStatus() {
    this.allHeroes.forEach(hero => {
      this.logCallback(`${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) with HP: ${hero.hp}/${hero.originalHp}`);
    });
  }
  
  /**
   * Draw the battlefield on an 800×600 canvas using isometric projection.
   */
  drawCanvas() {
    const container = document.getElementById("summit-battlefield");
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      container.innerHTML = "";
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Define tile dimensions for isometric view.
    const tileWidth = 32;
    const tileHeight = 16;
    // Overall grid dimensions in isometric projection.
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    // Center the grid on the canvas.
    const offsetX = (canvas.width - isoGridWidth) / 2;
    const offsetY = (canvas.height - isoGridHeight) / 2;
  
    // Draw each hero as a diamond.
    this.allHeroes.forEach(hero => {
      if (hero.hp > 0) {
        let isoX = (hero.x - hero.y) * tileWidth / 2 + offsetX + isoGridWidth / 2;
        let isoY = (hero.x + hero.y) * tileHeight / 2 + offsetY;
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2);
        ctx.lineTo(isoX + tileWidth / 2, isoY);
        ctx.lineTo(isoX, isoY + tileHeight / 2);
        ctx.lineTo(isoX - tileWidth / 2, isoY);
        ctx.closePath();
        ctx.fillStyle = this.getTeamColor(hero.team);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY + 3);
      }
    });
  }
  
  /**
   * Generate a team color based on team number (cycles through 50 hues).
   */
  getTeamColor(team) {
    const hue = (team * 360 / 50) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
}
