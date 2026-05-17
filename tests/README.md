# tests/

Regression test suite using Node's built-in test runner. No install required — Node 18+ only.

## Running tests

```bash
# Run all tests
npm test

# Run a single file
node --test tests/battle.test.js

# Run tests matching a name pattern
node --test --test-name-pattern "moveUnit" tests/battle.test.js
```

## Coverage (97 tests, 18 suites)

`battle.test.js` covers all combat and movement mechanics in `battleEngine.js` and `applyKnockback.js`:

- `isWithinBounds`, `isCellPassable`, `getLiveHeroes`, `findClosestHero`
- `moveUnit` — movement, wall collision, vittle/mushroom pickups, move-point consumption
- `attackInDirection` — ray casting, range, wall damage, burn/slüj/trick/psych/bomba/heal
- `applyChainDamage`, `applyKnockback`
- `handleHeroDeath` — rise resurrection, persistent death, ankh on-death boost
- `enemyAttackAdjacent` — armor, rage
- `moveEnemy` — pathfinding, path correction
- `applyStatusEffects` (burn), `applySwarmDamage`, `applySlujEffect`
- `nextTurn` — turn rotation, dead-hero skip, enemy turn trigger, game over
- `BattleEngine` constructor
- Dodge formula, chain damage formula

## Writing new tests

`BattleEngine` is DOM-free and fully testable in Node. Key stubs:

```js
engine.shortPause = () => Promise.resolve();          // skip 300ms delays
engine.nextTurn = () => {};                           // prevent post-attack turn tick
// clear random vittle/mushroom placements after construction:
for (let y = 0; y < rows; y++)
  for (let x = 0; x < cols; x++)
    if (['ౚ','ඉ'].includes(engine.battlefield[y][x]))
      engine.battlefield[y][x] = '.';
```
