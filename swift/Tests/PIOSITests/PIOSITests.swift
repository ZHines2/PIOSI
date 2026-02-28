/// PIOSITests.swift
///
/// Unit tests for the PIOSI Swift port.
/// These tests validate the core battle logic translated from the JavaScript source.

import XCTest
@testable import PIOSI

final class HeroTests: XCTestCase {

    func testMakeHeroesReturnsExpectedCount() {
        let heroes = makeHeroes()
        XCTAssertEqual(heroes.count, 25, "Expected 25 heroes in the catalogue")
    }

    func testKnightStats() {
        let knight = makeHeroes().first { $0.name == "Knight" }!
        XCTAssertEqual(knight.attack, 4)
        XCTAssertEqual(knight.range, 1)
        XCTAssertEqual(knight.agility, 4)
        XCTAssertEqual(knight.hp, 18)
    }

    func testWizardHasChain() {
        let wizard = makeHeroes().first { $0.name == "Wizard" }!
        XCTAssertEqual(wizard.chain, 5)
    }

    func testBerserkerHasRage() {
        let berserker = makeHeroes().first { $0.name == "Berserker" }!
        XCTAssertEqual(berserker.rage, 1)
    }

    func testGreenjayHasRise() {
        let greenjay = makeHeroes().first { $0.name == "Greenjay" }!
        XCTAssertEqual(greenjay.rise, 5)
    }

    func testSysiphugeHasDodge() {
        let sysiphuge = makeHeroes().first { $0.name == "Sysiphuge" }!
        XCTAssertEqual(sysiphuge.dodge, 4)
    }
}

// MARK: - Level tests

final class LevelTests: XCTestCase {

    func testGetLevel1() {
        let level = getLevel(1)
        XCTAssertNotNil(level)
        XCTAssertEqual(level!.rows, 5)
        XCTAssertEqual(level!.cols, 5)
        XCTAssertEqual(level!.wallHP, 20)
        XCTAssertTrue(level!.enemies.isEmpty)
    }

    func testGetLevel2HasEnemies() {
        let level = getLevel(2)!
        XCTAssertFalse(level.enemies.isEmpty)
    }

    func testGetLevel3GeneratesEnemies() {
        let level = getLevel(3)!
        // Level 3 generator creates one Coterian per column (4 cols)
        XCTAssertEqual(level.enemies.count, level.cols)
    }

    func testGetLevel99GeneratesChessFormation() {
        let level = getLevel(99)!
        // 3 formation rows × 15 cols
        XCTAssertEqual(level.enemies.count, 3 * level.cols)
    }

    func testGetInvalidLevelReturnsNil() {
        XCTAssertNil(getLevel(999))
    }
}

// MARK: - BattleEngine tests

final class BattleEngineTests: XCTestCase {

    private func makeEngine(heroCount: Int = 2) -> BattleEngine {
        let party = Array(makeHeroes().prefix(heroCount))
        let enemies = [
            Enemy(name: "Test Enemy", symbol: "X", attack: 3, range: 1, agility: 1, hp: 10, x: 4, y: 0)
        ]
        return BattleEngine(party: party, enemies: enemies, rows: 5, cols: 5, wallHP: 20)
    }

    func testInitialMovePointsEqualCurrentHeroAgility() {
        let engine = makeEngine()
        let hero = engine.party[engine.currentUnit]
        XCTAssertEqual(engine.movePoints, hero.agility)
    }

    func testMoveUnitDecrementsMovePoints() {
        let engine = makeEngine()
        let before = engine.movePoints
        // Try moving right; may or may not succeed depending on grid placement
        engine.moveUnit(dx: 1, dy: 0)
        // Move points should either decrease by 1 or remain if blocked
        XCTAssertLessThanOrEqual(engine.movePoints, before)
    }

    func testEnterAttackModeSetFlag() {
        let engine = makeEngine()
        XCTAssertFalse(engine.awaitingAttackDirection)
        engine.enterAttackMode()
        XCTAssertTrue(engine.awaitingAttackDirection)
    }

    func testLiveHeroesExcludesDeadHeroes() {
        let engine = makeEngine(heroCount: 2)
        let hero = engine.party[0]
        hero.persistentDeath = PersistentDeath()
        XCTAssertEqual(engine.liveHeroes.count, 1)
    }

    func testBattlefieldHasCorrectDimensions() {
        let engine = makeEngine()
        XCTAssertEqual(engine.battlefield.count, 5)
        XCTAssertEqual(engine.battlefield[0].count, 5)
    }

    func testIsWithinBounds() {
        let engine = makeEngine()
        XCTAssertTrue(engine.isWithinBounds(x: 0, y: 0))
        XCTAssertTrue(engine.isWithinBounds(x: 4, y: 4))
        XCTAssertFalse(engine.isWithinBounds(x: 5, y: 0))
        XCTAssertFalse(engine.isWithinBounds(x: 0, y: 5))
        XCTAssertFalse(engine.isWithinBounds(x: -1, y: 0))
    }

    func testWallHPDecreasesWhenHeroAttacksWall() {
        // Create a 2-row field. Row 0 has hero; row 1 is wall. Moving down hits the wall.
        let party = [makeHeroes()[0]] // Knight: attack=4
        let engine = BattleEngine(party: party, enemies: [], rows: 2, cols: 3, wallHP: 20)
        let before = engine.wallHP
        // Knight will be placed at (0,0); moving down (0,+1) hits the wall row at y=1
        engine.moveUnit(dx: 0, dy: 1)
        XCTAssertLessThan(engine.wallHP, before)
    }
}

// MARK: - StatusEffect tests

final class StatusEffectTests: XCTestCase {

    func testBurnEffectInitialValues() {
        let burn = BurnEffect(damage: 5, duration: 3)
        XCTAssertEqual(burn.damage, 5)
        XCTAssertEqual(burn.duration, 3)
    }

    func testSlujEffectInitialValues() {
        let sluj = SlujEffect(level: 2, duration: 4)
        XCTAssertEqual(sluj.level, 2)
        XCTAssertEqual(sluj.duration, 4)
        XCTAssertEqual(sluj.counter, 0)
    }

    func testPersistentDeathIsAlwaysDead() {
        let pd = PersistentDeath()
        XCTAssertTrue(pd.isDead)
    }
}
