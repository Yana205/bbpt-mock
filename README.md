# Bunny Boo — testbed

Smallest testable version of *Bunny Boo Play Time* (Brackeys Jam 2026.2, "Trust No One").
One file, no build step: open `index.html` or drop it on itch.io as an HTML5 game.

**Play it live:** <https://yana205.github.io/bbpt-mock/> — designer view: [`?mode=designer`](https://yana205.github.io/bbpt-mock/?mode=designer).
Every push to `main` rebuilds `index.html` from `src/page.html` and redeploys via GitHub Actions.

## What it is for
It is a **test instrument** for the GDD's open questions, not the final game:
1. Which tell type reads best? → **TELL LAB** (10 rapid claims, score screen).
2. Lie chance on floor 2? → `lie2` in the rail, seeded runs.
3. Punishment combat? → `combat` + `punishCombat` toggles (off by default).
4. Do 3 petals feel right? → `petals`, `labPetals`.

## Admin rail (press ` to hide/show)
- **Session** – playtest/designer mode (designer shows LIE/honest in the log; playtest hides it so testers can be measured), seed, time scale, SHARE LINK (URL with every non-default value, e.g. `?seed=42&tellType=redpixel`), COPY CONFIG (JSON → Unity `TuningSO`), EXPORT SESSION (JSON: config + every claim, decision, ms-to-decide + summary).
- **Rooms & cheats** – jump to room, +petal, clear dolls, unlock doors, reveal truth (red dot on the honest door/chest).
- **Trust & tells / Tell lab / Petals / Combat / Player / Palette** – every number in the GDD.

Any config key works as a URL param. `?room=lab` boots straight into the lab. A `?seed=` link opens with the rail hidden (playtest mode).

**Playtest mode is clean by design:** object labels appear only when the player is near them, and the floor caption, rule line, flow strip, and room tabs are designer-only. The first tell of a run lingers longer (`firstTellMs`, default 900 ms) — the teach is visual, no tutorial text.

## Reading a room (designer mode)
Top-left of the canvas: `FLOOR n · TEACH/CONTRADICT/BETRAY`. Every object is labelled and colour-typed: **pick** objects (chests, doors, cups — the thing the claim is about) are lilac boxes; **clues** (wall note, mirror) are pale with lines; **collectibles** (torn notes) are pale with red lines; locked doors are dark with a red pip.

Under the dialogue: the **rule line** (this floor's lie %, tell on/off, wrong → consequence) and the **flow strip** — the if/else, live:
`ENTER → CLAIM (says X · truth Y · LIE/honest) → TELL (fires / no tell + why) → YOU (trusted/doubted) → RESULT → NEXT`.
In playtest mode the truth column stays hidden until the player has chosen.

## Content import (2026-08-28) — from the "Bunny Boo Flow" artifact
Room content now matches the flow doc: floor 1 is the **guest room** (two named beds, key under a pillow, wrong = hair + ribbon), floor 2 is the **gallery** (RABBIT vs GIRL door, wall scratch, note 2 behind the one painting whose girl has no bunny), floor 3 is the **mirror room** (stairs vs small door behind the mirror; the face never tells — the reflected Boo wears the wrong face while the claim line is up). The three notes carry the real invitation fragments and assemble in the secret ending.

## Review run (2026-08-25) — what was missing vs the GDD, now fixed
- **The bunny wasn't in any room.** GDD §5: presence only (doorway / back of room) until floor 3, where it stands close. Now: lab — propped on the floor back-centre; floor 1 and doll room — sitting in the doorway beside the exit; floor 2 — under the wall note; floor 3 — standing next to you. Examining it repeats the claim (and re-fires the tell; `repeatTell` toggle). `tellInWorld` makes the in-room bunny flip too.
- **Torn notes were unreachable** (placed outside the walkable clamp) — secret ending was impossible. Moved inside.
- **Key had no feedback** — HUD now shows KEY, the chest draws open.
- **Combat-off doll room** now shows sleeping dolls labelled ASLEEP (was unlabelled rectangles).
- **Export bug:** tell events were recorded with `type: "faceflip"` instead of `type: "tell"`. Fixed; old exports undercount tells.

## The three candidates (rail → Scenario → Preset)
Trimmed from nine experiments to the three configurations the shipped game could actually be. Pick one from the rail (it restarts the run) or boot it from a URL.

| preset (`?scenario=`) | what it is | the decision it answers |
|---|---|---|
| **A — GDD baseline** (`teach`) | F1 always lies (tell) / F2 coin flip vs the wall scratch / F3 always lies, mirror is the only tell. No combat. | Does the designed teach→contradict→betray arc land? |
| **B — Combat on** (`fight`) | Same arc; combat only in the mandatory 3-doll playroom after floor 2 (wrong picks just cost a petal). Fleeing via the exit is free (`flee`). | Keep or cut combat by Friday? |
| **C — Double bluff** (`bluff`) | Coin-flip lies, tells everywhere, 30% false tells on honest lines. | Is "even the tell lies" fun or just unfair? |

Editing any lie/tell/wrong cell switches the preset to *custom*; SHARE LINK carries it. `?scenario=bluff&seed=9` applies a preset from the URL.

## Testing
```
npm install
PW_EXEC=/path/to/chrome npx playwright test   # or just: npm test (downloads Chromium)
```
`tests/smoke.spec.js` drives the game through `window.BB` (test hook): boot, seed determinism, floor-1 chest flow, a full 5-claim lab run with export, and combat-off doll room.

## Files
- `src/page.html` – source (no html/head/body; same content publishes as a Claude artifact)
- `index.html` – standalone build of the above
- `art/` – crops of the concept sheets used as sprites (data URIs inside the page)
