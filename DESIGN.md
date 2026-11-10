# Design — Forge Floor

<!-- impeccable:design-schema 1 -->

Visual world for **Train with Aadi**: warm ink canvas, cream typography, copper accent—editorial strength training, not generic “fitness app green.”

## Mode

- **Public landing / auth:** Persuade-lite entry, one atmospheric canvas.
- **Member + admin surfaces:** Operate—scan, tap, log.

## Palette

| Token | Role |
| --- | --- |
| `canvas` | Deep warm black `#0a0908` |
| `fg` | Cream `#f5f0e8` |
| `muted` / `faint` | Warm stone secondary copy |
| `raised` / `elevated` | Layered surfaces |
| `line` | Hairline borders |
| `accent` | Copper `#c96f3b` |
| `danger` | Salmon red for errors |

## Typography

- **Display:** Syne — headlines, product name.
- **Body:** DM Sans — UI and paragraphs.
- **Data:** Tabular nums on stats; mono only for week keys if needed.

## Motion

- `ease-out` custom curve on buttons (press `scale(0.97)`).
- Single page-enter on marketing hero only—not repeated per section.
- No decorative glass; depth via border + soft shadow on elevated panels.

## Components

- `Button`, `Field`, `MemberShell` + bottom tab nav with stroke icons.
- Panels: `rounded-2xl border border-line bg-raised` with hover lift on tappable rows.

## Bans

- No uppercase eyebrow kickers above titles.
- No emerald/slate template pairing.
