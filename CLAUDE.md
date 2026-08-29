# Bunny Boo — testbed · brief for Claude Code

Brackeys Game Jam 2026.2 · theme "Trust No One" · deadline Sun Aug 30 10:00 Asia/Jerusalem.
This folder is the **web testbed** (single-file HTML) that precedes the Unity build. Every number in it is a Unity default-in-waiting (`COPY CONFIG` → `TuningSO`).

## Files
| path | what |
|---|---|
| `src/page.html` | **source of truth.** No `<html>/<head>/<body>` — it publishes as-is to a Claude artifact. |
| `index.html` | standalone build = doctype + head wrapper + `src/page.html`. Regenerate after every edit (`npm run build`). |
| `tests/smoke.spec.js` | Playwright, drives the game via `window.BB`. `npm test`. |
| `art/friends/` | hand-drawn pixel assets from Yana's friends (tea-party props, pink ramp), as downloaded. |
| `art/runtime/` | the images actually embedded (camelCase names = `ART` keys). `npm run assets` regenerates the data-URI blocks in `src/page.html`. |
| `audio/runtime/` | embedded music (m4a): `musicbox` = "Music Box Horror" (Liecio, Pixabay, no credit needed) · `drone` = "Dark Ambience Loop" (qubodup, **CC-BY — credit on the itch page**). SFX are WebAudio synth, no samples. |
| `fonts/runtime/` | self-hosted Silkscreen + Atkinson woff2 (offline / itch-iframe safe). |
| `tools/build-assets.mjs` | regenerates the `/*ART*/ /*AUDIO*/ /*FONTS*/` marker blocks from those dirs. |
| `LOGIC.md` | the trust/tell logic and room flow, in prose + tables. Read it before touching rooms. |
| `README.md` | how to use the rail, scenarios, review log. |

All five AI-generated placeholder PNGs (bunny heads, player, doll, tea room) are **gone** (2026-08-29, jam rule). Characters are procedural rect sprites; the tea room is composed from the friends' art.

## Build & test
```
npm install
npm run assets           # art/audio/fonts → data-URI blocks in src/page.html
npm run build            # src/page.html → index.html
npm run build:itch       # → dist/bunny-boo-itch.zip (release chrome on; upload as HTML5, viewport 960×720)
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
- `release: true` (`?release=1`, default in the itch build): playtest + no topbar/mode pill/backtick — only the game, HUD, sound button, and short help line. Never persisted to localStorage.
- Boot goes to the **title card** (Space starts); the ending goes to an **end card** (stats, Space → title). `?room=` / `skipIntro` skip both, so test URLs are unchanged.

## Conventions
- Palette is locked (5 purples + red reserved for petals/tells/blood/candle). One sanctioned exception (2026-08-29): the friends' **pink ramp lives only in the tea party room and title/end text** — pink is the warm facade, purple is the house's truth. Floors 1–3 must stay pink-free.
- Audio: music via the two embedded m4a loops (`CFG.music`: auto/musicbox/drone/off), SFX via the `sfx(name)` WebAudio synth. **No tell SFX ever** — the tell must stay visual-only, that's the design question the game asks.
- Combat is a bounded module behind `CFG.combat` (default off). If it isn't fun by Friday it is cut; the doll room already has its "run to the door" fallback.
- Don't add features to the testbed that the Unity build won't have. It exists to answer the GDD's open questions, not to become the game.

## Next steps queue
1. ~~Playtest candidates~~ **DONE 2026-08-28**: Yan approved the full flow (candidate B / scenario `fight`). Decisions frozen in `unity/approved-config.json`.
2. ~~Submission polish~~ **DONE 2026-08-29**: AI placeholders removed, friends' tea-party art wired (pink facade), title/end cards, audio (music switcher in rail + SOUND button / M), quicker tell (450/180 — frozen in approved-config), soft key-pickup fx, `release` mode + `npm run build:itch`. Storage key now `bb.cfg3`.
3. **Submit**: push main (GitHub Pages) and/or upload `dist/bunny-boo-itch.zip` to itch.io before Sun Aug 30 10:00. Credit line for the itch page: *music: "Dark Ambience Loop" — Iwan Gabovitch (qubodup), CC-BY 3.0 · "Music Box Horror" — Liecio (Pixabay)*.
