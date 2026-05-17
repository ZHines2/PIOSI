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

## What to test and why

**Test the contract, not the implementation.** A test that breaks because you renamed an internal variable is a maintenance burden. A test that breaks because the knockback formula changed is a valuable signal. Write tests against the behavior the rest of the game depends on, not against how the code happens to be structured today. *(Yu Suzuki)*

**Determinism is a prerequisite, not a nice-to-have.** Tests that pass most of the time are worse than no tests — they create false confidence and unpredictable failures. Stub `Math.random()` calls, clear vittle/mushroom placements after construction, and stub `shortPause` to `() => Promise.resolve()`. A test that relies on luck isn't a test. *(Yu Suzuki)*

**Feel is not directly testable, but its preconditions are.** You cannot write a test for "does this feel satisfying?" but you can test that `moveUnit` consumes exactly the right number of move points, that `attackInDirection` propagates the ray the correct number of cells, and that `applyKnockback` deposits the enemy at the right coordinates after a wall collision. If those preconditions are correct, the feel emerges from the engine operating as designed. *(Jordan Mechner)*

**Test the edges where systems meet.** The most valuable tests are the ones that cover interactions between two systems: burn applied *and* the enemy surviving into the next turn, chain damage with exactly one adjacent target vs. three, a Rise resurrection triggered by an enemy attack that also applies Slüj. System interactions are where bugs hide. *(Peter Molyneux)*

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
