/**
 * summitMode.js
 *
 * Updated for simulation mode.
 * In this simulation mode, heroes are randomly placed onto a 50×50 grid without overlapping,
 * using a unique assignInitialPositions() function. Each simulation round, heroes move toward
 * the nearest enemy (or attack if in range) with collision prevention. An isometric grid is
 * drawn in the canvas before rendering the heroes.
 *
 * When a hero is defeated, its HP is restored and it is added to the attacker's team.
 * Victory is declared when one team remains.
 */

import { heroes as allHeroes } from "./heroes.js";
import { BattleEngine } from "./battleEngine.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Keeping a limited internal log.
    this.logLines = [];
    this.logCallback = (message) => {
      this.logLines.push(message);
      if (this.logLines.length > 50) {
        this.logLines.shift();
      }
      // Update the log container (assumes element with id "summit-log").
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("<br>");
      }
    };
    // Work on a copy of the heroes array and store their original HP.
    this.allHeroes = allHeroes.map((hero, index) => {
      const spawnHp = hero.hp || 100;
      return {
        ...hero,
        originalHp: spawnHp,
        hp: spawnHp,
        maxHp: hero.maxHp || spawnHp,
        team: index, // each hero starts on its own team.
        defeatedBy: null,
        name: hero.name,
        symbol: hero.symbol,
        range: hero.range || 1,
        attack: hero.attack || 10
      };
    });
    this.round = 1;
    this.interval = null;
  }

  /**
   * Start the simulation.
   * Assigns each hero a unique starting position and begins simulation rounds.
   */
  start() {
    this.logCallback("Starting Summit Mode simulation...");
    // Attempt to assign unique initial positions.
    if (!this.assignInitialPositions()) {
      this.logCallback("Failed to assign unique starting positions. Aborting simulation.");
      return;
    }
    this.drawCanvas();
    this.printStatus();
    // Run a simulation round every 500ms.
    this.interval = setInterval(() => this.simulationRound(), 500);
  }

  /**
   * Assign unique starting positions to each hero.
   * Returns true if successful.
   */
  assignInitialPositions() {
    // Create an array of all possible grid slots (2,500 total in a 50x50 grid).
    const freeSlots = [];
    for (let x = 0; x < this.mapSize; x++) {
      for (let y = 0; y < this.mapSize; y++) {
        freeSlots.push({ x, y });
      }
    }
    // Shuffle freeSlots using Fisher-Yates.
    for (let i = freeSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freeSlots[i], freeSlots[j]] = [freeSlots[j], freeSlots[i]];
    }
    if (freeSlots.length < this.allHeroes.length) {
      this.logCallback("Error: Not enough free positions available.");
      return false;
    }
    // Assign the first N slots to heroes.
    this.allHeroes.forEach((hero, index) => {
      const slot = freeSlots[index];
      hero.x = slot.x;
      hero.y = slot.y;
    });
    return true;
  }
  
  /**
   * Simulate one round where each alive hero takes a turn.
   * Collision detection is applied, and movement or attacks occur based on proximity.
   */
  simulationRound() {
    this.logCallback(`--- Round ${this.round} ---`);
    let anyAction = false;
    const turnOrder = this.allHeroes.filter(hero => hero.hp > 0);
    
    for (let hero of turnOrder) {
      if (hero.hp <= 0) continue; // Skip dead heroes.
      
      // Find enemies (heroes on a different team that are alive).
      const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
      
      // If no enemy remains, declare victory.
      if (enemies.length === 0) {
        this.logCallback(`Victory: Team ${hero.team} wins!`);
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
      
      // If within attack range, attack; otherwise, move towards target.
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
        // Calculate a new position toward target.
        let dx = target.x - hero.x;
        let dy = target.y - hero.y;
        let newX = hero.x;
        let newY = hero.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          newX = hero.x + (dx > 0 ? 1 : -1);
          // If occupied, try vertical movement.
          if (this.isOccupied(newX, hero.y, hero)) {
            newX = hero.x;
            newY = hero.y + (dy > 0 ? 1 : -1);
            if (this.isOccupied(newX, newY, hero)) {
              newX = hero.x;
              newY = hero.y;
            }
          }
        } else {
          newY = hero.y + (dy > 0 ? 1 : -1);
          // If occupied, try horizontal movement.
          if (this.isOccupied(hero.x, newY, hero)) {
            newY = hero.y;
            newX = hero.x + (dx > 0 ? 1 : -1);
            if (this.isOccupied(newX, newY, hero)) {
              newX = hero.x;
              newY = hero.y;
            }
          }
        }
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
    this.drawCanvas();
    if (!anyAction) {
      this.logCallback("No actions possible. Ending simulation.");
      this.stopSimulation();
      if (this.onGameOver) this.onGameOver();
    }
  }
  
  /**
   * Check if a given cell (x, y) is occupied by another alive hero.
   */
  isOccupied(x, y, movingHero) {
    return this.allHeroes.some(hero => hero.hp > 0 && hero !== movingHero && hero.x === x && hero.y === y);
  }

  /**
   * Stop the simulation.
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
   * The grid is scaled dynamically so it always fits within the canvas.
   */
  drawCanvas() {
    const container = document.getElementById("summit-battlefield");
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      // Let canvas size be the full size of container.
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      container.innerHTML = "";
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the font – ensure "Sono" is imported via CSS.
    ctx.font = "10px 'Sono', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Define base tile dimensions.
    const baseTileWidth = 32;
    const baseTileHeight = 16;
    const isoGridWidth = (this.mapSize + this.mapSize) * baseTileWidth / 2;
    const isoGridHeight = this.mapSize * baseTileHeight;
    
    // Calculate scale factor to ensure grid fits in canvas.
    const scaleX = canvas.width / isoGridWidth;
    const scaleY = canvas.height / isoGridHeight;
    const scale = Math.min(scaleX, scaleY);

    // Adjust tile dimensions based on scale factor.
    const tileWidth = baseTileWidth * scale;
    const tileHeight = baseTileHeight * scale;
    const scaledGridWidth = isoGridWidth * scale;
    const scaledGridHeight = isoGridHeight * scale;
    const offsetX = (canvas.width - scaledGridWidth) / 2;
    const offsetY = (canvas.height - scaledGridHeight) / 2;

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    // Draw vertical-ish grid lines.
    for (let i = 0; i <= this.mapSize; i++) {
      let startX = (i * tileWidth / 2) + offsetX + scaledGridWidth / 2;
      let startY = (i * tileHeight / 2) + offsetY;
      let endX = ((i - this.mapSize) * tileWidth / 2) + offsetX + scaledGridWidth / 2;
      let endY = ((i + this.mapSize) * tileHeight / 2) + offsetY;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    // Draw horizontal-ish grid lines.
    for (let i = 0; i <= this.mapSize; i++) {
      let startX = ((-i) * tileWidth / 2) + offsetX + scaledGridWidth / 2;
      let startY = (i * tileHeight / 2) + offsetY;
      let endX = (((this.mapSize) - i) * tileWidth / 2) + offsetX + scaledGridWidth / 2;
      let endY = ((this.mapSize + i) * tileHeight / 2) + offsetY;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Draw each hero as a diamond with the hero symbol centered.
    this.allHeroes.forEach(hero => {
      if (hero.hp > 0) {
        let isoX = (hero.x - hero.y) * tileWidth / 2 + offsetX + scaledGridWidth / 2;
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
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY);
      }
    });
  }

  /**
   * Generate a team color based on team number.
   * Cycles through 50 hues.
   */
  getTeamColor(team) {
    const hue = (team * 360 / 50) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
}
