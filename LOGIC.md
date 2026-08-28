# Bunny Boo — the logic, in one page

## The one loop (every room is this)
```
ENTER room
  └─ speaker makes a CLAIM about the room        truth ← rng pick of {A,B}
       lie   ← rng < lie%(floor)                  said  ← lie ? other : truth
       tell  ← tellOn(floor) && tellType≠none && (lie || rng < falseTell)
  └─ TELL fires on the claim line for tellMs (after tellDelayMs)
       faceflip | redpixel | textglitch | candle | none
       world tells: floor-2 wall note / candle carry the tell when *they* lie
  └─ YOU walk to A or B and press Z                → recorded: chosen, followed(said), ms since claim
  └─ RESULT  chosen == truth ?
       yes → progress (key → exit unlocks | door → next room)
       no  → wrong→ rule for that floor:
               scare   : red flash only
               petal   : −1 petal + flash          (0 petals → floor restarts, claims re-rolled)
               doll    : −1 petal + 2-doll punishment room (needs combat on), then back
```

## Floors (defaults = GDD v0 preset)
| floor | claim about | speaker | lie% | tell | wrong → | extra |
|---|---|---|---|---|---|---|
| 0 tea party | which CUP is sweet | Vivi (girl) | 100 | on | nothing | Mara foreshadows; bunny doll in corner; any cup → basement |
| 1 guest room (teach) | which PILLOW hides the key | bunny (doorway) | 100 | on | petal | two beds, names stitched in; wrong = hair + ribbon; key unlocks EXIT; note 1 |
| 2 gallery (contradict) | RABBIT door vs GIRL door | bunny + WALL SCRATCH | 50 | on | petal | scratch contradicts / agrees / truth / off; liar carries the tell; note 2 behind the bunny-less painting; correct → doll room |
| doll room | — | bunny (doorway) | — | — | — | combat on: 3 dolls, clear to unlock; off: walk-through |
| 3 mirror room (betray) | STAIRS vs SMALL DOOR behind the mirror | bunny (standing, close) | 100 | **off** | petal | face never tells; the reflected Boo wears the wrong face while the claim line is up (`worldTells`); note 3 behind the mirror |
| ending | — | — | — | — | — | 3 notes → the invitation assembles → secret ending; else grey-morning normal; run resets |

## Tell lab
`room=lab`: N rapid claims (`labClaims`, default 10) at `labLie` (0.5), same tell settings, two doors. Ends with score: doors right, lies caught / lies, false alarms / honest, avg ms. `labPetals` makes misses cost petals.

## Metrics (in every export)
`detectionRate = liesCaught / lies` · `falseAlarmRate = falseAlarms / honest` · `avgMsToDecide` · per-claim `followed` (did they trust the speaker) and `correct`.

## Scenario presets — the three candidates
`teach` (A — GDD baseline) · `fight` (B — combat on, doll punishment) · `bluff` (C — double bluff, 30% false tells). Picking a preset restarts the run. Anything else is reachable by hand-editing the per-floor grid (→ *custom*).

## Config keys
Session: `mode seed timeScale skipIntro` · Tells: `tellType tellMs tellDelayMs falseTell worldTells repeatTell tellInWorld` · Per floor n∈0..3: `lie{n} tell{n} wrong{n}` + `note2` · Lab: `labClaims labLie labPetals` · Petals: `petals punishDolls scareMs` · Combat: `combat dolls dollSpeed dollHp atkReach atkActive atkCd knock hurtCd flee` · Player: `speed reach textSpeed` · Palette: `cInk cPlum cMid cLilac cPale cRed`.
Any key works as a URL param; `room=` and `scenario=` too.
