# assets/

Static assets shipped with the game. Served directly by the HTTP server alongside `index.html`.

| Subdirectory | Contents |
|---|---|
| `audio/` | Music tracks used in battle, party select, and Emanations Mode |
| `characters/` | Character sprite PNGs — one per hero, loaded by the content system |
| `images/` | Miscellaneous artwork and reference images |

## Design guidance

Assets are not decoration — they are part of the game's argument about what it is.

**Every asset earns its place through feel.** A sprite that doesn't read clearly at 40px has failed its job regardless of how well it renders at full size. A music track that creates the wrong emotional register is worse than silence. Test assets in context, not in isolation. *(Miyamoto, Jordan Mechner)*

**Audio sets the dramatic arc.** The shift from party-select music to battle music to level-complete silence is a theatrical transition. Each track should feel like it belongs to a distinct emotional moment in the player's experience, not just a playlist. *(Brenda Laurel, Ken Levine)*

**Sprites communicate character before the stat block does.** A player looking at the hero selection screen forms an opinion before they read a single number. The sprite is the hero's first impression — it should suggest aggression, caution, speed, or mystery through shape and posture alone. *(Jordan Mechner, Aarron Walter)*

## Adding assets

- **New audio track** — drop the MP3 here in `audio/` and add it to the `songs` array in `emanations.js` if it should appear in Emanations Mode, or reference it directly from `gameFlow.js` for a specific level.
- **New hero sprite** — add the PNG to `characters/` and set `"sprite": "assets/characters/<file>.png"` in the hero's entry in `content/heroes.<pack>.json`.
- **No build step** — all paths are relative to the project root; they work as-is when served via `python -m http.server`.
