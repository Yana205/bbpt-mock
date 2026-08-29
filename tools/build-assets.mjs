// Regenerates the /*ART*/, /*AUDIO*/ and /*FONTS*/ blocks in src/page.html
// from art/runtime/*.png, audio/runtime/*.m4a and fonts/runtime/*.woff2.
// Drop a new file in, `npm run assets && npm run build`, done — no code edits.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'src/page.html';
const b64 = f => fs.readFileSync(f).toString('base64');
const key = f => path.basename(f, path.extname(f));

function block(dir, ext, mime) {
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort())
    out[key(f)] = `data:${mime};base64,${b64(path.join(dir, f))}`;
  return out;
}

const art = block('art/runtime', '.png', 'image/png');
const audio = block('audio/runtime', '.m4a', 'audio/mp4');

const fontsMeta = JSON.parse(fs.readFileSync('fonts/runtime/fonts.json', 'utf8'));
const fontCss = fontsMeta.map(f =>
  `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:swap;` +
  `src:url(data:font/woff2;base64,${b64(path.join('fonts/runtime', f.file))}) format('woff2');}`
).join('\n');

function splice(s, tag, body) {
  const a = s.indexOf(`/*${tag}:BEGIN*/`), b = s.indexOf(`/*${tag}:END*/`);
  if (a < 0 || b < 0) throw new Error(`marker ${tag} missing`);
  return s.slice(0, a) + `/*${tag}:BEGIN*/\n` + body + '\n' + s.slice(b);
}

let s = fs.readFileSync(SRC, 'utf8');
s = splice(s, 'ART', `const ART={};const ASSETS=${JSON.stringify(art)};`);
s = splice(s, 'AUDIO', `const AUDIO_SRC=${JSON.stringify(audio)};`);
s = splice(s, 'FONTS', fontCss);
fs.writeFileSync(SRC, s);
const kb = o => Math.round(Object.values(o).reduce((a, v) => a + v.length, 0) / 1024);
console.log(`assets: ${Object.keys(art).length} images (${kb(art)} KB), ${Object.keys(audio).length} audio (${kb(audio)} KB), ${fontsMeta.length} fonts`);
