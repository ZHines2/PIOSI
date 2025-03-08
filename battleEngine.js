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

import { applyKnockback } from './applyKnockback.js';
import { applySlujEffect } from './sluj.js';

// Class to represent a persistent death effect.
export class PersistentDeath {
  constructor() {
    this.isDead = true;
  }
}

export class BattleEngine {
  constructor(party, enemies, fieldRows, fieldCols, wallHP, logCallback, onLevelComplete, onGameOver) {
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

    this.currentUnit = 0;
    // Only live heroes get move points.
    this.movePoints = this.getLiveHeroes().length ? this.getLiveHeroes()[0].agility : 0;
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
      enemy.statusEffects = {};
      // Initialize dodge stat if not set.
      if (typeof enemy.dodge !== 'number') enemy.dodge = 0;
    });
    this.battlefield = this.initializeBattlefield();
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
    // Apply caprice and fate buffs only to live heroes.
    this.getLiveHeroes().forEach(hero => {
      if (hero.caprice && hero.caprice > 0) {
        const stats = ['attack', 'range', 'agility', 'hp'];
        for (let i = 0; i < hero.caprice; i++) {
          const randomStat = stats[Math.floor(Math.random() * stats.length)];
          hero[randomStat] += 1;
          this.logCallback(`${hero.name}'s caprice boosts ${randomStat} to ${hero[randomStat]}`);
        }
      }
    });
    this.getLiveHeroes().forEach(hero => {
      if (hero.fate && hero.fate > 0) {
        const fates = [
          { stat: 'attack', change: 1 }, { stat: 'attack', change: -1 },
          { stat: 'range', change: 1 }, { stat: 'range', change: -1 },
          { stat: 'agility', change: 1 }, { stat: 'agility', change: -1 },
          { stat: 'hp', change: 1 }, { stat: 'hp', change: -1 }
        ];
        for (let i = 0; i < hero.fate; i++) {
          const randomFate = fates[Math.floor(Math.random() * fates.length)];
          hero[randomFate.stat] += randomFate.change;
          this.logCallback(`${hero.name}'s fate changes ${randomFate.stat} to ${hero[randomFate.stat]}`);
        }
      }
    });
    return field;
  }

  placeHeroes(field) {
    // Only place live heroes.
    this.getLiveHeroes().forEach(hero => {
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
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
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
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
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
        if (this.getLiveHeroes()[this.currentUnit] &&
            this.getLiveHeroes()[this.currentUnit].x === x &&
            this.getLiveHeroes()[this.currentUnit].y === y) {
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
    const unit = this.getLiveHeroes()[this.currentUnit];
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
    if (this.battlefield[newY][newX] === 'ౚ') {
      const healingValue = 10 + (unit.spicy ? unit.spicy * 2 : 0);
      unit.hp += healingValue;
      this.logCallback(`${unit.name} picks up a vittle and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
      this.battlefield[newY][newX] = '.';
    }
    if (this.battlefield[newY][newX] === 'ඉ') {
      const healingValue = 5;
      unit.hp += healingValue;
      this.logCallback(`${unit.name} picks up a mushroom and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
      this.battlefield[newY][newX] = '.';
      if (unit.spore && unit.spore > 0) {
        const stats = ['attack', 'range', 'agility', 'hp'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        unit[randomStat] += unit.spore;
        this.logCallback(`${unit.name} gains ${unit.spore} boost to ${randomStat} (Now: ${unit[randomStat]})`);
      }
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
        if (unit.heal && unit.heal > 0) {
          ally.hp += unit.heal;
          this.logCallback(`${unit.name} heals ${ally.name} for ${unit.heal} HP! (New HP: ${ally.hp})`);
        } else if (unit.psych && unit.psych > 0) {
          const stats = ['attack', 'range', 'agility', 'hp'];
          const randomStat = stats[Math.floor(Math.random() * stats.length)];
          ally[randomStat] += unit.psych;
          this.logCallback(`${unit.name} uses psych on ${ally.name}, boosting ${randomStat} by ${unit.psych}! (New ${randomStat}: ${ally[randomStat]})`);
        } else {
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
        if (Math.random() < dodgeChance) {
          this.logCallback(`${enemy.name} dodges ${unit.name}'s attack!`);
          this.awaitingAttackDirection = false;
          await this.shortPause();
          this.nextTurn();
          return; // Skip the rest of the attack logic
        }
        // DODGE CHECK END
        enemy.hp -= unit.attack;
        this.logCallback(`${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`);
        if (unit.trick > 0) {
          const debuffableStats = ["attack", "range", "agility", "hp"];
          const availableStats = debuffableStats.filter(stat => typeof enemy[stat] === "number");
          if (availableStats.length > 0) {
            const chosenStat = availableStats[Math.floor(Math.random() * availableStats.length)];
            const orig = enemy[chosenStat];
            enemy[chosenStat] = Math.max(0, enemy[chosenStat] - unit.trick);
            this.logCallback(`${unit.name}'s trick lowers ${enemy.name}'s ${chosenStat} from ${orig} to ${enemy[chosenStat]}!`);
          }
        }
        if (unit.burn) {
          enemy.statusEffects.burn = { damage: unit.burn, duration: 3 };
          this.logCallback(`${enemy.name} is burning for ${unit.burn} damage for 3 turns!`);
        }
        if (unit.sluj) {
          if (!enemy.statusEffects.sluj) enemy.statusEffects.sluj = { level: unit.sluj, duration: 4, counter: 0 };
          else {
            enemy.statusEffects.sluj.level += unit.sluj;
            enemy.statusEffects.sluj.duration = 4;
          }
          this.logCallback(`${enemy.name} is afflicted with slüj (level ${enemy.statusEffects.sluj.level}) for 4 turns!`);
        }
        if (unit.yeet && unit.yeet > 0) {
          applyKnockback(enemy, dx, dy, unit.yeet, unit.attack, this.battlefield, this.logCallback, this.isWithinBounds.bind(this));
        }
        if (unit.chain) {
          const effectiveMultiplier = 1 - Math.exp(-unit.chain / 10);
          const initialChainDamage = Math.round(unit.attack * effectiveMultiplier);
          if (initialChainDamage > 0) {
            this.logCallback(`${enemy.name} takes ${initialChainDamage} chain damage!`);
            this.applyChainDamage(enemy, initialChainDamage, effectiveMultiplier, new Set());
          }
        }
        // Check for adjacent heroes with a non-zero "bomba" stat
        const adjacentOffsets = [
          { x: -1, y: 0 }, { x: 1, y: 0 },
          { x: 0, y: -1 }, { x: 0, y: 1 }
        ];
        adjacentOffsets.forEach(offset => {
          const adjX = enemy.x + offset.x, adjY = enemy.y + offset.y;
          const adjacentHero = this.getLiveHeroes().find(h => h.x === adjX && h.y === adjY && h.bomba && h.bomba > 0);
          if (adjacentHero) {
            enemy.hp -= adjacentHero.bomba;
            this.logCallback(`${adjacentHero.name}'s bomba deals ${adjacentHero.bomba} additional damage to ${enemy.name}! (HP left: ${enemy.hp})`);
          }
        });
        // Check for enemy defeat (including from slüj damage applied earlier)
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated by its slüj effect!`);
          this.battlefield[enemy.y][enemy.x] = '.';
          this.enemies = this.enemies.filter(e => e !== enemy);
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
    this.enemies.forEach(enemy => {
      for (let moves = 0; moves < enemy.agility; moves++) this.moveEnemy(enemy);
      this.enemyAttackAdjacent(enemy);
      
      // Apply the slüj effect for each enemy.
      if (enemy.statusEffects.sluj) {
        applySlujEffect(enemy, this.logCallback);
      }
      
      // Kill logic for enemies affected by slüj damage.
      if (enemy.hp <= 0) {
        this.logCallback(`${enemy.name} is defeated by its slüj effect!`);
        this.battlefield[enemy.y][enemy.x] = '.';
        this.enemies = this.enemies.filter(e => e !== enemy);
        return;
      }
      
      if (Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0) {
        this.logCallback(`${enemy.name} says: "${enemy.dialogue[Math.floor(Math.random() * enemy.dialogue.length)]}"`);
      }
    });
    this.logCallback('Enemy turn completed.');
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
        if (Math.random() < dodgeChance) {
          this.logCallback(`${targetHero.name} dodges ${enemy.name}'s attack!`);
          return;
        }
        // DODGE CHECK END
        if (targetHero.armor && targetHero.armor > 0) {
          targetHero.armor--;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} but their armor absorbs it (Remaining Armor: ${targetHero.armor})`);
        } else {
          targetHero.hp -= enemy.attack;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (HP left: ${targetHero.hp})`);
        }
        if (targetHero.hp <= 0) {
          this.handleHeroDeath(targetHero);
          if (this.currentUnit >= this.party.length)
            this.currentUnit = 0;
        } else if (targetHero.rage && targetHero.rage > 0) {
          const stats = ['attack', 'range', 'agility', 'hp'];
          const randomStat = stats[Math.floor(Math.random() * stats.length)];
          if (targetHero.hasOwnProperty(randomStat)) {
            targetHero[randomStat] += targetHero.rage;
            this.logCallback(`${targetHero.name}'s rage boosts ${randomStat} by ${targetHero.rage} (Now: ${targetHero[randomStat]})`);
          }
        }
      }
    });
  }

  nextTurn() {
    if (this.transitioningLevel) return;
    this.applyStatusEffects();
    this.applySwarmDamage();
    const liveHeroes = this.getLiveHeroes();
    if (liveHeroes.length === 0) {
      this.logCallback('All heroes defeated! Game Over.');
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
          if (typeof this.onGameOver === 'function') this.onGameOver();
          return;
        }
      }
    } while(this.party[this.currentUnit].persistentDeath);
    this.movePoints = this.party[this.currentUnit].agility;
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

  applySwarmDamage() {
    const adjacentOffsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: -1, y: 1 },
      { x: 1, y: -1 }, { x: 1, y: 1 }
    ];
    this.getLiveHeroes().forEach(hero => {
      if (hero.swarm && typeof hero.swarm === 'number') {
        adjacentOffsets.forEach(offset => {
          const targetX = hero.x + offset.x, targetY = hero.y + offset.y;
          if (this.isWithinBounds(targetX, targetY)) {
            const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
            if (enemy) {
              enemy.hp -= hero.swarm;
              this.logCallback(`${hero.name}'s swarm deals ${hero.swarm} damage to ${enemy.name} at (${targetX},${targetY}) (HP left: ${enemy.hp})`);
              if (enemy.hp <= 0) {
                this.logCallback(`${enemy.name} is defeated by swarm damage!`);
                this.battlefield[targetY][targetX] = '.';
                this.enemies = this.enemies.filter(e => e !== enemy);
              }
            }
          }
        });
      }
    });
  }

  // Updated handleHeroDeath method to ensure a dead hero's cell is cleared.
  handleHeroDeath(hero) {
    if (hero.rise > 0) {
      this.logCallback(`Hero ${hero.name} falls but rises with ${hero.rise} HP!`);
      hero.hp = hero.rise;
      hero.rise = 0;
      this.applyAnkhBoost();
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
    this.applyAnkhBoost();
  }

  // Apply ankh boost to all live heroes.
  applyAnkhBoost() {
    this.getLiveHeroes().forEach(h => {
      if (h.ankh && typeof h.ankh === 'number' && h.ankh > 0) {
        const stats = ['attack', 'hp', 'agility', 'range'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        h[randomStat] += h.ankh;
        this.logCallback(`${h.name} gains an ankh boost of ${h.ankh} ${randomStat} (Now: ${h[randomStat]}).`);
      }
    });
  }

  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
  
  handleWallCollapse() {
    this.logCallback('The Wall Collapses!');
    this.transitioningLevel = true;
    setTimeout(() => { if (typeof this.onLevelComplete === 'function') this.onLevelComplete(); }, 1500);
  }
}
