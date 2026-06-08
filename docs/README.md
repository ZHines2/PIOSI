# docs/

Author-facing guides for creating and extending PIOSI content.

| File | Audience | Purpose |
|---|---|---|
| `hero-manifestation-guide.md` | Content authors | How to create a new hero: JSON fields, sprite setup, modeup.js entry |
| `level-creation.md` | Content authors | How to define levels: enemy placement, wall HP, special objects |
| `players-manual.md` | Players | Game controls, mechanics reference, mode descriptions |

These docs describe the **content authoring interface**, not the engine internals. Engine internals are documented in `CLAUDE.md` at the project root.

## Writing good documentation for PIOSI

**The reader is a creator, not a user.** Everyone who reads these docs wants to *make something* — a new hero, a new level, a new mode. Every sentence should either answer "how do I do X" or "why does X work this way." Background that doesn't serve one of those two purposes should be cut. *(Steve Krug)*

**Show the mental model, not the implementation.** A content author doesn't need to understand how `contentLoader.js` fetches JSON internally — they need to understand that what they put in `manifest.json` determines what the game loads. Document the interface, not the machinery behind it. *(Don Norman, Jesse James Garrett)*

**One example is worth three paragraphs.** A minimal working JSON snippet that the author can copy-paste and modify is more useful than a complete field enumeration. Always lead with an example; follow it with the explanation. *(Steve Krug)*

**Document constraints, not just affordances.** "You can set `range` to any integer" is less useful than "setting `range` above 8 lets heroes shoot off-screen and never miss — useful for testing, surprising in production." The surprising edges are worth documenting. *(Warren Spector)*
