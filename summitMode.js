/**
 * summitMode.js
 *
 * Revised simulation with improved on-screen displays.
 * 
 * This simulation runs turn-by-turn with heroes sorted by highest agility.
 * During a hero's turn, the hero can move up to a number of spaces equal to its agility.
 * At each step, if an enemy is within attack range (hero.range), the hero attacks for its attack stat value.
 * When a hero defeats an enemy (reducing its HP to 0 or below), the defeated hero’s HP is restored to its original value
 * and the enemy immediately joins the attacker's team.
 * 
 * On-screen, the simulation now displays:
 * - A canvas (800×600) with an outlined isometric grid where heroes are drawn.
 * - A "hero info" display showing each hero's name, coordinates, and their team color.
 * - A log that shows only moves and attacks per turn.
 */

import { heroes as allHeroes } from "./heroes.js";

export class SummitMode {
  constructor(logCallback, onGameOver, onVictory) {
    this.mapSize = 50;
    this.onGameOver = onGameOver;
    this.onVictory = onVictory;
    
    // A streamlined log that shows only per-turn events.
    this.logLines = [];
    this.logCallback = (message) => {
      // Wrap message in a paragraph for easier styling.
      this.logLines.push(`<p>${message}</p>`);
      // Limit log lines to the last 20 events.
      if (this.logLines.length > 20) this.logLines.shift();
      const logBox = document.getElementById("summit-log");
      if (logBox) {
        logBox.innerHTML = this.logLines.join("");
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
        // 'agility' determines both turn order and how many spaces the hero can move in one turn.
        agility: hero.agility || 1,
        name: hero.name,
        symbol: hero.symbol
      };
    });

    // Prepare turn tracking.
    this.turnOrder = []; // Will be computed at each full round.
    this.turnIndex = 0;  // Index in the turn order.
    this.delay = 500;    // Delay (in ms) between turns.
  }

  /**
   * Start the simulation:
   * - Update the turn order.
   * - Draw the initial canvas and hero info.
   * - Begin processing turns.
   */
  start() {
    this.logCallback("Starting Summit Mode battle royale simulation...");
    this.updateTurnOrder();
    this.drawCanvas();
    this.updateHeroInfo();
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
   * At each move, if an enemy is in range, the hero attacks and ends its turn.
   */
  processTurn() {
    // Refresh turn order when a round is complete.
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
    
    // Determine enemies: heroes on a different team that are alive.
    const enemies = this.allHeroes.filter(h => h.team !== hero.team && h.hp > 0);
    if (enemies.length === 0) {
      this.logCallback(`Victory: Team ${hero.team} now controls all heroes!`);
      if (this.onVictory) this.onVictory();
      return;
    }
    
    // Allow hero to move as many spaces as its agility permits.
    let movesLeft = hero.agility;
    let acted = false; // Set to true when hero attacks.

    while (movesLeft > 0 && !acted) {
      // Recompute target each time.
      let target = null;
      let minDist = Infinity;
      for (let enemy of enemies) {
        const dist = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
      
      // If target is within attack range, attack and end turn.
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
        // Move one step toward target.
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

    // Update hero info display after the turn.
    this.turnIndex++;
    this.drawCanvas();
    this.updateHeroInfo();
    this.scheduleNextTurn();
  }
  
  /**
   * Schedule the next turn after the specified delay.
   */
  scheduleNextTurn() {
    setTimeout(() => this.processTurn(), this.delay);
  }

  /**
   * Update the on-screen hero information.
   * Displays each hero's name, coordinates, and shows a color block representing their team.
   * Assumes an HTML container with id "hero-info".
   */
  updateHeroInfo() {
    const infoContainer = document.getElementById("hero-info");
    if (!infoContainer) return;
    
    // Clear previous info.
    infoContainer.innerHTML = "";
    
    // Create a styled div for each hero.
    this.allHeroes.forEach(hero => {
      const heroDiv = document.createElement("div");
      heroDiv.style.padding = "2px 4px";
      heroDiv.style.margin = "2px 0";
      heroDiv.style.border = "1px solid #ccc";
      heroDiv.style.borderRadius = "3px";
      heroDiv.style.backgroundColor = this.getTeamColor(hero.team);
      heroDiv.style.color = "#000";
      heroDiv.style.fontSize = "12px";
      heroDiv.innerText = `${hero.name} (Team ${hero.team}) at (${hero.x}, ${hero.y}) HP: ${hero.hp}/${hero.originalHp}`;
      infoContainer.appendChild(heroDiv);
    });
  }
  
  /**
   * Draw the battlefield on an 800×600 canvas using isometric projection.
   * A border is drawn around the grid.
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
    // Compute overall isometric grid size.
    const isoGridWidth = (this.mapSize + this.mapSize) * tileWidth / 2;
    const isoGridHeight = this.mapSize * tileHeight;
    // Center the grid.
    const offsetX = (canvas.width - isoGridWidth) / 2;
    const offsetY = (canvas.height - isoGridHeight) / 2;
  
    // Draw a border around the isometric grid.
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, isoGridWidth, isoGridHeight);
  
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
        // Draw the hero's symbol.
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
