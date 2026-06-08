/**
 * Regression tests for PIOSI combat and movement mechanics.
 * Run with: npm test
 *
 * Covers: movement, attack, knockback, chain, status effects, hero death,
 * enemy AI, turn rotation, dodge, armor, and all special stats.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, PersistentDeath } from '../src/battleEngine.js';
import { applyKnockback } from '../src/applyKnockback.js';
import { applySlujEffect } from '../src/sluj.js';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeHero(overrides = {}) {
  return {
    name: 'Hero',
    symbol: 'H',
    attack: 5,
    range: 3,
    agility: 3,
    hp: 20,
    rise: 0,
    dodge: 0,
    ...overrides,
  };
}

function makeEnemy(x, y, overrides = {}) {
  return {
    name: 'Enemy',
    symbol: 'E',
    attack: 3,
    range: 1,
    agility: 1,
    hp: 10,
    x,
    y,
    dodge: 0,
    ...overrides,
  };
}

/**
 * Builds a BattleEngine for testing.
 * - shortPause is replaced with an immediate resolve so async tests are fast.
 * - Random vittle/mushroom placements are cleared for determinism.
 */
function makeEngine(party, enemies, { rows = 5, cols = 8, wallHP = 50 } = {}) {
  const logs = [];
  const engine = new BattleEngine(
    party, enemies, rows, cols, wallHP,
    (msg) => logs.push(msg),
    () => {},
    () => {}
  );
  engine.shortPause = () => Promise.resolve();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = engine.battlefield[y][x];
      if (c === 'ౚ' || c === 'ඉ') engine.battlefield[y][x] = '.';
    }
  }
  return { engine, logs };
}

/** Moves a unit to an explicit position on the battlefield. */
function place(engine, unit, x, y) {
  if (unit.x != null && unit.y != null) {
    if (engine.battlefield[unit.y]?.[unit.x] === unit.symbol)
      engine.battlefield[unit.y][unit.x] = '.';
  }
  unit.x = x;
  unit.y = y;
  engine.battlefield[y][x] = unit.symbol;
}

// ─── isWithinBounds ──────────────────────────────────────────────────────────

describe('isWithinBounds', () => {
  test('returns true for corners and interior cells', () => {
    const { engine } = makeEngine([makeHero()], [], { rows: 5, cols: 8 });
    assert.equal(engine.isWithinBounds(0, 0), true);
    assert.equal(engine.isWithinBounds(7, 4), true);
    assert.equal(engine.isWithinBounds(3, 2), true);
  });

  test('returns false for negative coordinates', () => {
    const { engine } = makeEngine([makeHero()], []);
    assert.equal(engine.isWithinBounds(-1, 0), false);
    assert.equal(engine.isWithinBounds(0, -1), false);
    assert.equal(engine.isWithinBounds(-1, -1), false);
  });

  test('returns false for coordinates equal to or beyond dimensions', () => {
    const { engine } = makeEngine([makeHero()], [], { rows: 5, cols: 8 });
    assert.equal(engine.isWithinBounds(8, 0), false);
    assert.equal(engine.isWithinBounds(0, 5), false);
  });
});

// ─── isCellPassable ──────────────────────────────────────────────────────────

describe('isCellPassable', () => {
  test('empty cell is passable', () => {
    const { engine } = makeEngine([makeHero()], []);
    engine.battlefield[1][3] = '.';
    assert.equal(engine.isCellPassable(3, 1), true);
  });

  test('vittle cell is passable', () => {
    const { engine } = makeEngine([makeHero()], []);
    engine.battlefield[1][3] = 'ౚ';
    assert.equal(engine.isCellPassable(3, 1), true);
  });

  test('mushroom cell is passable', () => {
    const { engine } = makeEngine([makeHero()], []);
    engine.battlefield[1][3] = 'ඉ';
    assert.equal(engine.isCellPassable(3, 1), true);
  });

  test('wall row is not passable', () => {
    const { engine } = makeEngine([makeHero()], [], { rows: 5, cols: 8 });
    assert.equal(engine.isCellPassable(0, 4), false);
  });

  test('enemy cell is not passable', () => {
    const enemy = makeEnemy(3, 1);
    const { engine } = makeEngine([makeHero()], [enemy]);
    assert.equal(engine.isCellPassable(3, 1), false);
  });

  test('hero cell is not passable', () => {
    const hero = makeHero();
    const { engine } = makeEngine([hero], []);
    assert.equal(engine.isCellPassable(hero.x, hero.y), false);
  });
});

// ─── getLiveHeroes ───────────────────────────────────────────────────────────

describe('getLiveHeroes', () => {
  test('returns all heroes when none are dead', () => {
    const party = [makeHero({ name: 'A' }), makeHero({ name: 'B', symbol: 'B' })];
    const { engine } = makeEngine(party, []);
    assert.equal(engine.getLiveHeroes().length, 2);
  });

  test('excludes heroes with persistentDeath', () => {
    const dead = makeHero({ name: 'Dead', persistentDeath: new PersistentDeath() });
    const alive = makeHero({ name: 'Alive', symbol: 'A' });
    const { engine } = makeEngine([dead, alive], []);
    const live = engine.getLiveHeroes();
    assert.equal(live.length, 1);
    assert.equal(live[0].name, 'Alive');
  });

  test('returns empty array when all heroes are dead', () => {
    const dead = makeHero({ persistentDeath: new PersistentDeath() });
    const { engine } = makeEngine([dead], []);
    assert.equal(engine.getLiveHeroes().length, 0);
  });
});

// ─── findClosestHero ─────────────────────────────────────────────────────────

describe('findClosestHero', () => {
  test('returns null when no live heroes exist', () => {
    const dead = makeHero({ persistentDeath: new PersistentDeath() });
    const enemy = makeEnemy(5, 0);
    const { engine } = makeEngine([dead], [enemy]);
    assert.equal(engine.findClosestHero(enemy), null);
  });

  test('returns the hero with minimum Manhattan distance', () => {
    const heroA = makeHero({ name: 'Far', symbol: 'F' });
    const heroB = makeHero({ name: 'Near', symbol: 'N' });
    const enemy = makeEnemy(6, 0);
    const { engine } = makeEngine([heroA, heroB], [enemy]);
    place(engine, heroA, 0, 0); // dist = 6
    place(engine, heroB, 5, 0); // dist = 1
    assert.equal(engine.findClosestHero(enemy).name, 'Near');
  });

  test('ignores persistently dead heroes', () => {
    const dead = makeHero({ name: 'Dead', persistentDeath: new PersistentDeath() });
    const alive = makeHero({ name: 'Alive', symbol: 'A' });
    const enemy = makeEnemy(5, 0);
    const { engine } = makeEngine([dead, alive], [enemy]);
    place(engine, dead, 6, 0);
    place(engine, alive, 0, 0);
    assert.equal(engine.findClosestHero(enemy).name, 'Alive');
  });
});

// ─── moveUnit ────────────────────────────────────────────────────────────────

describe('moveUnit', () => {
  test('hero moves to adjacent empty cell and position updates', () => {
    const hero = makeHero();
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.moveUnit(1, 0);
    assert.equal(hero.x, 2);
    assert.equal(hero.y, 1);
    assert.equal(engine.battlefield[1][2], hero.symbol);
    assert.equal(engine.battlefield[1][1], '.');
  });

  test('each move costs one move point', () => {
    const hero = makeHero({ agility: 3 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.moveUnit(1, 0);
    assert.equal(engine.movePoints, 2);
    engine.moveUnit(1, 0);
    assert.equal(engine.movePoints, 1);
  });

  test('hero cannot move out of bounds', () => {
    const hero = makeHero();
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 0, 1);
    engine.moveUnit(-1, 0);
    assert.equal(hero.x, 0);
  });

  test('hero cannot move into an enemy cell', () => {
    const hero = makeHero();
    const enemy = makeEnemy(2, 1);
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    engine.moveUnit(1, 0);
    assert.equal(hero.x, 1);
  });

  test('hero cannot move into another hero cell', () => {
    const heroA = makeHero({ name: 'A' });
    const heroB = makeHero({ name: 'B', symbol: 'B' });
    const { engine } = makeEngine([heroA, heroB], []);
    place(engine, heroA, 1, 1);
    place(engine, heroB, 2, 1);
    engine.moveUnit(1, 0);
    assert.equal(heroA.x, 1);
  });

  test('moving into wall decrements wallHP', () => {
    const hero = makeHero({ attack: 5 });
    const { engine } = makeEngine([hero], [], { rows: 5, cols: 8, wallHP: 20 });
    place(engine, hero, 1, 3); // row 3 is adjacent to wall at row 4
    engine.moveUnit(0, 1);
    assert.equal(engine.wallHP, 15);
  });

  test('wall collapse from movement triggers level transition', () => {
    let levelDone = false;
    const hero = makeHero({ attack: 100 });
    const logs = [];
    const engine = new BattleEngine(
      [hero], [], 5, 8, 50,
      (m) => logs.push(m),
      () => { levelDone = true; },
      () => {}
    );
    engine.shortPause = () => Promise.resolve();
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 8; x++)
        if (engine.battlefield[y][x] === 'ౚ' || engine.battlefield[y][x] === 'ඉ')
          engine.battlefield[y][x] = '.';
    place(engine, hero, 0, 3);
    engine.moveUnit(0, 1);
    assert.equal(engine.transitioningLevel, true);
  });

  test('vittle pickup heals hero by 10', () => {
    const hero = makeHero({ hp: 5 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.battlefield[1][2] = 'ౚ';
    engine.moveUnit(1, 0);
    assert.equal(hero.hp, 15);
    assert.equal(engine.battlefield[1][2], hero.symbol);
  });

  test('vittle with spicy heals 10 + spicy * 2', () => {
    const hero = makeHero({ hp: 5, spicy: 3 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.battlefield[1][2] = 'ౚ';
    engine.moveUnit(1, 0);
    assert.equal(hero.hp, 21); // 5 + 10 + 6
  });

  test('mushroom pickup heals hero by 5', () => {
    const hero = makeHero({ hp: 10 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.battlefield[1][2] = 'ඉ';
    engine.moveUnit(1, 0);
    assert.equal(hero.hp, 15);
  });

  test('mushroom with spore boosts a random stat', () => {
    const hero = makeHero({ spore: 3 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.battlefield[1][2] = 'ඉ';
    const before = hero.attack + hero.range + hero.agility + hero.hp;
    engine.moveUnit(1, 0);
    const after = hero.attack + hero.range + hero.agility + hero.hp;
    assert.ok(after > before); // stat boosted on top of heal
  });

  test('dead hero (hp <= 0) cannot move', () => {
    const hero = makeHero({ hp: 0 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.moveUnit(1, 0);
    assert.equal(hero.x, 1);
  });

  test('awaitingAttackDirection blocks movement', () => {
    const hero = makeHero();
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.awaitingAttackDirection = true;
    engine.moveUnit(1, 0);
    assert.equal(hero.x, 1);
  });

  test('transitioningLevel blocks movement', () => {
    const hero = makeHero();
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.transitioningLevel = true;
    engine.moveUnit(1, 0);
    assert.equal(hero.x, 1);
  });
});

// ─── attackInDirection ───────────────────────────────────────────────────────

describe('attackInDirection', () => {
  test('deals attack damage to enemy in ray', async () => {
    const hero = makeHero({ attack: 5, range: 4 });
    const enemy = makeEnemy(4, 1, { hp: 10, dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 4, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.hp, 5);
  });

  test('removes enemy from array and clears cell when killed', async () => {
    const hero = makeHero({ attack: 20, range: 4 });
    const enemy = makeEnemy(3, 1, { hp: 10, dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 3, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(engine.enemies.length, 0);
    assert.equal(engine.battlefield[1][3], '.');
  });

  test('attack misses when enemy is beyond range', async () => {
    const hero = makeHero({ attack: 5, range: 2 });
    const enemy = makeEnemy(5, 1, { hp: 10 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 5, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.hp, 10);
  });

  test('ranged attack damages wall', async () => {
    const hero = makeHero({ attack: 5, range: 5 });
    const { engine } = makeEngine([hero], [], { rows: 5, cols: 8, wallHP: 20 });
    place(engine, hero, 0, 3);
    await engine.attackInDirection(0, 1, hero, async () => {});
    assert.equal(engine.wallHP, 15);
  });

  test('wall collapse from ranged attack triggers level transition', async () => {
    const hero = makeHero({ attack: 100, range: 5 });
    let levelDone = false;
    const logs = [];
    const engine = new BattleEngine(
      [hero], [], 5, 8, 50,
      (m) => logs.push(m),
      () => { levelDone = true; },
      () => {}
    );
    engine.shortPause = () => Promise.resolve();
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 8; x++)
        if (engine.battlefield[y][x] === 'ౚ' || engine.battlefield[y][x] === 'ඉ')
          engine.battlefield[y][x] = '.';
    place(engine, hero, 0, 3);
    await engine.attackInDirection(0, 1, hero, async () => {});
    assert.equal(engine.transitioningLevel, true);
  });

  test('heal stat restores ally HP', async () => {
    const healer = makeHero({ name: 'Healer', symbol: 'M', heal: 8, range: 3 });
    const ally = makeHero({ name: 'Ally', symbol: 'A', hp: 10 });
    const { engine } = makeEngine([healer, ally], []);
    place(engine, healer, 0, 1);
    place(engine, ally, 2, 1);
    await engine.attackInDirection(1, 0, healer, async () => {});
    assert.equal(ally.hp, 18);
  });

  test('psych stat boosts a random ally stat', async () => {
    const psycher = makeHero({ name: 'Psych', symbol: 'P', psych: 3, range: 3 });
    const ally = makeHero({ name: 'Ally', symbol: 'A' });
    const { engine } = makeEngine([psycher, ally], []);
    place(engine, psycher, 0, 1);
    place(engine, ally, 2, 1);
    const before = ally.attack + ally.range + ally.agility + ally.hp;
    await engine.attackInDirection(1, 0, psycher, async () => {});
    const after = ally.attack + ally.range + ally.agility + ally.hp;
    assert.equal(after - before, 3);
  });

  test('burn stat applies burn status to enemy', async () => {
    // Stub nextTurn so applyStatusEffects doesn't tick duration before we assert.
    const hero = makeHero({ attack: 5, range: 3, burn: 4 });
    const enemy = makeEnemy(2, 1, { dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    engine.nextTurn = () => {};
    place(engine, hero, 0, 1);
    place(engine, enemy, 2, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.statusEffects.burn.damage, 4);
    assert.equal(enemy.statusEffects.burn.duration, 3);
  });

  test('sluj stat applies sluj status to enemy', async () => {
    const hero = makeHero({ attack: 5, range: 3, sluj: 2 });
    const enemy = makeEnemy(2, 1, { dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    engine.nextTurn = () => {};
    place(engine, hero, 0, 1);
    place(engine, enemy, 2, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.statusEffects.sluj.level, 2);
    assert.equal(enemy.statusEffects.sluj.duration, 4);
  });

  test('hitting a sluj-afflicted enemy stacks level and resets duration', async () => {
    const hero = makeHero({ attack: 5, range: 3, sluj: 2 });
    const enemy = makeEnemy(2, 1, { dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    engine.nextTurn = () => {};
    place(engine, hero, 0, 1);
    place(engine, enemy, 2, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    enemy.hp = 20;
    place(engine, enemy, 2, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.statusEffects.sluj.level, 4);
    assert.equal(enemy.statusEffects.sluj.duration, 4);
  });

  test('trick stat debuffs a random enemy stat', async () => {
    const hero = makeHero({ attack: 5, range: 3, trick: 2 });
    const enemy = makeEnemy(2, 1, { dodge: 0, attack: 6, range: 2, agility: 2, hp: 20 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 2, 1);
    const beforeStatSum = enemy.attack + enemy.range + enemy.agility;
    const beforeHp = enemy.hp;
    await engine.attackInDirection(1, 0, hero, async () => {});
    const afterStatSum = enemy.attack + enemy.range + enemy.agility;
    const hpDrop = beforeHp - enemy.hp;
    // Either a non-HP stat was reduced by trick, or HP was reduced by more than just base attack
    const nonHpDebuffed = afterStatSum < beforeStatSum;
    const hpDebuffed = hpDrop > 5; // more than base attack alone
    assert.ok(nonHpDebuffed || hpDebuffed);
  });

  test('bomba hero adjacent to enemy deals bonus damage', async () => {
    const hero = makeHero({ attack: 5, range: 3 });
    const bomba = makeHero({ name: 'Bomba', symbol: 'B', bomba: 4 });
    const enemy = makeEnemy(3, 1, { dodge: 0 });
    const { engine } = makeEngine([hero, bomba], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, bomba, 3, 2); // adjacent to enemy
    place(engine, enemy, 3, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.hp, 1); // 10 - 5 (hero) - 4 (bomba)
  });

  test('dead hero cell is treated as empty and stops attack ray', async () => {
    const hero = makeHero({ attack: 5, range: 5 });
    const dead = makeHero({ name: 'Ghost', symbol: 'G', persistentDeath: new PersistentDeath() });
    const enemy = makeEnemy(4, 1, { dodge: 0 });
    const { engine } = makeEngine([hero, dead], [enemy]);
    place(engine, hero, 0, 1);
    dead.x = 2; dead.y = 1; // dead hero's recorded position (cell is '.')
    place(engine, enemy, 4, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.hp, 10); // ray stopped at dead hero's cell
  });

  test('dead hero (hp <= 0) cannot attack', async () => {
    const hero = makeHero({ hp: 0, attack: 5, range: 3 });
    const enemy = makeEnemy(2, 1, { dodge: 0 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 2, 1);
    await engine.attackInDirection(1, 0, hero, async () => {});
    assert.equal(enemy.hp, 10);
  });
});

// ─── applyChainDamage ────────────────────────────────────────────────────────

describe('applyChainDamage', () => {
  test('spreads damage to an adjacent enemy', () => {
    const hero = makeHero();
    const a = makeEnemy(2, 1, { name: 'A', hp: 30 });
    const b = makeEnemy(3, 1, { name: 'B', hp: 30 });
    const { engine } = makeEngine([hero], [a, b]);
    engine.applyChainDamage(a, 8, 0.5, new Set());
    assert.equal(b.hp, 22);
  });

  test('does not damage enemies already in the visited set', () => {
    const hero = makeHero();
    const a = makeEnemy(2, 1, { name: 'A', hp: 30 });
    const b = makeEnemy(3, 1, { name: 'B', hp: 30 });
    const { engine } = makeEngine([hero], [a, b]);
    engine.applyChainDamage(a, 8, 0.5, new Set([b]));
    assert.equal(b.hp, 30);
  });

  test('kills adjacent enemy and clears its cell', () => {
    const hero = makeHero();
    const a = makeEnemy(2, 1, { name: 'A', hp: 30 });
    const b = makeEnemy(3, 1, { name: 'B', hp: 5 });
    const { engine } = makeEngine([hero], [a, b]);
    place(engine, b, 3, 1);
    engine.applyChainDamage(a, 8, 0.5, new Set());
    assert.equal(engine.enemies.find(e => e.name === 'B'), undefined);
    assert.equal(engine.battlefield[1][3], '.');
  });

  test('does not propagate chain when next damage equals current (no reduction)', () => {
    // With multiplier = 1.0, nextDamage === damage, propagation halts
    const hero = makeHero();
    const a = makeEnemy(2, 1, { name: 'A', hp: 100 });
    const b = makeEnemy(3, 1, { name: 'B', hp: 100 });
    const c = makeEnemy(4, 1, { name: 'C', hp: 100 });
    const { engine } = makeEngine([hero], [a, b, c]);
    engine.applyChainDamage(a, 5, 1.0, new Set()); // multiplier = 1, nextDamage = 5 = damage
    assert.equal(b.hp, 95);   // one hop
    assert.equal(c.hp, 100);  // second hop suppressed (nextDamage not < damage)
  });
});

// ─── applyKnockback ──────────────────────────────────────────────────────────

describe('applyKnockback', () => {
  test('moves enemy the full knockback distance along attack direction', () => {
    const hero = makeHero();
    const enemy = makeEnemy(2, 1, { hp: 20 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, enemy, 2, 1);
    applyKnockback(enemy, 1, 0, 2, 5, engine.battlefield, () => {}, engine.isWithinBounds.bind(engine));
    assert.equal(enemy.x, 4);
    assert.equal(engine.battlefield[1][4], enemy.symbol);
    assert.equal(engine.battlefield[1][2], '.');
  });

  test('deals damage and stops when knocked out of bounds', () => {
    const hero = makeHero();
    const enemy = makeEnemy(6, 1, { hp: 20 });
    const { engine } = makeEngine([hero], [enemy], { rows: 5, cols: 8 });
    place(engine, enemy, 6, 1);
    applyKnockback(enemy, 1, 0, 3, 5, engine.battlefield, () => {}, engine.isWithinBounds.bind(engine));
    assert.equal(enemy.hp, 15);
  });

  test('deals damage and stops when knocked into a wall cell', () => {
    const hero = makeHero();
    const enemy = makeEnemy(1, 3, { hp: 20 });
    const { engine } = makeEngine([hero], [enemy], { rows: 5, cols: 8 });
    place(engine, enemy, 1, 3); // row 4 is wall
    applyKnockback(enemy, 0, 1, 2, 5, engine.battlefield, () => {}, engine.isWithinBounds.bind(engine));
    assert.equal(enemy.hp, 15); // collides with wall at row 4
  });

  test('moves enemy incrementally, clearing each previous cell', () => {
    const hero = makeHero();
    const enemy = makeEnemy(1, 1, { hp: 20 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, enemy, 1, 1);
    applyKnockback(enemy, 1, 0, 1, 5, engine.battlefield, () => {}, engine.isWithinBounds.bind(engine));
    assert.equal(enemy.x, 2);
    assert.equal(engine.battlefield[1][1], '.');
    assert.equal(engine.battlefield[1][2], enemy.symbol);
  });
});

// ─── handleHeroDeath ─────────────────────────────────────────────────────────

describe('handleHeroDeath', () => {
  test('hero with rise > 0 is resurrected with rise HP', () => {
    const hero = makeHero({ hp: 0, rise: 7 });
    const { engine } = makeEngine([hero], []);
    engine.handleHeroDeath(hero);
    assert.equal(hero.hp, 7);
    assert.equal(hero.rise, 0);
    assert.equal(hero.persistentDeath, null);
  });

  test('hero without rise gets a PersistentDeath marker', () => {
    const hero = makeHero({ hp: 0, rise: 0 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.handleHeroDeath(hero);
    assert.ok(hero.persistentDeath instanceof PersistentDeath);
  });

  test('dead hero cell is cleared on persistent death', () => {
    const hero = makeHero({ hp: 0 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.handleHeroDeath(hero);
    assert.equal(engine.battlefield[1][1], '.');
  });

  test('handleHeroDeath is idempotent after first persistent death', () => {
    const hero = makeHero({ hp: 0 });
    const { engine } = makeEngine([hero], []);
    place(engine, hero, 1, 1);
    engine.handleHeroDeath(hero);
    const marker = hero.persistentDeath;
    engine.handleHeroDeath(hero); // call again
    assert.equal(hero.persistentDeath, marker); // same object, no double-death
  });

  test('ankh stat boosts a random stat on all live allies', () => {
    const dying = makeHero({ name: 'Dying', hp: 0 });
    const survivor = makeHero({ name: 'Survivor', symbol: 'S', ankh: 3 });
    const { engine } = makeEngine([dying, survivor], []);
    place(engine, dying, 0, 1);
    place(engine, survivor, 2, 1);
    const before = survivor.attack + survivor.range + survivor.agility + survivor.hp;
    engine.handleHeroDeath(dying);
    const after = survivor.attack + survivor.range + survivor.agility + survivor.hp;
    assert.equal(after - before, 3);
  });
});

// ─── enemyAttackAdjacent ─────────────────────────────────────────────────────

describe('enemyAttackAdjacent', () => {
  test('enemy deals attack damage to adjacent hero', () => {
    const hero = makeHero({ hp: 20, dodge: 0 });
    const enemy = makeEnemy(2, 1, { attack: 4 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    engine.enemyAttackAdjacent(enemy);
    assert.equal(hero.hp, 16);
  });

  test('armor absorbs one enemy attack without HP loss', () => {
    const hero = makeHero({ hp: 20, armor: 2, dodge: 0 });
    const enemy = makeEnemy(2, 1, { attack: 5 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    engine.enemyAttackAdjacent(enemy);
    assert.equal(hero.armor, 1);
    assert.equal(hero.hp, 20);
  });

  test('after armor is depleted, next hit damages HP', () => {
    const hero = makeHero({ hp: 20, armor: 1, dodge: 0 });
    const enemy = makeEnemy(2, 1, { attack: 5 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    engine.enemyAttackAdjacent(enemy); // absorb
    engine.enemyAttackAdjacent(enemy); // damage
    assert.equal(hero.armor, 0);
    assert.equal(hero.hp, 15);
  });

  test('rage boosts a random stat when hero survives a hit', () => {
    const hero = makeHero({ hp: 20, rage: 2, dodge: 0 });
    const enemy = makeEnemy(2, 1, { attack: 5 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    const before = hero.attack + hero.range + hero.agility + hero.hp;
    engine.enemyAttackAdjacent(enemy);
    const after = hero.attack + hero.range + hero.agility + hero.hp;
    // Net: -5 (damage) + 2 (rage) = -3
    assert.equal(after - before, -3);
  });

  test('enemy does not attack non-adjacent heroes', () => {
    const hero = makeHero({ hp: 20, dodge: 0 });
    const enemy = makeEnemy(5, 1, { attack: 5 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 5, 1);
    engine.enemyAttackAdjacent(enemy);
    assert.equal(hero.hp, 20);
  });
});

// ─── moveEnemy ───────────────────────────────────────────────────────────────

describe('moveEnemy', () => {
  test('enemy moves one step horizontally toward hero', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1);
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 5, 1);
    engine.moveEnemy(enemy);
    assert.equal(enemy.x, 4);
    assert.equal(enemy.y, 1);
  });

  test('enemy moves one step vertically toward hero', () => {
    const hero = makeHero();
    const enemy = makeEnemy(0, 3);
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 0);
    place(engine, enemy, 0, 3);
    engine.moveEnemy(enemy);
    assert.equal(enemy.y, 2);
    assert.equal(enemy.x, 0);
  });

  test('enemy does not move when no live heroes remain', () => {
    const dead = makeHero({ persistentDeath: new PersistentDeath() });
    const enemy = makeEnemy(5, 1);
    const { engine } = makeEngine([dead], [enemy]);
    place(engine, enemy, 5, 1);
    engine.moveEnemy(enemy);
    assert.equal(enemy.x, 5);
    assert.equal(enemy.y, 1);
  });

  test('enemy prefers horizontal movement when |dx| >= |dy|', () => {
    const hero = makeHero();
    const enemy = makeEnemy(4, 2); // dx=4, dy=2 → horizontal first
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 0);
    place(engine, enemy, 4, 2);
    engine.moveEnemy(enemy);
    assert.equal(enemy.x, 3); // moved left (toward hero)
    assert.equal(enemy.y, 2);
  });

  test('enemy tries alternate direction when primary path is blocked', () => {
    // Hero at row 0 so dy != 0, giving path correction a vertical option.
    const hero = makeHero();
    const blocker = makeEnemy(3, 1, { name: 'Blocker', symbol: 'X' });
    const mover = makeEnemy(4, 1, { name: 'Mover', symbol: 'M' });
    const { engine } = makeEngine([hero], [blocker, mover]);
    place(engine, hero, 0, 0);    // hero at row 0 → dy = -1, vertical correction available
    place(engine, blocker, 3, 1); // blocks horizontal path
    place(engine, mover, 4, 1);
    engine.moveEnemy(mover);
    // Mover can't go left (blocked), should try vertical
    const moved = mover.x !== 4 || mover.y !== 1;
    assert.equal(moved, true);
  });

  test('enemy cell is cleared at old position after move', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1);
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 0, 1);
    place(engine, enemy, 5, 1);
    engine.moveEnemy(enemy);
    assert.equal(engine.battlefield[1][5], '.');
    assert.equal(engine.battlefield[1][4], enemy.symbol);
  });
});

// ─── applyStatusEffects (burn) ───────────────────────────────────────────────

describe('applyStatusEffects – burn', () => {
  test('burn damages an enemy on each tick', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1, { hp: 30 });
    const { engine } = makeEngine([hero], [enemy]);
    enemy.statusEffects.burn = { damage: 4, duration: 3 };
    engine.applyStatusEffects();
    assert.equal(enemy.hp, 26);
    assert.equal(enemy.statusEffects.burn.duration, 2);
  });

  test('burn ticks exactly 3 times then stops', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1, { hp: 100 });
    const { engine } = makeEngine([hero], [enemy]);
    enemy.statusEffects.burn = { damage: 3, duration: 3 };
    engine.applyStatusEffects();
    engine.applyStatusEffects();
    engine.applyStatusEffects();
    assert.equal(enemy.statusEffects.burn.duration, 0);
    engine.applyStatusEffects(); // 4th tick — no damage
    assert.equal(enemy.hp, 91); // 100 - 9 (3 ticks × 3)
  });

  test('burn kills enemy and removes it from battlefield', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1, { hp: 3 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, enemy, 5, 1);
    enemy.statusEffects.burn = { damage: 5, duration: 1 };
    engine.applyStatusEffects();
    assert.equal(engine.enemies.length, 0);
    assert.equal(engine.battlefield[1][5], '.');
  });

  test('burn damages a hero on each tick', () => {
    const hero = makeHero({ hp: 20 });
    const { engine } = makeEngine([hero], []);
    hero.statusEffects.burn = { damage: 3, duration: 2 };
    engine.applyStatusEffects();
    assert.equal(hero.hp, 17);
    assert.equal(hero.statusEffects.burn.duration, 1);
  });
});

// ─── applySwarmDamage ────────────────────────────────────────────────────────

describe('applySwarmDamage', () => {
  test('swarm damages all 8-adjacent enemies each tick', () => {
    const hero = makeHero({ swarm: 2 });
    const right = makeEnemy(2, 1, { name: 'Right', hp: 10 });
    const diag = makeEnemy(2, 2, { name: 'Diag', hp: 10 });
    const { engine } = makeEngine([hero], [right, diag]);
    place(engine, hero, 1, 1);
    place(engine, right, 2, 1);
    place(engine, diag, 2, 2);
    engine.applySwarmDamage();
    assert.equal(right.hp, 8);
    assert.equal(diag.hp, 8);
  });

  test('non-adjacent enemies take no swarm damage', () => {
    const hero = makeHero({ swarm: 5 });
    const far = makeEnemy(5, 1, { name: 'Far', hp: 10 });
    const { engine } = makeEngine([hero], [far]);
    place(engine, hero, 1, 1);
    place(engine, far, 5, 1);
    engine.applySwarmDamage();
    assert.equal(far.hp, 10);
  });

  test('swarm kills adjacent enemy and removes from battlefield', () => {
    const hero = makeHero({ swarm: 15 });
    const enemy = makeEnemy(2, 1, { hp: 5 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    engine.applySwarmDamage();
    assert.equal(engine.enemies.length, 0);
    assert.equal(engine.battlefield[1][2], '.');
  });

  test('hero without swarm deals no swarm damage', () => {
    const hero = makeHero(); // no swarm property
    const enemy = makeEnemy(2, 1, { hp: 10 });
    const { engine } = makeEngine([hero], [enemy]);
    place(engine, hero, 1, 1);
    place(engine, enemy, 2, 1);
    engine.applySwarmDamage();
    assert.equal(enemy.hp, 10);
  });
});

// ─── nextTurn ────────────────────────────────────────────────────────────────

describe('nextTurn', () => {
  test('advances currentUnit to the next hero', () => {
    const a = makeHero({ name: 'A', agility: 3 });
    const b = makeHero({ name: 'B', symbol: 'B', agility: 2 });
    const { engine } = makeEngine([a, b], []);
    engine.nextTurn();
    assert.equal(engine.currentUnit, 1);
    assert.equal(engine.movePoints, 2);
  });

  test('skips over persistently dead heroes', () => {
    const a = makeHero({ name: 'A', agility: 3 });
    const dead = makeHero({ name: 'Dead', symbol: 'D', persistentDeath: new PersistentDeath() });
    const c = makeHero({ name: 'C', symbol: 'C', agility: 4 });
    const { engine } = makeEngine([a, dead, c], []);
    engine.nextTurn();
    assert.equal(engine.party[engine.currentUnit].name, 'C');
    assert.equal(engine.movePoints, 4);
  });

  test('triggers enemy turn when all heroes have gone', () => {
    let enemyTurnCalled = false;
    const a = makeHero({ name: 'A', agility: 3 });
    const b = makeHero({ name: 'B', symbol: 'B', agility: 2 });
    const { engine } = makeEngine([a, b], []);
    engine.enemyTurn = () => { enemyTurnCalled = true; };
    engine.currentUnit = 1; // last hero's turn
    engine.nextTurn();
    assert.equal(enemyTurnCalled, true);
  });

  test('triggers game over when all heroes are dead after enemy turn', () => {
    let gameOver = false;
    const hero = makeHero({ name: 'A', agility: 3 });
    const logs = [];
    const engine = new BattleEngine(
      [hero], [], 5, 8, 50,
      (m) => logs.push(m),
      () => {},
      () => { gameOver = true; }
    );
    engine.shortPause = () => Promise.resolve();
    engine.enemyTurn = () => {};
    hero.persistentDeath = new PersistentDeath();
    engine.nextTurn();
    assert.equal(gameOver, true);
  });

  test('awaitingAttackDirection is cleared on nextTurn', () => {
    const a = makeHero({ name: 'A' });
    const b = makeHero({ name: 'B', symbol: 'B' });
    const { engine } = makeEngine([a, b], []);
    engine.awaitingAttackDirection = true;
    engine.nextTurn();
    assert.equal(engine.awaitingAttackDirection, false);
  });
});

// ─── applySlujEffect ─────────────────────────────────────────────────────────

describe('applySlujEffect', () => {
  test('counter increments and damage fires on correct interval', () => {
    const enemy = { name: 'E', hp: 50, statusEffects: { sluj: { level: 3, duration: 4, counter: 0 } } };
    const logs = [];
    // triggerInterval = max(5-3, 1) = 2; damage fires when counter % 2 === 0
    applySlujEffect(enemy, (m) => logs.push(m));
    assert.equal(enemy.statusEffects.sluj.counter, 1); // counter = 1
    assert.equal(enemy.hp, 50); // no fire yet (1 % 2 !== 0)
    applySlujEffect(enemy, (m) => logs.push(m));
    assert.equal(enemy.statusEffects.sluj.counter, 2); // counter = 2
    assert.equal(enemy.hp, 50 - 3 * 2); // fired: damage = level * 2 = 6
  });

  test('sluj effect is removed when duration reaches 0', () => {
    const enemy = { name: 'E', hp: 100, statusEffects: { sluj: { level: 1, duration: 1, counter: 0 } } };
    applySlujEffect(enemy, () => {});
    assert.equal(enemy.statusEffects.sluj, undefined);
  });

  test('does nothing when no sluj status', () => {
    const enemy = { name: 'E', hp: 20, statusEffects: {} };
    applySlujEffect(enemy, () => {});
    assert.equal(enemy.hp, 20);
  });

  test('higher sluj level fires more frequently (lower interval)', () => {
    // level=4 → interval=max(5-4,1)=1, fires every tick
    const enemy = { name: 'E', hp: 100, statusEffects: { sluj: { level: 4, duration: 4, counter: 0 } } };
    applySlujEffect(enemy, () => {});
    assert.equal(enemy.hp, 100 - 4 * 2); // fires on tick 1 (1 % 1 === 0)
  });
});

// ─── BattleEngine constructor ─────────────────────────────────────────────────

describe('BattleEngine constructor', () => {
  test('initializes movePoints from first live hero agility', () => {
    const hero = makeHero({ agility: 5 });
    const { engine } = makeEngine([hero], []);
    assert.equal(engine.movePoints, 5);
  });

  test('skips dead heroes to find first live currentUnit', () => {
    const dead = makeHero({ name: 'Dead', persistentDeath: new PersistentDeath() });
    const alive = makeHero({ name: 'Alive', symbol: 'A', agility: 4 });
    const { engine } = makeEngine([dead, alive], []);
    assert.equal(engine.party[engine.currentUnit].name, 'Alive');
    assert.equal(engine.movePoints, 4);
  });

  test('all heroes persistently dead triggers game over', (_, done) => {
    const dead = makeHero({ persistentDeath: new PersistentDeath() });
    new BattleEngine(
      [dead], [], 5, 8, 50,
      () => {},
      () => {},
      () => done()
    );
  });

  test('initializes statusEffects on heroes and enemies', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1);
    const { engine } = makeEngine([hero], [enemy]);
    assert.ok(typeof hero.statusEffects === 'object');
    assert.ok(typeof enemy.statusEffects === 'object');
  });

  test('rise defaults to 0 if not set on hero', () => {
    const hero = makeHero();
    delete hero.rise;
    const { engine } = makeEngine([hero], []);
    assert.equal(engine.party[0].rise, 0);
  });

  test('dodge defaults to 0 if not set on hero or enemy', () => {
    const hero = makeHero();
    const enemy = makeEnemy(5, 1);
    delete hero.dodge;
    delete enemy.dodge;
    const { engine } = makeEngine([hero], [enemy]);
    assert.equal(engine.party[0].dodge, 0);
    assert.equal(engine.enemies[0].dodge, 0);
  });
});

// ─── Dodge formula ───────────────────────────────────────────────────────────

describe('dodge formula', () => {
  function dodgeChance(dodge) {
    return Math.min(dodge / (100 + dodge), 0.5);
  }

  test('dodge=0 gives 0% chance', () => {
    assert.equal(dodgeChance(0), 0);
  });

  test('dodge=100 gives ~50% (near cap)', () => {
    const chance = dodgeChance(100);
    assert.ok(chance > 0.49 && chance <= 0.5);
  });

  test('dodge=1000 is capped at exactly 50%', () => {
    assert.equal(dodgeChance(1000), 0.5);
  });

  test('dodge chance increases with dodge stat below the cap', () => {
    // Both values must be below the cap point (dodge < 100 where cap doesn't kick in)
    assert.ok(dodgeChance(50) > dodgeChance(10));
    assert.ok(dodgeChance(80) > dodgeChance(50));
  });
});

// ─── Chain damage formula ────────────────────────────────────────────────────

describe('chain damage formula', () => {
  function chainMultiplier(chainStat) {
    return 1 - Math.exp(-chainStat / 10);
  }

  test('higher chain stat yields higher multiplier', () => {
    assert.ok(chainMultiplier(20) > chainMultiplier(10));
    assert.ok(chainMultiplier(10) > chainMultiplier(5));
  });

  test('multiplier is always between 0 and 1 exclusive for practical chain values', () => {
    // Avoid very large values where float precision collapses 1 - ε to exactly 1
    for (const v of [1, 5, 10, 20, 30, 40]) {
      const m = chainMultiplier(v);
      assert.ok(m > 0 && m < 1, `chain=${v} produced multiplier ${m}`);
    }
  });

  test('chain=0 produces 0 multiplier', () => {
    assert.equal(chainMultiplier(0), 0);
  });
});
