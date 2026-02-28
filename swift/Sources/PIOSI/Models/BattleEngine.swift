/// BattleEngine.swift
///
/// Core turn-based battle logic for PIOSI, translated from battleEngine.js.
/// Manages the battlefield grid, hero/enemy turns, status effects,
/// and special abilities (knockback, chain, slüj, swarm, etc.).
/// Uses the Swift @Observable macro (Observation framework, Swift 5.9+).

import Foundation
import Observation

// MARK: - Cell constants

public let cellEmpty    = "."
public let cellWall     = "ᚙ"
public let cellVittle   = "ౚ"
public let cellMushroom = "ඉ"

// MARK: - Direction

public struct Direction {
    public let dx: Int
    public let dy: Int
    public static let up    = Direction(dx: 0, dy: -1)
    public static let down  = Direction(dx: 0, dy: 1)
    public static let left  = Direction(dx: -1, dy: 0)
    public static let right = Direction(dx: 1, dy: 0)
    public static let cardinals: [Direction] = [.up, .down, .left, .right]
    public static let allEight: [Direction] = [
        .up, .down, .left, .right,
        Direction(dx: -1, dy: -1), Direction(dx: -1, dy: 1),
        Direction(dx: 1, dy: -1), Direction(dx: 1, dy: 1),
    ]
}

// MARK: - BattleEngine

/// Manages one battle level: the grid, turn order, hero/enemy actions, and end conditions.
@Observable
public class BattleEngine {

    // MARK: Observable state
    public private(set) var battlefield: [[String]]
    public private(set) var logMessages: [String] = []
    public private(set) var currentUnit: Int = 0
    public private(set) var movePoints: Int = 0
    public private(set) var awaitingAttackDirection: Bool = false
    public private(set) var wallHP: Int
    public private(set) var isGameOver: Bool = false
    public private(set) var isLevelComplete: Bool = false

    // MARK: Private data
    public private(set) var party: [Hero]
    public private(set) var enemies: [Enemy]
    private let rows: Int
    private let cols: Int

    private var transitioningLevel: Bool = false

    // Callbacks (set externally when embedding in a view model)
    public var onLevelComplete: (() -> Void)?
    public var onGameOver: (() -> Void)?

    // MARK: Init

    public init(party: [Hero], enemies: [Enemy], rows: Int, cols: Int, wallHP: Int) {
        self.party = party
        self.enemies = enemies
        self.rows = rows
        self.cols = cols
        self.wallHP = wallHP

        // Placeholder — will be populated in setup()
        self.battlefield = Array(repeating: Array(repeating: cellEmpty, count: cols), count: rows)

        setup()
    }

    // MARK: - Setup

    private func setup() {
        // Initialise status effects
        for hero in party {
            hero.statusEffects = StatusEffects()
            if hero.persistentDeath == nil { hero.persistentDeath = nil }
            if hero.rise < 0 { hero.rise = 0 }
            if hero.dodge < 0 { hero.dodge = 0 }
        }
        for enemy in enemies {
            enemy.statusEffects = StatusEffects()
            if enemy.dodge < 0 { enemy.dodge = 0 }
        }

        // Advance past any heroes already persistently dead
        while currentUnit < party.count && party[currentUnit].persistentDeath != nil {
            currentUnit += 1
        }
        if currentUnit >= party.count {
            currentUnit = 0
            movePoints = 0
            isGameOver = true
            onGameOver?()
            return
        }
        movePoints = party[currentUnit].agility

        battlefield = initBattlefield()
        applyCapriceAndFate()
    }

    // MARK: - Battlefield initialisation

    private func initBattlefield() -> [[String]] {
        var field = Array(repeating: Array(repeating: cellEmpty, count: cols), count: rows)
        placeHeroes(field: &field)
        placeEnemies(field: &field)
        createWall(field: &field)
        placeHealingItem(field: &field)
        placeMushroom(field: &field)
        return field
    }

    private func placeHeroes(field: inout [[String]]) {
        for hero in party {
            guard hero.persistentDeath == nil else { continue }
            var placed = false
            outer: for y in 0..<rows {
                for x in 0..<cols {
                    if field[y][x] == cellEmpty {
                        hero.x = x; hero.y = y
                        field[y][x] = hero.symbol
                        placed = true
                        break outer
                    }
                }
            }
            if !placed { log("\(hero.name) could not be placed on the field!") }
        }
    }

    private func placeEnemies(field: inout [[String]]) {
        for enemy in enemies {
            enemy.statusEffects = StatusEffects()
            field[enemy.y][enemy.x] = enemy.symbol
        }
    }

    private func createWall(field: inout [[String]]) {
        for x in 0..<cols { field[rows - 1][x] = cellWall }
        for enemy in enemies where enemy.isStaticWall {
            field[enemy.y][enemy.x] = enemy.symbol
        }
    }

    private func placeHealingItem(field: inout [[String]]) {
        let empty = emptyCells(in: field, excludingLastRow: true)
        if let cell = empty.randomElement() { field[cell.y][cell.x] = cellVittle }
    }

    private func placeMushroom(field: inout [[String]]) {
        let empty = emptyCells(in: field, excludingLastRow: true)
        if let cell = empty.randomElement() { field[cell.y][cell.x] = cellMushroom }
    }

    private func emptyCells(in field: [[String]], excludingLastRow: Bool) -> [(x: Int, y: Int)] {
        let limit = excludingLastRow ? rows - 1 : rows
        var cells: [(x: Int, y: Int)] = []
        for y in 0..<limit {
            for x in 0..<cols where field[y][x] == cellEmpty {
                cells.append((x, y))
            }
        }
        return cells
    }

    private func applyCapriceAndFate() {
        let stats: [ReferenceWritableKeyPath<Hero, Int>] = [\.attack, \.range, \.agility, \.hp]
        let statNames = ["attack", "range", "agility", "hp"]

        for hero in liveHeroes {
            if let caprice = hero.caprice, caprice > 0 {
                for _ in 0..<caprice {
                    let idx = Int.random(in: 0..<stats.count)
                    hero[keyPath: stats[idx]] += 1
                    log("\(hero.name)'s caprice boosts \(statNames[idx]) to \(hero[keyPath: stats[idx]])")
                }
            }
        }
        for hero in liveHeroes {
            if let fate = hero.fate, fate > 0 {
                for _ in 0..<fate {
                    let idx = Int.random(in: 0..<stats.count)
                    let delta = Bool.random() ? 1 : -1
                    hero[keyPath: stats[idx]] += delta
                    log("\(hero.name)'s fate changes \(statNames[idx]) to \(hero[keyPath: stats[idx]])")
                }
            }
        }
    }

    // MARK: - Live heroes helper

    public var liveHeroes: [Hero] {
        party.filter { $0.persistentDeath == nil }
    }

    // MARK: - Bounds & passability

    public func isWithinBounds(x: Int, y: Int) -> Bool {
        x >= 0 && x < cols && y >= 0 && y < rows
    }

    private func isCellPassable(x: Int, y: Int) -> Bool {
        let cell = battlefield[y][x]
        return cell == cellEmpty || cell == cellVittle || cell == cellMushroom
    }

    // MARK: - Log helper

    private func log(_ msg: String) {
        logMessages.append(msg)
    }

    // MARK: - Move

    /// Attempt to move the current hero one step in the given direction.
    public func moveUnit(dx: Int, dy: Int) {
        guard !awaitingAttackDirection, movePoints > 0, !transitioningLevel else { return }
        let unit = party[currentUnit]
        guard unit.persistentDeath == nil else { return }
        guard unit.hp > 0 else { log("\(unit.name) is dead and cannot move."); return }

        let newX = unit.x + dx
        let newY = unit.y + dy
        guard isWithinBounds(x: newX, y: newY) else { return }

        let cell = battlefield[newY][newX]

        // Wall attack
        if cell == cellWall || cell == "█" {
            wallHP -= unit.attack
            log("\(unit.name) attacks the wall for \(unit.attack) damage! (Wall HP: \(wallHP))")
            if wallHP <= 0, !transitioningLevel { handleWallCollapse(); return }
            movePoints -= 1
            if movePoints == 0 { nextTurn() }
            return
        }

        // Vittle pickup
        if cell == cellVittle {
            let healVal = 10 + ((unit.spicy ?? 0) * 2)
            unit.hp += healVal
            log("\(unit.name) picks up a vittle and heals for \(healVal) HP! (New HP: \(unit.hp))")
            battlefield[newY][newX] = cellEmpty
        }

        // Mushroom pickup
        if cell == cellMushroom {
            unit.hp += 5
            log("\(unit.name) picks up a mushroom and heals for 5 HP! (New HP: \(unit.hp))")
            battlefield[newY][newX] = cellEmpty
            if let spore = unit.spore, spore > 0 {
                let stats: [ReferenceWritableKeyPath<Hero, Int>] = [\.attack, \.range, \.agility, \.hp]
                let names = ["attack", "range", "agility", "hp"]
                let idx = Int.random(in: 0..<stats.count)
                unit[keyPath: stats[idx]] += spore
                log("\(unit.name) gains \(spore) boost to \(names[idx]) (Now: \(unit[keyPath: stats[idx]]))")
            }
        }

        guard isCellPassable(x: newX, y: newY) else { return }

        battlefield[unit.y][unit.x] = cellEmpty
        unit.x = newX; unit.y = newY
        battlefield[newY][newX] = unit.symbol
        movePoints -= 1
        if movePoints == 0 { nextTurn() }
    }

    // MARK: - Attack

    /// Resolve an attack by the current hero in the given direction.
    public func attackInDirection(dx: Int, dy: Int) {
        guard !transitioningLevel else { return }
        let unit = party[currentUnit]
        guard unit.hp > 0 else { log("\(unit.name) is dead and cannot attack."); return }

        log("\(unit.name) attacked in direction (\(dx), \(dy)).")

        for i in 1...unit.range {
            let tx = unit.x + dx * i
            let ty = unit.y + dy * i
            guard isWithinBounds(x: tx, y: ty) else { break }

            // Ally interaction
            if let ally = liveHeroes.first(where: { $0.x == tx && $0.y == ty && $0 !== unit }) {
                handleAllyInteraction(unit: unit, ally: ally)
                return
            }

            // Dead hero – treat as empty
            if party.contains(where: { $0.x == tx && $0.y == ty && $0.persistentDeath != nil }) {
                finishAttack()
                return
            }

            // Enemy hit
            if let idx = enemies.firstIndex(where: { $0.x == tx && $0.y == ty }) {
                let enemy = enemies[idx]
                if !dodgeCheck(unit: enemy) {
                    resolveHeroHitsEnemy(unit: unit, enemy: enemy, dx: dx, dy: dy)
                    if enemy.hp <= 0 {
                        log("\(enemy.name) is defeated!")
                        battlefield[enemy.y][enemy.x] = cellEmpty
                        enemies.remove(at: idx)
                    }
                }
                finishAttack()
                return
            }

            // Wall / static wall
            let cell = battlefield[ty][tx]
            if cell == cellWall || cell == "█" {
                wallHP -= unit.attack
                log("\(unit.name) attacks the wall for \(unit.attack) damage! (Wall HP: \(wallHP))")
                awaitingAttackDirection = false
                if wallHP <= 0, !transitioningLevel { handleWallCollapse(); return }
                nextTurn()
                return
            }
        }

        log("\(unit.name) attacks, but nothing is in range.")
        finishAttack()
    }

    private func finishAttack() {
        awaitingAttackDirection = false
        nextTurn()
    }

    private func handleAllyInteraction(unit: Hero, ally: Hero) {
        if let heal = unit.heal, heal > 0 {
            ally.hp += heal
            log("\(unit.name) heals \(ally.name) for \(heal) HP! (New HP: \(ally.hp))")
        } else if let psych = unit.psych, psych > 0 {
            let stats: [ReferenceWritableKeyPath<Hero, Int>] = [\.attack, \.range, \.agility, \.hp]
            let names = ["attack", "range", "agility", "hp"]
            let idx = Int.random(in: 0..<stats.count)
            ally[keyPath: stats[idx]] += psych
            log("\(unit.name) uses psych on \(ally.name), boosting \(names[idx]) by \(psych)! (New \(names[idx]): \(ally[keyPath: stats[idx]]))")
        } else {
            log("\(unit.name) attacks \(ally.name) but nothing happens.")
        }
        awaitingAttackDirection = false
        nextTurn()
    }

    private func resolveHeroHitsEnemy(unit: Hero, enemy: Enemy, dx: Int, dy: Int) {
        enemy.hp -= unit.attack
        log("\(unit.name) attacks \(enemy.name) for \(unit.attack) damage! (HP left: \(enemy.hp))")

        // Trick debuff
        if let trick = unit.trick, trick > 0 {
            applyTrick(unit: unit, enemy: enemy, trick: trick)
        }
        // Burn
        if let burn = unit.burn {
            enemy.statusEffects.burn = BurnEffect(damage: burn, duration: 3)
            log("\(enemy.name) is burning for \(burn) damage for 3 turns!")
        }
        // Slüj
        if let sluj = unit.sluj {
            if enemy.statusEffects.sluj == nil {
                enemy.statusEffects.sluj = SlujEffect(level: sluj, duration: 4)
            } else {
                enemy.statusEffects.sluj!.level += sluj
                enemy.statusEffects.sluj!.duration = 4
            }
            log("\(enemy.name) is afflicted with slüj (level \(enemy.statusEffects.sluj!.level)) for 4 turns!")
        }
        // Knockback (yeet)
        if let yeet = unit.yeet, yeet > 0 {
            applyKnockback(enemy: enemy, dx: dx, dy: dy, yeet: yeet, attackPower: unit.attack)
        }
        // Chain
        if let chain = unit.chain, chain > 0 {
            let multiplier = 1.0 - exp(-Double(chain) / 10.0)
            let initialDmg = Int((Double(unit.attack) * multiplier).rounded())
            if initialDmg > 0 {
                log("\(enemy.name) takes \(initialDmg) chain damage!")
                applyChainDamage(enemy: enemy, damage: initialDmg, multiplier: multiplier, visited: [ObjectIdentifier(enemy)])
            }
        }
        // Bomba bonus from adjacent heroes
        for dir in Direction.cardinals {
            let ax = enemy.x + dir.dx, ay = enemy.y + dir.dy
            if let adj = liveHeroes.first(where: { $0.x == ax && $0.y == ay }),
               let bomba = adj.bomba, bomba > 0 {
                enemy.hp -= bomba
                log("\(adj.name)'s bomba deals \(bomba) additional damage to \(enemy.name)! (HP left: \(enemy.hp))")
            }
        }
    }

    // MARK: - Chain damage

    private func applyChainDamage(enemy: Enemy, damage: Int, multiplier: Double, visited: Set<ObjectIdentifier>) {
        var visited = visited
        for dir in Direction.allEight {
            let ax = enemy.x + dir.dx, ay = enemy.y + dir.dy
            guard isWithinBounds(x: ax, y: ay) else { continue }
            guard let adj = enemies.first(where: { $0.x == ax && $0.y == ay }),
                  !visited.contains(ObjectIdentifier(adj)) else { continue }
            adj.hp -= damage
            log("\(adj.name) takes \(damage) chain damage! (HP left: \(adj.hp))")
            visited.insert(ObjectIdentifier(adj))
            if adj.hp <= 0 {
                log("\(adj.name) is defeated by chain damage!")
                battlefield[ay][ax] = cellEmpty
                enemies.removeAll { $0 === adj }
            }
            let next = Int((Double(damage) * multiplier).rounded())
            if next > 0 && next < damage {
                applyChainDamage(enemy: adj, damage: next, multiplier: multiplier, visited: visited)
            }
        }
    }

    // MARK: - Knockback

    private func applyKnockback(enemy: Enemy, dx: Int, dy: Int, yeet: Int, attackPower: Int) {
        let origX = enemy.x, origY = enemy.y
        for i in 1...yeet {
            let nx = origX + dx * i, ny = origY + dy * i
            if !isWithinBounds(x: nx, y: ny) {
                log("\(enemy.name) is knocked back into the wall and takes \(attackPower) damage!")
                enemy.hp -= attackPower; break
            }
            let cell = battlefield[ny][nx]
            if cell == cellWall || cell == "█" {
                log("\(enemy.name) collides with the wall during knockback and takes \(attackPower) damage!")
                enemy.hp -= attackPower; break
            }
            if cell == cellEmpty {
                battlefield[enemy.y][enemy.x] = cellEmpty
                enemy.x = nx; enemy.y = ny
                battlefield[ny][nx] = enemy.symbol
            }
        }
    }

    // MARK: - Trick debuff

    private func applyTrick(unit: Hero, enemy: Enemy, trick: Int) {
        // Randomly debuff one of the enemy's numeric stats
        let candidates: [(name: String, kp: ReferenceWritableKeyPath<Enemy, Int>)] = [
            ("attack", \.attack), ("range", \.range), ("agility", \.agility), ("hp", \.hp)
        ]
        let pick = candidates.randomElement()!
        let orig = enemy[keyPath: pick.kp]
        enemy[keyPath: pick.kp] = max(0, orig - trick)
        log("\(unit.name)'s trick lowers \(enemy.name)'s \(pick.name) from \(orig) to \(enemy[keyPath: pick.kp])!")
    }

    // MARK: - Dodge check

    /// Returns true if the unit dodges (attack should be skipped).
    private func dodgeCheck(unit: Enemy) -> Bool {
        let chance = min(Double(unit.dodge) / Double(100 + unit.dodge), 0.5)
        if Double.random(in: 0..<1) < chance {
            log("\(unit.name) dodges the attack!")
            awaitingAttackDirection = false
            nextTurn()
            return true
        }
        return false
    }

    private func dodgeCheck(unit: Hero) -> Bool {
        let chance = min(Double(unit.dodge) / Double(100 + unit.dodge), 0.5)
        if Double.random(in: 0..<1) < chance {
            log("\(unit.name) dodges \("enemy")'s attack!")
            return true
        }
        return false
    }

    // MARK: - Enemy turn

    public func enemyTurn() {
        guard !transitioningLevel else { return }
        for enemy in enemies {
            for _ in 0..<enemy.agility { moveEnemy(enemy) }
            enemyAttackAdjacent(enemy: enemy)
            applySlujTick(enemy: enemy)
            if enemy.hp <= 0 {
                log("\(enemy.name) is defeated by its slüj effect!")
                battlefield[enemy.y][enemy.x] = cellEmpty
                enemies.removeAll { $0 === enemy }
                continue
            }
            if let line = enemy.dialogue.randomElement() {
                log("\(enemy.name) says: \"\(line)\"")
            }
        }
        log("Enemy turn completed.")
    }

    private func moveEnemy(_ enemy: Enemy) {
        guard let target = findClosestHero(to: enemy) else { return }
        let dx = target.x - enemy.x
        let dy = target.y - enemy.y
        var stepX = 0, stepY = 0
        if abs(dx) >= abs(dy) { stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0) }
        else { stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0) }

        if !canMove(x: enemy.x + stepX, y: enemy.y + stepY) {
            if stepX != 0, canMove(x: enemy.x, y: enemy.y + (dy > 0 ? 1 : -1)) {
                stepY = dy > 0 ? 1 : -1; stepX = 0
            } else if stepY != 0, canMove(x: enemy.x + (dx > 0 ? 1 : -1), y: enemy.y) {
                stepX = dx > 0 ? 1 : -1; stepY = 0
            }
        }

        let nx = enemy.x + stepX, ny = enemy.y + stepY
        if canMove(x: nx, y: ny) {
            battlefield[enemy.y][enemy.x] = cellEmpty
            enemy.x = nx; enemy.y = ny
            battlefield[ny][nx] = enemy.symbol
        }
    }

    private func findClosestHero(to enemy: Enemy) -> Hero? {
        liveHeroes.min(by: {
            abs($0.x - enemy.x) + abs($0.y - enemy.y) < abs($1.x - enemy.x) + abs($1.y - enemy.y)
        })
    }

    private func canMove(x: Int, y: Int) -> Bool {
        isWithinBounds(x: x, y: y) && isCellPassable(x: x, y: y)
    }

    private func enemyAttackAdjacent(enemy: Enemy) {
        for dir in Direction.cardinals {
            let tx = enemy.x + dir.dx, ty = enemy.y + dir.dy
            guard let hero = liveHeroes.first(where: { $0.x == tx && $0.y == ty }) else { continue }
            guard !dodgeCheck(unit: hero) else { continue }

            if let armor = hero.armor, armor > 0 {
                hero.armor = armor - 1
                log("\(enemy.name) attacks \(hero.name) but their armor absorbs it (Remaining Armor: \(hero.armor!))")
            } else {
                hero.hp -= enemy.attack
                log("\(enemy.name) attacks \(hero.name) for \(enemy.attack) damage! (HP left: \(hero.hp))")
            }
            if hero.hp <= 0 {
                handleHeroDeath(hero)
            } else if let rage = hero.rage, rage > 0 {
                applyRage(hero: hero, rage: rage)
            }
        }
    }

    private func applyRage(hero: Hero, rage: Int) {
        let stats: [ReferenceWritableKeyPath<Hero, Int>] = [\.attack, \.range, \.agility, \.hp]
        let names = ["attack", "range", "agility", "hp"]
        let idx = Int.random(in: 0..<stats.count)
        hero[keyPath: stats[idx]] += rage
        log("\(hero.name)'s rage boosts \(names[idx]) by \(rage) (Now: \(hero[keyPath: stats[idx]]))")
    }

    // MARK: - Slüj tick

    private func applySlujTick(enemy: Enemy) {
        guard var sluj = enemy.statusEffects.sluj else { return }
        sluj.counter += 1
        let interval = max(5 - sluj.level, 1)
        if sluj.counter % interval == 0 {
            let dmg = sluj.level * 2
            log("\(enemy.name) takes \(dmg) slüj damage!")
            enemy.hp -= dmg
        }
        sluj.duration -= 1
        if sluj.duration <= 0 {
            log("\(enemy.name)'s slüj effect wears off.")
            enemy.statusEffects.sluj = nil
        } else {
            enemy.statusEffects.sluj = sluj
        }
    }

    // MARK: - Hero death

    private func handleHeroDeath(_ hero: Hero) {
        if hero.rise > 0 {
            log("Hero \(hero.name) falls but rises with \(hero.rise) HP!")
            hero.hp = hero.rise
            hero.rise = 0
            applyAnkhBoost()
            return
        }
        guard hero.persistentDeath == nil else { return }
        log("Hero \(hero.name) has fallen permanently.")
        hero.statusEffects.isDead = true
        hero.persistentDeath = PersistentDeath()
        battlefield[hero.y][hero.x] = cellEmpty
        applyAnkhBoost()
    }

    private func applyAnkhBoost() {
        let stats: [ReferenceWritableKeyPath<Hero, Int>] = [\.attack, \.hp, \.agility, \.range]
        let names = ["attack", "hp", "agility", "range"]
        for hero in liveHeroes {
            guard let ankh = hero.ankh, ankh > 0 else { continue }
            let idx = Int.random(in: 0..<stats.count)
            hero[keyPath: stats[idx]] += ankh
            log("\(hero.name) gains an ankh boost of \(ankh) \(names[idx]) (Now: \(hero[keyPath: stats[idx]])).")
        }
    }

    // MARK: - Swarm damage

    private func applySwarmDamage() {
        for hero in liveHeroes {
            guard let swarm = hero.swarm else { continue }
            for dir in Direction.allEight {
                let tx = hero.x + dir.dx, ty = hero.y + dir.dy
                guard isWithinBounds(x: tx, y: ty) else { continue }
                if let idx = enemies.firstIndex(where: { $0.x == tx && $0.y == ty }) {
                    let enemy = enemies[idx]
                    enemy.hp -= swarm
                    log("\(hero.name)'s swarm deals \(swarm) damage to \(enemy.name) (HP left: \(enemy.hp))")
                    if enemy.hp <= 0 {
                        log("\(enemy.name) is defeated by swarm damage!")
                        battlefield[ty][tx] = cellEmpty
                        enemies.remove(at: idx)
                    }
                }
            }
        }
    }

    // MARK: - Status effects

    private func applyStatusEffects() {
        // Heroes
        for hero in liveHeroes {
            if var burn = hero.statusEffects.burn, burn.duration > 0 {
                log("\(hero.name) takes \(burn.damage) burn damage!")
                hero.hp -= burn.damage
                burn.duration -= 1
                hero.statusEffects.burn = burn.duration > 0 ? burn : nil
                if hero.hp <= 0 { handleHeroDeath(hero) }
            }
        }
        // Enemies
        var toRemove: [Enemy] = []
        for enemy in enemies {
            if var burn = enemy.statusEffects.burn, burn.duration > 0 {
                log("\(enemy.name) takes \(burn.damage) burn damage!")
                enemy.hp -= burn.damage
                burn.duration -= 1
                enemy.statusEffects.burn = burn.duration > 0 ? burn : nil
                if enemy.hp <= 0 {
                    log("\(enemy.name) died from burn damage!")
                    battlefield[enemy.y][enemy.x] = cellEmpty
                    toRemove.append(enemy)
                }
            }
        }
        enemies.removeAll { e in toRemove.contains(where: { $0 === e }) }
    }

    // MARK: - Next turn

    public func nextTurn() {
        guard !transitioningLevel else { return }
        applyStatusEffects()
        applySwarmDamage()

        if liveHeroes.isEmpty {
            log("All heroes defeated! Game Over.")
            isGameOver = true
            onGameOver?()
            return
        }

        awaitingAttackDirection = false
        repeat {
            currentUnit += 1
            if currentUnit >= party.count {
                currentUnit = 0
                log("Enemy turn begins.")
                enemyTurn()
                applyStatusEffects()
                if liveHeroes.isEmpty {
                    log("All heroes defeated! Game Over.")
                    isGameOver = true
                    onGameOver?()
                    return
                }
            }
        } while party[currentUnit].persistentDeath != nil

        movePoints = party[currentUnit].agility
        log("Now it's \(party[currentUnit].name)'s turn.")
    }

    // MARK: - Attack mode

    public func enterAttackMode() {
        guard !awaitingAttackDirection else { return }
        awaitingAttackDirection = true
    }

    // MARK: - Wall collapse

    private func handleWallCollapse() {
        log("The Wall Collapses!")
        transitioningLevel = true
        isLevelComplete = true
        onLevelComplete?()
    }
}
