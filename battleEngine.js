// battleEngine.js
// Refactored BattleEngine class with improved state management and turn progression.
// Also, added support for lingering status effects such as burn.
// The Slüjier now does not inflict a slüj effect directly on attack; instead, mode-up grants the party a slüj buff,
// similar to how Torcher grants a burn buff.
//
// Slüj Effect Levels (if implemented as a buff later):
//   slüj +1: 1 damage every 4th turn.
//   slüj +2: 1 damage every 3rd turn.
//   slüj +3: 1 damage every 2nd turn.
//   slüj +4: 1 damage every turn.
//   slüj +5: 2 damage every turn.
//   slüj +6: 3 damage every turn.

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

    // Initialize status effects (burn, etc.) if not already present.
    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
    });
    this.enemies.forEach(enemy => {
      enemy.statusEffects = enemy.statusEffects || {};
    });

    this.battlefield = this.initializeBattlefield();
  }

  // Build the battlefield grid and place heroes, enemies, and the wall.
  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill('.')
    );
    // Place heroes in the top row.
    this.party.forEach((hero, index) => {
      hero.x = Math.min(index, this.cols - 1);
      hero.y = 0;
      field[hero.y][hero.x] = hero.symbol;
    });
    // Place enemies.
    this.enemies.forEach(enemy => {
      field[enemy.y][enemy.x] = enemy.symbol;
    });
    // Create the wall along the bottom row.
    for (let i = 0; i < this.cols; i++) {
      field[this.rows - 1][i] = 'ᚙ';
    }
    return field;
  }

  // Render the battlefield as HTML.
  drawBattlefield() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = '';
        // Check for enemy symbols.
        if (cellContent === 'Җ' || cellContent === '⛨') {
          cellClass += ' enemy';
        }
        // Mark the active hero cell.
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

  // Move the current hero unit if possible.
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
    // Update the battlefield with the hero's movement.
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
      this.battlefield[y][x] === '.'
    );
  }

  // Process an attack in a specified direction.
  // The recordAttackCallback logs narrative messages (such as character banter).
  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    await recordAttackCallback(
      `${unit.name} attacked in direction (${dx}, ${dy}).`
    );
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;
      // Check for an enemy at the target location.
      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
        enemy.hp -= unit.attack;
        this.logCallback(
          `${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`
        );
        // Removed slüj effect: the Slüjier no longer inflicts slüj on attack.
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
      // Check if the wall is hit.
      if (this.battlefield[targetY][targetX] === 'ᚙ') {
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

  isWithinBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  // Transition the level when the wall's HP drops to zero.
  handleWallCollapse() {
    this.logCallback('The Wall Collapses!');
    this.transitioningLevel = true;
    setTimeout(() => {
      if (typeof this.onLevelComplete === 'function') {
        this.onLevelComplete();
      }
    }, 1500);
  }

  // Enemy turn: each enemy moves and then attempts to attack an adjacent hero.
  enemyTurn() {
    if (this.transitioningLevel) return;
    this.enemies.forEach(enemy => {
      for (let moves = 0; moves < enemy.agility; moves++) {
        this.moveEnemy(enemy);
      }
      this.enemyAttackAdjacent(enemy);
    });
    this.logCallback('Enemy turn completed.');
  }

  // Move enemy toward the closest hero.
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
      } else if (
        stepY !== 0 &&
        this.canMove(enemy.x + Math.sign(dx), enemy.y)
      ) {
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
    return this.isWithinBounds(x, y) && this.battlefield[y][x] === '.';
  }

  // Enemy attacks any hero in adjacent cells.
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

  // Move to the next turn while applying status effects (burn and any ongoing effects).
  nextTurn() {
    if (this.transitioningLevel) return;
    // Apply all status effects.
    this.applyStatusEffects();
    if (this.party.length === 0) {
      this.logCallback('All heroes have been defeated! Game Over.');
      if (typeof this.onGameOver === 'function') this.onGameOver();
      return;
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

  // Apply status effects (burn, etc.) to heroes and enemies.
  applyStatusEffects() {
    // Process effects for heroes.
    this.party.forEach(hero => {
      // Process burn effect.
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
      // (Additional status effects can be processed here.)
    });
    this.party = this.party.filter(hero => hero.hp > 0);

    // Process effects for enemies.
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
    });
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
  }

  // A short delay between actions for smoother animations/log rendering.
  shortPause() {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}
