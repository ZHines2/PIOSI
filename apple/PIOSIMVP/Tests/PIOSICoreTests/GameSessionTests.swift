import XCTest
@testable import PIOSICore

final class GameSessionTests: XCTestCase {
    func testStarterPartyIsKnightArcherRogue() {
        let session = GameSession(content: .mvp)

        XCTAssertEqual(session.selectedHeroes.map(\.id), ["knight", "archer", "rogue"])
        XCTAssertEqual(session.selectedHeroes.map(\.name), ["Knight", "Archer", "Rogue"])
        XCTAssertEqual(session.selectedHeroes[2].agility, 6)
    }

    func testWizardUnlocksAfterTwoEncountersAndCanJoinSquad() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "knight", name: "Knight", symbol: "K", attack: 4, range: 1, agility: 4, maxHP: 18),
                CombatantBlueprint(id: "archer", name: "Archer", symbol: "A", attack: 3, range: 5, agility: 4, maxHP: 12),
                CombatantBlueprint(id: "rogue", name: "Rogue", symbol: "R", attack: 4, range: 2, agility: 6, maxHP: 12)
            ],
            unlockableHeroes: [
                CombatantBlueprint(id: "wizard", name: "Wizard", symbol: "W", attack: 2, range: 7, agility: 2, maxHP: 10)
            ],
            levels: [
                LevelDefinition(id: 1, title: "First", summary: "First encounter.", rows: 2, columns: 4, wallHP: 1, enemies: []),
                LevelDefinition(id: 2, title: "Second", summary: "Second encounter.", rows: 2, columns: 4, wallHP: 1, enemies: [])
            ]
        )
        var session = GameSession(content: content)
        session.toggleHeroSelection("wizard")
        session.toggleHeroSelection("unknown")
        XCTAssertEqual(session.selectedHeroes.map(\.id), ["knight", "archer", "rogue"])

        session.continuePrimaryAction()
        session.continuePrimaryAction()
        session.moveActiveHero(by: .down)

        XCTAssertEqual(session.screen, .encounterVictory(levelIndex: 0))
        XCTAssertTrue(session.unlockedHeroes.isEmpty)

        session.continuePrimaryAction()
        session.continuePrimaryAction()
        session.moveActiveHero(by: .down)

        XCTAssertEqual(session.screen, .campaignVictory)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])

        session.continuePrimaryAction()
        XCTAssertEqual(session.screen, .title)
        XCTAssertEqual(session.availableHeroes.map(\.id), ["knight", "archer", "rogue", "wizard"])

        session.toggleHeroSelection("knight")
        session.continuePrimaryAction()
        XCTAssertEqual(session.screen, .title)
        session.toggleHeroSelection("knight")
        XCTAssertEqual(session.selectedHeroes.count, 3)

        session.toggleHeroSelection("knight")
        session.toggleHeroSelection("wizard")
        XCTAssertEqual(session.selectedHeroes.count, 3)
        XCTAssertTrue(session.selectedHeroes.contains(where: { $0.id == "wizard" }))
        session.toggleHeroSelection("knight")
        session.toggleHeroSelection("unknown")
        XCTAssertEqual(session.selectedHeroes.count, 3)

        session.continuePrimaryAction()
        session.continuePrimaryAction()
        XCTAssertTrue(session.encounter?.heroes.contains(where: { $0.id == "wizard" }) == true)
    }

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

    func testEnemySpawnIsClampedOffWallRow() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "hero", name: "Hero", symbol: "H", attack: 2, range: 1, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(
                    id: 1,
                    title: "Spawn Clamp",
                    summary: "Enemies should never begin inside the wall row.",
                    rows: 4,
                    columns: 4,
                    wallHP: 20,
                    enemies: [
                        CombatantBlueprint(id: "enemy", name: "Enemy", symbol: "E", attack: 1, range: 1, agility: 1, maxHP: 5, startingPosition: GridPoint(x: 2, y: 3))
                    ]
                )
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        XCTAssertEqual(session.encounter?.enemies.first?.position, GridPoint(x: 2, y: 2))
        XCTAssertEqual(session.encounter?.tile(at: GridPoint(x: 2, y: 2)), .enemy(session.encounter!.enemies.first!))
    }
}
