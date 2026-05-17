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

## Wiring a new track

1. Drop the MP3 in this folder.
2. To add it to the Emanations jukebox, append `'assets/audio/<file>.mp3'` to the `songs` array in `emanations.js`.
3. To tie it to a specific battle level, call `document.getElementById('<audio-id>').play()` from `gameFlow.js` `initializeBattle()` — mirroring how level 5 and 6 tracks are wired today.
4. Add a `<audio id="..." src="assets/audio/<file>.mp3">` element in `index.html` if the track needs a dedicated DOM node for fading/pausing.
