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
| 1 teach | which CHEST has the key | bunny (doorway) | 100 | on | petal | key unlocks EXIT; torn note |
| 2 contradict | which DOOR | bunny (back wall) + WALL NOTE | 50 | on | petal | note contradicts / agrees / truth / off; liar carries the tell; correct → doll room |
| doll room | — | bunny (doorway) | — | — | — | combat on: 3 dolls, clear to unlock; off: walk-through |
| 3 betray | which DOOR goes home | bunny (standing, close) | 100 | **off** | petal | "I have never lied to you." mirror; torn note |
| ending | — | — | — | — | — | 3 torn notes → secret ending; run resets |

## Tell lab
`room=lab`: N rapid claims (`labClaims`, default 10) at `labLie` (0.5), same tell settings, two doors. Ends with score: doors right, lies caught / lies, false alarms / honest, avg ms. `labPetals` makes misses cost petals.

## Metrics (in every export)
`detectionRate = liesCaught / lies` · `falseAlarmRate = falseAlarms / honest` · `avgMsToDecide` · per-claim `followed` (did they trust the speaker) and `correct`.

## Scenario presets (what each answers)
teach (GDD v0) · fair (tell on F3 too) · coin (50% everywhere) · wolf (honest, honest, lie) · bluff (30% false tells) · late (tell 900 ms late) · world (honest bunny, lying note) · fight (combat + doll punishment) · gentle (scare only)

## Config keys
Session: `mode seed timeScale skipIntro` · Tells: `tellType tellMs tellDelayMs falseTell worldTells repeatTell tellInWorld` · Per floor n∈0..3: `lie{n} tell{n} wrong{n}` + `note2` · Lab: `labClaims labLie labPetals` · Petals: `petals punishDolls scareMs` · Combat: `combat dolls dollSpeed dollHp atkReach atkActive atkCd knock hurtCd` · Player: `speed reach textSpeed` · Palette: `cInk cPlum cMid cLilac cPale cRed`.
Any key works as a URL param; `room=` and `scenario=` too.
