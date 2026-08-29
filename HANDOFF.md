# Bunny Boo — Handoff

Brackeys Game Jam 2026.2 · theme **"Trust No One"** · deadline **Sun Aug 30, 10:00 Asia/Jerusalem**.
This repo is the **web testbed** (single-file HTML) that precedes the Unity build. Everything tunable in it is a Unity default-in-waiting.

## Live
| what | where |
|---|---|
| Playable (auto-deploys on push to main) | https://yana205.github.io/bbpt-mock/ |
| Claude artifact mirror | https://claude.ai/code/artifact/5d5b2f09-75c4-4223-a6fa-63a42812ba8d |
| Figma (rooms, text boxes, portraits) | https://figma.com/design/lduq59Tib9grkhvqDIZmXw "BB" |
| Story source (words & beats) | https://claude.ai/code/artifact/7c086664-f0a8-42e9-bcec-5cf12dd00f24 "Bunny Boo Flow" |

## Sources of truth (on conflict)
- **Narrative** (lines, beats, room intent): the Bunny Boo Flow artifact.
- **Tuning** (numbers, punishments): `unity/approved-config.json` — frozen after the 2026-08-28 playtest (scenario B; tell 180ms / first-tell 450ms; wrong picks cost a petal, no doll drop).
- **Set dressing / layout**: the Figma file. The Tea Party frame is natively 320×180 — positions are used verbatim and the render is pixel-identical to the frame export.

## Submit (the one open step)
1. `npm run build:itch` → upload `dist/bunny-boo-itch.zip` to itch.io as HTML5, viewport 960×720 (Pages is already live as fallback).
2. Credit line for the itch page: *music: "Dark Ambience Loop" — Iwan Gabovitch (qubodup), CC-BY 3.0 · "Music Box Horror" — Liecio (Pixabay)* — and if any of the three Kevin MacLeod loops is used in the shipped room-music config, add *"Come Play with Me" / "Ossuary 5 – Rest" / "Deep Noise" — Kevin MacLeod (incompetech.com), CC-BY*.

## Build & test
```
npm install
npm run assets    # art|audio|fonts /runtime → data-URI blocks in src/page.html
npm run build     # src/page.html → index.html
npm test          # 34 Playwright tests — keep green; window.BB is the test API
npm run build:itch
```
`src/page.html` is the only source. Never hand-edit the `/*ART*/ /*AUDIO*/ /*FONTS*/` marker blocks.

## The game (current state)
Title card (friends' baked start-screen art) → tea party (Figma room, tell fires on the word "Promise"; **every** dialog game-wide renders in-canvas in the Figma text box with character portraits — no DOM textbox) → floors 1–3 (teach / contradict / betray; purple-remapped hero carries the bunny) → doll playroom (dolls sit asleep, stand after Boo's line) → two endings gated on 3 torn notes. Interact cue = pulsing rectangle around the nearest usable object; diagonal movement works; soft typing blips (SFX synth — **no tell SFX ever**, the tell stays visual-only).

## Editing workflow
- **EDIT mode keeps only what's needed day-to-day**: click-select + drag-move (inspector shows X/Y etc., corner grip resizes) and the **♫ MUSIC** window (global + per-room track from 5 embedded loops + uploads, volume, previews). Everything else (cards, sprite uploads, palette, tells) still lives in the rail, collapsed — deeper edits go through Claude Code in this repo.
- Layouts persist per room in `localStorage['bb.layout2']`; **COPY LAYOUT** exports a room (positions, sizes, reach, music) to bake in; **RESET LAYOUT** forgets. Config persists in `bb.cfg3`; browser uploads in IndexedDB `bb.uploads`. **COPY CONFIG** = the Unity TuningSO payload.

## Figma → game pipeline (how to continue)
1. Frames are authored at **native 320×180** — layer x/y transfer verbatim.
2. **Gotcha**: Figma metadata reports *flipped* layers at their transform origin, not visual bounds (visual x = x − width). Verify against the frame export; the tea room was diffed to 0 differing pixels.
3. New art: drop PNGs into `art/runtime/` (camelCase filename = `ART` key) + `npm run assets`. Sources archived in `art/friends/` (incl. `figma-room/`).
4. Cropped-fill layers (like the dialog portraits) export via node *screenshots*, not raw fills.
5. Dialog boxes: `teaBox` (288×47 at 16,125) + portraits `portraitVivi/Mara/Bunny/Hero` (= Figma Page 1 enemy1/enemy2/bunnydoll/char_ref portraits) — **all rooms** draw dialogs in-canvas (`drawDialog`); the DOM box is removed. Speakers map via `DLGPORT` (unknown/narrator → hero); to add a character, add its portrait PNG + a `DLGPORT` entry.

## Asset & license inventory
- **Friends' art** (tea room, hero, girls, plush, text boxes, portraits): yours — from the BB Figma file.
- **Music (embedded m4a)**: musicbox (Liecio/Pixabay, no credit), drone (qubodup, CC-BY 3.0), comeplay/ossuary/deepnoise (Kevin MacLeod/incompetech, CC-BY, trimmed ~95s).
- **Fonts**: Silkscreen + Atkinson Hyperlegible (OFL), self-hosted.
- **SFX**: WebAudio synth, no samples.
- No AI-generated placeholder art remains (jam rule, removed 2026-08-29).

## For the Unity build
`unity/approved-config.json` + COPY CONFIG output map 1:1 onto the planned TuningSO. Room layouts (COPY LAYOUT JSON) carry positions, hotspot sizes, per-object reach and per-room music. The testbed exists to answer the GDD's open questions — don't port testbed-only chrome (rail, editor, PROD preview).
