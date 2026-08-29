// Smoke test for the Bunny Boo testbed. Run: npm test
// Drives the game through window.BB (test hook at the bottom of index.html).
const { test, expect } = require('@playwright/test');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function skip(page) { await page.evaluate(() => BB.skipDialog()); }
async function waitRoom(page, name) {
  await page.waitForFunction(n => BB.state.room && BB.state.room.name === n, name, { timeout: 5000 });
  await page.waitForFunction(() => BB.dialogOpen(), null, { timeout: 3000 }).catch(() => {});
}
async function useAt(page, x, y) {
  await page.evaluate(([x, y]) => { BB.teleport(x, y); BB.press('KeyZ'); }, [x, y]);
  await page.waitForTimeout(80);
}

test('boots into tea party with 3 petals and a hidden log in playtest mode', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await waitRoom(page, 'title');           // boot lands on the title card
  await page.evaluate(() => BB.press('Space'));
  await waitRoom(page, 'teaparty');
  expect(await page.evaluate(() => BB.state.petals)).toBe(3);
  expect(await page.locator('#hudMode').textContent()).toBe('PLAYTEST');
  await page.evaluate(() => { BB.state.room.items[0].use(); });
  await page.waitForTimeout(100);
  const logText = await page.locator('#log').textContent();
  expect(logText).not.toMatch(/LIE|honest/);
  expect(errors).toEqual([]);
});

test('seed makes claims deterministic', async ({ page }) => {
  const roll = async seed => {
    await page.goto(url + `?seed=${seed}&skipIntro=1&lie1=0.5`);
    await waitRoom(page, 'floor1');
    return page.evaluate(() => { const c = BB.roomClaim(); return c.said + c.truth; });
  };
  const a = await roll(7), b = await roll(7);
  expect(a).toBe(b);
});

test('floor 1: correct pillow unlocks door, wrong pillow costs a petal', async ({ page }) => {
  await page.goto(url + '?seed=3&skipIntro=1&lie1=1&wrong1=petal');
  await waitRoom(page, 'floor1');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  const wrong = truth === 'left' ? 'right' : 'left';
  const pos = { left: [70, 84], right: [234, 84] };
  await useAt(page, ...pos[wrong]);
  await page.waitForFunction(() => BB.state.petals === 2);
  await skip(page);
  await useAt(page, ...pos[truth]);
  await page.waitForFunction(() => BB.state.room.doors[0].locked === false);
  const s = await page.evaluate(() => BB.summary());
  expect(s.claims).toBe(1); // one claim, first decision counts
  expect(s.lies).toBe(1);
});

test('tell lab: runs N claims and produces a summary with a detection rate', async ({ page }) => {
  await page.goto(url + '?room=lab&seed=11&labClaims=5&mode=designer');
  await waitRoom(page, 'lab');
  await skip(page); // intro line
  for (let i = 0; i < 5; i++) {
    await page.waitForFunction(n => BB.session.claims.length === n && BB.dialogOpen(), i + 1);
    await skip(page);
    const truth = await page.evaluate(() => BB.roomClaim().truth);
    await useAt(page, truth === 'left' ? 68 : 252, 30);
  }
  await page.waitForFunction(() => BB.session.events.some(e => e.type === 'labDone'));
  const s = await page.evaluate(() => BB.summary());
  expect(s.claims).toBe(5);
  expect(s.correct).toBe(5);
  expect(s.liesCaught).toBe(s.lies);
  const exp = await page.evaluate(() => BB.exportSession());
  expect(exp.config.tellType).toBe('faceflip');
  expect(exp.claims.length).toBe(5);
});

test('combat off: doll room is a walk-through', async ({ page }) => {
  await page.goto(url + '?room=dollroom&seed=1&combat=0');
  await waitRoom(page, 'dollroom');
  expect(await page.evaluate(() => BB.state.dolls.length)).toBe(0);
  expect(await page.evaluate(() => BB.state.room.doors[0].locked)).toBe(false);
});

test('scenario "fight": wrong pick on floor 1 drops into a 2-doll punishment room', async ({ page }) => {
  await page.goto(url + '?seed=3&skipIntro=1&combat=1&wrong1=doll&lie1=1');
  await waitRoom(page, 'floor1');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  const wrong = truth === 'left' ? 'right' : 'left';
  await useAt(page, ...(wrong === 'left' ? [70, 84] : [234, 84]));
  await page.waitForFunction(() => BB.state.petals === 2);
  await skip(page);
  await waitRoom(page, 'dollroom');
  expect(await page.evaluate(() => BB.state.dolls.length)).toBe(2);
  expect(await page.evaluate(() => BB.state.room.doors[0].locked)).toBe(true);
});

test('scenario presets apply and the flow strip fills in', async ({ page }) => {
  await page.goto(url + '?seed=5&skipIntro=1&mode=designer');
  await waitRoom(page, 'floor1');
  await page.evaluate(() => BB.applyScenario('bluff'));
  expect(await page.evaluate(() => BB.cfg.falseTell)).toBe(0.3);
  const claimNode = await page.locator('#f1 .v').textContent();
  expect(claimNode).toMatch(/says (LEFT|RIGHT)/);
  expect(await page.locator('#rule').textContent()).toMatch(/FLOOR1/);
});

test('every torn note and the bunny are reachable inside the walkable area', async ({ page }) => {
  for (const room of ['floor1', 'floor2', 'floor3']) {
    await page.goto(url + `?seed=1&room=${room}&mode=designer`);
    await waitRoom(page, room);
    await skip(page);
    const ok = await page.evaluate(() => {
      const p = BB.state.player, items = BB.state.room.items.filter(i => i.id === 'note' || i.id === 'bunnyNpc');
      return items.every(it => {
        const cx = Math.max(42, Math.min(318 - 42 - p.w, it.x + it.w / 2 - p.w / 2)), cy = Math.max(22, Math.min(158 - p.h, it.y + it.h / 2 - p.h / 2));
        const d = Math.hypot(cx + p.w / 2 - (it.x + it.w / 2), cy + p.h / 2 - (it.y + it.h / 2));
        return d < BB.cfg.reach + Math.max(it.w, it.h) / 2;
      });
    });
    expect(ok, room).toBe(true);
  }
});

test('examining the bunny repeats the claim and re-fires the tell', async ({ page }) => {
  await page.goto(url + '?seed=3&skipIntro=1&lie1=1&mode=designer');
  await waitRoom(page, 'floor1');
  await skip(page);
  const before = await page.evaluate(() => BB.session.events.filter(e => e.type === 'tell').length);
  await useAt(page, 108, 32);
  await page.waitForTimeout(200);
  await page.evaluate(() => BB.press('KeyZ')); await page.waitForTimeout(100);   // finish line 1
  await page.evaluate(() => BB.press('KeyZ')); await page.waitForTimeout(400);   // advance to the claim line → tell
  await page.waitForFunction(n => BB.session.events.filter(e => e.type === 'tell').length > n, before, { timeout: 5000 });
  expect(await page.evaluate(() => BB.state.tellSeen)).toBe(true); // first-tell teach consumed
});

test('floor 2 gallery: rabbit/girl doors, wall scratch contradicts the bunny', async ({ page }) => {
  await page.goto(url + '?seed=4&room=floor2&mode=designer&note2=contradict');
  await waitRoom(page, 'floor2');
  await skip(page);
  const c = await page.evaluate(() => BB.roomClaim());
  expect(['rabbit', 'girl']).toContain(c.said);
  expect(['rabbit', 'girl']).toContain(c.truth);
  await useAt(page, 150, 72); // the wall scratch
  await page.waitForFunction(() => BB.session.events.some(e => e.type === 'worldClaim'));
  const ev = await page.evaluate(() => BB.session.events.find(e => e.type === 'worldClaim'));
  expect(ev.said).not.toBe(c.said); // contradict mode: scratch never agrees with Boo
});

test('floor 3: the mirror carries the tell, wrong pick throws you back into the room', async ({ page }) => {
  await page.goto(url + '?seed=2&room=floor3&mode=designer&lie3=1&tell3=0&wrong3=petal');
  await waitRoom(page, 'floor3');
  await skip(page);
  // no face tell, but the world tell fired: the reflection wears the wrong face
  expect(await page.evaluate(() => BB.state.room.mirrorTell)).toBe(true);
  expect(await page.evaluate(() => BB.session.events.some(e => e.type === 'tell' && e.tellType === 'mirror'))).toBe(true);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  const pos = { door: [62, 30], stairs: [244, 30] };
  await useAt(page, ...pos[truth === 'door' ? 'stairs' : 'door']);
  await page.waitForFunction(() => BB.state.petals === 2);
  await skip(page);
  expect(await page.evaluate(() => BB.state.room.name)).toBe('floor3');
});

test('three notes assemble the invitation: secret ending fires', async ({ page }) => {
  await page.goto(url + '?seed=6&room=floor3&mode=designer&lie3=0&tell3=0');
  await waitRoom(page, 'floor3');
  await skip(page);
  await page.evaluate(() => { ['floor1', 'floor2', 'floor3'].forEach(n => BB.state.notes.add(n)); });
  const truth = await page.evaluate(() => BB.roomClaim().truth); // honest roll: said === truth
  const pos = { door: [62, 30], stairs: [244, 30] };
  await useAt(page, ...pos[truth]);
  await page.waitForFunction(() => BB.session.events.some(e => e.type === 'ending' && e.secret === true), null, { timeout: 5000 });
});

test('doll room: Space swings mid-fight, and the locked exit can be fled for free', async ({ page }) => {
  await page.goto(url + '?room=dollroom&seed=1&combat=1&dollSpeed=0&mode=designer');
  await waitRoom(page, 'dollroom');
  await skip(page);
  expect(await page.evaluate(() => BB.state.dolls.length)).toBe(3);
  // away from doors/items, Space is an attack, not an examine
  await page.evaluate(() => { BB.teleport(100, 120); BB.press('Space'); });
  await page.waitForFunction(() => BB.state.atk.cd > 0);
  expect(await page.evaluate(() => BB.dialogOpen())).toBe(false);
  // at the locked exit, Z flees: free by default, on to floor 3
  await page.evaluate(() => { BB.teleport(148, 30); BB.press('KeyZ'); });
  await page.waitForFunction(() => BB.dialogOpen());
  await skip(page);
  await waitRoom(page, 'floor3');
  expect(await page.evaluate(() => BB.state.petals)).toBe(3); // flee cost nothing
});

test('floor 2 after punishment: claim re-rolls and the doors work again', async ({ page }) => {
  await page.goto(url + '?room=floor2&seed=5&combat=1&wrong2=doll&lie2=1&dollSpeed=0&mode=designer');
  await waitRoom(page, 'floor2');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  const pos = { rabbit: [62, 30], girl: [246, 30] };
  await useAt(page, ...pos[truth === 'rabbit' ? 'girl' : 'rabbit']); // wrong on purpose
  await page.waitForFunction(() => BB.state.petals === 2);
  await skip(page);
  await waitRoom(page, 'dollroom');
  await skip(page);
  await page.evaluate(() => { BB.teleport(148, 30); BB.press('KeyZ'); }); // flee the punishment (free)
  await page.waitForFunction(() => BB.dialogOpen());
  await skip(page);
  await waitRoom(page, 'floor2');
  await skip(page);
  const c = await page.evaluate(() => BB.roomClaim());
  expect(c).not.toBeNull(); // the bug: claim was null after punishment, so doors were dead
  await useAt(page, ...pos[c.truth]);
  await waitRoom(page, 'dollroom'); // correct door progresses again
});

test('scenario B: a wrong pillow costs a petal but stays on the floor — no punishment room', async ({ page }) => {
  await page.goto(url + '?scenario=fight&seed=3&skipIntro=1&mode=designer');
  await waitRoom(page, 'floor1');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  const pos = { left: [70, 84], right: [234, 84] };
  await useAt(page, ...pos[truth === 'left' ? 'right' : 'left']); // wrong on purpose
  await page.waitForFunction(() => BB.state.petals === 2);
  await skip(page);
  expect(await page.evaluate(() => BB.state.room.name)).toBe('floor1'); // still here, no doll room
});

test('key pickup: soft fx spawns, HUD swaps the em-dash for the pixel key', async ({ page }) => {
  await page.goto(url + '?seed=3&skipIntro=1&lie1=1');
  await waitRoom(page, 'floor1');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  await useAt(page, ...(truth === 'left' ? [70, 84] : [234, 84]));
  await page.waitForFunction(() => BB.state.key === true);
  expect(await page.evaluate(() => BB.fxCount())).toBeGreaterThan(0);   // floating key
  expect(await page.evaluate(() => BB.state.glow > 0)).toBe(true);      // pale glow, not red scare
  expect(await page.evaluate(() => BB.state.scare > 0)).toBe(false);
  expect(await page.locator('#hudKey canvas').count()).toBe(1);         // pixel icon, no emoji
});

test('end card: ending shows stats screen, Space returns to the title', async ({ page }) => {
  await page.goto(url + '?seed=6&room=floor3&mode=designer&lie3=0&tell3=0');
  await waitRoom(page, 'floor3');
  await skip(page);
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  await useAt(page, ...(truth === 'door' ? [62, 30] : [244, 30]));
  await waitRoom(page, 'ending');
  await skip(page);
  await waitRoom(page, 'endcard');
  await page.evaluate(() => BB.press('Space'));
  await waitRoom(page, 'title');
});

test('release mode: testbed chrome is gone, sound button stays', async ({ page }) => {
  await page.goto(url + '?release=1&seed=1');
  await waitRoom(page, 'title');
  expect(await page.locator('.topbar').isVisible()).toBe(false);
  expect(await page.locator('#hudMode').isVisible()).toBe(false);
  expect(await page.locator('#bSound').isVisible()).toBe(true);
  // backtick must not reveal the admin rail in release
  await page.keyboard.press('Backquote');
  expect(await page.locator('#app').getAttribute('class')).toContain('norail');
});

test('audio: music follows the room (music box up top, drone in the house), M toggles sound', async ({ page }) => {
  await page.goto(url + '?seed=1');
  await waitRoom(page, 'title');
  expect(await page.evaluate(() => BB.audio.track())).toBe('musicbox');
  await page.evaluate(() => BB.goto('floor1'));
  await waitRoom(page, 'floor1');
  expect(await page.evaluate(() => BB.audio.track())).toBe('drone');
  await page.keyboard.press('m');
  await page.waitForFunction(() => !BB.audio.on());
  expect(await page.evaluate(() => BB.audio.track())).toBe(null);
  expect(await page.locator('#bSound').textContent()).toBe('SOUND OFF');
});

test('layout editor: dragging a prop in designer mode persists across reload', async ({ page }) => {
  const u = url + '?seed=1&room=teaparty&mode=designer';
  await page.goto(u);
  await waitRoom(page, 'teaparty');
  await skip(page);
  const box = await page.locator('#game').boundingBox();
  const s = box.width / 320;
  const before = await page.evaluate(() => BB.state.room.deco.at(-1).x); // the plush
  await page.mouse.move(box.x + (before + 22) * s, box.y + 94 * s);
  await page.mouse.down();
  await page.mouse.move(box.x + (before - 40) * s, box.y + 94 * s, { steps: 4 });
  await page.mouse.up();
  const after = await page.evaluate(() => BB.state.room.deco.at(-1).x);
  expect(after).toBeLessThan(before);
  await page.goto(u); // reload: saved layout re-applies
  await waitRoom(page, 'teaparty');
  expect(await page.evaluate(() => BB.state.room.deco.at(-1).x)).toBe(after);
  await page.click('#cLayReset'); // reset restores the baked-in layout
  await waitRoom(page, 'teaparty');
  expect(await page.evaluate(() => BB.state.room.deco.at(-1).x)).toBe(before);
});

test('top bar: room tabs switch rooms, PLAY/EDIT toggles the rail', async ({ page }) => {
  await page.goto(url + '?seed=1&mode=designer');
  await waitRoom(page, 'title');
  await page.evaluate(() => BB.press('Space'));
  await waitRoom(page, 'teaparty');
  await page.click('.tab[data-room="floor2"]');
  await waitRoom(page, 'floor2');
  expect(await page.locator('.tab.cur').textContent()).toBe('FLOOR 2');
  await page.click('#mPlay');
  expect(await page.locator('#app').getAttribute('class')).toContain('norail');
  expect(await page.locator('#hudMode').textContent()).toBe('PLAYTEST');
  await page.click('#mEdit');
  expect(await page.locator('#app').getAttribute('class')).not.toContain('norail');
});

test('editor v2: selecting art shows the inspector, moving it carries its hotspot, undo restores both', async ({ page }) => {
  await page.goto(url + '?seed=1&room=teaparty&mode=designer');
  await waitRoom(page, 'teaparty');
  await skip(page);
  const ok = await page.evaluate(() => BB.editor.select('deco', 'girl'));
  expect(ok).toBe(true);
  expect(await page.locator('#insWin').getAttribute('class')).not.toContain('hidden');
  expect(await page.locator('#insBody').textContent()).toContain('girlA'); // "carries hotspots: girlA"
  const before = await page.evaluate(() => {
    const g = BB.state.room.deco.find(d => d._id === 'girl'), a = BB.state.room.items.find(i => i.id === 'girlA');
    return { gx: g.x, gy: g.y, ax: a.x, ay: a.y };
  });
  await page.evaluate(b => BB.editor.move(b.gx + 10, b.gy - 5), before);
  const after = await page.evaluate(() => {
    const g = BB.state.room.deco.find(d => d._id === 'girl'), a = BB.state.room.items.find(i => i.id === 'girlA');
    return { gx: g.x, gy: g.y, ax: a.x, ay: a.y };
  });
  expect(after.gx).toBe(before.gx + 10);
  expect(after.ax).toBe(before.ax + 10);   // hotspot travelled with the art
  expect(after.ay).toBe(before.ay - 5);
  const lay = await page.evaluate(() => BB.editor.layout());
  expect(lay.teaparty.items.girlA.x).toBe(after.ax); // persisted
  await page.evaluate(() => BB.editor.undo());
  const undone = await page.evaluate(() => {
    const g = BB.state.room.deco.find(d => d._id === 'girl'), a = BB.state.room.items.find(i => i.id === 'girlA');
    return { gx: g.x, ax: a.x };
  });
  expect(undone.gx).toBe(before.gx);
  expect(undone.ax).toBe(before.ax);
});

test('editor v2: per-item interact radius override changes what the player can reach', async ({ page }) => {
  await page.goto(url + '?seed=3&skipIntro=1&lie1=1');
  await waitRoom(page, 'floor1');
  await skip(page);
  // stand well outside the default radius (reach 14 + 8 = 22 from the pillow centre)
  const far = await page.evaluate(() => {
    const it = BB.state.room.items.find(i => i.id === 'left');
    BB.teleport(it.x + it.w / 2 + 35 - 5, it.y + it.h / 2 - 7); BB.press('KeyZ');
    return BB.dialogOpen();
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => BB.dialogOpen())).toBe(false);
  await page.evaluate(() => { BB.state.room.items.find(i => i.id === 'left').reach = 40; BB.press('KeyZ'); });
  await page.waitForFunction(() => BB.dialogOpen()); // now in range: the pillow answers
});

test('music: per-room override beats the global pick and inherit falls back', async ({ page }) => {
  await page.goto(url + '?seed=1&skipIntro=1&sound=1');
  await waitRoom(page, 'floor1');
  await page.keyboard.press('a'); // gesture unlocks audio
  await page.waitForFunction(() => BB.audio.track() === 'drone');
  await page.evaluate(() => BB.music.set('floor1', 'musicbox'));
  await page.waitForFunction(() => BB.audio.track() === 'musicbox');
  await page.evaluate(() => BB.music.set('floor1', null));
  await page.waitForFunction(() => BB.audio.track() === 'drone');
  await page.evaluate(() => BB.music.set('floor1', 'off'));
  await page.waitForFunction(() => BB.audio.track() === null);
});

test('tea party proportions: teaScale shrinks art, hotspots and spawn together', async ({ page }) => {
  await page.goto(url + '?seed=1&room=teaparty&teaScale=0.5');
  await waitRoom(page, 'teaparty');
  const half = await page.evaluate(() => {
    const a = BB.state.room.items.find(i => i.id === 'girlA');
    return { scale: BB.state.room.artScale, w: a.w, x: a.x, spawn: BB.state.room.spawn.y };
  });
  expect(half.scale).toBe(0.5);
  expect(half.w).toBe(6); // 12 × 0.5
  await page.goto(url + '?seed=1&room=teaparty&teaScale=1');
  await waitRoom(page, 'teaparty');
  const full = await page.evaluate(() => {
    const a = BB.state.room.items.find(i => i.id === 'girlA');
    return { scale: BB.state.room.artScale, w: a.w, x: a.x };
  });
  expect(full.scale).toBe(1);
  expect(full.w).toBe(12);
  expect(full.x).not.toBe(half.x); // positions zoom about the pivot too
});

test('cards are config-driven: title text/color edits render without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=1&titleText=HELLO%20BOO&titleColor=%239a86c4&titleFont=Atkinson%20Hyperlegible&mode=designer');
  await waitRoom(page, 'title');
  expect(await page.evaluate(() => BB.cfg.titleText)).toBe('HELLO BOO');
  expect(await page.locator('[data-cfg="titleText"]').inputValue()).toBe('HELLO BOO');
  await page.waitForTimeout(300); // let a few title frames draw with the custom font/color
  expect(errors).toEqual([]);
});

test('horror floors: the purple-remapped charRef stands in for the rect player (and can be turned off)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?seed=1&skipIntro=1&sprChar=1');
  await waitRoom(page, 'floor1');
  await skip(page);
  await page.waitForTimeout(200); // frames draw the remapped sprite
  await page.goto(url + '?seed=1&skipIntro=1&sprChar=0');
  await waitRoom(page, 'floor1');
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test('title card: text/bunny are selectable card elements — inspector edits, drag moves', async ({ page }) => {
  await page.goto(url + '?seed=1&room=title&mode=designer');
  await waitRoom(page, 'title');
  // entering a card screen in EDIT auto-opens the inspector with a hint
  expect(await page.locator('#insWin').getAttribute('class')).not.toContain('hidden');
  expect(await page.locator('#insBody').textContent()).toContain('card screen');
  expect(await page.evaluate(() => BB.editor.select('card', 'titleText'))).toBe(true);
  expect(await page.locator('#insBody').textContent()).toContain('TITLE TEXT');
  await page.evaluate(() => BB.editor.move(0, 80)); // text is centered: only Y moves
  expect(await page.evaluate(() => BB.cfg.titleY)).toBe(80);
  await page.evaluate(() => BB.editor.undo());
  expect(await page.evaluate(() => BB.cfg.titleY)).toBe(62);
  expect(await page.evaluate(() => BB.editor.select('card', 'bunny'))).toBe(true);
  await page.evaluate(() => BB.editor.move(150, 90));
  expect(await page.evaluate(() => [BB.cfg.bunnyX, BB.cfg.bunnyY])).toEqual([150, 90]);
});
