import XCTest
@testable import PIOSITests

fileprivate extension BattleEngineTests {
    @available(*, deprecated, message: "Not actually deprecated. Marked as deprecated to allow inclusion of deprecated tests (which test deprecated functionality) without warnings")
    static nonisolated(unsafe) let __allTests__BattleEngineTests = [
        ("testBattlefieldHasCorrectDimensions", testBattlefieldHasCorrectDimensions),
        ("testEnterAttackModeSetFlag", testEnterAttackModeSetFlag),
        ("testInitialMovePointsEqualCurrentHeroAgility", testInitialMovePointsEqualCurrentHeroAgility),
        ("testIsWithinBounds", testIsWithinBounds),
        ("testLiveHeroesExcludesDeadHeroes", testLiveHeroesExcludesDeadHeroes),
        ("testMoveUnitDecrementsMovePoints", testMoveUnitDecrementsMovePoints),
        ("testWallHPDecreasesWhenHeroAttacksWall", testWallHPDecreasesWhenHeroAttacksWall)
    ]
}

fileprivate extension HeroTests {
    @available(*, deprecated, message: "Not actually deprecated. Marked as deprecated to allow inclusion of deprecated tests (which test deprecated functionality) without warnings")
    static nonisolated(unsafe) let __allTests__HeroTests = [
        ("testBerserkerHasRage", testBerserkerHasRage),
        ("testGreenjayHasRise", testGreenjayHasRise),
        ("testKnightStats", testKnightStats),
        ("testMakeHeroesReturnsExpectedCount", testMakeHeroesReturnsExpectedCount),
        ("testSysiphugeHasDodge", testSysiphugeHasDodge),
        ("testWizardHasChain", testWizardHasChain)
    ]
}

fileprivate extension LevelTests {
    @available(*, deprecated, message: "Not actually deprecated. Marked as deprecated to allow inclusion of deprecated tests (which test deprecated functionality) without warnings")
    static nonisolated(unsafe) let __allTests__LevelTests = [
        ("testGetInvalidLevelReturnsNil", testGetInvalidLevelReturnsNil),
        ("testGetLevel1", testGetLevel1),
        ("testGetLevel2HasEnemies", testGetLevel2HasEnemies),
        ("testGetLevel3GeneratesEnemies", testGetLevel3GeneratesEnemies),
        ("testGetLevel99GeneratesChessFormation", testGetLevel99GeneratesChessFormation)
    ]
}

fileprivate extension StatusEffectTests {
    @available(*, deprecated, message: "Not actually deprecated. Marked as deprecated to allow inclusion of deprecated tests (which test deprecated functionality) without warnings")
    static nonisolated(unsafe) let __allTests__StatusEffectTests = [
        ("testBurnEffectInitialValues", testBurnEffectInitialValues),
        ("testPersistentDeathIsAlwaysDead", testPersistentDeathIsAlwaysDead),
        ("testSlujEffectInitialValues", testSlujEffectInitialValues)
    ]
}
@available(*, deprecated, message: "Not actually deprecated. Marked as deprecated to allow inclusion of deprecated tests (which test deprecated functionality) without warnings")
func __PIOSITests__allTests() -> [XCTestCaseEntry] {
    return [
        testCase(BattleEngineTests.__allTests__BattleEngineTests),
        testCase(HeroTests.__allTests__HeroTests),
        testCase(LevelTests.__allTests__LevelTests),
        testCase(StatusEffectTests.__allTests__StatusEffectTests)
    ]
}