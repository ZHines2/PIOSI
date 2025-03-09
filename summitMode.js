/**
 * summitMode.js
 *
 * This file handles Summit Mode in PIOSI.
 * In Summit Mode, a special hero selection screen is shown where the player chooses one hero.
 * The selected hero is placed on a 50×50 grid along with all other heroes (at random positions),
 * and battle begins using the existing grid-based BattleEngine mechanics.
 *
 * When a hero (enemy) is defeated, if it is not already in the playable squad, it is added.
 * Additionally, when an enemy hero becomes controllable, its HP is restored to full.
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
      <div id="summit-battlefield" style="margin:10px auto; width:500px; height:500px; border:1px solid #fff;"></div>
      <div id="summit-status" style="text-align:center;"></div>
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
      // Render the battlefield grid.
      const battlefieldDiv = document.getElementById("summit-battlefield");
      battlefieldDiv.innerHTML = this.battleEngine.drawBattlefield();
    }
  }

  /**
   * Called when a hero is defeated.
   *
   * If the defeated hero is controlled by the player and it is the last playable hero, then game over.
   * If an enemy hero is defeated, it is added to the playable squad (controlledByPlayer=true)
   * and its HP is restored to full.
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
      this.logCallback(`${defeatedHero.name} has been defeated and joins your team! Restoring full HP.`);
      defeatedHero.controlledByPlayer = true;
      // Restore enemy hero's HP. If a maxHp property exists, use that; otherwise, set to a default value.
      defeatedHero.hp = defeatedHero.maxHp !== undefined ? defeatedHero.maxHp : 100;
      // Note: You might want to preserve original HP values in your hero definitions.
      // The enemy now becomes a playable unit.
    }
  }
}
