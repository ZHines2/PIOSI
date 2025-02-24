/**
 * battleEngine.js
 *
 * This version includes updated "yeet" logic so that if an enemy is knocked back
 * (yeeted) into the wall and cannot move past it, they take damage or die as intended.
 * It also applies damage if they collide with the wall during a yeet attempt.
 *
 * Additionally, we've integrated Mellitron's swarm ability.
 * Mellitron's swarm deals turn-based damage to any enemy in an adjacent tile.
 * The damage dealt is equal to Mellitron's current swarm stat.
 *
 * New in this version:
 * - Healing item (vittle) functionality has been added.
 *   Healing items are represented by the symbol 'ౚ' on the battlefield.
 *   If a hero moves onto a cell containing a vittle, the hero consumes it and
 *   recovers a fixed amount of HP.
 * - Healing mushroom functionality has been added.
 *   Mushrooms are represented by the symbol 'ඉ' on the battlefield.
 *
 * - Wizard chain ability updated:
 *   The wizard's "chain" stat now is converted into an effective damage multiplier
 *   using the formula:
 *       effectiveMultiplier = 1 - Math.exp(-chain / 10)
 *   For example, starting at chain = 5, the multiplier is ≈0.393 (39.3% of base damage),
 *   and a mode up increase to chain = 6 raises it to ≈0.451. This new metric provides a
 *   balanced, non-linear scaling to justify the numbering.
 *
 * For detailed guidelines on creating new levels, refer to the Level Creation Rubric in docs/level-creation.md.
 */

import { applyKnockback } from './applyKnockback.js';

export class BattleEngine {
  constructor(
    party,
    enemies,
    fieldRows,
    fieldCols,
    wallHP,
    logCallback,
    onLevelComplete,
    onGameOver
  ) {
    // Filter out any heroes with 0 HP.
    this.party = party.filter(hero => hero.hp > 0);
    // Set the first hero as the active hero.
    this.activeHero = this.party[0];
    this.currentUnit = 0;
    this.movePoints = this.activeHero ? this.activeHero.agility : 0;

    this.enemies = enemies;
    this.rows = fieldRows;
    this.cols = fieldCols;
    this.wallHP = wallHP;
    this.logCallback = logCallback;

    this.onLevelComplete = onLevelComplete;
    this.onGameOver = onGameOver;

    this.awaitingAttackDirection = false;
    this.transitioningLevel = false;

    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
    });
    this.enemies.forEach(enemy => {
      enemy.statusEffects = {};
    });

    this.battlefield = this.initializeBattlefield();
  }

  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill('.')
    );
    this.placeHeroes(field);
    this.placeEnemies(field);
    this.createWall(field);
    this.placeHealingItem(field);
    this.placeMushroom(field);

    if (this.levelSettings && this.levelSettings.layout) {
      for (let y = 0; y < this.levelSettings.layout.length; y++) {
        for (let x = 0; x < this.levelSettings.layout[y].length; x++) {
          if (this.levelSettings.layout[y][x] === '.wall') {
            field[y][x] = '.wall';
          }
        }
      }
    }
    return field;
  }

  placeHeroes(field) {
    this.party.forEach(hero => {
      let placed = false;
      for (let y = 0; y < this.rows && !placed; y++) {
        for (let x = 0; x < this.cols && !placed; x++) {
          if (field[y][x] === '.') {
            hero.x = x;
            hero.y = y;
            field[hero.y][hero.x] = hero.symbol;
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
    for (let i = 0; i < this.cols; i++) {
      field[this.rows - 1][i] = 'ᚙ';
    }
    this.enemies.forEach(enemy => {
      if (enemy.symbol === '█') {
        field[enemy.y][enemy.x] = enemy.symbol;
      }
    });
  }

  placeHealingItem(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length) {
      const index = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells[index];
      field[cell.y][cell.x] = 'ౚ';
    }
  }

  placeMushroom(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length) {
      const index = Math.floor(Math.random() * emptyCells.length);
      const cell = emptyCells[index];
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
        if (cellContent === 'ౚ' || cellContent === 'ඉ') {
          cellClass += ' healing-item';
        }
        const isEnemy = this.enemies.some(enemy => enemy.symbol === cellContent);
        if (isEnemy) {
          cellClass += ' enemy';
        }
        // Highlight the active hero using the activeHero property.
        if (this.activeHero && this.activeHero.x === x && this.activeHero.y === y) {
          cellClass += this.awaitingAttackDirection ? ' attack-mode' : ' active';
        }
        html += `<div class="cell ${cellClass}">${cellContent}</div>`;
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
    if (
      this.awaitingAttackDirection ||
      this.movePoints <= 0 ||
      this.transitioningLevel
    )
      return;
    const unit = this.activeHero;
    const newX = unit.x + dx;
    const newY = unit.y + dy;
    if (!this.isWithinBounds(newX, newY)) return;

    if (this.battlefield[newY][newX] === 'ᚙ' || this.battlefield[newY][newX] === '█') {
      this.wallHP -= unit.attack;
      this.logCallback(
        `${unit.name} attacks the wall for ${unit.attack} damage! (Wall HP: ${this.wallHP})`
      );
      if (this.wallHP <= 0 && !this.transitioningLevel) {
        this.handleWallCollapse();
        return;
      }
      this.movePoints--;
      if (this.movePoints === 0) {
        this.nextTurn();
      }
      return;
    }

    if (this.battlefield[newY][newX] === 'ౚ') {
      const baseHealingValue = 10;
      const spicyBonus = unit.spicy ? unit.spicy * 2 : 0;
      const healingValue = baseHealingValue + spicyBonus;
      unit.hp += healingValue;
      this.logCallback(
        `${unit.name} picks up a vittle and heals for ${healingValue} HP! (New HP: ${unit.hp})`
      );
      this.battlefield[newY][newX] = '.';
    }
    if (this.battlefield[newY][newX] === 'ඉ') {
      const healingValue = 5;
      unit.hp += healingValue;
      this.logCallback(
        `${unit.name} picks up a mushroom and heals for ${healingValue} HP! (New HP: ${unit.hp})`
      );
      this.battlefield[newY][newX] = '.';
      if (unit.spore && unit.spore > 0) {
        const stats = ['attack', 'range', 'agility', 'hp'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        unit[randomStat] += unit.spore;
        this.logCallback(
          `${unit.name} gains a ${unit.spore} point boost to ${randomStat} from the mushroom! (New ${randomStat}: ${unit[randomStat]})`
        );
      }
    }

    if (!this.isCellPassable(newX, newY)) return;

    this.battlefield[unit.y][unit.x] = '.';
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;
    this.movePoints--;
    if (this.movePoints === 0) {
      this.nextTurn();
    }
  }

  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    await recordAttackCallback(
      `${unit.name} attacked in direction (${dx}, ${dy}).`
    );
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;

      const ally = this.party.find(
        h => h.x === targetX && h.y === targetY && h !== unit
      );
      if (ally) {
        if (unit.heal && unit.heal > 0) {
          ally.hp += unit.heal;
          this.logCallback(
            `${unit.name} heals ${ally.name} for ${unit.heal} HP! (New HP: ${ally.hp})`
          );
        } else {
          this.logCallback(
            `${unit.name} attacks ${ally.name} but nothing happens.`
          );
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }

      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
        enemy.hp -= unit.attack;
        this.logCallback(
          `${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`
        );
        if (unit.burn) {
          enemy.statusEffects.burn = { damage: unit.burn, duration: 3 };
          this.logCallback(
            `${enemy.name} is now burning for ${unit.burn} damage per turn for 3 turns!`
          );
        }
        if (unit.sluj) {
          if (!enemy.statusEffects.sluj) {
            enemy.statusEffects.sluj = {
              level: unit.sluj,
              duration: 4,
              counter: 0,
            };
          } else {
            enemy.statusEffects.sluj.level += unit.sluj;
            enemy.statusEffects.sluj.duration = 4;
          }
          this.logCallback(
            `${enemy.name} is afflicted with slüj (level ${enemy.statusEffects.sluj.level}) for 4 turns!`
          );
        }

        if (unit.yeet && unit.yeet > 0) {
          applyKnockback(
            enemy,
            dx,
            dy,
            unit.yeet,
            unit.attack,
            this.battlefield,
            this.logCallback,
            this.isWithinBounds.bind(this)
          );
        }

        if (unit.name === "Wizard" && unit.chain) {
          const effectiveMultiplier = 1 - Math.exp(-unit.chain / 10);
          const initialChainDamage = Math.round(unit.attack * effectiveMultiplier);
          if (initialChainDamage > 0) {
            this.applyChainDamage(enemy, initialChainDamage, effectiveMultiplier, new Set());
          }
        }

        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated!`);
          this.battlefield[targetY][targetX] = '.';
          this.enemies = this.enemies.filter(e => e !== enemy);
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      if (
        this.battlefield[targetY][targetX] === 'ᚙ' ||
        this.battlefield[targetY][targetX] === '█'
      ) {
        this.wallHP -= unit.attack;
        this.logCallback(
          `${unit.name} attacks the wall for ${unit.attack} damage! (Wall HP: ${this.wallHP})`
        );
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
    this.logCallback(`${unit.name} attacks, but there's nothing in range.`);
    this.awaitingAttackDirection = false;
    await this.shortPause();
    this.nextTurn();
  }

  applyChainDamage(enemy, damage, effectiveMultiplier, visited = new Set()) {
    visited.add(enemy);
    const adjacentOffsets = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 }
    ];
    for (let offset of adjacentOffsets) {
      const adjX = enemy.x + offset.x;
      const adjY = enemy.y + offset.y;
      if (!this.isWithinBounds(adjX, adjY)) continue;
      const adjacentEnemy = this.enemies.find(e => e.x === adjX && e.y === adjY);
      if (adjacentEnemy && !visited.has(adjacentEnemy)) {
        adjacentEnemy.hp -= damage;
        this.logCallback(`Wizard's chain deals ${damage} damage to ${adjacentEnemy.name} at (${adjX},${adjY})! (HP left: ${adjacentEnemy.hp})`);
        if (adjacentEnemy.hp <= 0) {
          this.logCallback(`${adjacentEnemy.name} is defeated by chain damage!`);
          this.battlefield[adjY][adjX] = '.';
          this.enemies = this.enemies.filter(e => e !== adjacentEnemy);
        }
        const nextDamage = Math.round(damage * effectiveMultiplier);
        if (nextDamage > 0 && nextDamage < damage) {
          this.applyChainDamage(adjacentEnemy, nextDamage, effectiveMultiplier, visited);
        }
      }
    }
  }

  enemyTurn() {
    if (this.transitioningLevel) return;
    this.enemies.forEach(enemy => {
      for (let moves = 0; moves < enemy.agility; moves++) {
        this.moveEnemy(enemy);
      }
      this.enemyAttackAdjacent(enemy);
      if (Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0) {
        const randomIndex = Math.floor(Math.random() * enemy.dialogue.length);
        this.logCallback(`${enemy.name} says: "${enemy.dialogue[randomIndex]}"`);
      }
    });
    this.logCallback('Enemy turn completed.');
  }

  moveEnemy(enemy) {
    const targetHero = this.findClosestHero(enemy);
    if (!targetHero) return;
    const dx = targetHero.x - enemy.x;
    const dy = targetHero.y - enemy.y;
    let stepX = 0, stepY = 0;
    if (Math.abs(dx) >= Math.abs(dy)) {
      stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    } else {
      stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    }
    if (!this.canMove(enemy.x + stepX, enemy.y + stepY)) {
      if (stepX !== 0 && this.canMove(enemy.x, enemy.y + Math.sign(dy))) {
        stepY = dy > 0 ? 1 : -1;
        stepX = 0;
      } else if (stepY !== 0 && this.canMove(enemy.x + Math.sign(dx), enemy.y)) {
        stepX = dx > 0 ? 1 : -1;
        stepY = 0;
      }
    }
    const newX = enemy.x + stepX;
    const newY = enemy.y + stepY;
    if (this.canMove(newX, newY)) {
      this.battlefield[enemy.y][enemy.x] = '.';
      enemy.x = newX;
      enemy.y = newY;
      this.battlefield[newY][newX] = enemy.symbol;
    }
  }

  findClosestHero(enemy) {
    if (this.party.length === 0) return null;
    return this.party.reduce((closest, hero) => {
      const currentDistance =
        Math.abs(closest.x - enemy.x) + Math.abs(closest.y - enemy.y);
      const heroDistance =
        Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      return heroDistance < currentDistance ? hero : closest;
    });
  }

  canMove(x, y) {
    return this.isWithinBounds(x, y) && this.isCellPassable(x, y);
  }

  enemyAttackAdjacent(enemy) {
    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    directions.forEach(([dx, dy]) => {
      const tx = enemy.x + dx;
      const ty = enemy.y + dy;
      const targetHero = this.party.find(
        hero => hero.x === tx && hero.y === ty
      );
      if (targetHero) {
        if (targetHero.armor && targetHero.armor > 0) {
          targetHero.armor--;
          this.logCallback(
            `${enemy.name} attacks ${targetHero.name}, but the armor absorbs the damage! (Remaining Armor: ${targetHero.armor})`
          );
        } else {
          targetHero.hp -= enemy.attack;
          this.logCallback(
            `${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (HP left: ${targetHero.hp})`
          );
        }
        if (targetHero.hp <= 0) {
          this.logCallback(`${targetHero.name} is defeated!`);
          this.battlefield[targetHero.y][targetHero.x] = '.';
          this.party = this.party.filter(h => h !== targetHero);
          if (this.currentUnit >= this.party.length) {
            this.currentUnit = 0;
          }
        }
      }
    });
  }

  // Updated nextTurn() method that preserves active hero identity.
  nextTurn() {
    if (this.transitioningLevel) return;
    this.applyStatusEffects();
    this.applySwarmDamage();

    const previousActive = this.activeHero;
    this.party = this.party.filter(hero => hero.hp > 0);
    if (this.party.length === 0) {
      this.logCallback('All heroes have been defeated! Game Over.');
      if (typeof this.onGameOver === 'function') this.onGameOver();
      return;
    }
    let newIndex = previousActive ? this.party.indexOf(previousActive) : -1;
    if (newIndex === -1) {
      newIndex = this.currentUnit >= this.party.length ? 0 : this.currentUnit;
    }
    this.activeHero = this.party[newIndex];
    this.movePoints = this.activeHero.agility;
    this.awaitingAttackDirection = false;
    this.logCallback(`Now it's ${this.activeHero.name}'s turn.`);
    this.currentUnit = (newIndex + 1) % this.party.length;
  }

  applyStatusEffects() {
    this.party.forEach(hero => {
      if (hero.statusEffects.burn && hero.statusEffects.burn.duration > 0) {
        this.logCallback(
          `${hero.name} is burned and takes ${hero.statusEffects.burn.damage} damage!`
        );
        hero.hp -= hero.statusEffects.burn.damage;
        hero.statusEffects.burn.duration--;
        if (hero.hp <= 0) {
          this.logCallback(`${hero.name} was defeated by burn damage!`);
          this.battlefield[hero.y][hero.x] = '.';
        }
      }
    });
    this.party = this.party.filter(hero => hero.hp > 0);

    this.enemies.forEach(enemy => {
      if (enemy.statusEffects.burn && enemy.statusEffects.burn.duration > 0) {
        this.logCallback(
          `${enemy.name} is burned and takes ${enemy.statusEffects.burn.damage} damage!`
        );
        enemy.hp -= enemy.statusEffects.burn.damage;
        enemy.statusEffects.burn.duration--;
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} was defeated by burn damage!`);
          this.battlefield[enemy.y][enemy.x] = '.';
        }
      }
      if (enemy.statusEffects.sluj && enemy.statusEffects.sluj.duration > 0) {
        enemy.statusEffects.sluj.counter++;
        const level = enemy.statusEffects.sluj.level;
        let trigger = false;
        let damage = 0;
        if (level === 1 && enemy.statusEffects.sluj.counter % 4 === 0) {
          trigger = true;
          damage = 1;
        } else if (level === 2 && enemy.statusEffects.sluj.counter % 3 === 0) {
          trigger = true;
          damage = 1;
        } else if (level === 3 && enemy.statusEffects.sluj.counter % 2 === 0) {
          trigger = true;
          damage = 1;
        } else if (level === 4) {
          trigger = true;
          damage = 1;
        } else if (level === 5) {
          trigger = true;
          damage = 2;
        } else if (level >= 6) {
          trigger = true;
          damage = 3;
        }
        if (trigger) {
          this.logCallback(`${enemy.name} takes ${damage} slüj damage!`);
          enemy.hp -= damage;
        }
        enemy.statusEffects.sluj.duration--;
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated by slüj damage!`);
          this.battlefield[enemy.y][enemy.x] = '.';
        }
      }
    });
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
  }

  applySwarmDamage() {
    const adjacentOffsets = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: -1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 }
    ];
    this.party.forEach(hero => {
      if (hero.swarm && typeof hero.swarm === 'number') {
        adjacentOffsets.forEach(offset => {
          const targetX = hero.x + offset.x;
          const targetY = hero.y + offset.y;
          if (this.isWithinBounds(targetX, targetY)) {
            const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
            if (enemy) {
              const damage = hero.swarm;
              enemy.hp -= damage;
              this.logCallback(
                `${hero.name}'s swarm deals ${damage} damage to ${enemy.name} at (${targetX},${targetY})! (HP left: ${enemy.hp})`
              );
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

  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  handleWallCollapse() {
    this.logCallback('The Wall Collapses!');
    this.transitioningLevel = true;
    setTimeout(() => {
      if (typeof this.onLevelComplete === 'function') {
        this.onLevelComplete();
      }
    }, 1500);
  }
}
