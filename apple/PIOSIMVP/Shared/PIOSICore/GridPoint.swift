import Foundation

public struct GridPoint: Hashable, Codable, Sendable {
    public var x: Int
    public var y: Int

    public init(x: Int, y: Int) {
        self.x = x
        self.y = y
    }

    public func translated(by delta: GridPoint) -> GridPoint {
        GridPoint(x: x + delta.x, y: y + delta.y)
    }

    public func scaled(by value: Int) -> GridPoint {
        GridPoint(x: x * value, y: y * value)
    }

    public func manhattanDistance(to other: GridPoint) -> Int {
        abs(x - other.x) + abs(y - other.y)
    }

    public static let up = GridPoint(x: 0, y: -1)
    public static let down = GridPoint(x: 0, y: 1)
    public static let left = GridPoint(x: -1, y: 0)
    public static let right = GridPoint(x: 1, y: 0)
    public static let orthogonal: [GridPoint] = [.up, .down, .left, .right]
}
