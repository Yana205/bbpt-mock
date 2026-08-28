# Bunny Boo — testbed · brief for Claude Code

Brackeys Game Jam 2026.2 · theme "Trust No One" · deadline Sun Aug 30 10:00 Asia/Jerusalem.
This folder is the **web testbed** (single-file HTML) that precedes the Unity build. Every number in it is a Unity default-in-waiting (`COPY CONFIG` → `TuningSO`).

## Files
| path | what |
|---|---|
| `src/page.html` | **source of truth.** No `<html>/<head>/<body>` — it publishes as-is to a Claude artifact. |
| `index.html` | standalone build = doctype + head wrapper + `src/page.html`. Regenerate after every edit (`npm run build`). Drop on itch.io as HTML5. |
| `tests/smoke.spec.js` | Playwright, drives the game via `window.BB`. `npm test`. |
| `art/*.png` | sprite crops (bunny ok/bad heads, player, doll, tea room). Embedded as data-URIs in the page; **placeholders** — the jam bans AI-generated art in the final build. |
| `LOGIC.md` | the trust/tell logic and room flow, in prose + tables. Read it before touching rooms. |
| `README.md` | how to use the rail, scenarios, review log. |

## Build & test
```
npm install
npm run build            # src/page.html → index.html
PW_EXEC=/path/to/chrome npx playwright test   # or `npm test` after `npx playwright install chromium`
```
Keep all tests green. Add a test for every behaviour change; the `window.BB` hook (bottom of the script) is the API — extend it, don't bypass it.

## Architecture (one IIFE, top to bottom)
1. **ART** – data-URI images.
2. **CONFIG** – `DEF` holds every tunable. URL params override localStorage override DEF. Add a key to `DEF` + a `[data-cfg]` input in the rail and it is automatically persisted, URL-shareable (`SHARE LINK`), exported, and shown in `COPY CONFIG`.
3. **SCENARIOS** – `SCEN` presets = partial overrides of `DEF`. `?scenario=id` applies one from the URL.
4. **RNG** – mulberry32 seeded from `CFG.seed`; every roll goes through `rng()`. Never use `Math.random()` for game logic (only for the scare-noise pixels).
5. **SESSION RECORDER** – `rec(type,data)` appends to `S.events`; `rollClaim` → `recClaim`, decisions → `recDecision`. `summary()` computes detection rate / false alarms / ms-to-decide. `exportSession()` is the JSON testers send back. **Never spread an object containing `type` into `rec()`** (it shadowed the event type once).
6. **FLOW STRIP** – `flowClaim(c)` / `flowDecide(chosen, correct, consequence)` fill the six boxes. In playtest mode truths stay hidden until the decision.
7. **DIALOG** – `say(lines, speaker, {tellAt})` returns a promise. The tell fires when line `tellAt` starts typing (`tellDelayMs` offsets it). `drawPortrait(wrong)` swaps the bunny face.
8. **ROOMS** – `mkRoom(name, build)`; `build(opts)` returns the room object itself (**do not copy it** — `G.room.claim` must stay live). Helpers: `rollClaim`, `wrongTrust(msg, consequence)`, `addNote`, `addBunny`. Each room sets `floor` (0–3) and `rule` (one-line designer caption).
9. **UPDATE / DRAW** – 320×180 canvas, 16:9, pixel-perfect. `drawItem` colours by `kind`: `pick` (chests/doors/cups), `clue` (wall note/mirror), `collect` (torn note), `bunny`, `npc`. Every item and door gets a label.
10. **BB hook** – `window.BB = {cfg, state, session, goto, resetRun, summary, exportSession, scenarios, applyScenario, press, hold, dialogOpen, skipDialog, teleport, roomClaim}`.

## Modes
- `mode: 'playtest'` = **PLAY** (top bar): rail hidden, log hides LIE/honest, flow strip hides truth until decision. What a tester gets.
- `mode: 'designer'` = **EDIT**: everything visible. Backtick toggles the rail independently.

## Conventions
- Palette is locked (5 purples + red reserved for petals/tells/blood/candle). Never introduce a new hue.
- Combat is a bounded module behind `CFG.combat` (default off). If it isn't fun by Friday it is cut; the doll room already has its "run to the door" fallback.
- Don't add features to the testbed that the Unity build won't have. It exists to answer the GDD's open questions, not to become the game.

## Next steps queue
1. ~~Playtest candidates~~ **DONE 2026-08-28**: Yan approved the full flow (candidate B / scenario `fight`). Decisions frozen in `unity/approved-config.json`; DEF now equals the approved game (combat on, wrong→petal, free flee, firstTellMs teach).
2. Optional: lab runs with other testers (`?room=lab&mode=playtest&seed=42&tellType=…`) to double-check faceflip vs redpixel before art is final.
3. **Unity scaffold from `unity/approved-config.json`** ← current phase. Write the numbers into `gdd/bunny-boo-gdd-v0.md` (project) as v1 while scaffolding.
