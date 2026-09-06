# Plugabyte brand kit — v2.1

Source: `Plugabyte_Brand_System_v2.1.html`. This folder is the lightweight,
client-shareable subset — the full system lives in that file.

## Colour

| Token | Hex | Use |
|---|---|---|
| `--pb-void` | `#0D131B` | Primary background |
| `--pb-panel` | `#0E1D2C` | Card / panel background |
| `--pb-panel-2` | `#0B1826` | Secondary panel background |
| `--pb-ghost` | `#8FB8E8` | Ghost mark, links, primary accent |
| `--pb-bolt` | `#F4586A` | "Bolt Red" — CTAs, disqualification, failure states |

Text scale (on `--pb-void`): `#E6EEF5` (primary) → `#C4D3DF` → `#8195A8` → `#6F8497` → `#4E6478` (faintest).

See `tokens.css` for the full CSS variable sheet — kept in sync with `src/app/globals.css`.

## Type

- **Nunito** (700/800/900) — display, headlines
- **Space Grotesk** (400–700) — UI, body copy
- **JetBrains Mono** (400/500) — labels, spec ids, meta text

## Mark

`ghost-mark.svg` — the ghost itself (idle pose). `wordmark.svg` — the standalone "plugAbyte" A-mark used in the logo lockup, paired with the text "plug" + mark + "byte".

## Usage

- **Minimum size:** don't render the ghost mark below ~48px — the eyes and bolt lose legibility.
- **Clear space:** keep at least half the mark's width as empty space on all sides.
- **Do:** use the ghost on dark (`--pb-void` / `--pb-panel`) backgrounds only.
- **Don't:** recolour the bolt — it's a fixed brand signal (Bolt Red), not a themeable accent. Don't add a gradient to the wordmark or stretch the mark off-ratio.
