/// HeroSelectionView.swift
///
/// Lets the player pick up to 4 heroes before a battle begins.
/// Mirrors the hero selection UI from index.html.
/// Compiled only on Apple platforms where SwiftUI is available.

#if canImport(SwiftUI)
import SwiftUI
import Observation

struct HeroSelectionView: View {
    var gameState: GameState
    @State private var selected: Set<UUID> = []
    private let maxHeroes = 4

    var body: some View {
        VStack(spacing: 0) {
            Text("CHOOSE YOUR HEROES")
                .font(.system(size: 22, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
                .padding(.top, 44)
                .padding(.bottom, 8)

            Text("Select up to \(maxHeroes) heroes")
                .font(.system(size: 13, design: .monospaced))
                .foregroundColor(.gray)
                .padding(.bottom, 16)

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 12) {
                    ForEach(gameState.allHeroes) { hero in
                        HeroCard(hero: hero, isSelected: selected.contains(hero.id)) {
                            toggleHero(hero)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }

            Spacer()

            Button("START BATTLE  (\(selected.count)/\(maxHeroes))") {
                let party = gameState.allHeroes.filter { selected.contains($0.id) }
                gameState.startGame(heroes: party)
            }
            .disabled(selected.isEmpty)
            .font(.system(size: 18, weight: .bold, design: .monospaced))
            .padding(.horizontal, 40)
            .padding(.vertical, 14)
            .background(selected.isEmpty ? Color.gray.opacity(0.3) : Color.white.opacity(0.15))
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(selected.isEmpty ? Color.gray : Color.white, lineWidth: 1)
            )
            .foregroundColor(selected.isEmpty ? .gray : .white)
            .padding(.bottom, 32)
        }
        .background(Color.black.ignoresSafeArea())
    }

    private func toggleHero(_ hero: Hero) {
        if selected.contains(hero.id) {
            selected.remove(hero.id)
        } else if selected.count < maxHeroes {
            selected.insert(hero.id)
        }
    }
}

// MARK: - HeroCard

struct HeroCard: View {
    let hero: Hero
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 6) {
                Text(hero.symbol)
                    .font(.system(size: 36))
                Text(hero.name)
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Divider().background(Color.gray)
                HStack(spacing: 4) {
                    statLabel("ATK", value: hero.attack)
                    statLabel("HP", value: hero.hp)
                }
                HStack(spacing: 4) {
                    statLabel("AGI", value: hero.agility)
                    statLabel("RNG", value: hero.range)
                }
                specialTags(hero: hero)
            }
            .padding(10)
            .background(isSelected ? Color(red: 0, green: 0.13, blue: 0.35) : Color(white: 0.1))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.blue : Color(white: 0.3), lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    private func statLabel(_ name: String, value: Int) -> some View {
        VStack(spacing: 1) {
            Text(name)
                .font(.system(size: 9, design: .monospaced))
                .foregroundColor(.gray)
            Text("\(value)")
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func specialTags(hero: Hero) -> some View {
        let tags = buildTags(hero: hero)
        if !tags.isEmpty {
            FlowLayout(tags: tags)
        }
    }

    private func buildTags(hero: Hero) -> [String] {
        var tags: [String] = []
        if let v = hero.chain,  v > 0 { tags.append("chain") }
        if let v = hero.heal,   v > 0 { tags.append("heal") }
        if let v = hero.burn,   v > 0 { tags.append("burn") }
        if let v = hero.yeet,   v > 0 { tags.append("yeet") }
        if let v = hero.swarm,  v > 0 { tags.append("swarm") }
        if let v = hero.sluj,   v > 0 { tags.append("slüj") }
        if let v = hero.armor,  v > 0 { tags.append("armor") }
        if let v = hero.spore,  v > 0 { tags.append("spore") }
        if let v = hero.bomba,  v > 0 { tags.append("bomba") }
        if let v = hero.ankh,   v > 0 { tags.append("ankh") }
        if hero.rise > 0            { tags.append("rise") }
        if hero.dodge > 0           { tags.append("dodge") }
        if let v = hero.psych,  v > 0 { tags.append("psych") }
        if let v = hero.trick,  v > 0 { tags.append("trick") }
        if let v = hero.rage,   v > 0 { tags.append("rage") }
        if let v = hero.spicy,  v > 0 { tags.append("spicy") }
        if let v = hero.fate,   v > 0 { tags.append("fate") }
        if let v = hero.caprice, v > 0 { tags.append("caprice") }
        return tags
    }
}

// MARK: - Simple FlowLayout for ability tags

struct FlowLayout: View {
    let tags: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            let rows = tags.chunked(into: 2)
            ForEach(rows.indices, id: \.self) { ri in
                HStack(spacing: 2) {
                    ForEach(rows[ri].indices, id: \.self) { ti in
                        Text(rows[ri][ti])
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundColor(.yellow)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(Color.yellow.opacity(0.15))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }
}

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
#endif
