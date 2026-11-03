# Tempest

A Tempest-style arcade game in a single HTML file: vanilla JS on a canvas, with a vector/neon look (glowing strokes), Web Audio sound effects, and no build step or dependencies.

## Play

Open `index.html` in a browser, or serve it locally:

```bash
npx serve .
```

## Controls

| Action | Keyboard | Pointer |
| ------ | -------- | ------- |
| Move around the web | `←` / `→` or `A` / `D` | Mouse / touch |
| Fire | `Space`, `Enter`, `↑` / `↓`, `W` / `S` | Mouse / touch |

Press any key or click to start from the title screen.

## Project layout

- `index.html` – the whole game
- `specs/` – feature specs (webs & levels, enemies, scoring, audio)
- `IMPLEMENTATION_PLAN.md` – task list for the polish/extend work
- `AGENTS.md`, `PROMPT_*.md`, `loop.sh`, `loop.ps1` – autonomous build-loop setup

## Roadmap

Planned work (testing tooling, extracting pure game logic into testable modules, new web shapes, enemies, scoring and audio) is described in `specs/` and tracked in `IMPLEMENTATION_PLAN.md`.
