// src/page.html → index.html (+ `node build.js itch` → dist/bunny-boo-itch.zip with release mode on)
const fs = require('fs');
const s = fs.readFileSync('src/page.html', 'utf8');
const head = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n';
const i = s.indexOf('<div class="app"');
const page = head + s.slice(0, i) + '</head>\n<body>\n' + s.slice(i) + '\n</body>\n</html>\n';
fs.writeFileSync('index.html', page);
console.log('built index.html');
if (process.argv[2] === 'itch') {
  // the itch upload is the same file with release chrome on by default
  let rel = page.replace('skipIntro:false,release:false,', 'skipIntro:false,release:true,');
  if (rel === page) throw new Error('release flag not found in DEF');
  // the early-classes script (first paint, before the big blocks parse) gets the same default
  const rel2 = rel.replace('let rel=false;/*RELDEF*/', 'let rel=true;/*RELDEF*/');
  if (rel2 === rel) throw new Error('RELDEF marker not found in the early script');
  rel = rel2;
  fs.mkdirSync('dist/itch', { recursive: true });
  fs.writeFileSync('dist/itch/index.html', rel);
  const { execSync } = require('child_process');
  // -X: no macOS extended attributes; delete any stale zip first so entries never accumulate.
  // itch needs index.html at the ROOT of the zip — never re-compress the folder in Finder (that nests itch/ + __MACOSX and itch fails with "Failed to find index.html").
  execSync('rm -f dist/bunny-boo-itch.zip && cd dist/itch && zip -q -X ../bunny-boo-itch.zip index.html');
  console.log('built dist/bunny-boo-itch.zip (upload to itch.io as HTML5, viewport 960×720)');
}
