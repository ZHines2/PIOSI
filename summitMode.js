/**
 * summitMode.js
 *
 * Revised to add a canvas-based battle rendering that uses the "Sono" font
 * (loaded in CSS) so that Unicode characters render properly.
 *
 * In Summit Mode, a special hero selection screen is shown where the player chooses one hero.
 * The selected hero is placed on a 50×50 grid along with all heroes (at random positions),
 * and battle begins using grid-based BattleEngine mechanics.
 *
 * When a hero (enemy) is defeated, if it is not already in the playable squad, it is added.
 * Additionally, when an enemy hero becomes controllable, its HP is restored to its original spawn value.
 * The game is over when all playable heroes are defeated.
 */

import { heroes as allHeroes } from "./heroes.js";
import { BattleEngine } from "./battleEngine.js";

export class SummitMode {
  constructor(logCallback, onGameOver) {
    this.mapSize = 50;
    this.logCallback = logCallback;
    this.onGameOver = onGameOver;
    // Work on a copy of all heroes so that modifications here do not affect the base definitions.
    this.allHeroes = allHeroes.map(hero => ({ ...hero }));
    // Save each hero's original HP value.
    this.allHeroes.forEach(hero => {
      hero.originalHp = hero.hp || 100;
    });
    // Index of hero chosen by the player, default is 0.
    this.selectedHeroIndex = 0;
    // The battle engine instance (uses base BattleEngine mechanics).
    this.battleEngine = null;
    // Bind selection key handling method.
    this.handleSelectionKeyDown = this.handleSelectionKeyDown.bind(this);
  }

  /**
   * Begins Summit Mode by displaying the hero selection screen.
   */
  start() {
    this.logCallback("Entering Summit Mode selection screen...");
    this.showHeroSelectionScreen();
    document.addEventListener("keydown", this.handleSelectionKeyDown);
  }

  /**
   * Render the hero selection screen in the summit-mode container.
   */
  showHeroSelectionScreen() {
    const container = document.getElementById("summit-mode");
    container.innerHTML = `
      <h1>Summit Mode - Select Your Hero</h1>
      <div id="summit-selection" style="display:flex; justify-content:center; align-items:center;"></div>
      <div id="summit-stats" style="margin-top:10px; text-align:center;"></div>
      <p style="text-align:center;">Use Left/Right arrows to select a hero. Press Space to confirm.</p>
    `;
    this.renderSelection();
  }

  /**
   * Display hero icons in the selection area, highlighting the selected hero.
   */
  renderSelection() {
    const selectionDiv = document.getElementById("summit-selection");
    selectionDiv.innerHTML = "";
    this.allHeroes.forEach((hero, idx) => {
      const heroDiv = document.createElement("div");
      heroDiv.style.margin = "5px";
      heroDiv.style.padding = "10px";
      heroDiv.style.border = idx === this.selectedHeroIndex ? "2px solid yellow" : "2px solid gray";
      heroDiv.style.backgroundColor = "#222";
      heroDiv.style.color = "#fff";
      heroDiv.style.fontSize = "1.5em";
      // Display hero symbol if provided; otherwise, first letter of the hero's name.
      heroDiv.textContent = hero.symbol || hero.name.charAt(0);
      selectionDiv.appendChild(heroDiv);
    });
    this.renderHeroStats();
  }

  /**
   * Display detailed stats for the currently highlighted hero.
   */
  renderHeroStats() {
    const statsDiv = document.getElementById("summit-stats");
    const hero = this.allHeroes[this.selectedHeroIndex];
    let statsHtml = `<strong>${hero.name}</strong><br>`;
    statsHtml += `Attack: ${hero.attack || 0} | HP: ${hero.hp || 0} | Agility: ${hero.agility || 0} | Range: ${hero.range || 0}`;
    statsDiv.innerHTML = statsHtml;
  }

  /**
   * Handle keydown events on the hero selection screen.
   * Left/Right arrows cycle through heroes; Space confirms selection.
   */
  handleSelectionKeyDown(e) {
    if (!this.isSummitModeActive()) return; // Process keys only if summit-mode is visible
    if (e.code === "ArrowLeft") {
      this.selectedHeroIndex = (this.selectedHeroIndex - 1 + this.allHeroes.length) % this.allHeroes.length;
      this.renderSelection();
      e.preventDefault();
    } else if (e.code === "ArrowRight") {
      this.selectedHeroIndex = (this.selectedHeroIndex + 1) % this.allHeroes.length;
      this.renderSelection();
      e.preventDefault();
    } else if (e.code === "Space") {
      document.removeEventListener("keydown", this.handleSelectionKeyDown);
      this.logCallback(`Selected hero: ${this.allHeroes[this.selectedHeroIndex].name}`);
      this.initializeBattle();
      e.preventDefault();
    }
  }

  /**
   * Determines if the summit-mode container is currently active.
   */
  isSummitModeActive() {
    const container = document.getElementById("summit-mode");
    return container && container.style.display !== "none";
  }

  /**
   * Initialize the battle phase.
   * The selected hero is marked as controlled and placed on a random grid position.
   * All heroes are randomly positioned and sorted by agility for turn order.
   * The BattleEngine is instantiated with additional defeat handling for summing heroes.
   */
  initializeBattle() {
    // Position heroes randomly and mark playable vs. non-playable.
    this.allHeroes.forEach((hero, idx) => {
      hero.x = Math.floor(Math.random() * this.mapSize);
      hero.y = Math.floor(Math.random() * this.mapSize);
      // Initially, only the selected hero is controlled by the player.
      hero.controlledByPlayer = (idx === this.selectedHeroIndex);
    });
    // Sort heroes by agility descending.
    this.allHeroes.sort((a, b) => (b.agility || 0) - (a.agility || 0));

    // Clear the UI and render the battle layout.
    const container = document.getElementById("summit-mode");
    container.innerHTML = `
      <h1>Summit Mode - Battle</h1>
      <div id="summit-battlefield" style="margin:10px auto; width:800px; height:600px; border:1px solid #fff; position:relative;"></div>
      <div id="summit-status" style="text-align:center; margin-top:10px;"></div>
      <p style="text-align:center;">Use arrow keys to move, Space to attack.</p>
    `;

    // Instantiate the BattleEngine, providing callbacks for turn completion and defeat handling.
    this.battleEngine = new BattleEngine(
      this.allHeroes,
      [], // In Summit Mode, all heroes (playable and enemy) are in one array.
      this.mapSize,
      this.mapSize,
      0, // wallHP is set to 0 or can be customized.
      this.logCallback,
      this.onTurnComplete.bind(this),
      this.onHeroDefeated.bind(this)
    );

    // Replace the textual grid display with a canvas rendering.
    this.drawCanvas();
    // Start the battle loop.
    this.battleEngine.nextTurn();
  }

  /**
   * Callback triggered after each turn.
   * Updates the battlefield view and status using the BattleEngine's functions.
   */
  onTurnComplete() {
    if (this.battleEngine) {
      const statusDiv = document.getElementById("summit-status");
      const currentHero = this.battleEngine.getCurrentHero();
      statusDiv.textContent = `Turn: ${currentHero.name} at (${currentHero.x}, ${currentHero.y}) ${currentHero.controlledByPlayer ? "[Player]" : "[Enemy]"}`;
      // Instead of using a text-based grid, update the canvas visualization.
      this.drawCanvas();
    }
  }

  /**
   * Called when a hero is defeated.
   *
   * If the defeated hero is controlled by the player and it is the last playable hero, then game over.
   * If an enemy hero is defeated, it is added to the playable squad (controlledByPlayer=true)
   * and its HP is restored to its original spawn value.
   */
  onHeroDefeated(defeatedHero) {
    if (defeatedHero.controlledByPlayer) {
      // Check if any playable hero remains.
      const playableHeroes = this.allHeroes.filter(hero => hero.controlledByPlayer && (hero.hp || 0) > 0);
      if (playableHeroes.length === 0) {
        this.logCallback("Game Over! All playable heroes have been defeated.");
        this.onGameOver();
      } else {
        this.logCallback(`${defeatedHero.name} has fallen, but playable heroes remain.`);
        // Remove the defeated hero from further turns.
        this.battleEngine.removeHero(defeatedHero);
      }
    } else {
      // An enemy hero was defeated:
      this.logCallback(`${defeatedHero.name} has been defeated and joins your team! Restoring HP to original value (${defeatedHero.originalHp}).`);
      defeatedHero.controlledByPlayer = true;
      defeatedHero.hp = defeatedHero.originalHp;
      // Optionally, you might flag who defeated them.
      defeatedHero.defeatedBy = null;
    }
    // Update the canvas after a defeat.
    this.drawCanvas();
  }

  /**
   * Draw the battlefield on a canvas element using isometric projection.
   * The canvas uses the "Sono" font (set in CSS) by explicitly setting the context's font.
   */
  drawCanvas() {
    const container = document.getElementById("summit-battlefield");
    let canvas = container.querySelector("canvas");
    if (!canvas) {
      // Create a new canvas element if one doesn't exist.
      canvas = document.createElement("canvas");
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      container.innerHTML = "";
      container.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the font to use "Sono" as imported in the CSS.
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

    // Optionally, draw grid lines for reference.
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
        // You could customize the fillStyle based on the hero's team.
        ctx.fillStyle = "#88c"; 
        ctx.fill();
        // Draw the hero's symbol in the center.
        ctx.fillStyle = "black";
        ctx.fillText(hero.symbol ? hero.symbol[0] : hero.name[0], isoX, isoY);
      }
    });
  }
}
