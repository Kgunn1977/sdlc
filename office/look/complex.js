/* Look: comes from the design. A new design replaces this file. */
/* The office complex map (designer's art, 2026-11-05): native 320 x 240, 16 px tiles, fillRect only, 1 px #100C20 outlines.
   Only these pieces are taken from the design; the game places and names the buildings. */
'use strict';
const COMPLEX = (function(){
const PLOTS = [
  { x: 16, y: 26 }, { x: 96, y: 26 }, { x: 176, y: 26 }, { x: 256, y: 26 },
  { x: 16, y: 120 }, { x: 96, y: 120 }, { x: 176, y: 120 }, { x: 256, y: 120 }
];
/* Each plot is 48 x 48. The name board (44 x 9) stands on the roof at signSpot(plot, style).
   The waiting marker goes at (plot.x + 40, sign y - 11); the you-are-here arrow at (plot.x + 21, sign y - 11). */
const SIGN_Y = [-9, -12, -13, -7];
function signSpot(plot, style){ return { x: plot.x + 2, y: plot.y + SIGN_Y[((style | 0) % 4 + 4) % 4] }; }

const PAL = {
  O: '#100C20', white: '#FCFCFC', gold: '#FCBC3C', sky: '#3CBCFC', blue: '#5878C8',
  red: '#F83800', green: '#58D854', grey: '#A8A8B8', wood: '#8C5030', lwood: '#C88050',
  goldL: '#FCE08C', goldD: '#C88C1C', skyL: '#A8E4FC', skyD: '#2A7CB0', skyDD: '#1C4A70',
  blueL: '#8CA4E0', blueD: '#3A5090', redL: '#FC7858', redD: '#A82410',
  greenL: '#7CE070', grass: '#3E9440', grassL: '#4AA84A', grassD: '#327A36', grassDD: '#245C2A',
  leaf: '#2E8A34', leafD: '#1E5A24',
  greyL: '#C4C4D0', greyLL: '#E0E0E8', greyD: '#8C8C9C', greyDD: '#5C5C6C', asphalt: '#4A4A56', asphaltD: '#3A3A46',
  woodD: '#5C3418', lwoodL: '#E0A878', brick: '#A84830', brickD: '#7A3020', brickL: '#C86848',
  winDark: '#28304C', winDarkL: '#4A5878'
};

function R(ctx, x, y, w, h, c){ ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function box(ctx, x, y, w, h, fill){ R(ctx, x, y, w, h, PAL.O); R(ctx, x + 1, y + 1, w - 2, h - 2, fill); }
function hash(x, y){ let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function bitmap(ctx, x, y, rows, colors){ rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = colors[r[i]]; if (c) R(ctx, x + i, y + j, 1, 1, c); } }); }

/* ---------- The complex background ---------- */
function drawTree(ctx, x, y){
  R(ctx, x + 2, y + 17, 13, 3, PAL.grassDD);
  box(ctx, x + 6, y + 12, 4, 7, PAL.wood); R(ctx, x + 7, y + 13, 1, 5, PAL.lwood);
  bitmap(ctx, x, y, [
    '....OOOOOOO.....',
    '..OOgggLLggOO...',
    '.OggLLLLLgggggO.',
    '.OgLLgggggggggO.',
    'OggggggggggggggO',
    'OgggggggggggddgO',
    'OggggggggggdddgO',
    'OggggggggddddddO',
    '.OgggggddddddO..',
    '.OOddddddddOOO..',
    '...OOOOOOOO.....'
  ], { O: PAL.O, g: PAL.leaf, L: PAL.green, d: PAL.leafD });
}
function drawBush(ctx, x, y){
  R(ctx, x + 1, y + 6, 10, 2, PAL.grassDD);
  bitmap(ctx, x, y, ['..OOOOOO..', '.OgLLgggO.', 'OggggggddO', 'OgggggdddO', '.OOddddOO.', '..OOOOOO..'], { O: PAL.O, g: PAL.leaf, L: PAL.green, d: PAL.leafD });
}
function drawCar(ctx, x, y, body){
  const dark = body === PAL.red ? PAL.redD : body === PAL.blue ? PAL.blueD : PAL.greyD;
  R(ctx, x + 1, y + 19, 10, 2, PAL.asphaltD);
  box(ctx, x, y, 12, 20, body);
  R(ctx, x + 1, y + 1, 10, 1, PAL.white);
  box(ctx, x + 2, y + 4, 8, 4, PAL.skyDD); R(ctx, x + 3, y + 5, 3, 1, PAL.sky);
  R(ctx, x + 2, y + 9, 8, 5, dark); R(ctx, x + 3, y + 9, 6, 1, body);
  box(ctx, x + 2, y + 14, 8, 3, PAL.skyDD);
  R(ctx, x + 1, y + 18, 2, 1, PAL.red); R(ctx, x + 9, y + 18, 2, 1, PAL.red);
}
function drawLamp(ctx, x, y){
  R(ctx, x + 1, y + 13, 4, 1, PAL.grassDD);
  box(ctx, x + 1, y + 3, 3, 11, PAL.greyD);
  box(ctx, x, y, 5, 4, PAL.greyDD); R(ctx, x + 1, y + 2, 3, 1, PAL.goldL);
}
function path(ctx, x, y, w, h){
  R(ctx, x, y, w, h, PAL.greyL);
  for (let i = x; i < x + w; i += 8) R(ctx, i, y, 1, h, PAL.grey);
  for (let j = y; j < y + h; j += 8) R(ctx, x, j, w, 1, PAL.grey);
  R(ctx, x, y, w, 1, PAL.greyLL);
}
function drawComplex(ctx){
  R(ctx, 0, 0, 320, 240, PAL.grass);
  for (let y = 0; y < 240; y += 2) for (let x = 0; x < 320; x += 2) { const h = hash(x, y); if (h < 0.08) R(ctx, x, y, 1, 1, PAL.grassD); else if (h > 0.93) R(ctx, x, y, 1, 1, PAL.grassL); }
  PLOTS.forEach(p => { for (let i = 0; i < 48; i += 8) R(ctx, p.x, p.y + i, 48, 4, PAL.grassL); R(ctx, p.x, p.y + 48, 48, 1, PAL.grassD); });
  path(ctx, 8, 88, 304, 8);
  path(ctx, 8, 180, 304, 8);
  path(ctx, 76, 96, 8, 84);
  path(ctx, 236, 96, 8, 84);
  PLOTS.forEach(p => path(ctx, p.x + 20, p.y + 48, 8, 14));
  R(ctx, 0, 188, 320, 26, PAL.asphalt);
  R(ctx, 0, 188, 320, 1, PAL.greyD);
  for (let x = 8; x <= 312; x += 16) R(ctx, x, 191, 1, 20, PAL.white);
  R(ctx, 0, 212, 320, 2, PAL.greyL);
  R(ctx, 0, 214, 320, 26, PAL.asphaltD);
  R(ctx, 0, 214, 320, 1, PAL.greyDD);
  for (let x = 4; x < 320; x += 20) R(ctx, x, 226, 10, 2, PAL.gold);
  R(ctx, 0, 238, 320, 2, PAL.greyD);
  drawCar(ctx, 26, 191, PAL.red); drawCar(ctx, 106, 191, PAL.blue); drawCar(ctx, 202, 191, PAL.grey); drawCar(ctx, 282, 191, PAL.blue);
  [[66, 28], [66, 54], [146, 34], [226, 28], [226, 54], [152, 126]].forEach(([x, y]) => drawTree(ctx, x, y));
  [[0, 4], [306, 4], [0, 140], [306, 140], [86, 140], [246, 140], [144, 162], [166, 162]].forEach(([x, y]) => drawBush(ctx, x, y));
  [[150, 72], [164, 72], [68, 164], [248, 164]].forEach(([x, y]) => drawLamp(ctx, x, y));
}

/* ---------- Buildings, 48 x 48, styles 0 to 3, windows dark or lit ---------- */
function win(ctx, x, y, w, h, lit, frame){
  R(ctx, x, y, w, h, frame || PAL.O);
  R(ctx, x + 1, y + 1, w - 2, h - 2, lit ? PAL.gold : PAL.winDark);
  R(ctx, x + 1, y + 1, w - 2, 1, lit ? PAL.goldL : PAL.winDarkL);
  if (w >= 6) R(ctx, x + (w >> 1), y + 1, 1, h - 2, frame || PAL.O);
}
function apron(ctx, x, y){ R(ctx, x + 1, y + 44, 46, 4, PAL.greyL); R(ctx, x + 1, y + 44, 46, 1, PAL.greyLL); R(ctx, x + 1, y + 47, 46, 1, PAL.grey); }
function door(ctx, x, y, w, h, lit, fill){
  box(ctx, x, y, w, h, fill || PAL.skyDD);
  R(ctx, x + 1, y + 1, w - 2, h - 3, lit ? PAL.goldL : (fill ? fill : PAL.skyDD));
  if (!fill) { R(ctx, x + (w >> 1), y + 1, 1, h - 2, PAL.O); R(ctx, x + 1, y + 1, 1, h - 3, lit ? PAL.white : PAL.sky); }
  R(ctx, x - 1, y + h, w + 2, 1, PAL.greyD);
}
function drawStartup(ctx, x, y, lit){
  apron(ctx, x, y);
  R(ctx, x + 5, y + 43, 40, 2, PAL.grassDD);
  box(ctx, x + 4, y + 6, 40, 13, PAL.greyL);
  R(ctx, x + 5, y + 7, 38, 1, PAL.greyLL);
  for (let i = 0; i < 3; i++) box(ctx, x + 7 + i * 6, y + 9, 5, 6, PAL.blue);
  for (let i = 0; i < 3; i++) R(ctx, x + 8 + i * 6, y + 10, 3, 1, PAL.blueL);
  box(ctx, x + 30, y + 9, 9, 7, PAL.grey); R(ctx, x + 32, y + 11, 5, 3, PAL.greyD);
  box(ctx, x + 4, y + 18, 40, 27, PAL.greyLL);
  R(ctx, x + 5, y + 19, 38, 2, PAL.blue);
  R(ctx, x + 41, y + 21, 2, 23, PAL.greyL);
  [7, 15, 26, 34].forEach(wx => win(ctx, x + wx, y + 23, 7, 7, lit));
  win(ctx, x + 7, y + 32, 9, 7, lit); win(ctx, x + 32, y + 32, 9, 7, lit);
  box(ctx, x + 17, y + 31, 14, 3, PAL.blue); R(ctx, x + 18, y + 32, 12, 1, PAL.blueL);
  door(ctx, x + 20, y + 34, 8, 10, lit);
  R(ctx, x + 36, y + 41, 3, 3, PAL.O); R(ctx, x + 37, y + 41, 1, 2, PAL.green);
}
function drawBrick(ctx, x, y, lit){
  apron(ctx, x, y);
  R(ctx, x + 3, y + 43, 44, 2, PAL.grassDD);
  box(ctx, x + 2, y + 3, 44, 12, PAL.woodD);
  R(ctx, x + 3, y + 4, 42, 1, PAL.wood); R(ctx, x + 3, y + 13, 42, 1, PAL.wood);
  box(ctx, x + 8, y + 6, 6, 5, PAL.greyD); R(ctx, x + 9, y + 7, 4, 1, PAL.grey);
  box(ctx, x + 32, y + 5, 4, 7, PAL.brickD);
  box(ctx, x + 2, y + 14, 44, 31, PAL.brick);
  for (let j = 16; j < 42; j += 3) { R(ctx, x + 3, y + j, 42, 1, PAL.brickD); for (let i = 3 + ((j / 3) % 2) * 3; i < 45; i += 6) R(ctx, x + i, y + j + 1, 1, 2, PAL.brickD); }
  R(ctx, x + 3, y + 15, 42, 1, PAL.brickL);
  [6, 20, 34].forEach(wx => { win(ctx, x + wx, y + 18, 8, 8, lit, PAL.white); R(ctx, x + wx - 1, y + 26, 10, 1, PAL.greyL); });
  [6, 34].forEach(wx => { win(ctx, x + wx, y + 30, 8, 8, lit, PAL.white); R(ctx, x + wx - 1, y + 38, 10, 1, PAL.greyL); });
  box(ctx, x + 19, y + 29, 10, 15, PAL.lwood);
  R(ctx, x + 20, y + 30, 8, 3, lit ? PAL.gold : PAL.winDark);
  R(ctx, x + 20, y + 33, 8, 1, PAL.O);
  R(ctx, x + 20, y + 34, 8, 9, PAL.wood); R(ctx, x + 21, y + 35, 2, 7, PAL.woodD); R(ctx, x + 25, y + 35, 2, 7, PAL.woodD);
  R(ctx, x + 26, y + 38, 1, 1, PAL.gold);
  R(ctx, x + 17, y + 44, 14, 1, PAL.greyD);
}
function drawTower(ctx, x, y, lit){
  apron(ctx, x, y);
  R(ctx, x + 10, y + 43, 30, 2, PAL.grassDD);
  R(ctx, x + 23, y, 1, 3, PAL.O); R(ctx, x + 23, y, 1, 1, PAL.red);
  box(ctx, x + 9, y + 2, 30, 8, PAL.grey); R(ctx, x + 10, y + 3, 28, 1, PAL.greyLL);
  box(ctx, x + 16, y + 4, 8, 4, PAL.greyD);
  box(ctx, x + 9, y + 9, 30, 36, PAL.skyD);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) {
    const wx = x + 11 + i * 4 + (i > 2 ? 1 : 0), wy = y + 11 + j * 4, on = lit && (i + j * 3) % 4 !== 1;
    R(ctx, wx, wy, 3, 3, on ? PAL.gold : PAL.skyDD); R(ctx, wx, wy, 3, 1, on ? PAL.goldL : PAL.sky);
  }
  for (let k = 0; k < 5; k++) R(ctx, x + 12 + k * 5, y + 10 + k * 6, 2, 1, PAL.skyL);
  R(ctx, x + 36, y + 10, 2, 34, PAL.skyDD);
  box(ctx, x + 15, y + 37, 18, 3, PAL.grey); R(ctx, x + 16, y + 38, 16, 1, PAL.greyLL);
  door(ctx, x + 19, y + 40, 10, 4, lit);
}
function drawGarage(ctx, x, y, lit){
  apron(ctx, x, y);
  R(ctx, x + 3, y + 43, 44, 2, PAL.grassDD);
  box(ctx, x + 2, y + 8, 44, 13, PAL.grey);
  for (let i = 4; i < 45; i += 3) R(ctx, x + i, y + 9, 1, 11, PAL.greyD);
  R(ctx, x + 3, y + 9, 42, 1, PAL.greyLL);
  box(ctx, x + 2, y + 20, 44, 25, PAL.lwood);
  for (let j = 23; j < 44; j += 3) R(ctx, x + 3, y + j, 42, 1, PAL.wood);
  R(ctx, x + 3, y + 21, 42, 1, PAL.lwoodL);
  box(ctx, x + 5, y + 24, 22, 20, PAL.greyL);
  for (let j = 31; j < 43; j += 2) R(ctx, x + 6, y + j, 20, 1, PAL.grey);
  [6, 11, 16, 21].forEach(wx => { R(ctx, x + wx, y + 25, 4, 5, lit ? PAL.gold : PAL.winDark); R(ctx, x + wx, y + 25, 4, 1, lit ? PAL.goldL : PAL.winDarkL); });
  R(ctx, x + 6, y + 30, 20, 1, PAL.O);
  win(ctx, x + 31, y + 23, 10, 6, lit, PAL.O);
  box(ctx, x + 31, y + 31, 9, 13, PAL.blue);
  R(ctx, x + 33, y + 33, 5, 4, lit ? PAL.gold : PAL.winDark);
  R(ctx, x + 38, y + 38, 1, 1, PAL.gold);
  R(ctx, x + 30, y + 44, 11, 1, PAL.greyD);
  box(ctx, x + 41, y + 39, 4, 5, PAL.wood); R(ctx, x + 41, y + 36, 4, 3, PAL.leaf); R(ctx, x + 42, y + 36, 1, 1, PAL.green);
}
function drawBuilding(ctx, x, y, style, lit){
  [drawStartup, drawBrick, drawTower, drawGarage][((style | 0) % 4 + 4) % 4](ctx, x, y, !!lit);
}

/* ---------- Empty plot with a for-sale post and blank board ---------- */
function drawLot(ctx, x, y){
  [[1, 1], [44, 1], [1, 43], [44, 43]].forEach(([sx, sy]) => { box(ctx, x + sx, y + sy, 3, 4, PAL.lwood); R(ctx, x + sx + 1, y + sy, 1, 1, PAL.red); });
  for (let i = 4; i < 44; i += 4) { R(ctx, x + i, y + 2, 2, 1, PAL.white); R(ctx, x + i, y + 44, 2, 1, PAL.white); }
  for (let j = 5; j < 43; j += 4) { R(ctx, x + 2, y + j, 1, 2, PAL.white); R(ctx, x + 45, y + j, 1, 2, PAL.white); }
  R(ctx, x + 18, y + 40, 14, 2, PAL.grassDD);
  box(ctx, x + 22, y + 22, 4, 20, PAL.wood); R(ctx, x + 23, y + 23, 1, 18, PAL.lwood);
  box(ctx, x + 11, y + 10, 26, 16, PAL.red);
  R(ctx, x + 13, y + 12, 22, 12, PAL.white); R(ctx, x + 13, y + 23, 22, 1, PAL.greyLL);
  R(ctx, x + 12, y + 11, 24, 1, PAL.redL);
  box(ctx, x + 15, y + 26, 2, 3, PAL.greyD); box(ctx, x + 31, y + 26, 2, 3, PAL.greyD);
}

/* ---------- Blank name sign: a billboard board, 44 x 9, on two posts ---------- */
function drawSign(ctx, x, y){
  [9, 31].forEach(px => { box(ctx, x + px, y + 8, 4, 7, PAL.greyD); R(ctx, x + px + 1, y + 9, 1, 5, PAL.greyL); R(ctx, x + px - 1, y + 14, 6, 1, PAL.O); });
  box(ctx, x, y, 44, 9, PAL.white);
  R(ctx, x + 1, y + 7, 42, 1, PAL.greyL);
  R(ctx, x + 1, y + 2, 1, 5, PAL.gold); R(ctx, x + 42, y + 2, 1, 5, PAL.gold);
}

/* ---------- Waiting-on-you marker, 9 x 11, frame 0 or 1 ---------- */
function drawWaiting(ctx, x, y, frame){
  bitmap(ctx, x, y + (frame ? 0 : 1), [
    '.OOOOOOO.',
    'OLLLLLLLO',
    'ORRRWRRRO',
    'ORRRWRRRO',
    'ORRRWRRRO',
    'ORRRRRRRO',
    'ORRRWRRRO',
    'ODDDDDDDO',
    '.OOOOOOO.',
    '...ODO...',
    '....O....'
  ], { O: PAL.O, R: PAL.red, L: PAL.redL, D: PAL.redD, W: PAL.white });
}

/* ---------- You-are-here marker, 7 x 9 ---------- */
function drawHere(ctx, x, y){
  bitmap(ctx, x, y, [
    '.OOOOO.',
    '.OGGLO.',
    '.OGGGO.',
    '.OGGGO.',
    'OOGGGOO',
    'OGGGGGO',
    '.OGGGO.',
    '..ODO..',
    '...O...'
  ], { O: PAL.O, G: PAL.gold, L: PAL.goldL, D: PAL.goldD });
}

/* ---------- Hover highlight around a 48 x 48 building ---------- */
function drawHover(ctx, x, y){
  R(ctx, x - 1, y - 1, 50, 1, PAL.white); R(ctx, x - 1, y + 48, 50, 1, PAL.white);
  R(ctx, x - 1, y, 1, 48, PAL.white); R(ctx, x + 48, y, 1, 48, PAL.white);
}

/* ---------- The 3 x 5 letters the game writes names with on the board ---------- */
const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101101111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', ' ': '000000000000000',
  '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110' };
const SIGN_CHARS = 10;
function writeName(ctx, s, cx, y){ const w = s.length * 4 - 1, x0 = Math.round(cx - w / 2); ctx.fillStyle = PAL.O; for (let i = 0; i < s.length; i++) { const g = FONT[s[i]] || FONT[' ']; for (let p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(x0 + i * 4 + (p % 3), y + ((p / 3) | 0), 1, 1); } }

return { PLOTS, signSpot, drawComplex, drawBuilding, drawLot, drawSign, drawWaiting, drawHere, drawHover, writeName, SIGN_CHARS };
})();
