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
 *   restored to its original spawn HP and immediately joins the attacker's team.
 * - Victory is achieved when one team controls all heroes.
 *
 * The simulation uses a canvas element to render an isometric view of the battlefield.
 * Log entries are confined to a fixed number of lines so as not to overwhelm the display.
 *
 * Future improvements could include enhanced team coloring and player controls.
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Initialize log lines storage; we keep only the last 50 lines.
    this.logLines = [];
    // Use the provided logCallback as a handler to update both internal log array and UI.
    this.logCallback = (message) => {
      this.logLines.push(message);
      if (this.logLines.length > 50) {
        this.logLines.shift();
      }
      // Update the log box (assumes an element with id "summit-log")
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("<br>");
      }
    };
    // Copy heroes and store original HP upon spawn.
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
        defeatedBy: null
      };
    });
    this.round = 1;
    this.interval = null;
  }

  /**
   * Start the simulation.
   */
  start() {
    this.logCallback("Starting Summit Mode battle royale simulation...");
    this.drawCanvas();
    this.printStatus();
    // Run a simulation round every 500ms.
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
      // Define enemies as heroes on a different team and still alive.
      const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
      
      // If no enemy remains, victory is achieved.
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
          this.logCallback(`${target.name} is defeated by ${hero.name} and joins Team ${hero.team}. HP restored to original value (${target.originalHp}).`);
          target.team = hero.team;
          target.hp = target.originalHp;
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
    this.drawCanvas(); // update visual canvas each round
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
      this.logCallback(`${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) with HP: ${hero.hp}/${hero.originalHp}`);
    });
  }

  /**
   * Draw the battlefield on a canvas element using isometric projection.
   * The canvas is created inside the 'summit-battlefield' container.
   */
  drawCanvas() {
    const container = document.getElementById("summit-battlefield");
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      // Create a new canvas element if one doesn't already exist.
      canvas = document.createElement("canvas");
      // Set default dimensions; these can be adjusted as needed.
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
    // Compute overall grid size in isometric projection.
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    // Center the grid in the canvas.
    const offsetX = (canvas.width - isoGridWidth) / 2;
    const offsetY = (canvas.height - isoGridHeight) / 2;

    // Optionally, you could draw grid lines here.
    // For each hero, compute its isometric coordinate and draw a diamond.
    this.allHeroes.forEach(hero => {
      if (hero.hp > 0) {
        let isoX = (hero.x - hero.y) * tileWidth / 2 + offsetX + isoGridWidth / 2;
        let isoY = (hero.x + hero.y) * tileHeight / 2 + offsetY;
        // Draw a diamond representing the hero.
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - tileHeight / 2);
        ctx.lineTo(isoX + tileWidth / 2, isoY);
        ctx.lineTo(isoX, isoY + tileHeight / 2);
        ctx.lineTo(isoX - tileWidth / 2, isoY);
        ctx.closePath();
        ctx.fillStyle = this.getTeamColor(hero.team);
        ctx.fill();
        // Draw the hero's symbol in the center.
        ctx.fillStyle = "black";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY + 3);
      }
    });
  }

  /**
   * Generate a color based on team number.
   * Cycles through 50 hues.
   */
  getTeamColor(team) {
    const hue = (team * 360 / 50) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
}
