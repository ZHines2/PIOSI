/**
 * summitMode.js
 *
 * Revised as a turn-by-turn simulation where each hero’s turn is processed in order based on highest agility.
 * During a hero's turn, the hero can move up to a number of spaces equal to its agility.
 * At each step, if an enemy is within attack range (hero.range), the hero attacks for its attack stat value.
 * When a hero defeats an enemy (reducing its HP to 0 or below), the defeated hero’s HP is restored to its original value
 * and immediately joins the attacker's team.
 *
 * Victory is declared when one team controls all heroes.
 *
 * This version has been updated to accommodate recent changes in index.html:
 * - The Summit Mode screen now includes a new container with id "summit-hero-info" for displaying
 *   each hero's name, coordinates, and team color.
 * - The log messages are displayed in "summit-log".
 * - The canvas is drawn in the "summit-battlefield" container.
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    // Streamlined log that shows only per-turn events.
    this.logLines = [];
    this.logCallback = (message) => {
      // Wrap the message in a paragraph for easier styling.
      this.logLines.push(`<p>${message}</p>`);
      // Keep only the latest 20 messages.
      if (this.logLines.length > 20) this.logLines.shift();
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("");
        // Set the background to black and text color to white.
        logBox.style.backgroundColor = "black";
        logBox.style.color = "white";
      }
    };

    // Initialize heroes with random positions and set their attributes.
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
        attack: hero.attack || 10,
        // 'range' represents the attack range; default to 1.
        range: hero.range || 1,
        // 'agility' determines both the turn order and how many spaces the hero can move.
        agility: hero.agility || 1,
        name: hero.name,
        symbol: hero.symbol
      };
    });

    // Prepare turn tracking.
    this.turnOrder = []; // Computed at the beginning of each round.
    this.turnIndex = 0;  // Index in the turn order.
    this.delay = 500;    // Delay (ms) between turns.
  }

  /**
   * Start the simulation by computing the initial turn order and processing the first turn.
   */
  start() {
    this.logCallback("Starting Summit Mode battle royale simulation...");
    this.updateTurnOrder();
    this.drawCanvas();
    this.updateSummitHeroInfo();
    this.processTurn();
  }

  /**
   * Update the turn order by sorting all alive heroes in descending order of agility.
   */
  updateTurnOrder() {
    this.turnOrder = this.allHeroes.filter(hero => hero.hp > 0)
      .sort((a, b) => b.agility - a.agility);
    this.turnIndex = 0;
  }

  /**
   * Process a single hero's turn.
   * The current hero can move up to hero.agility spaces.
   * At each step, if an enemy is within attack range, the hero attacks for its attack stat value.
   */
  processTurn() {
    // Refresh turn order when a complete round ends.
    if (this.turnIndex >= this.turnOrder.length) {
      this.updateTurnOrder();
      if (this.turnOrder.length === 0) {
        this.logCallback("No alive heroes remain. Ending simulation.");
        if (this.onGameOver) this.onGameOver();
        return;
      }
    }

    let hero = this.turnOrder[this.turnIndex];
    if (hero.hp <= 0) {
      this.turnIndex++;
      this.scheduleNextTurn();
      return;
    }

    // Determine alive enemy heroes not on the same team.
    const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
    if (enemies.length === 0) {
      this.logCallback(`Victory: Team ${hero.team} now controls all heroes!`);
      if (this.onVictory) this.onVictory();
      return;
    }

    // Set number of moves available based on hero's agility.
    let movesLeft = hero.agility;
    let acted = false;

    while (movesLeft > 0 && !acted) {
      // Pick the closest enemy as target.
      let target = null;
      let minDist = Infinity;
      for (let enemy of enemies) {
        const dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }

      // If the target is within attack range, attack and end turn.
      if (minDist <= hero.range) {
        this.logCallback(`${hero.name} (Team ${hero.team}) attacks ${target.name} (Team ${target.team}) for ${hero.attack} damage.`);
        target.hp -= hero.attack;
        acted = true;
        if (target.hp <= 0) {
          this.logCallback(`${target.name} is defeated by ${hero.name} and joins Team ${hero.team}. HP restored to ${target.originalHp}.`);
          target.team = hero.team;
          target.hp = target.originalHp;
          target.defeatedBy = hero.name;
        }
      } else {
        // Move one step closer to the target.
        let dx = target.x - hero.x;
        let dy = target.y - hero.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
          hero.x += dx > 0 ? 1 : -1;
        } else {
          hero.y += dy > 0 ? 1 : -1;
        }
        this.logCallback(`${hero.name} moves to (${hero.x}, ${hero.y}).`);
        movesLeft--;
      }
    }

    // Update canvas and hero info.
    this.turnIndex++;
    this.drawCanvas();
    this.updateSummitHeroInfo();
    this.scheduleNextTurn();
  }

  /**
   * Schedule processing the next turn after a delay.
   */
  scheduleNextTurn() {
    setTimeout(() => this.processTurn(), this.delay);
  }

  /**
   * Update the on-screen hero information for Summit Mode.
   * Populates the "summit-hero-info" container with each hero's details.
   */
  updateSummitHeroInfo() {
    const infoContainer = document.getElementById("summit-hero-info");
    if (!infoContainer) return;
    
    // Clear previous content.
    infoContainer.innerHTML = "";
    
    if (this.allHeroes.length === 0) {
      infoContainer.innerText = "No hero information available.";
      return;
    }
    
    // Create a display element for each hero.
    this.allHeroes.forEach(hero => {
      const heroDiv = document.createElement("div");
      heroDiv.style.padding = "4px";
      heroDiv.style.margin = "4px 0";
      heroDiv.style.border = "1px solid #ccc";
      heroDiv.style.borderRadius = "3px";
      // Set the background to black and text to white.
      heroDiv.style.backgroundColor = "black";
      heroDiv.style.color = "white";
      heroDiv.style.fontSize = "14px";
      heroDiv.innerText = `${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) HP: ${hero.hp}/${hero.originalHp}`;
      infoContainer.appendChild(heroDiv);
    });
  }
  
  /**
   * Draw the battlefield on an 800×600 canvas using isometric projection.
   * The canvas is drawn inside the "summit-battlefield" container.
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
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    const offsetX = (canvas.width - isoGridWidth) / 2;
    const offsetY = (canvas.height - isoGridHeight) / 2;
  
    // Draw the border around the grid.
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, isoGridWidth, isoGridHeight);
  
    // Draw each hero as an isometric diamond.
    this.allHeroes.forEach(hero => {
      if (hero.hp > 0) {
        const isoX = (hero.x - hero.y) * tileWidth / 2 + offsetX + isoGridWidth / 2;
        const isoY = (hero.x + hero.y) * tileHeight / 2 + offsetY;
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
   * Generate a team color based on team number, cycling through 50 hues.
   */
  getTeamColor(team) {
    const hue = (team * 360 / 50) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
}
