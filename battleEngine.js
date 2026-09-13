/**
 * battleEngine.js
 * 
 * This file implements the battle engine for PIOSI. It includes:
 * - Unit movement and attack logic (including knockback, chain, and swarm abilities).
 * - Healing item (vittle) and mushroom pickup.
 * - Hero death handling that triggers persistent death effects with the "rise" stat.
 *   If a hero has points in the rise stat when they die, they are resurrected on the next
 *   level with HP equal to the rise value, the rise stat is reset to zero, and they still
 *   trigger ankh boosts to all live heroes.
 * - The ankh stat boost now enhances one of attack, hp, agility, or range.
 */

import { applySlujEffect } from './sluj.js';
import {
  ABILITY_HOOKS,
  BATTLE_PHASES,
  createSeededRng,
  normalizeCombatant,
  normalizeLevelSettings
} from './gameModel.js';
import { runBattleHook } from './battleRules.js';

// Class to represent a persistent death effect.
export class PersistentDeath {
  constructor() {
    this.isDead = true;
  }
}

export class BattleEngine {
  constructor(party, enemies, fieldRows, fieldCols, wallHP, logCallback, onLevelComplete, onGameOver, options = {}) {
    // Keep all heroes in the party array.
    // NOTE: Heroes with persistent death will no longer be referenced in the battlefield.
    this.party = party;
    this.enemies = enemies;
    this.rows = fieldRows;
    this.cols = fieldCols;
    this.wallHP = wallHP;
    this.logCallback = logCallback;
    this.onLevelComplete = onLevelComplete;
    this.onGameOver = onGameOver;
    this.levelSettings = normalizeLevelSettings(options.levelSettings ?? { rows: fieldRows, cols: fieldCols, wallHP });
    this.rng = options.rng ?? createSeededRng(options.seed);
    this.eventLog = [];
    this.phase = BATTLE_PHASES.BATTLE_START;
    this.turnCounter = 0;

    this.party.forEach((hero, index) => Object.assign(hero, normalizeCombatant(hero, { fallbackId: `hero-${index + 1}`, team: 'hero' })));
    this.enemies.forEach((enemy, index) => Object.assign(enemy, normalizeCombatant(enemy, { fallbackId: `enemy-${index + 1}`, team: 'enemy' })));

    // Advance past any heroes that are already persistently dead at battle start.
    this.currentUnit = 0;
    while (this.currentUnit < this.party.length && this.party[this.currentUnit].persistentDeath) {
      this.currentUnit++;
    }
    if (this.currentUnit >= this.party.length) {
      // All heroes are persistently dead — trigger game over after construction.
      this.currentUnit = 0;
      this.movePoints = 0;
      setTimeout(() => { if (typeof this.onGameOver === 'function') this.onGameOver(); }, 0);
    } else {
      this.movePoints = this.party[this.currentUnit].agility;
    }
    this.awaitingAttackDirection = false;
    this.transitioningLevel = false;

    // Initialize status effects for all heroes and enemies.
    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
      // Persistent death marker may already exist.
      if (!hero.persistentDeath) hero.persistentDeath = null;
      // Initialize rise stat if not set.
      if (typeof hero.rise !== 'number') hero.rise = 0;
      // Initialize dodge stat if not set.
      if (typeof hero.dodge !== 'number') hero.dodge = 0;
    });
    this.enemies.forEach(enemy => {
      enemy.statusEffects = enemy.statusEffects || {};
      // Initialize dodge stat if not set.
      if (typeof enemy.dodge !== 'number') enemy.dodge = 0;
    });
    this.battlefield = this.initializeBattlefield();
    this.setPhase(BATTLE_PHASES.PLAYER_TURN_START);
  }

  emitEvent(type, payload = {}) {
    this.eventLog.push({
      index: this.eventLog.length,
      type,
      phase: this.phase,
      turn: this.turnCounter,
      ...payload
    });
  }

  setPhase(phase) {
    this.phase = phase;
    this.emitEvent('phase.changed', { phase });
  }

  pickRandom(items) {
    return this.rng.pick(items);
  }

  rollChance(probability) {
    return this.rng.chance(probability);
  }

  // Returns the list of heroes that are not persistently dead.
  getLiveHeroes() {
    return this.party.filter(hero => !hero.persistentDeath);
  }

  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () => Array(this.cols).fill('.'));
    this.placeHeroes(field);
    this.placeEnemies(field);
    this.createWall(field);
    this.placeHealingItem(field);
    this.placeMushroom(field);
    if (this.levelSettings && this.levelSettings.layout) {
      for (let y = 0; y < this.levelSettings.layout.length; y++) {
        for (let x = 0; x < this.levelSettings.layout[y].length; x++) {
          if (this.levelSettings.layout[y][x] === '.wall') field[y][x] = '.wall';
        }
      }
    }
    this.getLiveHeroes().forEach(hero => {
      runBattleHook(this, ABILITY_HOOKS.ON_BATTLE_START, { hero });
    });
    return field;
  }

  placeHeroes(field) {
    // Only place live heroes.
    // Use the party order so that currentUnit pointer correctly corresponds to the hero's position on the field.
    this.party.forEach(hero => {
      if (hero.persistentDeath) return;
      let placed = false;
      for (let y = 0; y < this.rows && !placed; y++) {
        for (let x = 0; x < this.cols && !placed; x++) {
          if (field[y][x] === '.') {
            hero.x = x;
            hero.y = y;
            field[y][x] = hero.symbol;
            placed = true;
          }
        }
      }
    });
  }

  placeEnemies(field) {
    this.enemies.forEach(enemy => {
      enemy.statusEffects = {};
      field[enemy.y][enemy.x] = enemy.symbol;
    });
  }

  createWall(field) {
    for (let i = 0; i < this.cols; i++) field[this.rows - 1][i] = 'ᚙ';
    this.enemies.forEach(enemy => {
      if (enemy.symbol === '█') field[enemy.y][enemy.x] = enemy.symbol;
    });
  }

  placeHealingItem(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length) {
      const cell = this.pickRandom(emptyCells);
      field[cell.y][cell.x] = 'ౚ';
    }
  }

  placeMushroom(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') emptyCells.push({ x, y });
      }
    }
    if (emptyCells.length) {
      const cell = this.pickRandom(emptyCells);
      field[cell.y][cell.x] = 'ඉ';
    }
  }

  drawBattlefield() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = '';
        if (cellContent === 'ౚ' || cellContent === 'ඉ') cellClass += ' healing-item';
        if (this.enemies.some(enemy => enemy.symbol === cellContent)) cellClass += ' enemy';
        // Use the active hero from the party (if not dead) for highlighting.
        const activeHero = this.party[this.currentUnit] && !this.party[this.currentUnit].persistentDeath ? this.party[this.currentUnit] : null;
        if (activeHero && activeHero.x === x && activeHero.y === y) {
          cellClass += this.awaitingAttackDirection ? ' attack-mode' : ' active';
        }
        html += `<div class="cell${cellClass}">${cellContent}</div>`;
      }
      html += '</div>';
    }
    return html;
  }

  isWithinBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  isCellPassable(x, y) {
    return (
      this.battlefield[y][x] === '.' ||
      this.battlefield[y][x] === 'ౚ' ||
      this.battlefield[y][x] === 'ඉ'
    );
  }

  moveUnit(dx, dy) {
    if (this.awaitingAttackDirection || this.movePoints <= 0 || this.transitioningLevel) return;
    this.setPhase(BATTLE_PHASES.PLAYER_MOVE);
    // Always refer to the active hero directly from party.
    const unit = this.party[this.currentUnit];
    if (!unit || unit.persistentDeath) return;
    if (unit.hp <= 0) {
      this.logCallback(`${unit.name} is dead and cannot move.`);
      return;
    }
    const newX = unit.x + dx, newY = unit.y + dy;
    if (!this.isWithinBounds(newX, newY)) return;
    if (this.battlefield[newY][newX] === 'ᚙ' || this.battlefield[newY][newX] === '█') {
      this.wallHP -= unit.attack;
      this.logCallback(`${unit.name} attacks the wall for ${unit.attack} damage! (Wall HP: ${this.wallHP})`);
      if (this.wallHP <= 0 && !this.transitioningLevel) {
        this.handleWallCollapse();
        return;
      }
      this.movePoints--;
      if (this.movePoints === 0) this.nextTurn();
      return;
    }
    const destinationTile = this.battlefield[newY][newX];
    if (destinationTile === 'ౚ' || destinationTile === 'ඉ') {
      runBattleHook(this, ABILITY_HOOKS.ON_MOVE, {
        unit,
        from: { x: unit.x, y: unit.y },
        to: { x: newX, y: newY },
        tile: destinationTile
      });
      this.battlefield[newY][newX] = '.';
    }
    if (!this.isCellPassable(newX, newY)) return;
    this.battlefield[unit.y][unit.x] = '.';
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;
    this.movePoints--;
    if (this.movePoints === 0) this.nextTurn();
  }

  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    this.setPhase(BATTLE_PHASES.PLAYER_ATTACK_RESOLVE);
    if (unit.hp <= 0) {
      this.logCallback(`${unit.name} is dead and cannot attack.`);
      return;
    }
    await recordAttackCallback(`${unit.name} attacked in direction (${dx}, ${dy}).`);
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i, targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;
      // Use only live heroes for targeting; dead heroes never register.
      const ally = this.getLiveHeroes().find(h => h.x === targetX && h.y === targetY && h !== unit);
      if (ally) {
        const applied = runBattleHook(this, ABILITY_HOOKS.ON_ATTACK_TARGET_ALLY, { attacker: unit, target: ally });
        if (applied.length === 0) {
          this.logCallback(`${unit.name} attacks ${ally.name} but nothing happens.`);
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      // If a hero is found at the targeted cell but is dead, treat it as an empty cell.
      const deadHero = this.party.find(h => h.x === targetX && h.y === targetY && h.persistentDeath);
      if (deadHero) {
        this.logCallback(`${unit.name} attacks an empty cell where ${deadHero.name} once stood.`);
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
         // DODGE CHECK START
        let dodgeChance = enemy.dodge / (100 + enemy.dodge); // Diminishing returns
        dodgeChance = Math.min(dodgeChance, 0.5); // Cap dodge chance at 50%
        if (this.rollChance(dodgeChance)) {
          this.logCallback(`${enemy.name} dodges ${unit.name}'s attack!`);
         this.emitEvent('attack.dodged', { attackerId: unit.id, targetId: enemy.id });
         this.awaitingAttackDirection = false;
         await this.shortPause();
         this.nextTurn();
          return; // Skip the rest of the attack logic
        }
        // DODGE CHECK END
        enemy.hp -= unit.attack;
        this.emitEvent('damage.applied', { unitId: enemy.id, amount: unit.attack, source: 'attack', actorId: unit.id });
        this.logCallback(`${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`);
        runBattleHook(this, ABILITY_HOOKS.ON_ATTACK_TARGET_ENEMY, { attacker: unit, target: enemy, dx, dy });
        // Check for enemy defeat
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated!`);
          this.battlefield[enemy.y][enemy.x] = '.';
          this.enemies = this.enemies.filter(e => e !== enemy);
          runBattleHook(this, ABILITY_HOOKS.ON_KILL, { attacker: unit, target: enemy, cause: 'attack' });
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      if (this.battlefield[targetY][targetX] === 'ᚙ' || this.battlefield[targetY][targetX] === '█') {
        this.wallHP -= unit.attack;
        this.logCallback(`${unit.name} attacks the wall for ${unit.attack} damage! (Wall HP: ${this.wallHP})`);
        this.awaitingAttackDirection = false;
        if (this.wallHP <= 0 && !this.transitioningLevel) {
          this.handleWallCollapse();
          return;
        }
        await this.shortPause();
        this.nextTurn();
        return;
      }
    }
    this.logCallback(`${unit.name} attacks, but nothing is in range.`);
    this.awaitingAttackDirection = false;
    await this.shortPause();
    this.nextTurn();
  }

  applyChainDamage(enemy, damage, effectiveMultiplier, visited = new Set()) {
    visited.add(enemy);
    const adjacentOffsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: -1, y: 1 },
      { x: 1, y: -1 }, { x: 1, y: 1 }
    ];
    for (let offset of adjacentOffsets) {
      const adjX = enemy.x + offset.x, adjY = enemy.y + offset.y;
      if (!this.isWithinBounds(adjX, adjY)) continue;
      const adjacentEnemy = this.enemies.find(e => e.x === adjX && e.y === adjY);
      if (adjacentEnemy && !visited.has(adjacentEnemy)) {
        adjacentEnemy.hp -= damage;
        this.logCallback(`${adjacentEnemy.name} takes ${damage} chain damage! (HP left: ${adjacentEnemy.hp})`);
        if (adjacentEnemy.hp <= 0) {
          this.logCallback(`${adjacentEnemy.name} is defeated by chain damage!`);
          this.battlefield[adjY][adjX] = '.';
          this.enemies = this.enemies.filter(e => e !== adjacentEnemy);
        }
        const nextDamage = Math.round(damage * effectiveMultiplier);
        if (nextDamage > 0 && nextDamage < damage) {
          this.logCallback(`${adjacentEnemy.name} takes ${nextDamage} chain propagation damage!`);
          this.applyChainDamage(adjacentEnemy, nextDamage, effectiveMultiplier, visited);
        }
      }
    }
  }

  enemyTurn() {
    if (this.transitioningLevel) return;
    this.setPhase(BATTLE_PHASES.ENEMY_PHASE);
    this.enemies.forEach(enemy => {
      for (let moves = 0; moves < enemy.agility; moves++) this.moveEnemy(enemy);
      this.enemyAttackAdjacent(enemy);
      
      // Apply the slüj effect for each enemy.
      if (enemy.statusEffects.sluj) {
        applySlujEffect(enemy, this.logCallback);
      }
      
      // Kill logic for enemies affected by slüj damage.
      if (enemy.hp <= 0 && enemy.statusEffects.sluj && enemy.statusEffects.sluj.level > 0) {
        this.logCallback(`${enemy.name} is defeated by its slüj effect!`);
        this.battlefield[enemy.y][enemy.x] = '.';
        this.enemies = this.enemies.filter(e => e !== enemy);
        return;
      }
      
      if (Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0) {
        this.logCallback(`${enemy.name} says: "${this.pickRandom(enemy.dialogue)}"`);
      }
    });
    this.logCallback('Enemy turn completed.');
    this.emitEvent('enemy.turn.completed', { enemiesRemaining: this.enemies.length });
  }

  moveEnemy(enemy) {
    const targetHero = this.findClosestHero(enemy);
    if (!targetHero) return;
    const dx = targetHero.x - enemy.x, dy = targetHero.y - enemy.y;
    let stepX = 0, stepY = 0;
    if (Math.abs(dx) >= Math.abs(dy))
      stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    else
      stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    if (!this.canMove(enemy.x + stepX, enemy.y + stepY)) {
      if (stepX !== 0 && this.canMove(enemy.x, enemy.y + Math.sign(dy))) {
        stepY = dy > 0 ? 1 : -1;
        stepX = 0;
      } else if (stepY !== 0 && this.canMove(enemy.x + Math.sign(dx), enemy.y)) {
        stepX = dx > 0 ? 1 : -1;
        stepY = 0;
      }
    }
    const newX = enemy.x + stepX, newY = enemy.y + stepY;
    if (this.canMove(newX, newY)) {
      this.battlefield[enemy.y][enemy.x] = '.';
      enemy.x = newX;
      enemy.y = newY;
      this.battlefield[newY][newX] = enemy.symbol;
    }
  }

  findClosestHero(enemy) {
    const liveHeroes = this.getLiveHeroes();
    if (liveHeroes.length === 0) return null;
    return liveHeroes.reduce((closest, hero) => {
      const dCurrent = Math.abs(closest.x - enemy.x) + Math.abs(closest.y - enemy.y);
      const dHero = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      return (dHero < dCurrent ? hero : closest);
    });
  }

  canMove(x, y) {
    return this.isWithinBounds(x, y) && this.isCellPassable(x, y);
  }
  
  enemyAttackAdjacent(enemy) {
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    // Use only live heroes when determining targets.
    directions.forEach(([dx, dy]) => {
      const tx = enemy.x + dx, ty = enemy.y + dy;
      const targetHero = this.getLiveHeroes().find(hero => hero.x === tx && hero.y === ty);
      if (targetHero) {
         // DODGE CHECK START
        let dodgeChance = targetHero.dodge / (100 + targetHero.dodge);
        dodgeChance = Math.min(dodgeChance, 0.5);
        if (this.rollChance(dodgeChance)) {
          this.logCallback(`${targetHero.name} dodges ${enemy.name}'s attack!`);
          this.emitEvent('attack.dodged', { attackerId: enemy.id, targetId: targetHero.id });
          return;
        }
        // DODGE CHECK END
        let prevented = null;
        if (targetHero.armor && targetHero.armor > 0) {
          targetHero.armor--;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} but their armor absorbs it (Remaining Armor: ${targetHero.armor})`);
          prevented = 'armor';
        } else {
          targetHero.hp -= enemy.attack;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (HP left: ${targetHero.hp})`);
          this.emitEvent('damage.applied', { unitId: targetHero.id, amount: enemy.attack, source: 'enemyAttack', actorId: enemy.id });
        }
        if (targetHero.hp <= 0) {
          this.handleHeroDeath(targetHero);
          if (this.currentUnit >= this.party.length)
            this.currentUnit = 0;
        } else {
          runBattleHook(this, ABILITY_HOOKS.ON_TAKE_DAMAGE, {
            attacker: enemy,
            target: targetHero,
            prevented,
            damage: prevented ? 0 : enemy.attack
          });
        }
      }
    });
  }

  nextTurn() {
    if (this.transitioningLevel) return;
    this.setPhase(BATTLE_PHASES.PLAYER_TURN_END);
    this.turnCounter++;
    this.applyStatusEffects();
    runBattleHook(this, ABILITY_HOOKS.ON_TURN_END, { heroes: this.getLiveHeroes() });
    const liveHeroes = this.getLiveHeroes();
    if (liveHeroes.length === 0) {
      this.logCallback('All heroes defeated! Game Over.');
      this.setPhase(BATTLE_PHASES.DEFEAT);
      if (typeof this.onGameOver === 'function') this.onGameOver();
      return;
    }
    this.awaitingAttackDirection = false;
    do {
      this.currentUnit++;
      if (this.currentUnit >= this.party.length) {
        this.currentUnit = 0;
        this.logCallback('Enemy turn begins.');
        this.enemyTurn();
        this.applyStatusEffects();
        if (this.getLiveHeroes().length === 0) {
          this.logCallback('All heroes defeated! Game Over.');
          this.setPhase(BATTLE_PHASES.DEFEAT);
          if (typeof this.onGameOver === 'function') this.onGameOver();
          return;
        }
      }
    } while(this.party[this.currentUnit].persistentDeath);
    this.movePoints = this.party[this.currentUnit].agility;
    this.setPhase(BATTLE_PHASES.PLAYER_TURN_START);
    this.logCallback(`Now it's ${this.party[this.currentUnit].name}'s turn.`);
  }

  applyStatusEffects() {
    this.getLiveHeroes().forEach(hero => {
      if (hero.statusEffects.burn && hero.statusEffects.burn.duration > 0) {
        this.logCallback(`${hero.name} takes ${hero.statusEffects.burn.damage} burn damage!`);
        hero.hp -= hero.statusEffects.burn.damage;
        hero.statusEffects.burn.duration--;
        if (hero.hp <= 0) this.handleHeroDeath(hero);
      }
    });
    this.enemies.forEach(enemy => {
      if (enemy.statusEffects.burn && enemy.statusEffects.burn.duration > 0) {
        this.logCallback(`${enemy.name} takes ${enemy.statusEffects.burn.damage} burn damage!`);
        enemy.hp -= enemy.statusEffects.burn.damage;
        enemy.statusEffects.burn.duration--;
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} died from burn damage!`);
          this.battlefield[enemy.y][enemy.x] = '.';
          this.enemies = this.enemies.filter(e => e !== enemy);
        }
      }
      // The slüj effect is handled via the imported applySlujEffect() in enemyTurn().
    });
  }

  // Updated handleHeroDeath method to ensure a dead hero's cell is cleared.
  handleHeroDeath(hero) {
    if (hero.rise > 0) {
      this.logCallback(`Hero ${hero.name} falls but rises with ${hero.rise} HP!`);
      hero.hp = hero.rise;
      hero.rise = 0;
      runBattleHook(this, ABILITY_HOOKS.ON_REVIVE, { hero, outcome: 'revived' });
      return;
    }
    if (hero.persistentDeath) return;
    this.logCallback(`Hero ${hero.name} has fallen permanently. Applying persistent death and ankh effects...`);
    hero.statusEffects.death = true;
    hero.persistentDeath = new PersistentDeath();
    // Clear the cell so the dead hero is no longer represented on the battlefield.
    this.battlefield[hero.y][hero.x] = '.';
    // Optionally, remove the hero from future selections.
    // this.party = this.party.filter(h => h !== hero);
    runBattleHook(this, ABILITY_HOOKS.ON_DEATH, { hero, outcome: 'permanent' });
  }

  /**
   * Draw the battlefield in an isometric perspective onto a provided canvas element.
   * Tiles are rendered as diamonds arranged on an isometric grid.
   * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
   */
  drawIsometricBattlefield(canvas) {
    const tileW = 48;
    const tileH = 24;
    const padding = 30;

    // Size canvas to fit the full isometric grid only if dimensions changed.
    const neededWidth = (this.cols + this.rows) * tileW / 2 + padding * 2;
    const neededHeight = (this.cols + this.rows) * tileH / 2 + padding * 2;
    if (canvas.width !== neededWidth || canvas.height !== neededHeight) {
      canvas.width = neededWidth;
      canvas.height = neededHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Horizontal offset places row-0 col-0 at the left edge; row origin shifts right by rows*tileW/2.
    const offsetX = padding + this.rows * tileW / 2;
    const offsetY = padding;

    const activeHero = this.party[this.currentUnit] && !this.party[this.currentUnit].persistentDeath
      ? this.party[this.currentUnit] : null;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cellContent = this.battlefield[row][col];

        // Isometric projection: convert (col, row) grid coords to screen (x, y).
        const isoX = offsetX + (col - row) * tileW / 2;
        const isoY = offsetY + (col + row) * tileH / 2;

        // Determine tile fill and text color based on cell content.
        let fillColor = '#2a2a2a';
        let strokeColor = '#444';
        let textColor = '#ccc';

        if (cellContent === 'ᚙ' || cellContent === '█') {
          fillColor = '#555';
          strokeColor = '#777';
        } else if (cellContent === 'ౚ' || cellContent === 'ඉ') {
          fillColor = '#4a3a00';
          textColor = 'tan';
        } else if (activeHero && activeHero.x === col && activeHero.y === row) {
          fillColor = this.awaitingAttackDirection ? '#6a0000' : '#00215a';
          strokeColor = this.awaitingAttackDirection ? '#ff4444' : '#4488ff';
          textColor = 'white';
        } else if (this.enemies.some(e => e.x === col && e.y === row)) {
          fillColor = '#4a1500';
          strokeColor = '#ff5722';
          textColor = '#ff5722';
        } else if (cellContent !== '.') {
          fillColor = '#0d2a40';
          textColor = '#7cb8f0';
        }

        // Draw the diamond tile.
        ctx.beginPath();
        ctx.moveTo(isoX,              isoY);
        ctx.lineTo(isoX + tileW / 2,  isoY + tileH / 2);
        ctx.lineTo(isoX,              isoY + tileH);
        ctx.lineTo(isoX - tileW / 2,  isoY + tileH / 2);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw cell symbol centered on the tile.
        if (cellContent !== '.') {
          ctx.fillStyle = textColor;
          ctx.font = '13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cellContent, isoX, isoY + tileH / 2);
        }
      }
    }
  }

  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
  
  handleWallCollapse() {
    this.logCallback('The Wall Collapses!');
    this.transitioningLevel = true;
    this.setPhase(BATTLE_PHASES.VICTORY);
    runBattleHook(this, ABILITY_HOOKS.ON_LEVEL_COMPLETE, {
      party: this.party,
      wallHP: this.levelSettings.wallHP,
      remainingWallHP: this.wallHP,
      levelSettings: this.levelSettings
    });
    setTimeout(() => { if (typeof this.onLevelComplete === 'function') this.onLevelComplete(); }, 1500);
  }
}
