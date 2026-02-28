/// Enemy.swift
///
/// Defines the Enemy data model for PIOSI, mirroring the enemy objects
/// used in levels.js and battleEngine.js.

import Foundation

// MARK: - Enemy

public class Enemy: Identifiable {
    public let id: UUID
    public let name: String
    public let symbol: String

    // Core combat stats
    public var attack: Int
    public var range: Int
    public var agility: Int
    public var hp: Int
    public var dodge: Int

    // Battle-state position
    public var x: Int
    public var y: Int

    // Optional dialogue lines shown during the enemy's turn
    public var dialogue: [String]

    // Transient status effects
    public var statusEffects: StatusEffects = StatusEffects()

    public init(
        name: String,
        symbol: String,
        attack: Int,
        range: Int,
        agility: Int,
        hp: Int,
        x: Int,
        y: Int,
        dodge: Int = 0,
        dialogue: [String] = []
    ) {
        self.id = UUID()
        self.name = name
        self.symbol = symbol
        self.attack = attack
        self.range = range
        self.agility = agility
        self.hp = hp
        self.x = x
        self.y = y
        self.dodge = dodge
        self.dialogue = dialogue
    }

    /// Returns true when this enemy acts as a static wall tile.
    public var isStaticWall: Bool { symbol == "█" }
}
