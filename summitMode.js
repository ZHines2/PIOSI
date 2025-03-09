/**
 * summitMode.js
 *
 * Revised to prevent hero overlapping during combat by checking for collisions
 * when moving heroes. Collision detection will ensure each hero occupies its own cell.
 * This file uses an HTML canvas for isometric visualization and confines log output.
 *
 * In Summit Mode, the heroes are positioned on a 50×50 grid.
 * When a hero is defeated, its HP is restored to its original spawn value,
 * and it immediately joins the attacker's team.
 * Victory is declared when one team controls all heroes.
 */

import { heroes as allHeroes } from "./heroes.js";
import { BattleEngine } from "./battleEngine.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Internal log storage: keep only the last 50 log entries.
    this.logLines = [];
    this.logCallback = (message) => {
      this.logLines.push(message);
      if (this.logLines.length > 50) {
        this.logLines.shift();
      }
      // Update the log container (assumes an element with id "summit-log")
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("<br>");
      }
    };
    // Copy heroes and store their original HP (spawn HP) along with their properties.
    this.allHeroes = allHeroes.map((hero, index) => {
      const spawnHp = hero.hp || 100;
      return {
        ...hero,
        originalHp: spawnHp,
        hp: spawnHp,
        maxHp: hero.maxHp || spawnHp,
        team: index,  // each hero starts on its own team
        defeatedBy: null,
        // Ensure that name and symbol properties are preserved.
        name: hero.name,
        symbol: hero.symbol
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
   * Collision detection is applied during movement.
   */
  simulationRound() {
    this.logCallback(`--- Round ${this.round} ---`);
    let anyAction = false;
    const turnOrder = this.allHeroes.filter(hero => hero.hp > 0);
    
    for (let hero of turnOrder) {
      if (hero.hp <= 0) continue; // skip dead heroes
      
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
        // Movement phase: calculate intended new position toward the target.
        let dx = target.x - hero.x;
        let dy = target.y - hero.y;
        let newX = hero.x;
        let newY = hero.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          newX = hero.x + (dx > 0 ? 1 : -1);
          newY = hero.y;
          // If the intended cell is occupied, try moving vertically.
          if (this.isOccupied(newX, newY, hero)) {
            newX = hero.x;
            newY = hero.y + (dy > 0 ? 1 : -1);
            if (this.isOccupied(newX, newY, hero)) {
              newX = hero.x;
              newY = hero.y;
            }
          }
        } else if (dy !== 0) {
          newY = hero.y + (dy > 0 ? 1 : -1);
          newX = hero.x;
          // If the intended cell is occupied, try horizontal movement.
          if (this.isOccupied(newX, newY, hero)) {
            newY = hero.y;
            newX = hero.x + (dx > 0 ? 1 : -1);
            if (this.isOccupied(newX, newY, hero)) {
              newX = hero.x;
              newY = hero.y;
            }
          }
        } else if (dx !== 0) {
          newX = hero.x + (dx > 0 ? 1 : -1);
          newY = hero.y;
          if (this.isOccupied(newX, newY, hero)) {
            newX = hero.x;
            newY = hero.y;
          }
        }
        
        // Apply movement if new position is available.
        if (newX !== hero.x || newY !== hero.y) {
          hero.x = newX;
          hero.y = newY;
          this.logCallback(`${hero.name} moves to (${hero.x}, ${hero.y}).`);
          anyAction = true;
        } else {
          this.logCallback(`${hero.name} stays at (${hero.x}, ${hero.y}) due to collisions.`);
        }
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
   * Helper method to check if a cell at (x, y) is occupied by any other alive hero.
   */
  isOccupied(x, y, movingHero) {
    return this.allHeroes.some(hero => hero.hp > 0 && hero !== movingHero && hero.x === x && hero.y === y);
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
   * Print the current status of all heroes to the log.
   */
  printStatus() {
    this.allHeroes.forEach(hero => {
      this.logCallback(`${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) with HP: ${hero.hp}/${hero.originalHp}`);
    });
  }

  /**
   * Draw the battlefield on a canvas element using isometric projection.
   * The canvas uses the "Sono" font (set in CSS) by explicitly setting the drawing context.
   */
  drawCanvas() {
    const container = document.getElementById("summit-battlefield");
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      // Create the canvas element if it doesn't exist.
      canvas = document.createElement("canvas");
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      container.innerHTML = "";
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set font to "Sono" imported via CSS.
    ctx.font = "10px 'Sono', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Define tile dimensions for isometric view.
    const tileWidth = 32;
    const tileHeight = 16;
    // Compute overall grid size in isometric projection.
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    // Center the grid in the canvas.
    const offsetX = (canvas.width - isoGridWidth) / 2;
    const offsetY = (canvas.height - isoGridHeight) / 2;

    // Draw each hero on the isometric canvas.
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
        // Use team color to differentiate heroes.
        ctx.fillStyle = this.getTeamColor(hero.team);
        ctx.fill();
        // Draw the hero's symbol (or first letter of the name) in the center.
        ctx.fillStyle = "black";
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY);
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
