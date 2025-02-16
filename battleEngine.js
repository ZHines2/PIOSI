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
 * IMPORTANT UPDATE: Non-enemy (interactive) entities are now supported.
 * Instead of only accepting combat enemies in the battle, the engine now accepts
 * a separate array of non-enemy entities. These non-combat objects (like markers
 * or interactive elements) are merged with combat enemies internally.
 *
 * For detailed guidelines on creating new levels, refer to the Level Creation Rubric in docs/level-creation.md.
 *
 * Overview of Level Creation:
 * - Each level is defined by properties like `level`, `title`, `rows`, `cols`, `wallHP`, and entity arrays.
 * - Levels can use an `enemyGenerator` function to dynamically generate enemies.
 * - Non-enemy (interactive) entities are provided via a separate array.
 * - Special properties like `generateEnemies`, `waveNumber`, and `restPhase` can be used for advanced level configurations.
 */

import { applyKnockback } from './applyKnockback.js';

export class BattleEngine {
  /**
   * Constructor updated to accept non-enemy entities.
   * @param {Array} party - Array of hero objects.
   * @param {Array} enemies - Array of combat enemy objects.
   * @param {Array} nonEnemies - Array of non-combat (interactive) entity objects.
   * @param {number} fieldRows - Number of rows in the battlefield.
   * @param {number} fieldCols - Number of columns in the battlefield.
   * @param {number} wallHP - Initial hit points of the wall.
   * @param {function} logCallback - Callback to log messages.
   * @param {function} onLevelComplete - Callback for when the level is completed.
   * @param {function} onGameOver - Callback for when the game is over.
   */
  constructor(
    party,
    enemies,
    nonEnemies,
    fieldRows,
    fieldCols,
    wallHP,
    logCallback,
    onLevelComplete,
    onGameOver
  ) {
    // Filter out any heroes with 0 HP.
    this.party = party.filter(hero => hero.hp > 0);
    // Merge enemies and non-enemy interactive entities into one list.
    this.entities = enemies.concat(nonEnemies || []);
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

    // Initialize status effects for party members.
    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
    });
    // Initialize status effects for each entity.
    this.entities.forEach(entity => {
      entity.statusEffects = {};
    });

    this.battlefield = this.initializeBattlefield();
  }

  /**
   * Helper method to determine if an entity is a combat (enemy) type.
   * Non-combat entities typically lack combat properties such as 'attack' and 'hp'.
   * @param {Object} entity 
   * @returns {boolean}
   */
  isCombatEntity(entity) {
    return (
      typeof entity.attack === 'number' &&
      typeof entity.hp === 'number'
    );
  }

  /**
   * Initializes the battlefield grid and places heroes and all entities.
   * @returns {Array} 2D array representing the battlefield.
   */
  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill('.')
    );
    this.placeHeroes(field);
    this.placeEntities(field);
    this.createWall(field);
    return field;
  }

  /**
   * Places heroes on the battlefield.
   * Heroes are positioned along the top row.
   * @param {Array} field 
   */
  placeHeroes(field) {
    this.party.forEach((hero, index) => {
      hero.x = Math.min(index, this.cols - 1);
      hero.y = 0;
      field[hero.y][hero.x] = hero.symbol;
    });
  }

  /**
   * Places all entities (combat enemies and non-combat interactive objects) on the battlefield.
   * @param {Array} field 
   */
  placeEntities(field) {
    this.entities.forEach(entity => {
      // Assume entities already have x and y defined.
      // If not, you might assign default positions here.
      field[entity.y][entity.x] = entity.symbol;
    });
  }

  /**
   * Creates the wall at the bottom of the battlefield.
   * @param {Array} field 
   */
  createWall(field) {
    for (let i = 0; i < this.cols; i++) {
      field[this.rows - 1][i] = 'ᚙ';
    }
    // Redraw any entities that represent wall segments.
    this.entities.forEach(entity => {
      if (entity.symbol === '█') {
        field[entity.y][entity.x] = entity.symbol;
      }
    });
  }

  /**
   * Renders the battlefield as an HTML string.
   * Entities are styled based on whether they are combat enemies or interactive objects.
   * @returns {string}
   */
  drawBattlefield() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = '';

        // Check if the cell content matches any combat entity's symbol.
        const isCombat = this.entities.some(
          entity =>
            this.isCombatEntity(entity) && entity.symbol === cellContent
        );
        // Also, mark non-combat interactive entities.
        const isNonCombat = this.entities.some(
          entity =>
            !this.isCombatEntity(entity) && entity.symbol === cellContent
        );
        if (isCombat) {
          cellClass += ' enemy';
        } else if (isNonCombat) {
          cellClass += ' interactive';
        }

        if (
          this.party[this.currentUnit] &&
          this.party[this.currentUnit].x === x &&
          this.party[this.currentUnit].y === y
        ) {
          cellClass += this.awaitingAttackDirection
            ? ' attack-mode'
            : ' active';
        }
        html += `<div class="cell ${cellClass}">${cellContent}</div>`;
      }
      html += '</div>';
    }
    return html;
  }

  /**
   * Moves a hero unit by (dx, dy) if possible.
   * @param {number} dx 
   * @param {number} dy 
   */
  moveUnit(dx, dy) {
    if (
      this.awaitingAttackDirection ||
      this.movePoints <= 0 ||
      this.transitioningLevel
    )
      return;
    const unit = this.party[this.currentUnit];
    const newX = unit.x + dx;
    const newY = unit.y + dy;
    if (!this.isValidMove(newX, newY)) return;
    this.battlefield[unit.y][unit.x] = '.';
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;
    this.movePoints--;
    if (this.movePoints === 0) {
      this.nextTurn();
    }
  }

  /**
   * Validates if a move to (x, y) is allowed.
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  isValidMove(x, y) {
    return (
      x >= 0 &&
      x < this.cols &&
      y >= 0 &&
      y < this.rows &&
      this.battlefield[y][x] === '.'
    );
  }
  
  /**
   * Processes an attack (or healing) action in a specified direction.
   * When targeting an ally, the action may be interpreted as healing.
   * @param {number} dx 
   * @param {number} dy 
   * @param {Object} unit - The attacking hero.
   * @param {function} recordAttackCallback - Callback to record the attack.
   */
  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    await recordAttackCallback(
      `${unit.name} attacked in direction (${dx}, ${dy}).`
    );
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;

      // Check for an ally (different from the attacker).
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

      // Check for a combat enemy at the target cell.
      const enemy = this.entities.find(
        e =>
          this.isCombatEntity(e) &&
          e.x === targetX &&
          e.y === targetY
      );
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

        // Apply knockback if the attacking hero has the yeet stat.
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
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated!`);
          this.battlefield[targetY][targetX] = '.';
          this.entities = this.entities.filter(e => e !== enemy);
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      // Check for the wall.
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

  /**
   * Checks if the coordinates (x, y) are within battlefield bounds.
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  isWithinBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  /**
   * Handles the wall collapse event when its HP drops to 0.
   */
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
   * For each hero with a swarm ability (e.g., Mellitron), any combat enemy
   * in an adjacent cell takes damage equal to the hero's current swarm stat.
   */
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
            const enemy = this.entities.find(
              e =>
                this.isCombatEntity(e) &&
                e.x === targetX &&
                e.y === targetY
            );
            if (enemy) {
              const damage = hero.swarm;
              enemy.hp -= damage;
              this.logCallback(
                `${hero.name}'s swarm deals ${damage} damage to ${enemy.name} at (${targetX},${targetY})! (HP left: ${enemy.hp})`
              );
              if (enemy.hp <= 0) {
                this.logCallback(`${enemy.name} is defeated by swarm damage!`);
                this.battlefield[targetY][targetX] = '.';
                this.entities = this.entities.filter(e => e !== enemy);
              }
            }
          }
        });
      }
    });
  }

  /**
   * Processes the enemy turn.
   * Only combat entities take actions on enemy turn; non-combat interactive objects are ignored.
   */
  enemyTurn() {
    if (this.transitioningLevel) return;
    // Filter only combat enemies.
    this.entities
      .filter(entity => this.isCombatEntity(entity))
      .forEach(enemy => {
        // Move enemy based on its agility.
        for (let moves = 0; moves < enemy.agility; moves++) {
          this.moveEnemy(enemy);
        }
        // Enemy attacks adjacent heroes.
        this.enemyAttackAdjacent(enemy);
        // Trigger enemy dialogue if defined.
        if (Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0) {
          const randomIndex = Math.floor(Math.random() * enemy.dialogue.length);
          this.logCallback(`${enemy.name} says: "${enemy.dialogue[randomIndex]}"`);
        }
      });
    this.logCallback('Enemy turn completed.');
  }

  /**
   * Moves a combat enemy towards the closest hero.
   * @param {Object} enemy 
   */
  moveEnemy(enemy) {
    const targetHero = this.findClosestHero(enemy);
    if (!targetHero) return;
    const dx = targetHero.x - enemy.x;
    const dy = targetHero.y - enemy.y;
    let stepX = 0,
      stepY = 0;
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

  /**
   * Finds the closest hero to a given enemy.
   * @param {Object} enemy 
   * @returns {Object|null}
   */
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

  /**
   * Checks if a cell at (x, y) is free for movement.
   * @param {number} x 
   * @param {number} y 
   * @returns {boolean}
   */
  canMove(x, y) {
    return this.isWithinBounds(x, y) && this.battlefield[y][x] === '.';
  }

  /**
   * Enemies attack adjacent heroes.
   * @param {Object} enemy 
   */
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
        targetHero.hp -= enemy.attack;
        this.logCallback(
          `${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (Hero HP: ${targetHero.hp})`
        );
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

  /**
   * Proceeds to the next turn, processing status effects and switching turns between heroes and enemies.
   */
  nextTurn() {
    if (this.transitioningLevel) return;
    
    // Process status effects for heroes and combat enemies.
    this.applyStatusEffects();

    // Apply swarm damage from heroes like Mellitron.
    this.applySwarmDamage();

    // If no heroes remain, the game is over.
    if (this.party.length === 0) {
      this.logCallback('All heroes have been defeated! Game Over.');
      if (typeof this.onGameOver === 'function') this.onGameOver();
      return;
    }

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

  /**
   * Applies status effects (e.g., burn, slüj) to heroes and combat enemies.
   */
  applyStatusEffects() {
    // Process status effects for heroes.
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

    // Process status effects for combat enemies.
    this.entities.forEach(entity => {
      if (this.isCombatEntity(entity)) {
        if (entity.statusEffects.burn && entity.statusEffects.burn.duration > 0) {
          this.logCallback(
            `${entity.name} is burned and takes ${entity.statusEffects.burn.damage} damage!`
          );
          entity.hp -= entity.statusEffects.burn.damage;
          entity.statusEffects.burn.duration--;
          if (entity.hp <= 0) {
            this.logCallback(`${entity.name} was defeated by burn damage!`);
            this.battlefield[entity.y][entity.x] = '.';
          }
        }
        if (entity.statusEffects.sluj && entity.statusEffects.sluj.duration > 0) {
          entity.statusEffects.sluj.counter++;
          const level = entity.statusEffects.sluj.level;
          let trigger = false;
          let damage = 0;
          if (level === 1 && entity.statusEffects.sluj.counter % 4 === 0) {
            trigger = true;
            damage = 1;
          } else if (level === 2 && entity.statusEffects.sluj.counter % 3 === 0) {
            trigger = true;
            damage = 1;
          } else if (level === 3 && entity.statusEffects.sluj.counter % 2 === 0) {
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
            this.logCallback(`${entity.name} takes ${damage} slüj damage!`);
            entity.hp -= damage;
          }
          entity.statusEffects.sluj.duration--;
          if (entity.hp <= 0) {
            this.logCallback(`${entity.name} is defeated by slüj damage!`);
            this.battlefield[entity.y][entity.x] = '.';
          }
        }
      }
    });
    // Remove defeated combat entities.
    this.entities = this.entities.filter(entity => !this.isCombatEntity(entity) || entity.hp > 0);
  }

  /**
   * Creates a short pause between actions.
   * @returns {Promise}
   */
  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
