import Foundation

public enum SessionScreen: Equatable, Sendable {
    case title
    case briefing(levelIndex: Int)
    case battle
    case encounterVictory(levelIndex: Int)
    case campaignVictory
    case defeat(levelIndex: Int)
}

public enum BoardTile: Equatable, Sendable {
    case empty
    case wall
    case hero(Combatant, isActive: Bool)
    case enemy(Combatant)
}

public struct EncounterState: Equatable, Sendable {
    public let level: LevelDefinition
    public var heroes: [Combatant]
    public var enemies: [Combatant]
    public var activeHeroIndex: Int
    public var remainingMovePoints: Int
    public var wallHP: Int
    public var turnCount: Int
    public var log: [String]

    public init(
        level: LevelDefinition,
        heroes: [Combatant],
        enemies: [Combatant],
        activeHeroIndex: Int,
        remainingMovePoints: Int,
        wallHP: Int,
        turnCount: Int,
        log: [String]
    ) {
        self.level = level
        self.heroes = heroes
        self.enemies = enemies
        self.activeHeroIndex = activeHeroIndex
        self.remainingMovePoints = remainingMovePoints
        self.wallHP = wallHP
        self.turnCount = turnCount
        self.log = log
    }

    public var activeHero: Combatant? {
        guard heroes.indices.contains(activeHeroIndex) else { return nil }
        return heroes[activeHeroIndex]
    }

    public var liveHeroes: [Combatant] {
        heroes.filter(\.isAlive)
    }

    public func tile(at point: GridPoint) -> BoardTile {
        if point.y == level.rows - 1 {
            return .wall
        }
        if let hero = heroes.first(where: { $0.isAlive && $0.position == point }) {
            return .hero(hero, isActive: hero.id == activeHero?.id)
        }
        if let enemy = enemies.first(where: { $0.isAlive && $0.position == point }) {
            return .enemy(enemy)
        }
        return .empty
    }
}

public struct GameSession: Equatable, Sendable {
    public let content: GameContent
    public private(set) var selectedHeroes: [CombatantBlueprint]
    public private(set) var partyRoster: [Combatant]
    public private(set) var currentLevelIndex: Int?
    public private(set) var screen: SessionScreen
    public private(set) var encounter: EncounterState?

    public init(content: GameContent = .mvp) {
        self.content = content
        self.selectedHeroes = Array(content.starterHeroes.prefix(3))
        self.partyRoster = []
        self.currentLevelIndex = nil
        self.screen = .title
        self.encounter = nil
    }

    public mutating func continuePrimaryAction() {
        switch screen {
        case .title:
            startAdventure()
        case .briefing:
            beginEncounter()
        case .encounterVictory:
            advanceToNextBeat()
        case .campaignVictory, .defeat:
            self = GameSession(content: content)
        case .battle:
            break
        }
    }

    public mutating func moveActiveHero(by delta: GridPoint) {
        guard screen == .battle, var encounter else { return }
        guard let activeHero = encounter.activeHero, activeHero.isAlive else {
            finishDefeat(levelIndex: currentLevelIndex ?? 0, encounter: encounter)
            return
        }
        guard encounter.remainingMovePoints > 0 else {
            endTurn()
            return
        }

        let destination = activeHero.position.translated(by: delta)
        guard isInsideBoard(destination, level: encounter.level) else {
            appendLog("The battlefield ends there.", to: &encounter)
            self.encounter = encounter
            return
        }

        if isWall(destination, level: encounter.level) {
            damageWall(with: activeHero.attack, heroName: activeHero.name, encounter: &encounter)
            consumeMovePointAndAdvance(encounter: &encounter)
            return
        }

        guard isPassable(destination, encounter: encounter) else {
            appendLog("\(activeHero.name) cannot move into an occupied tile.", to: &encounter)
            self.encounter = encounter
            return
        }

        encounter.heroes[encounter.activeHeroIndex].position = destination
        encounter.remainingMovePoints -= 1
        appendLog("\(activeHero.name) advances to (\(destination.x), \(destination.y)).", to: &encounter)
        if encounter.remainingMovePoints == 0 {
            advanceTurn(encounter: &encounter)
        } else {
            self.encounter = encounter
        }
    }

    public mutating func attack(in delta: GridPoint) {
        guard screen == .battle, var encounter else { return }
        guard let activeHero = encounter.activeHero, activeHero.isAlive else { return }

        for step in 1...max(1, activeHero.range) {
            let target = activeHero.position.translated(by: delta.scaled(by: step))
            guard isInsideBoard(target, level: encounter.level) else { break }

            if let ally = encounter.heroes.first(where: { $0.isAlive && $0.id != activeHero.id && $0.position == target }) {
                appendLog("\(activeHero.name) holds fire rather than hit \(ally.name).", to: &encounter)
                advanceTurn(encounter: &encounter)
                return
            }

            if let enemyIndex = encounter.enemies.firstIndex(where: { $0.isAlive && $0.position == target }) {
                encounter.enemies[enemyIndex].hp -= activeHero.attack
                let remainingHP = max(0, encounter.enemies[enemyIndex].hp)
                appendLog("\(activeHero.name) strikes \(encounter.enemies[enemyIndex].name) for \(activeHero.attack). (HP: \(remainingHP))", to: &encounter)
                if encounter.enemies[enemyIndex].hp <= 0 {
                    appendLog("\(encounter.enemies[enemyIndex].name) falls.", to: &encounter)
                    encounter.enemies.remove(at: enemyIndex)
                }
                advanceTurn(encounter: &encounter)
                return
            }

            if isWall(target, level: encounter.level) {
                damageWall(with: activeHero.attack, heroName: activeHero.name, encounter: &encounter)
                if encounter.wallHP > 0 {
                    advanceTurn(encounter: &encounter)
                }
                return
            }
        }

        appendLog("\(activeHero.name) attacks, but nothing is in range.", to: &encounter)
        advanceTurn(encounter: &encounter)
    }

    public mutating func endTurn() {
        guard screen == .battle, var encounter else { return }
        advanceTurn(encounter: &encounter)
    }

    public func titleText(for screen: SessionScreen? = nil) -> String {
        let currentScreen = screen ?? self.screen
        switch currentScreen {
        case .title:
            return "PIOSI MVP"
        case .briefing(let levelIndex):
            return content.levels[levelIndex].title
        case .battle:
            return encounter?.level.title ?? "Battle"
        case .encounterVictory:
            return "Path Cleared"
        case .campaignVictory:
            return "The Wall Yields"
        case .defeat:
            return "Squad Broken"
        }
    }

    public func subtitleText(for screen: SessionScreen? = nil) -> String {
        let currentScreen = screen ?? self.screen
        switch currentScreen {
        case .title:
            return "A phone-first Swift pass through the core battle loop."
        case .briefing(let levelIndex):
            return content.levels[levelIndex].summary
        case .battle:
            guard let encounter else { return "" }
            let heroName = encounter.activeHero?.name ?? "No active hero"
            return "Turn \(encounter.turnCount) • \(heroName) • Move \(encounter.remainingMovePoints) • Wall HP \(encounter.wallHP)"
        case .encounterVictory(let levelIndex):
            if levelIndex + 1 < content.levels.count {
                return "The lite path keeps going — the next wall still stands."
            }
            return "This first-pass campaign slice is complete."
        case .campaignVictory:
            return "Two original levels, one mobile-friendly loop, and a clean base for phase 2."
        case .defeat:
            return "All living heroes were dropped before the wall could fall."
        }
    }

    private mutating func startAdventure() {
        selectedHeroes = Array(content.starterHeroes.prefix(3))
        partyRoster = stableHeroSort(
            selectedHeroes.enumerated().map { index, blueprint in
                Combatant(
                    blueprint: blueprint,
                    team: .hero,
                    position: GridPoint(x: index, y: 0)
                )
            }
        )
        currentLevelIndex = 0
        encounter = nil
        screen = .briefing(levelIndex: 0)
    }

    private mutating func beginEncounter() {
        guard let currentLevelIndex else { return }
        let level = content.levels[currentLevelIndex]
        let seededHeroes = seedHeroesForEncounter(level: level)
        let seededEnemies = level.enemies.map { enemy in
            Combatant(
                blueprint: enemy,
                team: .enemy,
                position: enemy.startingPosition ?? GridPoint(x: level.columns - 2, y: max(0, level.rows / 2 - 1))
            )
        }
        let firstActiveIndex = seededHeroes.firstIndex(where: \.isAlive) ?? 0
        let firstMoves = seededHeroes.indices.contains(firstActiveIndex) ? seededHeroes[firstActiveIndex].agility : 0
        encounter = EncounterState(
            level: level,
            heroes: seededHeroes,
            enemies: seededEnemies,
            activeHeroIndex: firstActiveIndex,
            remainingMovePoints: firstMoves,
            wallHP: level.wallHP,
            turnCount: 1,
            log: [
                level.title,
                level.summary,
                "The squad steps onto the field."
            ]
        )
        screen = .battle
    }

    private func seedHeroesForEncounter(level: LevelDefinition) -> [Combatant] {
        let sortedRoster = stableHeroSort(partyRoster)
        let width = max(1, min(level.columns, 3))
        return sortedRoster.enumerated().map { index, hero in
            var seededHero = hero
            seededHero.position = GridPoint(x: index % width, y: index / width)
            return seededHero
        }
    }

    private func stableHeroSort(_ heroes: [Combatant]) -> [Combatant] {
        heroes.enumerated()
            .sorted { lhs, rhs in
                if lhs.element.agility == rhs.element.agility {
                    return lhs.offset < rhs.offset
                }
                return lhs.element.agility > rhs.element.agility
            }
            .map(\.element)
    }

    private func isInsideBoard(_ point: GridPoint, level: LevelDefinition) -> Bool {
        point.x >= 0 && point.x < level.columns && point.y >= 0 && point.y < level.rows
    }

    private func isWall(_ point: GridPoint, level: LevelDefinition) -> Bool {
        point.y == level.rows - 1
    }

    private func isPassable(_ point: GridPoint, encounter: EncounterState) -> Bool {
        !isWall(point, level: encounter.level)
            && !encounter.heroes.contains(where: { $0.isAlive && $0.position == point })
            && !encounter.enemies.contains(where: { $0.isAlive && $0.position == point })
    }

    private mutating func damageWall(with amount: Int, heroName: String, encounter: inout EncounterState) {
        encounter.wallHP -= amount
        appendLog("\(heroName) hits the wall for \(amount). (Wall HP: \(max(0, encounter.wallHP)))", to: &encounter)
        if encounter.wallHP <= 0 {
            finishVictory(encounter: &encounter)
        }
    }

    private mutating func consumeMovePointAndAdvance(encounter: inout EncounterState) {
        encounter.remainingMovePoints -= 1
        if encounter.wallHP <= 0 {
            return
        }
        if encounter.remainingMovePoints == 0 {
            advanceTurn(encounter: &encounter)
        } else {
            self.encounter = encounter
        }
    }

    private mutating func advanceTurn(encounter: inout EncounterState) {
        if encounter.liveHeroes.isEmpty {
            finishDefeat(levelIndex: currentLevelIndex ?? 0, encounter: encounter)
            return
        }

        var nextIndex = encounter.activeHeroIndex + 1
        while true {
            if nextIndex >= encounter.heroes.count {
                encounter.turnCount += 1
                runEnemyPhase(encounter: &encounter)
                if encounter.liveHeroes.isEmpty {
                    finishDefeat(levelIndex: currentLevelIndex ?? 0, encounter: encounter)
                    return
                }
                nextIndex = 0
            }

            if encounter.heroes.indices.contains(nextIndex), encounter.heroes[nextIndex].isAlive {
                encounter.activeHeroIndex = nextIndex
                encounter.remainingMovePoints = encounter.heroes[nextIndex].agility
                appendLog("Now it is \(encounter.heroes[nextIndex].name)'s turn.", to: &encounter)
                self.encounter = encounter
                return
            }
            nextIndex += 1
        }
    }

    private func runEnemyPhase(encounter: inout EncounterState) {
        appendLog("Enemy turn begins.", to: &encounter)
        for enemyIndex in encounter.enemies.indices {
            guard encounter.enemies[enemyIndex].isAlive else { continue }
            for _ in 0..<encounter.enemies[enemyIndex].agility {
                moveEnemy(enemyIndex: enemyIndex, encounter: &encounter)
            }
            enemyAttackIfPossible(enemyIndex: enemyIndex, encounter: &encounter)
        }
        appendLog("Enemy turn completed.", to: &encounter)
    }

    private func moveEnemy(enemyIndex: Int, encounter: inout EncounterState) {
        guard encounter.enemies.indices.contains(enemyIndex), encounter.enemies[enemyIndex].isAlive else { return }
        guard let targetHero = nearestHero(to: encounter.enemies[enemyIndex], in: encounter) else { return }

        let enemy = encounter.enemies[enemyIndex]
        let dx = targetHero.position.x - enemy.position.x
        let dy = targetHero.position.y - enemy.position.y
        var step = abs(dx) >= abs(dy)
            ? GridPoint(x: dx == 0 ? 0 : (dx > 0 ? 1 : -1), y: 0)
            : GridPoint(x: 0, y: dy == 0 ? 0 : (dy > 0 ? 1 : -1))

        let primaryDestination = enemy.position.translated(by: step)
        if !isPassable(primaryDestination, encounter: encounter) {
            let alternateX = GridPoint(x: dx == 0 ? 0 : (dx > 0 ? 1 : -1), y: 0)
            let alternateY = GridPoint(x: 0, y: dy == 0 ? 0 : (dy > 0 ? 1 : -1))
            if step.x != 0 {
                step = alternateY
            } else {
                step = alternateX
            }
        }

        let destination = enemy.position.translated(by: step)
        guard isPassable(destination, encounter: encounter) else { return }
        encounter.enemies[enemyIndex].position = destination
    }

    private func nearestHero(to enemy: Combatant, in encounter: EncounterState) -> Combatant? {
        encounter.liveHeroes.min { lhs, rhs in
            let lhsDistance = lhs.position.manhattanDistance(to: enemy.position)
            let rhsDistance = rhs.position.manhattanDistance(to: enemy.position)
            if lhsDistance != rhsDistance {
                return lhsDistance < rhsDistance
            }
            if lhs.position.y != rhs.position.y {
                return lhs.position.y < rhs.position.y
            }
            if lhs.position.x != rhs.position.x {
                return lhs.position.x < rhs.position.x
            }
            return lhs.id < rhs.id
        }
    }

    private func enemyAttackIfPossible(enemyIndex: Int, encounter: inout EncounterState) {
        guard encounter.enemies.indices.contains(enemyIndex), encounter.enemies[enemyIndex].isAlive else { return }
        let enemy = encounter.enemies[enemyIndex]
        for delta in GridPoint.orthogonal {
            let targetPoint = enemy.position.translated(by: delta)
            guard let heroIndex = encounter.heroes.firstIndex(where: { $0.isAlive && $0.position == targetPoint }) else {
                continue
            }
            encounter.heroes[heroIndex].hp -= enemy.attack
            appendLog("\(enemy.name) hits \(encounter.heroes[heroIndex].name) for \(enemy.attack). (HP: \(max(0, encounter.heroes[heroIndex].hp)))", to: &encounter)
            if encounter.heroes[heroIndex].hp <= 0 {
                appendLog("\(encounter.heroes[heroIndex].name) falls.", to: &encounter)
            }
            break
        }
    }

    private mutating func finishVictory(encounter: inout EncounterState) {
        appendLog("The wall collapses.", to: &encounter)
        partyRoster = stableHeroSort(encounter.heroes.filter(\.isAlive))
        let completedLevelIndex = currentLevelIndex ?? 0
        self.encounter = encounter
        if completedLevelIndex + 1 < content.levels.count {
            screen = .encounterVictory(levelIndex: completedLevelIndex)
        } else {
            screen = .campaignVictory
        }
    }

    private mutating func advanceToNextBeat() {
        guard let currentLevelIndex else { return }
        let nextLevelIndex = currentLevelIndex + 1
        guard nextLevelIndex < content.levels.count else {
            screen = .campaignVictory
            return
        }
        self.currentLevelIndex = nextLevelIndex
        self.encounter = nil
        screen = .briefing(levelIndex: nextLevelIndex)
    }

    private mutating func finishDefeat(levelIndex: Int, encounter: EncounterState? = nil) {
        if let encounter {
            self.encounter = encounter
        }
        screen = .defeat(levelIndex: levelIndex)
    }

    private func appendLog(_ line: String, to encounter: inout EncounterState) {
        encounter.log.append(line)
        if encounter.log.count > 18 {
            encounter.log.removeFirst(encounter.log.count - 18)
        }
    }
}
