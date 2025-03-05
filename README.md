# PIOSI
THE SAGAS CONTINUE

## Documentation

For detailed guidelines on creating new levels, refer to the [Level Creation Rubric](docs/level-creation.md).

For detailed guidelines on creating new heroes, refer to the [Hero Manifestation Guide](docs/hero-manifestation-guide.md).

For detailed gameplay instructions, refer to the [Player's Manual](docs/players-manual.md).

The Level Creation Rubric provides comprehensive guidelines for defining level properties such as `level`, `title`, `rows`, `cols`, `wallHP`, and `enemies`. It also explains the use of the `enemyGenerator` function for dynamic enemy generation and offers examples and best practices for creating balanced and engaging levels.

The Hero Manifestation Guide now includes new hero stats `yeet` and `swarm`, which are used by the new heroes "Yeetrian" and "Mellitron" respectively. These stats add new dimensions to hero abilities and strategies in the game.


### Background Music for Level 5

A new song has been added to enhance the excitement of playing Level 5. The background music transitions smoothly from the usual background music (DarkAnoid) to the new song when the player begins Level 5.

### Implementation Details

1. **New Audio Element**: A new `<audio>` element for the new song has been added to `index.html`.
2. **Initialize Battle Function**: The `initializeBattle` function in `index.html` has been updated to check if the current level is 5 and play the new song.
3. **Mode Up Window Function**: The `showModeUpWindow` function in `index.html` has been updated to fade out the `background-music` when the current level is 4.

## Credits

### Music

* "WoodenPath" by Zachary Hines, II
* "DarkAnoid" by PHIctitious5
* "5GiMaxVision" by Skinnyy Hendrixx
* "INeedSome" by PHIctitious5
