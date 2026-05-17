# assets/

Static assets shipped with the game. Served directly by the HTTP server alongside `index.html`.

| Subdirectory | Contents |
|---|---|
| `audio/` | Music tracks used in battle, party select, and Emanations Mode |
| `characters/` | Character sprite PNGs — one per hero, loaded by the content system |
| `images/` | Miscellaneous artwork and reference images |

## Adding assets

- **New audio track** — drop the MP3 here in `audio/` and add it to the `songs` array in `emanations.js` if it should appear in Emanations Mode, or reference it directly from `gameFlow.js` for a specific level.
- **New hero sprite** — add the PNG to `characters/` and set `"sprite": "assets/characters/<file>.png"` in the hero's entry in `content/heroes.<pack>.json`.
- **No build step** — all paths are relative to the project root; they work as-is when served via `python -m http.server`.
