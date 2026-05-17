# assets/audio/

Music tracks for PIOSI. All files are MP3.

| File | Used in |
|---|---|
| `DarkAnoid.mp3` | Battle screen background music (levels 1–4) |
| `WoodenPath.mp3` | Party selection screen |
| `5GiMaxVision.mp3` | Level 5 |
| `ineedsome.mp3` | Level 6 |
| `SouthernBelle.mp3` | Emanations Mode playlist |
| `whaviors.mp3` | Emanations Mode playlist |
| `afrojapanesetwilight.mp3` | Emanations Mode playlist |
| `science.mp3` | Emanations Mode playlist |

## What makes a good PIOSI track

Music in PIOSI is not background noise — it is the emotional layer the game cannot express through its pixel grid.

**Match the emotional register of the moment, not the visual aesthetic.** The party select screen is deliberate, consequential, a little tense — the music should honor that. Battle music should raise stakes without exhausting the player. Emanations Mode music should stand alone as something worth listening to outside the game. *(Brenda Laurel)*

**Transitions are drama.** The moment music changes — entering battle, completing a level, switching to world map — is a theatrical beat. Abrupt cuts feel cheap; fades signal that something is ending. The `fadeOut()` utility in `audioManager.js` exists for this reason: use it every time a screen transition changes the audio context. *(Brenda Laurel, Ken Levine)*

**Restraint is a feature.** Not every level needs a new track. Returning to a track the player already knows creates familiarity and comfort — or dread if the context has changed. Silence after a level completion is more powerful than a victory jingle. *(John Maeda)*

## Wiring a new track

1. Drop the MP3 in this folder.
2. To add it to the Emanations jukebox, append `'assets/audio/<file>.mp3'` to the `songs` array in `emanations.js`.
3. To tie it to a specific battle level, call `document.getElementById('<audio-id>').play()` from `gameFlow.js` `initializeBattle()` — mirroring how level 5 and 6 tracks are wired today.
4. Add a `<audio id="..." src="assets/audio/<file>.mp3">` element in `index.html` if the track needs a dedicated DOM node for fading/pausing.
