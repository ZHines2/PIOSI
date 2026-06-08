# assets/images/

Miscellaneous artwork and reference images that are not hero sprites.

| File | Notes |
|---|---|
| `Untitled_Artwork.jpg` | Concept art / title screen artwork |
| `IMG_0905.JPG` | Reference image |
| `PIOSI.rtf` | Project document / design notes |

These files are not directly loaded by the game engine at runtime. They are kept here for reference and creative context.

## Design guidance

**Reference images anchor the aesthetic contract.** Before adding a new hero sprite or interface element, check what's already here. The existing artwork defines a visual register — new additions should feel like they belong to the same world, not a different game. *(Jordan Mechner)*

**Concept art answers the "why it looks this way" question.** When a visual decision seems arbitrary to a future contributor, a reference image makes it legible. If you create new concept art, name it descriptively (`title-screen-v2.jpg` beats `IMG_1234.JPG`). *(David Kelley)*

**The `.rtf` file is a design artifact.** `PIOSI.rtf` contains design thinking that doesn't fit cleanly in code or JSON. Read it before making large-scale changes to the game's tone or mechanics — it may explain a decision that would otherwise seem puzzling. *(Warren Spector)*
