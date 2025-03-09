/**
 * summitMode.js
 *
 * This file contains the logic for the summit mode in PIOSI.
 * In summit mode, all heroes are placed on a 50x50 map, the player controls one hero,
 * and enemy heroes join the player's team when defeated.
 */

import { heroes as allHeroes } from './heroes.js';
import { BattleEngine } from './battleEngine.js';

export class SummitMode {
  constructor(playerHeroIndex, logCallback, onGameOver) {
    this.mapSize = 50;
    this.playerHeroIndex = playerHeroIndex;
    this.logCallback = logCallback;
    this.onGameOver = onGameOver;
    this.heroes = this.initializeHeroes();
    this.battleEngine = new BattleEngine(
      this.heroes,
      [],
      this.mapSize,
      this.mapSize,
      0,
      logCallback,
      this.onLevelComplete.bind(this),
      onGameOver
    );
  }

  initializeHeroes() {
    const heroes = allHeroes.map((hero, index) => {
      const newHero = { ...hero };
      newHero.x = Math.floor(Math.random() * this.mapSize);
      newHero.y = Math.floor(Math.random() * this.mapSize);
      newHero.controlledByPlayer = index === this.playerHeroIndex;
      return newHero;
    });
    return heroes;
  }

  onLevelComplete() {
    this.logCallback("Summit mode level complete!");
  }

  handleHeroDefeat(defeatedHero) {
    if (defeatedHero.controlledByPlayer) {
      this.logCallback("Game Over! Your hero has been defeated.");
      this.onGameOver();
    } else {
      this.logCallback(`${defeatedHero.name} has been defeated and joins your team!`);
      defeatedHero.controlledByPlayer = true;
    }
  }

  start() {
    this.logCallback("Summit mode started!");
    this.battleEngine.nextTurn();
  }
}
