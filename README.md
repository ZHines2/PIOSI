# PIOSI
THE SAGAS CONTINUE

## CORE Build

PIOSI CORE is a clean, data-driven version of the game designed to be wrapped with [Tauri](https://tauri.app/) and shipped, then expanded over time by updating content data files — no engine changes required.

### How CORE works

1. At startup the game reads `content/manifest.json` to discover which content packs and modes are enabled.
2. For each enabled pack it fetches `content/heroes.<pack>.json` and `content/levels.<pack>.json`.
3. If any fetch fails the game falls back to the static data in `heroes.js` / `levels.js` so you can still open the file directly without a server.

### Adding heroes

Open (or create) a hero pack JSON file such as `content/heroes.mypack.json`:

```json
{
  "heroes": [
    {
      "id": "paladin",
      "name": "Paladin",
      "symbol": "⛨",
      "sprite": "PIOSI Characters/Paladin.png",
      "attack": 5,
      "range": 1,
      "agility": 3,
      "hp": 22,
      "armor": 3
    }
  ]
}
```

Then add `"mypack"` to the `packs` array in `content/manifest.json`:

```json
{ "packs": ["core", "mypack"] }
```

Add a matching `case "paladin":` entry in `modeup.js` to define Mode Up behaviour for the new hero.  Heroes without a case receive the default `ghis` fallback buff.

> **Tip:** Always set a stable lowercase `id` field. Mode Up logic (and future save/persistence systems) key off `hero.id` first, then fall back to `hero.name`.

### Adding levels

Open (or create) a level pack JSON file such as `content/levels.mypack.json`:

```json
{
  "levels": [
    {
      "level": 4,
      "title": "Level 4: The Outer Reach",
      "rows": 8,
      "cols": 10,
      "wallHP": 80,
      "enemies": [
        { "name": "Brigand", "symbol": "Җ", "attack": 3, "range": 1, "hp": 12, "agility": 2, "enemyXOffset": 3 }
      ]
    }
  ]
}
```

Enemies with `enemyXOffset` are placed at `cols - enemyXOffset` from the left edge (right side of the grid).  Enemies with explicit `x`/`y` coordinates are placed directly.

Add the pack to `content/manifest.json` and update `"coreLevels"` if you want the additional level to be reachable before the game transitions to victory.

### Enabling / disabling modes

Edit `content/manifest.json`:

```json
{
  "packs": ["core"],
  "modes": {
    "battle":     true,
    "modeUp":     true,
    "worldMap":   false,
    "summit":     false,
    "emanations": false
  },
  "coreLevels": 3
}
```

| Mode         | Effect when `false`                                                         |
|--------------|-----------------------------------------------------------------------------|
| `worldMap`   | World map screen is never shown; the world-map cheat code is also disabled. |
| `summit`     | Summit Mode is only accessible via the world map (already gated).           |
| `emanations` | Emanations Mode is only accessible via the world map (already gated).       |
| `modeUp`     | Reserved for future use; Mode Up still runs when `true`.                    |

Setting `worldMap: true` re-enables the world map and its entry points without any engine changes.

### Wrapping / shipping with Tauri

The CORE build is a self-contained HTML/JS application with no build step required.  To wrap it with Tauri:

1. `npm install --save-dev @tauri-apps/cli`
2. `npx tauri init` — point `distDir` at the repo root (or a dist folder if you run a bundler).
3. `npx tauri build` — produces a platform-specific installer.

The `content/` directory ships alongside the binary.  To add heroes or levels after release, replace or extend the JSON files and re-wrap — no Rust/engine recompilation needed.

---

## Documentation

For detailed guidelines on creating new levels, refer to the [Level Creation Rubric](docs/level-creation.md).

For detailed guidelines on creating new heroes, refer to the [Hero Manifestation Guide](docs/hero-manifestation-guide.md).

For detailed gameplay instructions, refer to the [Player's Manual](docs/players-manual.md).

---

## Credits

### Music

* "WoodenPath" by Zachary Hines, II
* "DarkAnoid" by PHIctitious5
* "5GiMaxVision" by Skinnyy Hendrixx
* "INeedSome" by PHIctitious5

