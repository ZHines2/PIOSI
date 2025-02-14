# PIOSI
THE SAGAS CONTINUE

## Documentation

For detailed guidelines on creating new levels, refer to the [Level Creation Rubric](docs/level-creation.md).

For detailed guidelines on creating new heroes, refer to the [Hero Manifestation Guide](docs/hero-manifestation-guide.md).

The Level Creation Rubric provides comprehensive guidelines for defining level properties such as `level`, `title`, `rows`, `cols`, `wallHP`, and `enemies`. It also explains the use of the `enemyGenerator` function for dynamic enemy generation and offers examples and best practices for creating balanced and engaging levels.

## New Classes

### Placeable Class

The `Placeable` class is used for non-enemy, non-hero entities that are part of the level design, such as pickups, walls, and decorations. This class extends the base `Entity` class.

### Breakable Class

The `Breakable` class extends the `Placeable` class and represents entities that can be attacked and destroyed. These entities have health points (HP) and can take damage.

### Static Wall Class

The `Static Wall` class is a specific type of `Breakable` entity used to represent static walls in the game. These walls have a fixed amount of HP and can be destroyed by attacks.

## Usage

- **Placeable Entities**: Use the `Placeable` class for any non-enemy, non-hero entities that are part of the level design.
- **Breakable Entities**: Use the `Breakable` class for entities that can be attacked and destroyed.
- **Static Walls**: Use the `Static Wall` class for static walls in the game.

These classes help in organizing the level design and ensuring that different types of entities are handled appropriately in the game.
