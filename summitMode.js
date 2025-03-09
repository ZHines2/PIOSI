/**
 * summitMode.js
 *
 * This file handles Summit Mode in PIOSI – reimagined as a battle royale simulation.
 * In this simulation:
 * - All heroes are randomly placed on a 50×50 grid.
 * - Each hero starts on its own team.
 * - During each round, every alive hero takes a turn:
 *    • If an enemy (a hero on a different team) is within attack range (default 1), they attack.
 *    • Otherwise, they move one step toward the closest enemy.
 * - When a hero defeats another (reducing its HP to 0 or below), the defeated hero's HP is restored
 *   to its original value and immediately joins the attacker's team.
 * - Victory is declared when one team controls all heroes.
 *
 * The simulation uses an 800×600 canvas element to render an isometric view of the battlefield.
 * Log entries are maintained (limited to the last 50 entries) in the element with id "summit-log".
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Keep only the last 50 log lines.
    this.logLines = [];
    this.logCallback = (message) => {
      this.logLines.push(message);
      if (this.logLines.length > 50) {
        this.logLines.shift();
      }
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("<br>");
      }
    };
  
    // Copy heroes and set a random position immediately in the map copy.
    this.allHeroes = allHeroes.map((hero, index) => {
      const spawnHp = hero.hp || 100;
      return {
        ...hero,
        x: Math.floor(Math.random() * this.mapSize),
        y: Math.floor(Math.random() * this.mapSize),
        hp: spawnHp,
        originalHp: spawnHp,
        maxHp: hero.maxHp || spawnHp,
        team: index, // Each hero starts on its own team.
        defeatedBy: null,
        // Use defaults for attack and range.
        attack: hero.attack || 10,
        range: hero.range || 1,
        name: hero.name,
        symbol: hero.symbol
      };
    });
    this.round = 1;
    this.interval = null;
  }

  /**
   * Start the simulation round loop.
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
      if (hero.hp <= 0) continue; // Skip dead heroes.

      // Define enemies as heroes on a different team that are alive.
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
        const dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }

      // If within attack range, attack. Otherwise, move one step towards the target.
      const attackRange = hero.range;
      if (minDist <= attackRange) {
        this.logCallback(`${hero.name} (Team ${hero.team}) attacks ${target.name} (Team ${target.team}) for ${hero.attack} damage.`);
        target.hp -= hero.attack;
        anyAction = true;
        if (target.hp <= 0) {
          this.logCallback(`${target.name} is defeated by ${hero.name} and joins Team ${hero.team}. HP restored to ${target.originalHp}.`);
          target.team = hero.team;
          target.hp = target.originalHp;
          target.defeatedBy = hero.name;
        }
      } else {
        // Move one step towards target without extra collision checks.
        let dx = target.x - hero.x;
        let dy = target.y - hero.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
          hero.x += dx > 0 ? 1 : -1;
        } else {
          hero.y += dy > 0 ? 1 : -1;
        }
        this.logCallback(`${hero.name} moves to (${hero.x}, ${hero.y}).`);
        anyAction = true;
      }
    }
    this.round++;
    this.printStatus();
    this.drawCanvas();
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
   * Log current status of all heroes.
   */
  printStatus() {
    this.allHeroes.forEach(hero => {
      this.logCallback(`${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) with HP: ${hero.hp}/${hero.originalHp}`);
    });
  }

  /**
   * Draw the battlefield on a canvas using isometric projection.
   * A fixed 800×600 canvas is used.
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

    // Define tile dimensions.
    const tileWidth = 32;
    const tileHeight = 16;
    // Overall isometric grid size.
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    // Center the grid.
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
        // Draw hero's symbol in the center.
        ctx.fillStyle = "black";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY + 3);
      }
    });
  }

  /**
   * Generate a color based on team number by cycling through hues.
   */
  getTeamColor(team) {
    const hue = (team * 360 / 50) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
}
