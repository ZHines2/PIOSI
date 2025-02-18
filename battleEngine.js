/**
 * battleEngine.js
 *
 * This version includes updated "yeet" logic, healing items (vittle), Mellitron's swarm ability,
 * and a simplified charm ability.
 *
 * A hero possessing a charm stat will apply a charm to an enemy on a successful attack.
 * Charmed enemies have a "charmDuration" property. During enemyTurn, if an enemy is charmed 
 * (charmDuration > 0), it executes a streamlined charmed behavior (attacking adjacent enemies)
 * and its charm duration is decremented.
 *
 * For detailed guidelines on creating new levels, refer to the Level Creation Rubric in docs/level-creation.md.
 *
 * Overview of Level Creation:
 * - Each level is defined by properties like `level`, `title`, `rows`, `cols`, `wallHP`, and `enemies`.
 * - Levels can use an `enemyGenerator` function to dynamically generate enemies.
 * - Special properties like `generateEnemies`, `waveNumber`, and `restPhase` can be used for advanced level configurations.
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
    this.enemies = enemies;
    this.rows = fieldRows;
    this.cols = fieldCols;
    this.wallHP = wallHP;
    this.logCallback = logCallback;
    this.onLevelComplete = onLevelComplete;
    this.onGameOver = onGameOver;

    // Turn state properties.
    this.currentUnit = 0;
    this.movePoints = this.party.length ? this.party[0].agility : 0;
    this.awaitingAttackDirection = false;
    this.transitioningLevel = false;

    // Initialize statusEffects for heroes and enemies.
    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
    });
    this.enemies.forEach(enemy => {
      enemy.statusEffects = enemy.statusEffects || {};
      // Initialize charmDuration property
      enemy.charmDuration = 0;
    });

    this.battlefield = this.initializeBattlefield();
  }

  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () => Array(this.cols).fill('.'));
    this.placeHeroes(field);
    this.placeEnemies(field);
    this.createWall(field);
    this.placeHealingItem(field); // Place healing item (vittle) on the battlefield.
    return field;
  }

  placeHeroes(field) {
    this.party.forEach((hero, index) => {
      hero.x = Math.min(index, this.cols - 1);
      hero.y = 0;
      field[hero.y][hero.x] = hero.symbol;
    });
  }

  placeEnemies(field) {
    this.enemies.forEach(enemy => {
      enemy.statusEffects = enemy.statusEffects || {};
      enemy.charmDuration = enemy.charmDuration || 0;
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

  // Place a healing item (vittle) on a random empty cell.
  placeHealingItem(field) {
    let emptyCells = [];
    // Exclude the last row since it is occupied by the wall.
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
      field[cell.y][cell.x] = 'ౚ'; // 'ౚ' represents the healing item (vittle).
    }
  }

  drawBattlefield() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = '';
        // Mark healing items and enemies.
        if (cellContent === 'ౚ') {
          cellClass += ' healing-item';
        }
        if (this.enemies.some(enemy => enemy.symbol === cellContent)) {
          cellClass += ' enemy';
        }
        // Highlight the active hero's cell.
        if (
          this.party[this.currentUnit] &&
          this.party[this.currentUnit].x === x &&
          this.party[this.currentUnit].y === y
        ) {
          cellClass += this.awaitingAttackDirection ? ' attack-mode' : ' active';
        }
        html += `<div class="cell ${cellClass}">${cellContent}</div>`;
      }
      html += '</div>';
    }
    return html;
  }

  moveUnit(dx, dy) {
    if (this.awaitingAttackDirection || this.movePoints <= 0 || this.transitioningLevel) return;
    const unit = this.party[this.currentUnit];
    const newX = unit.x + dx;
    const newY = unit.y + dy;
    if (!this.isValidMove(newX, newY)) return;

    // Check if moving onto a healing item (vittle)
    if (this.battlefield[newY][newX] === 'ౚ') {
      const healingValue = 10;
      unit.hp += healingValue;
      this.logCallback(`${unit.name} picks up a vittle and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
    }
    // Update battlefield positions.
    this.battlefield[unit.y][unit.x] = '.';
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;
    this.movePoints--;
    if (this.movePoints === 0) {
      this.nextTurn();
    }
  }

  isValidMove(x, y) {
    return (
      x >= 0 &&
      x < this.cols &&
      y >= 0 &&
      y < this.rows &&
      (this.battlefield[y][x] === '.' || this.battlefield[y][x] === 'ౚ')
    );
  }

  // In attackInDirection, if the attacker has a charm stat, apply charm by setting enemy.charmDuration.
  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    await recordAttackCallback(`${unit.name} attacked in direction (${dx}, ${dy}).`);
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;

      // If an ally (other than the attacker) is found, treat this as a healing attempt.
      const ally = this.party.find(h => h.x === targetX && h.y === targetY && h !== unit);
      if (ally) {
        if (unit.heal && unit.heal > 0) {
          ally.hp += unit.heal;
          this.logCallback(`${unit.name} heals ${ally.name} for ${unit.heal} HP! (New HP: ${ally.hp})`);
        } else {
          this.logCallback(`${unit.name} attacks ${ally.name} but nothing happens.`);
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }

      // If an enemy is found, apply damage.
      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
        enemy.hp -= unit.attack;
        this.logCallback(`${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`);
        // Apply burn or sluj status if applicable (existing logic)
        if (unit.burn) {
          enemy.statusEffects.burn = { damage: unit.burn, duration: 3 };
          this.logCallback(`${enemy.name} is now burning for ${unit.burn} damage for 3 turns!`);
        }
        if (unit.sluj) {
          if (!enemy.statusEffects.sluj) {
            enemy.statusEffects.sluj = { level: unit.sluj, duration: 4, counter: 0 };
          } else {
            enemy.statusEffects.sluj.level += unit.sluj;
            enemy.statusEffects.sluj.duration = 4;
          }
          this.logCallback(`${enemy.name} is afflicted with slüj (level ${enemy.statusEffects.sluj.level}) for 4 turns!`);
        }
        // Apply knockback if applicable.
        if (unit.yeet && unit.yeet > 0) {
          applyKnockback(enemy, dx, dy, unit.yeet, unit.attack, this.battlefield, this.logCallback, this.isWithinBounds.bind(this));
        }
        // Streamlined charm integration:
        // If the attacker has a charm stat, simply set enemy.charmDuration (overwriting previous value).
        if (unit.charm && unit.charm > 0) {
          enemy.charmDuration = unit.charm;
          this.logCallback(`${enemy.name} is charmed by ${unit.name} for ${unit.charm} turns!`);
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
      // If a wall is encountered, apply damage to it.
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
    this.logCallback(`${unit.name} attacks, but there's nothing in range.`);
    this.awaitingAttackDirection = false;
    await this.shortPause();
    this.nextTurn();
  }

  isWithinBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
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

  /**
   * Applies Mellitron's swarm damage.
   */
  applySwarmDamage() {
    const adjacentOffsets = [
      { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: 1 },
      { x: -1, y: -1 }, { x: -1, y: 1 },
      { x: 1, y: -1 }, { x: 1, y: 1 }
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
              this.logCallback(`${hero.name}'s swarm deals ${damage} damage to ${enemy.name} at (${targetX},${targetY})! (HP left: ${enemy.hp})`);
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

  // Simplified enemyTurn: if an enemy is charmed (charmDuration > 0), execute a charmed action.
  enemyTurn() {
    if (this.transitioningLevel) return;
    this.enemies.forEach(enemy => {
      if (enemy.charmDuration > 0) {
        this.handleCharmedEnemy(enemy);
        enemy.charmDuration--;
        if (enemy.charmDuration <= 0) {
          this.logCallback(`${enemy.name} is no longer charmed.`);
        }
      } else {
        // Normal behavior: move and attack.
        for (let moves = 0; moves < enemy.agility; moves++) {
          this.moveEnemy(enemy);
        }
        this.enemyAttackAdjacent(enemy);
      }
      // Optionally log enemy dialogue.
      if (Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0) {
        const randomIndex = Math.floor(Math.random() * enemy.dialogue.length);
        this.logCallback(`${enemy.name} says: "${enemy.dialogue[randomIndex]}"`);
      }
    });
    this.logCallback('Enemy turn completed.');
  }

  // If enemy is charmed, have it target an adjacent enemy instead of a hero.
  handleCharmedEnemy(enemy) {
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
      const tx = enemy.x + dx;
      const ty = enemy.y + dy;
      const target = this.enemies.find(e => e !== enemy && e.x === tx && e.y === ty);
      if (target) {
        target.hp -= enemy.attack;
        this.logCallback(`Charmed ${enemy.name} attacks ${target.name} for ${enemy.attack} damage! (HP left: ${target.hp})`);
        if (target.hp <= 0) {
          this.logCallback(`${target.name} is defeated!`);
          this.battlefield[target.y][target.x] = '.';
          this.enemies = this.enemies.filter(e => e !== target);
        }
        return;
      }
    }
    // If no adjacent enemy is found, fall back to normal movement.
    this.moveEnemy(enemy);
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
      const currentDistance = Math.abs(closest.x - enemy.x) + Math.abs(closest.y - enemy.y);
      const heroDistance = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      return heroDistance < currentDistance ? hero : closest;
    });
  }

  canMove(x, y) {
    return this.isWithinBounds(x, y) && (this.battlefield[y][x] === '.' || this.battlefield[y][x] === 'ౚ');
  }

  enemyAttackAdjacent(enemy) {
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    directions.forEach(([dx, dy]) => {
      const tx = enemy.x + dx;
      const ty = enemy.y + dy;
      const targetHero = this.party.find(hero => hero.x === tx && hero.y === ty);
      if (targetHero) {
        targetHero.hp -= enemy.attack;
        this.logCallback(`${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (Hero HP: ${targetHero.hp})`);
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

  nextTurn() {
    if (this.transitioningLevel) return;
    // Process status effects.
    this.applyStatusEffects();
    // Apply swarm damage.
    this.applySwarmDamage();
    // Check for game over.
    if (this.party.length === 0) {
      this.logCallback('All heroes have been defeated! Game Over.');
      if (typeof this.onGameOver === 'function') this.onGameOver();
      return;
    }
    // Update currentUnit and movePoints.
    if (this.currentUnit >= this.party.length) {
      this.currentUnit = 0;
    }
    this.awaitingAttackDirection = false;
    this.currentUnit++;
    if (this.currentUnit >= this.party.length) {
      this.currentUnit = 0;
      this.logCallback('Enemy turn begins.');
      this.enemyTurn();
      this.applyStatusEffects();
      if (this.party.length === 0) {
        this.logCallback('All heroes have been defeated! Game Over.');
        if (typeof this.onGameOver === 'function') this.onGameOver();
        return;
      }
    }
    this.movePoints = this.party[this.currentUnit].agility;
    this.logCallback(`Now it's ${this.party[this.currentUnit].name}'s turn.`);
  }

  applyStatusEffects() {
    this.party.forEach(hero => {
      if (hero.statusEffects.burn && hero.statusEffects.burn.duration > 0) {
        this.logCallback(`${hero.name} is burned and takes ${hero.statusEffects.burn.damage} damage!`);
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
        this.logCallback(`${enemy.name} is burned and takes ${enemy.statusEffects.burn.damage} damage!`);
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

  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
