// battleEngine.js
// The BattleEngine class handles battlefield initialization, drawing the grid,
// unit movement, attack logic, enemy AI, and turn transitions. When the wall
// collapses, the onLevelComplete callback is triggered for a level transition.
export class BattleEngine {
  constructor(party, enemies, fieldRows, fieldCols, wallHP, logCallback, onLevelComplete) {
    this.party = party;
    this.enemies = enemies;
    this.rows = fieldRows;
    this.cols = fieldCols;
    this.wallHP = wallHP;
    this.logCallback = logCallback;
    this.onLevelComplete = onLevelComplete; // callback when level is complete
    this.currentUnit = 0;
    this.movePoints = party.length ? party[0].agility : 0;
    this.awaitingAttackDirection = false;
    this.transitioningLevel = false;
    this.battlefield = this.initializeBattlefield();
  }
  
  // Build the basic battlefield grid and place heroes, enemies, and the wall.
  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () => Array(this.cols).fill("."));
    // Place heroes on the top row.
    this.party.forEach((hero, index) => {
      hero.x = Math.min(index, this.cols - 1);
      hero.y = 0;
      field[0][hero.x] = hero.symbol;
    });
    // Place enemies.
    this.enemies.forEach(enemy => {
      field[enemy.y][enemy.x] = enemy.symbol;
    });
    // Create wall on the bottom row.
    for (let i = 0; i < this.cols; i++) {
      field[this.rows - 1][i] = "ᚙ";
    }
    return field;
  }
  
  // Returns HTML for rendering the battlefield.
  drawBattlefield() {
    let html = "";
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = "";
        if (cellContent === "Җ" || cellContent === "⛨") {
          cellClass += " enemy";
        }
        if (this.party[this.currentUnit].x === x && this.party[this.currentUnit].y === y) {
          cellClass += this.awaitingAttackDirection ? " attack-mode" : " active";
        }
        html += `<div class="cell ${cellClass}">${cellContent}</div>`;
      }
      html += "</div>";
    }
    return html;
  }
  
  // Moves the current unit if there are available move points.
  moveUnit(dx, dy) {
    if (this.awaitingAttackDirection || this.movePoints <= 0 || this.transitioningLevel) return;
    const unit = this.party[this.currentUnit];
    const newX = unit.x + dx;
    const newY = unit.y + dy;
    if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows || this.battlefield[newY][newX] !== ".") {
      return;
    }
    this.battlefield[unit.y][unit.x] = ".";
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;
    this.movePoints--;
    if (this.movePoints === 0) {
      this.nextTurn();
    }
  }
  
  // Processes the attack in a given direction.
  // This async function awaits the narrative callback so that special character dialogue is fully logged
  // before the turn advances.
  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    // Await the narrative output before processing the attack.
    await recordAttackCallback(`${unit.name} attacked in direction (${dx}, ${dy}).`);
    
    // Process the attack along the chosen direction.
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (targetX < 0 || targetX >= this.cols || targetY < 0 || targetY >= this.rows) break;
      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
        enemy.hp -= unit.attack;
        this.logCallback(`${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`);
        if (enemy.hp <= 0) {
          this.logCallback(`${enemy.name} is defeated!`);
          this.battlefield[targetY][targetX] = ".";
          this.enemies = this.enemies.filter(e => e !== enemy);
        }
        this.awaitingAttackDirection = false;
        // Slight delay for diegetic effect.
        await new Promise(resolve => setTimeout(resolve, 300));
        this.nextTurn();
        return;
      }
      if (this.battlefield[targetY][targetX] === "ᚙ") {
        // Stop processing once the wall is reached.
        if (this.transitioningLevel) return;
        this.wallHP -= unit.attack;
        this.logCallback(`${unit.name} attacks the wall from range ${i} for ${unit.attack} damage!`);
        this.awaitingAttackDirection = false;
        if (this.wallHP <= 0 && !this.transitioningLevel) {
          this.logCallback("The Wall Collapses!");
          this.transitioningLevel = true;
          setTimeout(() => this.onLevelComplete(), 1500);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        this.nextTurn();
        return;
      }
    }
    this.logCallback(`${unit.name} attacks, but there's nothing in range.`);
    this.awaitingAttackDirection = false;
    await new Promise(resolve => setTimeout(resolve, 300));
    this.nextTurn();
  }
  
  // Basic enemy AI: move and then attack adjacent heroes.
  enemyTurn() {
    if (this.transitioningLevel) return;
    this.enemies.forEach(enemy => {
      for (let moves = 0; moves < enemy.agility; moves++) {
        this.moveEnemy(enemy);
      }
      this.enemyAttack(enemy);
    });
    this.logCallback("Enemy turn completed.");
  }
  
  // Move enemy toward the closest hero using simple pathing.
  moveEnemy(enemy) {
    let targetHero = this.party.reduce((closest, hero) => {
      const distCurrent = Math.abs(closest.x - enemy.x) + Math.abs(closest.y - enemy.y);
      const distHero = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      return distHero < distCurrent ? hero : closest;
    }, this.party[0]);
    
    const dx = targetHero.x - enemy.x;
    const dy = targetHero.y - enemy.y;
    
    // Determine the preferred move direction based on the greater distance.
    let moveX = 0, moveY = 0;
    if (Math.abs(dx) >= Math.abs(dy)) {
      moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    } else {
      moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
    }
    
    // If the preferred move is blocked, try the alternative direction.
    if (!this.canMoveTo(enemy.x + moveX, enemy.y + moveY)) {
      if (moveX !== 0 && this.canMoveTo(enemy.x, enemy.y + (dy > 0 ? 1 : -1))) {
        moveX = 0;
        moveY = dy > 0 ? 1 : -1;
      } else if (moveY !== 0 && this.canMoveTo(enemy.x + (dx > 0 ? 1 : -1), enemy.y)) {
        moveX = dx > 0 ? 1 : -1;
        moveY = 0;
      }
    }
    
    const newX = enemy.x + moveX;
    const newY = enemy.y + moveY;
    if (this.canMoveTo(newX, newY)) {
      this.battlefield[enemy.y][enemy.x] = ".";
      enemy.x = newX;
      enemy.y = newY;
      this.battlefield[newY][newX] = enemy.symbol;
    }
  }
  
  canMoveTo(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.battlefield[y][x] === ".";
  }
  
  // Enemies attack adjacent heroes.
  enemyAttack(enemy) {
    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ];
    directions.forEach(([dx, dy]) => {
      const targetX = enemy.x + dx;
      const targetY = enemy.y + dy;
      const targetHero = this.party.find(hero => hero.x === targetX && hero.y === targetY);
      if (targetHero) {
        targetHero.hp -= enemy.attack;
        this.logCallback(`${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (Hero HP: ${targetHero.hp})`);
        if (targetHero.hp <= 0) {
          this.logCallback(`${targetHero.name} is defeated!`);
          this.battlefield[targetHero.y][targetHero.x] = ".";
          this.party = this.party.filter(hero => hero !== targetHero);
        }
      }
    });
  }
  
  // Advance the turn.
  // When all heroes have taken their turn, trigger the enemy turn.
  nextTurn() {
    if (this.transitioningLevel) return;
    this.awaitingAttackDirection = false;
    this.currentUnit++;
    if (this.currentUnit >= this.party.length) {
      this.currentUnit = 0;
      this.logCallback("Enemy turn begins.");
      this.enemyTurn();
    }
    // If some heroes have been defeated, ensure there is still a valid hero.
    if (this.party.length > 0) {
      this.movePoints = this.party[this.currentUnit].agility;
      this.logCallback(`Now it's ${this.party[this.currentUnit].name}'s turn.`);
    }
  }
}
