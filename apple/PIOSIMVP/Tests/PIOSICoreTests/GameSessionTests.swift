import XCTest
@testable import PIOSICore

final class GameSessionTests: XCTestCase {
    func testStarterPartyIsKnightArcherRogue() {
        let session = GameSession(content: .mvp)

        XCTAssertEqual(session.selectedHeroes.map(\.id), ["knight", "archer", "rogue"])
        XCTAssertEqual(session.selectedHeroes.map(\.name), ["Knight", "Archer", "Rogue"])
        XCTAssertEqual(session.selectedHeroes[2].agility, 6)
    }

    func testWizardUnlocksAfterTwoEncounterWins() {
        var session = GameSession(content: wizardUnlockContent())

        winNextEncounter(&session)
        XCTAssertTrue(session.unlockedHeroes.isEmpty)

        winNextEncounter(&session)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
    }

    func testMVPConfiguresWizardUnlockAfterTwoWins() throws {
        let wizardUnlock = try XCTUnwrap(GameContent.mvp.unlockableHeroes.first)

        XCTAssertEqual(wizardUnlock.hero.id, "wizard")
        XCTAssertEqual(wizardUnlock.requiredEncounterWins, 2)
    }

    func testSessionRecreationRestoresUnlockedWizardAndSelectedParty() throws {
        let suiteName = "PIOSIProgressTests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suiteName))
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = UserDefaultsCampaignProgressStore(suiteName: suiteName)
        let content = wizardUnlockContent()

        var firstSession = GameSession(content: content, progressStore: store)
        winNextEncounter(&firstSession)
        winNextEncounter(&firstSession)
        firstSession.continuePrimaryAction()
        firstSession.toggleHeroSelection("knight")
        firstSession.toggleHeroSelection("wizard")

        let restoredSession = GameSession(content: content, progressStore: store)

        XCTAssertEqual(restoredSession.unlockedHeroes.map(\.id), ["wizard"])
        XCTAssertEqual(restoredSession.selectedHeroes.map(\.id), ["archer", "rogue", "wizard"])
        XCTAssertEqual(restoredSession.completedEncounterCount, 2)
        XCTAssertEqual(restoredSession.screen, .title)
        XCTAssertNil(restoredSession.encounter)
    }

    func testRestoredProgressIgnoresUnknownAndDuplicateHeroIDs() {
        let store = FixedCampaignProgressStore(
            progress: CampaignProgress(
                selectedHeroIDs: ["archer", "unknown", "archer", "wizard", "rogue"],
                unlockedHeroIDs: ["unknown", "wizard"],
                completedEncounterCount: 2
            )
        )

        let session = GameSession(content: wizardUnlockContent(), progressStore: store)

        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
        XCTAssertEqual(session.selectedHeroes.map(\.id), ["archer", "wizard", "rogue"])
    }

    func testUnlockableHeroClampsRequiredWinsToMinimumOfOne() {
        let wizard = GameContent.mvp.unlockableHeroes[0].hero

        XCTAssertEqual(
            UnlockableHero(hero: wizard, requiredEncounterWins: 0).requiredEncounterWins,
            1
        )
    }

    func testInvalidBriefingIndicesUseFallbackText() {
        let session = GameSession(content: .mvp)

        XCTAssertEqual(session.titleText(for: .briefing(levelIndex: -1)), "Briefing")
        XCTAssertEqual(
            session.subtitleText(for: .briefing(levelIndex: GameContent.mvp.levels.count)),
            "This briefing is unavailable."
        )
    }

    func testCampaignWithoutLevelsDoesNotStart() {
        var session = GameSession(content: GameContent(starterHeroes: GameContent.mvp.starterHeroes, levels: []))

        session.continuePrimaryAction()
        session.continuePrimaryAction()

        XCTAssertEqual(session.screen, .title)
        XCTAssertNil(session.currentLevelIndex)
        XCTAssertNil(session.encounter)
    }

    func testCampaignWithoutStarterHeroesCannotStart() {
        let level = LevelDefinition(id: 1, title: "Empty", summary: "No party.", rows: 2, columns: 2, wallHP: 1, enemies: [])
        var session = GameSession(content: GameContent(starterHeroes: [], levels: [level]))

        session.continuePrimaryAction()

        XCTAssertEqual(session.partySizeLimit, 0)
        XCTAssertEqual(session.screen, .title)
    }

    func testVictoryRestartPreservesUnlockedHeroesAndSelectedParty() {
        var session = GameSession(content: wizardUnlockContent())
        winNextEncounter(&session)
        winNextEncounter(&session)
        let selectedHeroes = session.selectedHeroes

        session.continuePrimaryAction()

        XCTAssertEqual(session.screen, .title)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
        XCTAssertEqual(session.selectedHeroes, selectedHeroes)
        XCTAssertEqual(session.completedEncounterCount, 2)
    }

    func testDefaultCampaignVictoryRestartPreservesWizardUnlock() {
        var session = GameSession(content: .mvp)
        session.continuePrimaryAction()
        session.continuePrimaryAction()
        clearWallByMovingDown(&session)
        session.continuePrimaryAction()
        session.continuePrimaryAction()
        clearWallByMovingDown(&session)

        XCTAssertEqual(session.screen, .campaignVictory)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
        let selectedHeroes = session.selectedHeroes

        session.continuePrimaryAction()

        XCTAssertEqual(session.screen, .title)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
        XCTAssertEqual(session.selectedHeroes, selectedHeroes)
    }

    func testLockedAndUnknownHeroesCannotBeSelected() {
        var session = GameSession(content: wizardUnlockContent())

        session.toggleHeroSelection("wizard")
        session.toggleHeroSelection("unknown")

        XCTAssertEqual(session.selectedHeroes.map(\.id), ["knight", "archer", "rogue"])
        XCTAssertEqual(session.availableHeroes.map(\.id), ["knight", "archer", "rogue"])
    }

    func testIncompleteSquadCannotStartCampaign() {
        var session = GameSession(content: .mvp)
        session.toggleHeroSelection("knight")

        session.continuePrimaryAction()

        XCTAssertEqual(session.screen, .title)
        XCTAssertNil(session.currentLevelIndex)
    }

    func testHeroSelectionIsIgnoredOutsideTitleScreen() {
        var session = GameSession(content: .mvp)
        session.continuePrimaryAction()
        let selectedHeroes = session.selectedHeroes

        session.toggleHeroSelection("knight")

        XCTAssertEqual(session.selectedHeroes, selectedHeroes)
        XCTAssertEqual(session.screen, .briefing(levelIndex: 0))
    }

    func testUnlockedWizardCanReplaceStarterHero() {
        var session = sessionAfterWizardUnlock()
        session.continuePrimaryAction()

        session.toggleHeroSelection("knight")
        session.toggleHeroSelection("wizard")

        XCTAssertEqual(session.availableHeroes.map(\.id), ["knight", "archer", "rogue", "wizard"])
        XCTAssertEqual(session.selectedHeroes.count, 3)
        XCTAssertTrue(session.selectedHeroes.contains(where: { $0.id == "wizard" }))
        session.toggleHeroSelection("knight")
        XCTAssertEqual(session.selectedHeroes.count, 3)
        XCTAssertFalse(session.selectedHeroes.contains(where: { $0.id == "knight" }))
    }

    func testSelectedWizardAppearsInNextEncounter() {
        var session = sessionAfterWizardUnlock()
        session.continuePrimaryAction()
        session.toggleHeroSelection("knight")
        session.toggleHeroSelection("wizard")
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        XCTAssertTrue(session.encounter?.heroes.contains(where: { $0.id == "wizard" }) == true)
    }

    func testUnlockedWizardPersistsAfterDefeatRestart() {
        let content = wizardUnlockContent(includeDefeatLevel: true)
        var session = GameSession(content: content)
        winNextEncounter(&session)
        winNextEncounter(&session)
        session.continuePrimaryAction()
        session.continuePrimaryAction()
        session.continuePrimaryAction()
        for _ in 0..<3 {
            session.endTurn()
        }

        XCTAssertEqual(session.screen, .defeat(levelIndex: 2))

        session.continuePrimaryAction()

        XCTAssertEqual(session.screen, .title)
        XCTAssertEqual(session.unlockedHeroes.map(\.id), ["wizard"])
        XCTAssertEqual(session.completedEncounterCount, 2)
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

    func testMovementWithoutMovePointsAdvancesTurnAndPersistsState() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "hero", name: "Hero", symbol: "H", attack: 2, range: 1, agility: 0, maxHP: 10)
            ],
            levels: [
                LevelDefinition(id: 1, title: "No Moves", summary: "Turn should advance.", rows: 3, columns: 3, wallHP: 99, enemies: [])
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.moveActiveHero(by: .right)

        XCTAssertEqual(session.encounter?.turnCount, 2)
    }

    func testRangedHeroCanDamageWallFromWithinRange() {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "archer", name: "Archer", symbol: "A", attack: 3, range: 5, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(id: 1, title: "Ranged Wall", summary: "Test ranged wall damage.", rows: 5, columns: 3, wallHP: 10, enemies: [])
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.attack(in: .down)

        XCTAssertEqual(session.encounter?.wallHP, 7)
    }

    func testAttackHoldsFireWhenAllyBlocksPath() throws {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "first", name: "First", symbol: "F", attack: 2, range: 2, agility: 1, maxHP: 10),
                CombatantBlueprint(id: "ally", name: "Ally", symbol: "A", attack: 2, range: 1, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(id: 1, title: "Ally Block", summary: "Ally blocks attack.", rows: 3, columns: 4, wallHP: 99, enemies: [])
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.attack(in: .right)

        let encounter = try XCTUnwrap(session.encounter)
        XCTAssertTrue(encounter.log.contains(where: { $0.contains("holds fire") }))
    }

    func testAttackCanDefeatAnEnemyInRange() throws {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "hero", name: "Hero", symbol: "H", attack: 5, range: 2, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(
                    id: 1,
                    title: "Enemy Target",
                    summary: "Enemy is in attack range.",
                    rows: 3,
                    columns: 4,
                    wallHP: 99,
                    enemies: [
                        CombatantBlueprint(id: "enemy", name: "Enemy", symbol: "E", attack: 1, range: 1, agility: 1, maxHP: 4, startingPosition: GridPoint(x: 1, y: 0))
                    ]
                )
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.attack(in: .right)

        let encounter = try XCTUnwrap(session.encounter)
        XCTAssertTrue(encounter.enemies.isEmpty)
        XCTAssertTrue(encounter.log.contains(where: { $0.contains("Enemy falls.") }))
    }

    func testAttackWithNoTargetLogsMissAndNegativeEnemyAgilityIsSafe() throws {
        let content = GameContent(
            starterHeroes: [
                CombatantBlueprint(id: "hero", name: "Hero", symbol: "H", attack: 2, range: 1, agility: 1, maxHP: 10)
            ],
            levels: [
                LevelDefinition(
                    id: 1,
                    title: "No Target",
                    summary: "No target in attack direction.",
                    rows: 3,
                    columns: 4,
                    wallHP: 99,
                    enemies: [
                        CombatantBlueprint(id: "enemy", name: "Enemy", symbol: "E", attack: 1, range: 1, agility: -1, maxHP: 5, startingPosition: GridPoint(x: 2, y: 0))
                    ]
                )
            ]
        )
        var session = GameSession(content: content)
        session.continuePrimaryAction()
        session.continuePrimaryAction()

        session.attack(in: .left)

        let encounter = try XCTUnwrap(session.encounter)
        XCTAssertTrue(encounter.log.contains(where: { $0.contains("attacks, but nothing is in range") }))
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

    func testEnemySpawnIsClampedOffWallRow() throws {
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

        let encounter = try XCTUnwrap(session.encounter)
        let enemy = try XCTUnwrap(encounter.enemies.first)
        XCTAssertEqual(enemy.position, GridPoint(x: 2, y: 2))
        XCTAssertEqual(encounter.tile(at: GridPoint(x: 2, y: 2)), .enemy(enemy))
    }

    private func sessionAfterWizardUnlock() -> GameSession {
        var session = GameSession(content: wizardUnlockContent())
        winNextEncounter(&session)
        winNextEncounter(&session)
        return session
    }

    private func winNextEncounter(_ session: inout GameSession) {
        session.continuePrimaryAction()
        session.continuePrimaryAction()
        session.moveActiveHero(by: .down)
    }

    private func clearWallByMovingDown(_ session: inout GameSession) {
        var actions = 0
        while session.screen == .battle && actions < 200 {
            session.moveActiveHero(by: .down)
            actions += 1
        }
    }

    private func wizardUnlockContent(includeDefeatLevel: Bool = false) -> GameContent {
        let starterHeroes = [
            CombatantBlueprint(id: "knight", name: "Knight", symbol: "K", attack: 4, range: 1, agility: 4, maxHP: 18),
            CombatantBlueprint(id: "archer", name: "Archer", symbol: "A", attack: 3, range: 5, agility: 4, maxHP: 12),
            CombatantBlueprint(id: "rogue", name: "Rogue", symbol: "R", attack: 4, range: 2, agility: 6, maxHP: 12)
        ]
        let wizard = CombatantBlueprint(id: "wizard", name: "Wizard", symbol: "W", attack: 2, range: 7, agility: 2, maxHP: 10)
        var levels = [
            LevelDefinition(id: 1, title: "First", summary: "First encounter.", rows: 2, columns: 4, wallHP: 1, enemies: []),
            LevelDefinition(id: 2, title: "Second", summary: "Second encounter.", rows: 2, columns: 4, wallHP: 1, enemies: [])
        ]
        if includeDefeatLevel {
            let enemies = (0..<3).map { index in
                CombatantBlueprint(
                    id: "enemy-\(index)",
                    name: "Enemy",
                    symbol: "E",
                    attack: 100,
                    range: 1,
                    agility: 1,
                    maxHP: 10,
                    startingPosition: GridPoint(x: index, y: 1)
                )
            }
            levels.append(
                LevelDefinition(id: 3, title: "Third", summary: "Defeat test.", rows: 4, columns: 4, wallHP: 99, enemies: enemies)
            )
        }
        return GameContent(
            starterHeroes: starterHeroes,
            unlockableHeroes: [UnlockableHero(hero: wizard, requiredEncounterWins: 2)],
            levels: levels
        )
    }
}

private struct FixedCampaignProgressStore: CampaignProgressStore {
    let progress: CampaignProgress

    func load() -> CampaignProgress? { progress }
    func save(_ progress: CampaignProgress) {}
}
