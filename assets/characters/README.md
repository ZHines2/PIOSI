# assets/characters/

Hero sprite PNGs — one per hero in the game roster.

Sprites are referenced in hero definitions via the `sprite` field:

```json
{ "sprite": "assets/characters/Knight.png" }
```

Both `content/heroes.core.json` (JSON pack, loaded at runtime) and `heroes.js` (static fallback) use this path. If you add a sprite, update both files to keep the fallback in sync.

## Naming convention

`<HeroName>.png` — PascalCase, matching the hero's display `name` field. Sprites are rendered at `height: 40px` with `image-rendering: pixelated` in the party select screen.

## Current roster

Archer, Berserker, Bombador, Cleric, Gastronomer, Greenjay, Griot, Jester, Kemetic, Knight, Meatwalker, Mellitron, Mycelian, Nonsequiteur, Paeg, Palisade, Rogue, Shrink, Slujier, Soothscribe, Sycophant, Sysiphuge, Torcher, Wizard, Yeetrian
