/**
 * battleEngine.js
 *
 * This file implements the battle engine for PIOSI. It includes:
 * - Unit movement and attack logic (including knockback, chain, and swarm abilities).
 * - Healing item (vittle) and mushroom pickup.
 * - Hero death handling with the "rise" stat: if a hero dies and has a nonzero rise,
 *   they are resurrected on the next level with HP equal to the rise value (and the rise is reset)
 *   while triggering ankh boosts to all live heroes.
 * - An explicit turn order is maintained based on hero agility so that dead heroes are removed
 *   and each hero’s move points come from their agility.
 */

import { applyKnockback } from './applyKnockback.js';

// Class to represent a persistent death effect.
export class PersistentDeath {
  constructor() {
    this.isDead = true;
  }
}

export class BattleEngine {
  constructor(party, enemies, fieldRows, fieldCols, wallHP, logCallback, onLevelComplete, onGameOver) {
    // Game entities.
    this.party = party;
    this.enemies = enemies;
    this.rows = fieldRows;
    this.cols = fieldCols;
    this.wallHP = wallHP;
    this.logCallback = logCallback;
    this.onLevelComplete = onLevelComplete;
    this.onGameOver = onGameOver;

    // Turn order management.
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.movePoints = 0;

    // Flags.
    this.awaitingAttackDirection = false;
    this.transitioningLevel = false;

    // Initialize battle state for heroes.
    this.party.forEach(hero => {
      hero.statusEffects = hero.statusEffects || {};
      if (!hero.hasOwnProperty("persistentDeath")) hero.persistentDeath = null;
      if (typeof hero.rise !== "number") hero.rise = 0;
    });
    this.enemies.forEach(enemy => enemy.statusEffects = {});

    // Initialize the battlefield.
    this.battlefield = this.initializeBattlefield();

    // Build turn order based on current live heroes and their agility.
    this.buildTurnOrder();
  }

  // Returns only heroes that haven't suffered persistent death.
  getLiveHeroes() {
    return this.party.filter(hero => !hero.persistentDeath);
  }

  // Build an explicit turn order array from live heroes, sorted by agility descending.
  buildTurnOrder() {
    const liveHeroes = this.getLiveHeroes();
    if (liveHeroes.length === 0) return;
    this.turnOrder = [...liveHeroes].sort((a, b) => b.agility - a.agility);
    this.currentTurnIndex = 0;
    const currentHero = this.getCurrentUnit();
    this.movePoints = currentHero ? currentHero.agility : 0;
    this.logCallback(`Turn Order: ${this.turnOrder.map(h => h.name).join(", ")}`);
  }

  // Returns the hero whose turn it is.
  getCurrentUnit() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentTurnIndex];
  }

  // Initializes the battlefield grid and places heroes, enemies, wall, healing items, and mushrooms.
  initializeBattlefield() {
    const field = Array.from({ length: this.rows }, () => Array(this.cols).fill('.'));
    // Place heroes and enemies.
    this.placeHeroes(field);
    this.placeEnemies(field);
    // Create bottom wall.
    this.createWall(field);
    // Place healing items and mushrooms.
    this.placeHealingItem(field);
    this.placeMushroom(field);

    // (Optional) Layout adjustments.
    if (this.levelSettings && this.levelSettings.layout) {
      for (let y = 0; y < this.levelSettings.layout.length; y++) {
        for (let x = 0; x < this.levelSettings.layout[y].length; x++) {
          if (this.levelSettings.layout[y][x] === '.wall') {
            field[y][x] = '.wall';
          }
        }
      }
    }

    // Apply random buffs based on caprice and fate.
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
          { stat: 'range', change: 1 },  { stat: 'range', change: -1 },
          { stat: 'agility', change: 1 },{ stat: 'agility', change: -1 },
          { stat: 'hp', change: 1 },     { stat: 'hp', change: -1 }
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

  // Place live heroes on the battlefield.
  placeHeroes(field) {
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

  // Place enemies on the battlefield.
  placeEnemies(field) {
    this.enemies.forEach(enemy => {
      enemy.statusEffects = {};
      field[enemy.y][enemy.x] = enemy.symbol;
    });
  }

  // Create the wall at the bottom row.
  createWall(field) {
    for (let i = 0; i < this.cols; i++) {
      field[this.rows - 1][i] = 'ᚙ';
    }
    // If any enemy uses a special wall symbol.
    this.enemies.forEach(enemy => {
      if (enemy.symbol === '█') field[enemy.y][enemy.x] = enemy.symbol;
    });
  }

  // Place a healing item (vittle) randomly.
  placeHealingItem(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') emptyCells.push({x, y});
      }
    }
    if (emptyCells.length) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      field[cell.y][cell.x] = 'ౚ';
    }
  }

  // Place a mushroom randomly.
  placeMushroom(field) {
    let emptyCells = [];
    for (let y = 0; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (field[y][x] === '.') emptyCells.push({x, y});
      }
    }
    if (emptyCells.length) {
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      field[cell.y][cell.x] = 'ඉ';
    }
  }

  // Render battlefield as HTML.
  drawBattlefield() {
    let html = '';
    for (let y = 0; y < this.rows; y++) {
      html += '<div class="row">';
      for (let x = 0; x < this.cols; x++) {
        const cellContent = this.battlefield[y][x];
        let cellClass = '';
        if (cellContent === 'ౚ' || cellContent === 'ඉ') cellClass += ' healing-item';
        if (this.enemies.some(enemy => enemy.symbol === cellContent)) cellClass += ' enemy';

        const currentUnit = this.getCurrentUnit();
        if (currentUnit && currentUnit.x === x && currentUnit.y === y) {
          cellClass += this.awaitingAttackDirection ? ' attack-mode' : ' active';
        }
        html += `<div class="cell${cellClass}">${cellContent}</div>`;
      }
      html += '</div>';
    }
    return html;
  }

  isWithinBounds(x, y) {
    return (x >= 0 && x < this.cols && y >= 0 && y < this.rows);
  }

  isCellPassable(x, y) {
    // Cells are passable if empty or contain healing items.
    return (this.battlefield[y][x] === '.' ||
            this.battlefield[y][x] === 'ౚ' ||
            this.battlefield[y][x] === 'ඉ');
  }

  // Moves the current hero by (dx, dy) if possible.
  moveUnit(dx, dy) {
    if (this.awaitingAttackDirection || this.movePoints <= 0 || this.transitioningLevel) return;
    const unit = this.getCurrentUnit();
    if (!unit) return;
    const newX = unit.x + dx, newY = unit.y + dy;
    if (!this.isWithinBounds(newX, newY)) return;

    // Check if hitting a wall.
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

    // Pickup healing item.
    if (this.battlefield[newY][newX] === 'ౚ') {
      const healingValue = 10 + (unit.spicy ? unit.spicy * 2 : 0);
      unit.hp += healingValue;
      this.logCallback(`${unit.name} picks up a vittle and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
      this.battlefield[newY][newX] = '.';
    }
    // Pickup mushroom.
    if (this.battlefield[newY][newX] === 'ඉ') {
      const healingValue = 5;
      unit.hp += healingValue;
      this.logCallback(`${unit.name} picks up a mushroom and heals for ${healingValue} HP! (New HP: ${unit.hp})`);
      this.battlefield[newY][newX] = '.';
      if (unit.spore && unit.spore > 0) {
        const stats = ['attack', 'range', 'agility', 'hp'];
        const randomStat = stats[Math.floor(Math.random()*stats.length)];
        unit[randomStat] += unit.spore;
        this.logCallback(`${unit.name} gains ${unit.spore} boost to ${randomStat} (Now: ${unit[randomStat]})`);
      }
    }
    if (!this.isCellPassable(newX, newY)) return;

    // Move the unit on the battlefield.
    this.battlefield[unit.y][unit.x] = '.';
    unit.x = newX;
    unit.y = newY;
    this.battlefield[newY][newX] = unit.symbol;

    this.movePoints--;
    if (this.movePoints === 0) this.nextTurn();
  }

  // Handles an attack in a given direction.
  async attackInDirection(dx, dy, unit, recordAttackCallback) {
    if (this.transitioningLevel) return;
    await recordAttackCallback(`${unit.name} attacked in direction (${dx}, ${dy}).`);
    for (let i = 1; i <= unit.range; i++) {
      const targetX = unit.x + dx * i;
      const targetY = unit.y + dy * i;
      if (!this.isWithinBounds(targetX, targetY)) break;

      const ally = this.party.find(h => h.x === targetX && h.y === targetY && h !== unit);
      if (ally) {
        if (unit.heal && unit.heal > 0) {
          ally.hp += unit.heal;
          this.logCallback(`${unit.name} heals ${ally.name} for ${unit.heal} HP! (New HP: ${ally.hp})`);
        } else if (unit.psych && unit.psych > 0) {
          const stats = ['attack', 'range', 'agility', 'hp'];
          const randomStat = stats[Math.floor(Math.random()*stats.length)];
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

      const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
      if (enemy) {
        enemy.hp -= unit.attack;
        this.logCallback(`${unit.name} attacks ${enemy.name} for ${unit.attack} damage! (HP left: ${enemy.hp})`);
        if (unit.trick > 0) {
          const debuffableStats = ["attack", "range", "agility", "hp"];
          const availableStats = debuffableStats.filter(stat => typeof enemy[stat] === "number");
          if(availableStats.length > 0){
            const chosenStat = availableStats[Math.floor(Math.random()*availableStats.length)];
            const orig = enemy[chosenStat];
            enemy[chosenStat] = Math.max(0, enemy[chosenStat]-unit.trick);
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
          const effectiveMultiplier = 1 - Math.exp(-unit.chain/10);
          const initialChainDamage = Math.round(unit.attack * effectiveMultiplier);
          if(initialChainDamage > 0){
            this.logCallback(`${enemy.name} takes ${initialChainDamage} chain damage!`);
            this.applyChainDamage(enemy, initialChainDamage, effectiveMultiplier, new Set());
          }
        }
        if(enemy.hp <= 0){
          this.logCallback(`${enemy.name} is defeated!`);
          this.battlefield[targetY][targetX] = '.';
          this.enemies = this.enemies.filter(e => e !== enemy);
        }
        this.awaitingAttackDirection = false;
        await this.shortPause();
        this.nextTurn();
        return;
      }
      // If a wall or special barrier is hit.
      if (this.battlefield[targetY][targetX] === 'ᚙ' || this.battlefield[targetY][targetX] === '█'){
        this.wallHP -= unit.attack;
        this.logCallback(`${unit.name} attacks the wall for ${unit.attack} damage! (Wall HP: ${this.wallHP})`);
        this.awaitingAttackDirection = false;
        if(this.wallHP <= 0 && !this.transitioningLevel){
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

  // Propagates chain damage to adjacent enemies.
  applyChainDamage(enemy, damage, effectiveMultiplier, visited = new Set()){
    visited.add(enemy);
    const adjacentOffsets = [
      {x: -1, y: 0}, {x: 1, y: 0},
      {x: 0, y: -1}, {x: 0, y: 1},
      {x: -1, y: -1}, {x: -1, y: 1},
      {x: 1, y: -1}, {x: 1, y: 1}
    ];
    for(let offset of adjacentOffsets){
      const adjX = enemy.x + offset.x, adjY = enemy.y + offset.y;
      if(!this.isWithinBounds(adjX, adjY)) continue;
      const adjacentEnemy = this.enemies.find(e => e.x === adjX && e.y === adjY);
      if(adjacentEnemy && !visited.has(adjacentEnemy)){
        adjacentEnemy.hp -= damage;
        this.logCallback(`${adjacentEnemy.name} takes ${damage} chain damage! (HP left: ${adjacentEnemy.hp})`);
        if(adjacentEnemy.hp <= 0){
          this.logCallback(`${adjacentEnemy.name} is defeated by chain damage!`);
          this.battlefield[adjY][adjX] = '.';
          this.enemies = this.enemies.filter(e => e !== adjacentEnemy);
        }
        const nextDamage = Math.round(damage * effectiveMultiplier);
        if(nextDamage > 0 && nextDamage < damage){
          this.logCallback(`${adjacentEnemy.name} takes ${nextDamage} chain propagation damage!`);
          this.applyChainDamage(adjacentEnemy, nextDamage, effectiveMultiplier, visited);
        }
      }
    }
  }

  // Process enemy actions.
  enemyTurn(){
    if(this.transitioningLevel) return;
    this.enemies.forEach(enemy=>{
      for(let moves = 0; moves < enemy.agility; moves++){
        this.moveEnemy(enemy);
      }
      this.enemyAttackAdjacent(enemy);
      if(Array.isArray(enemy.dialogue) && enemy.dialogue.length > 0){
        this.logCallback(`${enemy.name} says: "${enemy.dialogue[Math.floor(Math.random()*enemy.dialogue.length)]}"`);
      }
    });
    this.logCallback("Enemy turn completed.");
  }

  moveEnemy(enemy){
    const targetHero = this.findClosestHero(enemy);
    if(!targetHero) return;
    const dx = targetHero.x - enemy.x, dy = targetHero.y - enemy.y;
    let stepX = 0, stepY = 0;
    if(Math.abs(dx) >= Math.abs(dy)) {
      stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    } else {
      stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    }
    if(!this.canMove(enemy.x + stepX, enemy.y + stepY)){
      if(stepX !== 0 && this.canMove(enemy.x, enemy.y + Math.sign(dy))){
        stepY = dy > 0 ? 1 : -1;
        stepX = 0;
      } else if(stepY !== 0 && this.canMove(enemy.x + Math.sign(dx), enemy.y)){
        stepX = dx > 0 ? 1 : -1;
        stepY = 0;
      }
    }
    const newX = enemy.x + stepX, newY = enemy.y + stepY;
    if(this.canMove(newX, newY)){
      this.battlefield[enemy.y][enemy.x] = '.';
      enemy.x = newX;
      enemy.y = newY;
      this.battlefield[newY][newX] = enemy.symbol;
    }
  }

  findClosestHero(enemy){
    const liveHeroes = this.getLiveHeroes();
    if(liveHeroes.length === 0) return null;
    return liveHeroes.reduce((closest, hero)=>{
      const dCurrent = Math.abs(closest.x - enemy.x) + Math.abs(closest.y - enemy.y);
      const dHero = Math.abs(hero.x - enemy.x) + Math.abs(hero.y - enemy.y);
      return (dHero < dCurrent ? hero : closest);
    });
  }

  canMove(x, y){
    return this.isWithinBounds(x, y) && this.isCellPassable(x, y);
  }

  enemyAttackAdjacent(enemy){
    const directions = [[0,-1],[0,1],[-1,0],[1,0]];
    directions.forEach(([dx,dy])=>{
      const tx = enemy.x + dx, ty = enemy.y + dy;
      const targetHero = this.party.find(hero => hero.x === tx && hero.y === ty);
      if(targetHero){
        if(targetHero.armor && targetHero.armor > 0){
          targetHero.armor--;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} but their armor absorbs it (Remaining Armor: ${targetHero.armor})`);
        } else {
          targetHero.hp -= enemy.attack;
          this.logCallback(`${enemy.name} attacks ${targetHero.name} for ${enemy.attack} damage! (HP left: ${targetHero.hp})`);
        }
        if(targetHero.hp <= 0){
          this.handleHeroDeath(targetHero);
          // Adjust turn index if necessary.
          if(this.currentTurnIndex >= this.getLiveHeroes().length) this.currentTurnIndex = 0;
        } else if(targetHero.rage && targetHero.rage > 0){
          const stats = ['attack','range','agility','hp'];
          const randomStat = stats[Math.floor(Math.random()*stats.length)];
          if(targetHero.hasOwnProperty(randomStat)){
            targetHero[randomStat] += targetHero.rage;
            this.logCallback(`${targetHero.name}'s rage boosts ${randomStat} by ${targetHero.rage} (Now: ${targetHero[randomStat]})`);
          }
        }
      }
    });
  }

  // End of a hero's turn; update status effects, check game state, and advance turn order.
  nextTurn(){
    if(this.transitioningLevel) return;
    this.applyStatusEffects();
    this.applySwarmDamage();
    const liveHeroes = this.getLiveHeroes();
    if(liveHeroes.length === 0){
      this.logCallback("All heroes defeated! Game Over.");
      if(typeof this.onGameOver === "function") this.onGameOver();
      return;
    }
    this.awaitingAttackDirection = false;
    // Advance the turn order.
    this.currentTurnIndex++;
    if(this.currentTurnIndex >= this.turnOrder.length){
      this.currentTurnIndex = 0;
      this.logCallback("Enemy turn begins.");
      this.enemyTurn();
      // Rebuild turn order in case agility stats or hero list changed.
      this.buildTurnOrder();
      if(this.getLiveHeroes().length === 0){
        this.logCallback("All heroes defeated! Game Over.");
        if(typeof this.onGameOver === "function") this.onGameOver();
        return;
      }
    }
    const currentHero = this.getCurrentUnit();
    this.movePoints = currentHero ? currentHero.agility : 0;
    this.logCallback(`Now it's ${currentHero.name}'s turn.`);
  }

  // Process status effects on heroes and enemies.
  applyStatusEffects(){
    this.getLiveHeroes().forEach(hero=>{
      if(hero.statusEffects.burn && hero.statusEffects.burn.duration > 0){
        this.logCallback(`${hero.name} takes ${hero.statusEffects.burn.damage} burn damage!`);
        hero.hp -= hero.statusEffects.burn.damage;
        hero.statusEffects.burn.duration--;
        if(hero.hp <= 0) this.handleHeroDeath(hero);
      }
    });
    this.enemies.forEach(enemy=>{
      if(enemy.statusEffects.burn && enemy.statusEffects.burn.duration > 0){
        this.logCallback(`${enemy.name} takes ${enemy.statusEffects.burn.damage} burn damage!`);
        enemy.hp -= enemy.statusEffects.burn.damage;
        enemy.statusEffects.burn.duration--;
        if(enemy.hp <= 0){
          this.logCallback(`${enemy.name} died from burn damage!`);
          this.battlefield[enemy.y][enemy.x] = '.';
        }
      }
      if(enemy.statusEffects.sluj && enemy.statusEffects.sluj.duration > 0){
        enemy.statusEffects.sluj.counter++;
        let damage = 0, trigger = false;
        const level = enemy.statusEffects.sluj.level;
        if(level === 1 && enemy.statusEffects.sluj.counter % 4 === 0){ trigger = true; damage = 1; }
        else if(level === 2 && enemy.statusEffects.sluj.counter % 3 === 0){ trigger = true; damage = 1; }
        else if(level === 3 && enemy.statusEffects.sluj.counter % 2 === 0){ trigger = true; damage = 1; }
        else if(level === 4){ trigger = true; damage = 1; }
        else if(level === 5){ trigger = true; damage = 2; }
        else if(level >= 6){ trigger = true; damage = 3; }
        if(trigger){
          this.logCallback(`${enemy.name} takes ${damage} slüj damage!`);
          enemy.hp -= damage;
        }
        enemy.statusEffects.sluj.duration--;
        if(enemy.hp <= 0){
          this.logCallback(`${enemy.name} died from slüj damage!`);
          this.battlefield[enemy.y][enemy.x] = '.';
        }
      }
    });
  }

  // Process swarm damage from heroes to adjacent enemies.
  applySwarmDamage(){
    const offsets = [
      {x: -1, y: 0}, {x: 1, y: 0},
      {x: 0, y: -1}, {x: 0, y: 1},
      {x: -1, y: -1}, {x: -1, y: 1},
      {x: 1, y: -1}, {x: 1, y: 1}
    ];
    this.getLiveHeroes().forEach(hero=>{
      if(hero.swarm && typeof hero.swarm === "number"){
        offsets.forEach(offset=>{
          const targetX = hero.x + offset.x, targetY = hero.y + offset.y;
          if(this.isWithinBounds(targetX, targetY)){
            const enemy = this.enemies.find(e => e.x === targetX && e.y === targetY);
            if(enemy){
              enemy.hp -= hero.swarm;
              this.logCallback(`${hero.name}'s swarm deals ${hero.swarm} damage to ${enemy.name} at (${targetX},${targetY}) (HP left: ${enemy.hp})`);
              if(enemy.hp <= 0){
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

  // Handle hero death considering the possibility of a "rise" stat.
  handleHeroDeath(hero){
    if(hero.rise > 0){
      this.logCallback(`Hero ${hero.name} falls but rises with ${hero.rise} HP!`);
      hero.hp = hero.rise;
      hero.rise = 0;
      this.applyAnkhBoost();
      return;
    }
    if(hero.persistentDeath) return;
    this.logCallback(`Hero ${hero.name} has fallen permanently. Applying persistent death and ankh effects...`);
    hero.statusEffects.death = true;
    hero.persistentDeath = new PersistentDeath();
    this.battlefield[hero.y][hero.x] = '.';
    this.applyAnkhBoost();
    
    // Remove the hero from our turn order.
    this.turnOrder = this.turnOrder.filter(h => h !== hero);
    if(this.currentTurnIndex >= this.turnOrder.length){
      this.currentTurnIndex = 0;
    }
  }

  // Apply an ankh boost to all live heroes.
  applyAnkhBoost(){
    this.getLiveHeroes().forEach(h=>{
      if(h.ankh && typeof h.ankh === "number" && h.ankh > 0){
        const stats = ['attack', 'hp', 'agility', 'range'];
        const randomStat = stats[Math.floor(Math.random()*stats.length)];
        h[randomStat] += h.ankh;
        this.logCallback(`${h.name} gains an ankh boost of ${h.ankh} ${randomStat} (Now: ${h[randomStat]}).`);
      }
    });
  }

  // Returns a promise to pause execution for a short duration.
  shortPause(){
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  // Handles the collapse of the wall, transitioning the level.
  handleWallCollapse(){
    this.logCallback("The Wall Collapses!");
    this.transitioningLevel = true;
    setTimeout(() => { if (typeof this.onLevelComplete === "function") this.onLevelComplete(); }, 1500);
  }
}
