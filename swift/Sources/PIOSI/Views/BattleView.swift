/// BattleView.swift
///
/// Displays the active battle screen: grid, hero stats, action buttons, and log.
/// Mirrors the battle UI from index.html / battleEngine.js.
/// Compiled only on Apple platforms where SwiftUI is available.

#if canImport(SwiftUI)
import SwiftUI
import Observation

public struct BattleView: View {
    var gameState: GameState
    private var engine: BattleEngine

    init(gameState: GameState) {
        self.gameState = gameState
        // BattleEngine is guaranteed to exist when screen == .battle
        self.engine = gameState.engine!
    }

    public var body: some View {
        VStack(spacing: 0) {
            // Level title bar
            if let level = getLevel(gameState.currentLevelNumber) {
                Text(level.title)
                    .font(.system(size: 13, design: .monospaced))
                    .foregroundColor(.gray)
                    .padding(.top, 8)
            }

            // Battle grid
            BattleGridView(engine: engine)
                .padding(8)

            // Current hero info
            currentHeroPanel

            // Controls
            controlPanel

            // Log
            LogView(messages: engine.logMessages)
                .frame(height: 120)
        }
        .background(Color.black.ignoresSafeArea())
    }

    // MARK: - Current hero panel

    private var currentHeroPanel: some View {
        Group {
            let hero = engine.party[engine.currentUnit]
            HStack(spacing: 16) {
                Text(hero.symbol).font(.system(size: 28))
                VStack(alignment: .leading, spacing: 2) {
                    Text(hero.name)
                        .font(.system(size: 15, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    Text("HP:\(hero.hp)  ATK:\(hero.attack)  RNG:\(hero.range)  AGI:\(hero.agility)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.gray)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("MP: \(engine.movePoints)")
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundColor(.yellow)
                    Text("Wall: \(engine.wallHP)")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.red)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(white: 0.08))
        }
    }

    // MARK: - Control panel

    private var controlPanel: some View {
        VStack(spacing: 8) {
            // D-pad / attack buttons
            if engine.awaitingAttackDirection {
                Text("Choose attack direction")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundColor(.orange)
                dPadButtons { dx, dy in engine.attackInDirection(dx: dx, dy: dy) }
            } else {
                dPadButtons { dx, dy in engine.moveUnit(dx: dx, dy: dy) }
                Button("⚔  ATTACK") {
                    engine.enterAttackMode()
                }
                .buttonStyle(ActionButtonStyle(color: .red))
            }
        }
        .padding(10)
        .background(Color(white: 0.07))
    }

    private func dPadButtons(action: @escaping (Int, Int) -> Void) -> some View {
        VStack(spacing: 4) {
            HStack {
                Spacer()
                arrowButton("▲") { action(0, -1) }
                Spacer()
            }
            HStack(spacing: 8) {
                arrowButton("◀") { action(-1, 0) }
                arrowButton("▼") { action(0, 1) }
                arrowButton("▶") { action(1, 0) }
            }
        }
    }

    private func arrowButton(_ label: String, action: @escaping () -> Void) -> some View {
        Button(label, action: action)
            .font(.system(size: 22, weight: .bold, design: .monospaced))
            .frame(width: 50, height: 50)
            .background(Color(white: 0.15))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - BattleGridView

struct BattleGridView: View {
    var engine: BattleEngine

    private let cellSize: CGFloat = 34

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            VStack(spacing: 1) {
                ForEach(0..<engine.battlefield.count, id: \.self) { row in
                    HStack(spacing: 1) {
                        ForEach(0..<engine.battlefield[row].count, id: \.self) { col in
                            cellView(row: row, col: col)
                        }
                    }
                }
            }
            .padding(4)
        }
    }

    @ViewBuilder
    private func cellView(row: Int, col: Int) -> some View {
        let content = engine.battlefield[row][col]
        let activeHero = engine.party[engine.currentUnit].persistentDeath == nil
            ? engine.party[engine.currentUnit] : nil
        let isActive = activeHero?.x == col && activeHero?.y == row
        let isEnemy  = engine.enemies.contains { $0.x == col && $0.y == row }
        let isItem   = content == cellVittle || content == cellMushroom

        ZStack {
            Rectangle()
                .fill(bgColor(isActive: isActive, isEnemy: isEnemy, isItem: isItem,
                              isWall: content == cellWall || content == "█",
                              awaitingAttack: engine.awaitingAttackDirection))
            if content != cellEmpty {
                Text(content)
                    .font(.system(size: content.count == 1 ? 16 : 12))
                    .foregroundColor(fgColor(isActive: isActive, isEnemy: isEnemy, isItem: isItem))
            }
        }
        .frame(width: cellSize, height: cellSize)
        .overlay(
            Rectangle()
                .stroke(borderColor(isActive: isActive, awaitingAttack: engine.awaitingAttackDirection), lineWidth: isActive ? 2 : 0.5)
        )
    }

    private func bgColor(isActive: Bool, isEnemy: Bool, isItem: Bool, isWall: Bool, awaitingAttack: Bool) -> Color {
        if isWall    { return Color(white: 0.33) }
        if isItem    { return Color(red: 0.29, green: 0.23, blue: 0) }
        if isActive  { return awaitingAttack ? Color(red: 0.42, green: 0, blue: 0) : Color(red: 0, green: 0.13, blue: 0.35) }
        if isEnemy   { return Color(red: 0.29, green: 0.08, blue: 0) }
        return Color(white: 0.1)
    }

    private func fgColor(isActive: Bool, isEnemy: Bool, isItem: Bool) -> Color {
        if isItem  { return Color(red: 0.82, green: 0.71, blue: 0.55) }
        if isActive { return .white }
        if isEnemy  { return Color(red: 1, green: 0.34, blue: 0.13) }
        return Color(red: 0.49, green: 0.72, blue: 0.94)
    }

    private func borderColor(isActive: Bool, awaitingAttack: Bool) -> Color {
        guard isActive else { return Color(white: 0.27) }
        return awaitingAttack ? .red : .blue
    }
}

// MARK: - LogView

struct LogView: View {
    let messages: [String]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(messages.indices, id: \.self) { i in
                        Text(messages[i])
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.gray)
                            .id(i)
                    }
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color(white: 0.06))
            .onChange(of: messages.count) { _, _ in
                if let last = messages.indices.last {
                    proxy.scrollTo(last, anchor: .bottom)
                }
            }
        }
    }
}

// MARK: - ActionButtonStyle

struct ActionButtonStyle: ButtonStyle {
    let color: Color
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold, design: .monospaced))
            .padding(.horizontal, 24)
            .padding(.vertical, 10)
            .background(configuration.isPressed ? color.opacity(0.4) : color.opacity(0.2))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(color, lineWidth: 1))
            .foregroundColor(color)
    }
}
#endif
