import XCTest
@testable import PIOSICore

final class GameSessionTests: XCTestCase {
    func testTitleAdvancesToFirstBriefingAndBattle() {
        var session = GameSession(content: .mvp)

        session.continuePrimaryAction()
        XCTAssertEqual(session.screen, .briefing(levelIndex: 0))

        session.continuePrimaryAction()
        XCTAssertEqual(session.screen, .battle)
        XCTAssertEqual(session.encounter?.level.id, 1)
        XCTAssertEqual(session.encounter?.heroes.count, 3)
        XCTAssertEqual(session.encounter?.wallHP, 20)
    }

    func testWallCollapseProgressesToEncounterVictory() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "breaker", name: "Breaker", symbol: "B", attack: 2, range: 1, agility: 3, maxHP: 10)
            ],
            levels: [
                LevelDefinition(id: 1, title: "Test Wall", summary: "Break the wall.", rows: 3, columns: 3, wallHP: 4, enemies: [])
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.moveActiveHero(by: .down)
        session.moveActiveHero(by: .down)
        XCTAssertEqual(session.encounter?.wallHP, 2)
        XCTAssertEqual(session.screen, .battle)

        session.attack(in: .down)
        XCTAssertEqual(session.screen, .campaignVictory)
    }

    func testEnemyPhaseMovesTowardHeroAndDealsDamage() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "hero", name: "Hero", symbol: "H", attack: 2, range: 1, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(
                    id: 1,
                    title: "Enemy Test",
                    summary: "Enemy should move then attack.",
                    rows: 4,
                    columns: 4,
                    wallHP: 99,
                    enemies: [
                        CombatantBlueprint(id: "enemy", name: "Enemy", symbol: "E", attack: 3, range: 1, agility: 1, maxHP: 5, startingPosition: GridPoint(x: 2, y: 0))
                    ]
                )
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.endTurn()

        XCTAssertEqual(session.encounter?.enemies.first?.position, GridPoint(x: 1, y: 0))
        XCTAssertEqual(session.encounter?.heroes.first?.hp, 7)
    }

    func testEnemyTargetingBreaksDistanceTiesDeterministically() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "left-hero", name: "Left", symbol: "L", attack: 2, range: 1, agility: 1, maxHP: 10),
                CombatantBlueprint(id: "right-hero", name: "Right", symbol: "R", attack: 2, range: 1, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(
                    id: 1,
                    title: "Tie Test",
                    summary: "Enemy should favor the upper-left hero when distance ties.",
                    rows: 4,
                    columns: 3,
                    wallHP: 99,
                    enemies: [
                        CombatantBlueprint(id: "enemy", name: "Enemy", symbol: "E", attack: 1, range: 1, agility: 1, maxHP: 5, startingPosition: GridPoint(x: 1, y: 1))
                    ]
                )
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.endTurn()
        session.moveActiveHero(by: .right)

        XCTAssertEqual(session.encounter?.enemies.first?.position, GridPoint(x: 0, y: 1))
        XCTAssertEqual(session.encounter?.heroes.first?.hp, 9)
    }
}
