// src/page.html → index.html
const fs = require('fs');
const s = fs.readFileSync('src/page.html', 'utf8');
const head = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n';
const i = s.indexOf('<div class="app"');
fs.writeFileSync('index.html', head + s.slice(0, i) + '</head>\n<body>\n' + s.slice(i) + '\n</body>\n</html>\n');
console.log('built index.html');
