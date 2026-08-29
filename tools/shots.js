// Visual QA snapshots → scratch dir. Run: node tools/shots.js <outdir>
const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
const out = process.argv[2] || '.';

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1100, height: 820 } });
  const shot = n => page.screenshot({ path: path.join(out, n + '.png') });
  const waitRoom = n => page.waitForFunction(x => BB.state.room && BB.state.room.name === x, n);

  // 1. title (release)
  await page.goto(url + '?release=1&seed=3');
  await waitRoom('title');
  await page.waitForTimeout(700);
  await shot('1_title');

  // 2. tea party, intro dialog visible
  await page.evaluate(() => BB.press('Space'));
  await waitRoom('teaparty');
  await page.waitForTimeout(1800);
  await shot('2_teaparty_intro');
  await page.evaluate(() => BB.skipDialog());
  await page.waitForTimeout(300);
  await shot('3_teaparty_room');

  // 3. Vivi claim (portrait + tell moment): talk, screenshot right as tell may fire
  await page.evaluate(() => { BB.teleport(100, 80); BB.press('KeyZ'); });
  await page.waitForTimeout(500);
  await page.evaluate(() => BB.press('KeyZ'));   // finish line 1
  await page.waitForTimeout(150);
  await page.evaluate(() => BB.press('KeyZ'));   // to claim line
  await page.waitForTimeout(300);
  await shot('4_vivi_claim');

  // 4. floor1 key pickup fx (freeze frame mid-float)
  await page.goto(url + '?seed=3&skipIntro=1&lie1=1');
  await waitRoom('floor1');
  await page.waitForTimeout(800);   // let the room fade-in finish
  await page.evaluate(() => BB.skipDialog());
  const truth = await page.evaluate(() => BB.roomClaim().truth);
  await page.evaluate(t => { BB.teleport(t === 'left' ? 70 : 234, 84); BB.press('KeyZ'); }, truth);
  await page.waitForFunction(() => BB.state.key === true);
  await page.waitForTimeout(220);   // fx mid-flight
  await shot('5_key_fx');

  // 5. endcard
  await page.goto(url + '?seed=6&room=floor3&lie3=0&tell3=0&release=1');
  await waitRoom('floor3');
  await page.evaluate(() => BB.skipDialog());
  const t3 = await page.evaluate(() => BB.roomClaim().truth);
  await page.evaluate(t => { BB.teleport(t === 'door' ? 62 : 244, 30); BB.press('KeyZ'); }, t3);
  await waitRoom('ending');
  await page.evaluate(() => BB.skipDialog());
  await waitRoom('endcard');
  await page.waitForTimeout(700);
  await shot('6_endcard');

  // 6. designer rail with the music buttons
  await page.goto(url + '?seed=1&mode=designer&skipIntro=1');
  await waitRoom('floor1');
  await page.waitForTimeout(400);
  await shot('7_designer');

  await b.close();
  console.log('shots done →', out);
})();
