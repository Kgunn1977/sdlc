/* Look: comes from the design. A new design replaces this file. */
'use strict';
/* ================= Pixel art ================= */
const cv = document.getElementById('game'); const DC = cv.getContext('2d');
const LOWC = document.createElement('canvas'); LOWC.width = VW; LOWC.height = VH; const C0 = LOWC.getContext('2d', { willReadFrequently: true }); C0.imageSmoothingEnabled = false;
let C = C0, OX = 0, OY = 0, MIR = false;
function r(x, y, w, h, c){ C.fillStyle = c; C.fillRect(OX + (MIR ? 16 - x - w : x), OY + y, w, h); }
function ob(x, y, w, h, c){ r(x - 1, y - 1, w + 2, h + 2, O); r(x, y, w, h, c); }
function F(ctx, x, y, w, h, c){ ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
const PANTS = '#2C2A3C', LENS = '#A8E0F8', WHT = '#FCFCFC';
const LANYARD = { plain: 1, sleeves: 1, vest: 1, badge: 1, flight: 1, smock: 1, cardigan: 1, suitDark: 1, buttons: 1, sticky: 1, tweed: 1, bowtie: 1 };

const PROPS = {
  mug(){ ob(12, 15, 3, 3, WHT); r(15, 16, 1, 1, O); },
  baton(){ r(13, 9, 2, 9, O); r(13, 10, 1, 7, WHT); r(13, 9, 1, 1, '#FCBC3C'); },
  tabwrench(){ ob(12, 13, 3, 5, '#202838'); r(13, 14, 1, 3, '#3CBCFC'); r(0, 12, 3, 2, O); r(1, 12, 1, 1, '#A8A8B8'); r(1, 13, 2, 6, O); r(1, 14, 1, 4, '#A8A8B8'); },
  blueprint(){ ob(12, 11, 3, 8, '#3C78D8'); r(13, 11, 1, 8, '#A8C8F8'); },
  laptop(){ ob(11, 15, 5, 3, '#A8A8B8'); r(12, 15, 3, 2, '#3CBCFC'); },
  magnifier(){ ob(12, 8, 4, 4, LENS); r(13, 9, 1, 1, WHT); ob(13, 13, 1, 4, '#8C5030'); },
  shield(){ ob(12, 14, 3, 3, '#FCBC3C'); r(13, 17, 1, 1, '#FCBC3C'); ob(1, 15, 2, 3, '#606070'); r(1, 15, 2, 1, '#FCE45C'); },
  rocket(){ ob(13, 10, 2, 7, WHT); r(13, 10, 2, 1, '#F83800'); r(12, 15, 1, 2, '#F83800'); r(15, 15, 1, 2, '#F83800'); },
  megaphone(){ ob(12, 14, 2, 2, '#FCBC3C'); ob(14, 13, 2, 4, '#FCBC3C'); },
  palette(){ ob(11, 15, 5, 3, '#C88050'); r(12, 15, 1, 1, '#F83800'); r(14, 15, 1, 1, '#3CBCFC'); r(13, 17, 1, 1, '#58D854'); ob(1, 11, 1, 7, '#8C5030'); r(1, 11, 1, 1, '#F83800'); },
  quill(){ ob(13, 6, 2, 10, WHT); r(14, 7, 1, 7, '#C8C8DC'); r(13, 16, 1, 2, O); },
  speechmug(){ ob(12, 15, 3, 3, '#F8D838'); ob(12, 10, 4, 3, WHT); r(13, 13, 1, 1, WHT); },
  gavel(){ ob(11, 12, 5, 2, '#8C5030'); ob(13, 14, 1, 4, '#C88050'); },
  clipboard(){ ob(11, 13, 4, 6, '#C88050'); r(12, 14, 2, 4, WHT); r(12, 15, 1, 1, '#58D854'); r(13, 16, 1, 1, '#58D854'); r(12, 12, 2, 1, O); },
  lockfolder(){ ob(11, 14, 5, 4, '#E8C060'); r(13, 15, 1, 2, O); ob(1, 16, 3, 1, '#FCBC3C'); },
  coin(){ ob(11, 13, 5, 5, '#FCBC3C'); r(12, 14, 3, 3, '#A87010'); r(13, 15, 2, 1, '#FCBC3C'); },
  compass(){ ob(12, 14, 4, 4, '#D8D8E0'); r(13, 15, 1, 1, '#F83800'); r(14, 16, 1, 1, O); },
  scroll(){ ob(12, 12, 3, 7, '#F8F0D0'); r(11, 12, 5, 1, O); r(11, 18, 5, 1, O); r(13, 14, 1, 1, O); r(13, 16, 1, 1, O); },
  chart(){ ob(11, 13, 5, 5, '#202838'); r(12, 16, 1, 1, '#58D854'); r(13, 15, 1, 2, '#58D854'); r(14, 14, 1, 3, '#58D854'); },
  sketch(){ ob(11, 13, 5, 6, WHT); r(12, 14, 3, 1, '#7878A0'); r(12, 16, 1, 2, '#7878A0'); r(14, 16, 1, 2, '#7878A0'); },
  redpen(){ ob(13, 13, 1, 5, '#F83800'); }
};

function torsoFront(L, acc, sk){
  const t = L.torso;
  if (t === 'suitTie') { r(6, 12, 4, 1, WHT); r(7, 13, 2, 5, '#FCBC3C'); }
  else if (t === 'sleeves') { r(4, 15, 1, 3, sk); r(11, 15, 1, 3, sk); r(5, 13, 2, 2, '#A8A8B8'); }
  else if (t === 'vest') { r(5, 12, 6, 7, '#38A848'); r(7, 12, 2, 3, '#E0E0E0'); }
  else if (t === 'badge') { r(9, 13, 2, 2, '#FCBC3C'); r(4, 17, 8, 1, O); }
  else if (t === 'flight') { r(5, 12, 6, 1, '#E8D0A0'); r(7, 13, 1, 5, O); }
  else if (t === 'feather') { r(7, 12, 2, 3, WHT); r(9, 12, 1, 3, '#58D8F8'); r(10, 12, 1, 1, '#58D8F8'); }
  else if (t === 'smock') { r(5, 14, 1, 1, '#F83800'); r(9, 13, 1, 1, '#3CBCFC'); r(7, 17, 1, 1, '#FCBC3C'); r(10, 16, 1, 1, '#58D854'); }
  else if (t === 'cardigan') { r(7, 12, 2, 7, '#E8E0D0'); r(6, 14, 1, 1, O); r(6, 16, 1, 1, O); }
  else if (t === 'robe') { r(6, 12, 4, 1, WHT); r(7, 13, 2, 1, WHT); r(5, 12, 1, 7, acc); r(10, 12, 1, 7, acc); }
  else if (t === 'suitDark') { r(7, 12, 2, 4, WHT); r(7, 13, 1, 4, O); }
  else if (t === 'bowtie') { r(6, 12, 4, 2, WHT); r(6, 12, 1, 2, '#C83030'); r(9, 12, 1, 2, '#C83030'); r(7, 12, 2, 1, '#C83030'); }
  else if (t === 'buttons') { r(7, 13, 1, 1, '#FCBC3C'); r(7, 15, 1, 1, '#FCBC3C'); r(7, 17, 1, 1, '#FCBC3C'); }
  else if (t === 'sticky') { r(5, 13, 2, 2, '#FCE45C'); r(9, 14, 2, 2, '#F878F8'); r(6, 16, 2, 2, '#58D8F8'); }
  else if (t === 'tweed') { r(7, 12, 2, 2, '#E8E0D0'); r(5, 13, 1, 1, '#B09068'); r(9, 15, 1, 1, '#B09068'); r(6, 17, 1, 1, '#B09068'); r(10, 17, 1, 1, '#B09068'); }
  if (LANYARD[t]) { r(5, 12, 1, 2, acc); r(10, 12, 1, 2, acc); r(6, 14, 1, 1, acc); r(9, 14, 1, 1, acc); r(7, 15, 2, 2, acc); }
}
function headFeats(L, view){
  const f = L.feats, h = L.hair;
  const has = n => f.indexOf(n) >= 0;
  if (view === 'f') {
    if (has('beardGray') || has('beardRed')) { const c = has('beardRed') ? h : '#9C9CA4'; r(5, 8, 6, 3, c); r(5, 6, 1, 2, c); r(10, 6, 1, 2, c); }
    if (has('glasses')) { r(5, 5, 3, 3, O); r(8, 5, 3, 3, O); r(6, 6, 1, 1, LENS); r(9, 6, 1, 1, LENS); }
    if (has('sunglasses')) { r(5, 6, 6, 2, O); r(6, 6, 1, 1, '#505068'); }
    if (has('goggles')) { r(4, 3, 8, 1, O); r(5, 2, 2, 2, '#58D8F8'); r(9, 2, 2, 2, '#58D8F8'); }
    if (has('headband')) r(5, 3, 6, 1, '#F83800');
    if (has('ponytail')) r(12, 4, 1, 5, h);
    if (has('pencil')) r(11, 3, 1, 3, '#FCBC3C');
  } else if (view === 's') {
    if (has('beardGray') || has('beardRed')) { const c = has('beardRed') ? h : '#9C9CA4'; r(7, 8, 5, 3, c); }
    if (has('glasses')) { r(8, 5, 3, 3, O); r(9, 6, 1, 1, LENS); r(6, 6, 2, 1, O); }
    if (has('sunglasses')) { r(8, 6, 4, 2, O); r(6, 6, 2, 1, O); }
    if (has('goggles')) { r(4, 3, 8, 1, O); r(9, 2, 2, 2, '#58D8F8'); }
    if (has('headband')) r(5, 3, 6, 1, '#F83800');
    if (has('ponytail')) { r(2, 4, 3, 6, O); r(3, 5, 1, 4, h); }
    if (has('pencil')) r(6, 3, 1, 3, '#FCBC3C');
  } else {
    if (has('goggles')) r(4, 3, 8, 1, O);
    if (has('headband')) r(5, 3, 6, 1, '#F83800');
    if (has('ponytail')) { r(7, 10, 2, 5, O); r(7, 10, 1, 4, h); }
  }
  // headwear, any view
  if (has('headphones')) { r(4, 0, 8, 1, '#202028'); if (view === 's') r(6, 4, 3, 4, '#202028'); else { r(3, 4, 2, 4, '#202028'); r(11, 4, 2, 4, '#202028'); r(3, 5, 1, 2, '#F83800'); } }
  if (has('headset')) { if (view === 's') { r(6, 4, 2, 3, '#202028'); r(8, 9, 3, 1, '#202028'); } else if (view === 'f') { r(3, 4, 1, 4, '#202028'); r(12, 4, 1, 4, '#202028'); r(4, 8, 1, 2, '#202028'); r(5, 10, 2, 1, '#202028'); } else { r(3, 4, 1, 4, '#202028'); r(12, 4, 1, 4, '#202028'); } }
  if (has('beret')) { r(3, 0, 10, 3, O); r(4, 1, 8, 1, '#D82828'); r(5, 0, 5, 1, '#D82828'); r(9, -1, 1, 1, O); }
  if (has('cap')) { r(4, 0, 8, 3, O); r(5, 1, 6, 1, '#282850'); if (view === 'f') { r(7, 1, 2, 1, '#FCBC3C'); r(4, 3, 8, 1, O); } else if (view === 's') r(9, 3, 4, 1, O); }
  if (has('tophat')) { r(4, -5, 8, 6, O); r(5, -4, 6, 4, '#202028'); r(5, -1, 6, 1, '#C83030'); r(3, 1, 10, 1, O); }
  if (has('captain')) { r(4, -1, 8, 4, O); r(5, 0, 6, 2, WHT); if (view !== 'b') r(7, 0, 2, 1, '#FCBC3C'); if (view === 'f') r(4, 3, 8, 1, O); else if (view === 's') r(8, 3, 5, 1, O); }
  if (has('scarf')) { const c = '#F8D838'; if (view === 'f') { r(4, 1, 8, 1, O); r(5, 2, 6, 2, c); r(4, 3, 1, 5, c); r(11, 3, 1, 5, c); r(11, 8, 2, 2, '#F878F8'); } else if (view === 's') { r(5, 2, 6, 2, c); r(5, 3, 2, 6, c); r(4, 8, 2, 2, '#F878F8'); } else { r(5, 2, 6, 8, c); r(6, 10, 3, 2, '#F878F8'); } }
  if (has('wig')) { const c = '#F0F0F0'; if (view === 'f') { r(4, 1, 8, 2, c); r(2, 3, 1, 8, O); r(3, 3, 2, 8, c); r(13, 3, 1, 8, O); r(11, 3, 2, 8, c); r(3, 5, 1, 1, '#C8C8C8'); r(12, 7, 1, 1, '#C8C8C8'); } else if (view === 's') { r(5, 1, 6, 2, c); r(3, 3, 1, 8, O); r(4, 3, 3, 8, c); r(5, 6, 1, 1, '#C8C8C8'); } else { r(2, 3, 12, 8, O); r(3, 2, 10, 9, c); r(5, 5, 1, 1, '#C8C8C8'); r(10, 7, 1, 1, '#C8C8C8'); } }
}
// o: {walk, frame, seated, talking, frown, folder, noProp}
function drawSprite(L, dir, o, sx, sy, ctx){
  C = ctx || C0; OX = sx; OY = sy; MIR = dir === 'left';
  const d = dir === 'left' ? 'right' : dir;
  const sk = L.skin, m = L.main, h = L.hair, acc = o.acc, f = o.frame | 0;
  const hood = L.feats.indexOf('hood') >= 0;
  const robe = L.torso === 'robe';
  if (d === 'down') {
    if (!o.seated) { r(4, 19, 8, 5, O); if (robe) r(5, 19, 6, 4, m); else { const a = o.walk && f === 1 ? 1 : 0, b = o.walk && f === 0 ? 1 : 0; r(5, 19, 2, 4 - a, PANTS); r(9, 19, 2, 4 - b, PANTS); } }
    r(3, 11, 10, 9, O); r(4, 12, 8, 7, m);
    torsoFront(L, acc, sk);
    const hy = o.walk ? (f ? 17 : 18) : 17;
    r(3, hy, 1, 2, sk); r(12, o.walk ? (f ? 18 : 17) : 17, 1, 2, sk);
    if (hood) { r(3, 0, 10, 12, O); r(4, 1, 8, 11, m); r(5, 3, 6, 8, sk); r(5, 3, 6, 1, h); }
    else { r(4, 1, 8, 11, O); r(5, 2, 6, 9, sk);
      if (L.hairStyle === 'short') { r(5, 2, 6, 2, h); r(5, 4, 1, 2, h); r(10, 4, 1, 2, h); }
      else if (L.hairStyle === 'long') { r(5, 2, 6, 2, h); r(5, 4, 1, 6, h); r(10, 4, 1, 6, h); }
    }
    r(6, 6, 1, 2, O); r(9, 6, 1, 2, O);
    headFeats(L, 'f');
    if (o.talking && f) r(7, 9, 2, 1, '#5A1820');
    if (o.frown) { r(7, 9, 2, 1, O); r(6, 10, 1, 1, O); r(9, 10, 1, 1, O); }
    if (o.folder) { r(4, 13, 8, 6, O); r(5, 14, 6, 4, '#E8C060'); r(5, 14, 6, 1, '#C89838'); }
    else if (!o.noProp && PROPS[L.prop]) PROPS[L.prop]();
  } else if (d === 'up') {
    if (!o.seated) { r(4, 19, 8, 5, O); if (robe) r(5, 19, 6, 4, m); else { const a = o.walk && f === 1 ? 1 : 0, b = o.walk && f === 0 ? 1 : 0; r(5, 19, 2, 4 - a, PANTS); r(9, 19, 2, 4 - b, PANTS); } }
    r(3, 11, 10, 9, O); r(4, 12, 8, 7, m);
    if (LANYARD[L.torso]) r(5, 12, 6, 1, acc);
    if (robe) { r(5, 12, 1, 3, acc); r(10, 12, 1, 3, acc); }
    r(3, o.walk ? (f ? 18 : 17) : 17, 1, 2, sk); r(12, o.walk ? (f ? 17 : 18) : 17, 1, 2, sk);
    if (hood) { r(3, 0, 10, 12, O); r(4, 1, 8, 11, m); }
    else { r(4, 1, 8, 11, O); r(5, 2, 6, 9, L.hairStyle === 'none' ? sk : h); r(6, 10, 4, 1, sk); }
    headFeats(L, 'b');
    if (o.folder) { r(12, 14, 4, 5, O); r(13, 15, 2, 3, '#E8C060'); }
  } else {
    if (!o.seated) { r(5, 19, 6, 5, O); if (robe) r(6, 19, 4, 4, m); else if (o.walk && f) { r(5, 19, 2, 4, PANTS); r(9, 19, 2, 3, PANTS); } else if (o.walk) { r(6, 19, 2, 3, PANTS); r(8, 19, 2, 4, PANTS); } else r(6, 19, 4, 4, PANTS); }
    r(5, 11, 7, 9, O); r(6, 12, 5, 7, m);
    if (LANYARD[L.torso]) { r(9, 12, 1, 3, acc); r(10, 15, 1, 2, acc); }
    if (L.torso === 'suitTie') r(10, 12, 1, 5, '#FCBC3C');
    if (L.torso === 'vest') r(9, 12, 2, 7, '#38A848');
    r(7, 13, 1, 5, O); r(8, 17, 2, 2, sk);
    if (hood) { r(4, 0, 8, 12, O); r(5, 1, 6, 11, m); r(7, 3, 4, 8, sk); }
    else { r(4, 1, 8, 11, O); r(5, 2, 6, 9, sk);
      if (L.hairStyle === 'short') { r(5, 2, 6, 2, h); r(5, 4, 2, 4, h); }
      else if (L.hairStyle === 'long') { r(5, 2, 6, 2, h); r(5, 4, 2, 7, h); }
    }
    r(9, 6, 1, 2, O);
    headFeats(L, 's');
    if (o.talking && f) r(9, 9, 2, 1, '#5A1820');
    if (o.folder) { r(9, 13, 5, 6, O); r(10, 14, 3, 4, '#E8C060'); }
    else if (!o.noProp && PROPS[L.prop]) { OX -= 1; PROPS[L.prop](); OX += 1; }
  }
  MIR = false;
}

/* micro font 3x5 */
const MF = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', '+': '000010111010000',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101',
  N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101101111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111' };
const PLATE = { you: 'PRESIDENT', ceo: 'CEO', cto: 'CTO', architect: 'ARCHITECT', engineer: 'ENGINEER', qa: 'QA', security: 'SECURITY', release: 'RELEASE', cmo: 'CMO', 'brand-designer': 'BRAND', writer: 'WRITER', community: 'COMMUNITY', clo: 'CLO', compliance: 'COMPLIANCE', privacy: 'PRIVACY', ip: 'IP', cpo: 'CPO', pm: 'PM', analyst: 'ANALYST', 'product-designer': 'DESIGNER', rev1: 'REVIEWER', rev2: 'REVIEWER' };
function drawPlate(ctx, cx, y, key){ if (PLATE[key]) hq({ t: 'plate', x: cx, y, key }); }
function mtext(ctx, s, x, y, c){ ctx.fillStyle = c; for (let i = 0; i < s.length; i++) { const g = MF[s[i]]; if (!g) continue; for (let p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(x + i * 4 + (p % 3), y + ((p / 3) | 0), 1, 1); } }
const GL = { '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'], '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'], 'check': ['00000', '00001', '00011', '10110', '11100', '01000', '00000'] };
function glyph(ctx, g, x, y, c){ ctx.fillStyle = c; GL[g].forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === '1') ctx.fillRect(x + i, y + j, 1, 1); }); }
function drawMarker(ctx, x, y, mk, count){
  F(ctx, x - 1, y - 1, 11, 13, O); F(ctx, x, y, 9, 11, mk.fill); F(ctx, x + 3, y + 11, 3, 2, O); F(ctx, x + 4, y + 11, 1, 1, mk.fill);
  glyph(ctx, mk.glyph, x + 2, y + 2, O);
  if (count > 1) { F(ctx, x + 8, y - 4, 7, 9, O); F(ctx, x + 9, y - 3, 5, 7, WHT); mtext(ctx, String(Math.min(9, count)), x + 10, y - 2, O); }
}

/* ================= 16-bit helpers ================= */
function hsh(x, y){ let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function tone(c, f){ const n = parseInt(c.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; } return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }
const SH = 'rgba(12,6,24,0.30)';
/* Shaded, selectively outlined sprites, cached per pose */
const SPR = new Map();
const sprC = document.createElement('canvas'); sprC.width = 28; sprC.height = 36; const sprX = sprC.getContext('2d', { willReadFrequently: true });
function shadeImage(img){
  const w = img.width, h = img.height, d = img.data, s = new Uint8ClampedArray(d);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : (y * w + x) * 4;
  const isT = i => i < 0 || s[i + 3] === 0;
  const isO = i => i >= 0 && s[i + 3] !== 0 && s[i] === 16 && s[i + 1] === 12 && s[i + 2] === 32;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = at(x, y); if (s[i + 3] === 0) continue;
    const n = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)];
    if (isO(i)) {
      let fill = -1, trans = false;
      for (const j of n) { if (isT(j)) trans = true; else if (!isO(j) && fill < 0) fill = j; }
      if (fill >= 0) { const k = trans ? 0.26 : 0.42; d[i] = s[fill] * k + 16 * (1 - k); d[i + 1] = s[fill + 1] * k + 12 * (1 - k); d[i + 2] = s[fill + 2] * k + 32 * (1 - k); }
      continue;
    }
    const edge = j => isT(j) || isO(j);
    const tp = edge(n[0]), bt = edge(n[1]), lf = edge(n[2]), rt = edge(n[3]);
    let f = 0;
    if (tp && !bt) f += 0.18; else if (bt && !tp) f -= 0.22;
    if (lf && !rt) f += 0.08; else if (rt && !lf) f -= 0.14;
    if (f > 0) for (let c = 0; c < 3; c++) d[i + c] = s[i + c] + (255 - s[i + c]) * f;
    else if (f < 0) for (let c = 0; c < 3; c++) d[i + c] = s[i + c] * (1 + f);
  }
}
function shaded(id, L, dir, o){
  const key = id + '|' + dir + '|' + (o.walk ? 1 : 0) + (o.frame | 0) + (o.seated ? 1 : 0) + (o.talking ? 1 : 0) + (o.frown ? 1 : 0) + (o.folder ? 1 : 0) + (o.noProp ? 1 : 0) + '|' + o.acc;
  let c = SPR.get(key); if (c) return c;
  sprX.clearRect(0, 0, 28, 36); drawSprite(L, dir, o, 6, 8, sprX); C = C0;
  const img = sprX.getImageData(0, 0, 28, 36); shadeImage(img);
  c = document.createElement('canvas'); c.width = 28; c.height = 36; c.getContext('2d').putImageData(img, 0, 0);
  SPR.set(key, c); return c;
}
function drawMarker16(ctx, x, y, mk, count){ hq({ t: 'mk', x, y, mk, n: count }); }

/* ================= World prerender (16-bit) ================= */
const FL16 = {
  office: { kind: 'wood', c: '#6E5646' }, line: { kind: 'lino', c: '#4A4658' }, ceo: { kind: 'parquet', c: '#7A5C40' }, cto: { kind: 'carpet', c: '#34465E' }, conference: { kind: 'parquet', c: '#6A5240' }, lobby: { kind: 'tile', c: '#686276' },
  tech: { kind: 'carpet', c: '#3C4C62' }, marketing: { kind: 'carpet', c: '#604660' }, corridor: { kind: 'lino', c: '#4E4A5C' }, legal: { kind: 'wood', c: '#56403A' },
  review: { kind: 'tile', c: '#6E7886' }, product: { kind: 'carpet', c: '#445A48' }
};
const world = document.createElement('canvas'); world.width = W * T; world.height = H * T;
const wc = world.getContext('2d');
function floorTile(x, y, st){
  const X = x * T, Y = y * T, c = st.c;
  if (st.kind === 'wood') {
    for (let p = 0; p < 4; p++) { const row = y * 4 + p; const off = (row * 7) % 32; const seg = Math.floor((X + off) / 32);
      F(wc, X, Y + p * 4, T, 4, tone(c, (hsh(seg, row) - 0.5) * 0.16));
      F(wc, X, Y + p * 4 + 3, T, 1, tone(c, -0.28)); F(wc, X, Y + p * 4, T, 1, tone(c, 0.07));
      for (let q = 0; q < 16; q++) if (((X + q + off) % 32) === 0) F(wc, X + q, Y + p * 4, 1, 3, tone(c, -0.3));
      if (hsh(x * 9 + p, y) > 0.6) F(wc, X + ((hsh(x, y + p) * 12) | 0), Y + p * 4 + 1, 3, 1, tone(c, -0.12)); }
  } else if (st.kind === 'parquet') {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const hz = (x * 2 + i + y * 2 + j) % 2 === 0; const bx = X + i * 8, by = Y + j * 8;
      for (let k = 0; k < 4; k++) { const v = tone(c, (k % 2 ? -0.06 : 0.05) + (hsh(bx + k, by) - 0.5) * 0.1); if (hz) { F(wc, bx, by + k * 2, 8, 2, v); F(wc, bx, by + k * 2 + 1, 8, 1, tone(c, -0.16)); } else { F(wc, bx + k * 2, by, 2, 8, v); F(wc, bx + k * 2 + 1, by, 1, 8, tone(c, -0.16)); } } }
  } else if (st.kind === 'carpet') {
    F(wc, X, Y, T, T, c); F(wc, X, Y, T, 1, tone(c, 0.06)); F(wc, X, Y + 15, T, 1, tone(c, -0.14)); F(wc, X + 15, Y, 1, T, tone(c, -0.1));
    if ((x + y) % 2) { F(wc, X + 7, Y + 7, 2, 2, tone(c, 0.08)); }
  } else if (st.kind === 'lino') {
    F(wc, X, Y, T, T, tone(c, (x + y) % 2 ? 0.04 : -0.03)); F(wc, X, Y, T, 1, tone(c, 0.12)); F(wc, X, Y, 1, T, tone(c, 0.08)); F(wc, X, Y + 15, T, 1, tone(c, -0.2)); F(wc, X + 15, Y, 1, T, tone(c, -0.16));
  } else if (st.kind === 'tile') {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const bx = X + i * 8, by = Y + j * 8; F(wc, bx, by, 8, 8, tone(c, (hsh(bx, by) - 0.5) * 0.08)); F(wc, bx, by, 8, 1, tone(c, 0.2)); F(wc, bx, by, 1, 8, tone(c, 0.14)); F(wc, bx, by + 7, 8, 1, tone(c, -0.18)); F(wc, bx + 7, by, 1, 8, tone(c, -0.14)); F(wc, bx + 2, by + 2, 2, 1, tone(c, 0.3)); }
  }
}
function rug(x1, y1, x2, y2, base, border){
  const X = x1 * T, Y = y1 * T, w = (x2 - x1 + 1) * T, h = (y2 - y1 + 1) * T;
  wc.fillStyle = SH; wc.fillRect(X + 2, Y + 2, w, h);
  F(wc, X, Y, w, h, tone(border, -0.35)); F(wc, X + 1, Y + 1, w - 2, h - 2, border); F(wc, X + 4, Y + 4, w - 8, h - 8, tone(border, -0.35)); F(wc, X + 5, Y + 5, w - 10, h - 10, base);
  for (let i = X + 8; i < X + w - 8; i += 8) { F(wc, i, Y + 2, 2, 1, tone(border, 0.4)); F(wc, i, Y + h - 3, 2, 1, tone(border, 0.4)); }
  for (let j = Y + 10; j < Y + h - 10; j += 6) for (let i = X + 10 + ((j / 6) % 2) * 6; i < X + w - 10; i += 12) F(wc, i, j, 3, 2, tone(base, 0.14));
}
(function prerender(){
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), X = x * T, Y = y * T;
    if (grid[i]) {
      const rm = roomAt[i] >= 0 ? ROOMS[roomAt[i]] : null;
      if (rm) floorTile(x, y, FL16[rm.id]);
      else { floorTile(x, y, { kind: 'lino', c: '#4A4658' }); F(wc, X + 2, Y + 3, 12, 11, '#2A2438'); F(wc, X + 3, Y + 4, 10, 9, '#3A3048'); for (let k = 0; k < 4; k++) F(wc, X + 4, Y + 5 + k * 2, 8, 1, '#30283E');
        if (grid[idx(x, y - 1)] && grid[idx(x, y + 1)]) { F(wc, X, Y, 2, T, '#2A2438'); F(wc, X + 14, Y, 2, T, '#2A2438'); F(wc, X + 1, Y, 1, T, '#5A5470'); F(wc, X + 14, Y, 1, T, '#5A5470'); } }
      if (rm && rm.trim) {
        const t = rm.trim, tl = tone(t, 0.35), td = tone(t, -0.4);
        if (!grid[idx(x, y - 1)]) { F(wc, X, Y + 4, T, 2, t); F(wc, X, Y + 4, T, 1, tl); F(wc, X, Y + 6, T, 1, td); }
        if (!grid[idx(x, y + 1)]) { F(wc, X, Y + 13, T, 2, t); F(wc, X, Y + 13, T, 1, tl); F(wc, X, Y + 15, T, 1, td); }
        if (!grid[idx(x - 1, y)]) { F(wc, X + 1, Y, 2, T, t); F(wc, X + 1, Y, 1, T, tl); }
        if (!grid[idx(x + 1, y)]) { F(wc, X + 13, Y, 2, T, t); F(wc, X + 15, Y, 1, T, td); }
      }
    } else {
      const below = inb(x, y + 1) && grid[idx(x, y + 1)];
      const gl = isGlassWall(x, y);
      if (below) {
        if (gl) {
          F(wc, X, Y, T, T, '#5C8CA0'); F(wc, X, Y, T, 2, '#C8E4EC'); F(wc, X, Y + 2, T, 1, '#3C6474');
          for (let k = 0; k < 11; k++) F(wc, X + 3 + k, Y + 3 + 10 - k, 1, 1, 'rgba(232,248,255,0.55)');
          F(wc, X + 7, Y + 3, 1, 11, '#8CBCCC'); F(wc, X, Y + 13, T, 3, '#2E3440'); F(wc, X, Y + 13, T, 1, '#6C7C88');
        } else {
          const wl = '#6A6280';
          F(wc, X, Y, T, 2, '#8C84A4'); F(wc, X, Y + 2, T, 1, '#3E3850');
          F(wc, X, Y + 3, T, 4, wl); F(wc, X, Y + 3, T, 1, tone(wl, 0.1)); F(wc, X, Y + 6, T, 1, tone(wl, -0.06));
          F(wc, X, Y + 7, T, 1, '#9C8C78'); F(wc, X, Y + 8, T, 5, '#5C4636'); F(wc, X, Y + 8, T, 1, '#7A6050');
          F(wc, X + 1, Y + 9, 6, 3, '#4E3A2E'); F(wc, X + 9, Y + 9, 6, 3, '#4E3A2E'); F(wc, X + 1, Y + 9, 6, 1, '#664C3C'); F(wc, X + 9, Y + 9, 6, 1, '#664C3C');
          F(wc, X, Y + 13, T, 3, '#2A2232'); F(wc, X, Y + 13, T, 1, '#4A3E50');
        }
      } else {
        const top = gl ? '#3E5E6C' : '#1E1A2C';
        F(wc, X, Y, T, T, top);
        if (!gl) { for (let k = 0; k < 4; k++) F(wc, X, Y + k * 4 + 3, T, 1, '#18141F'); F(wc, X + ((y % 2) ? 4 : 11), Y, 1, T, '#18141F'); F(wc, X, Y, T, 1, '#2A2638'); }
        else { F(wc, X + 6, Y, 4, T, '#6C9CAC'); F(wc, X + 6, Y, 1, T, '#C8E4EC'); }
      }
    }
  }
  // per-pixel dithered grain over the floor
  const img = wc.getImageData(0, 0, W * T, H * T), d = img.data;
  for (let y = 0; y < H * T; y++) for (let x = 0; x < W * T; x++) {
    const ti = idx((x / T) | 0, (y / T) | 0); if (!grid[ti]) continue;
    const n = (hsh(x, y) - 0.5) * 9; const p = (y * W * T + x) * 4; d[p] += n; d[p + 1] += n; d[p + 2] += n;
  }
  wc.putImageData(img, 0, 0);
  // ambient occlusion under walls
  for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
    if (!grid[idx(x, y)]) continue; const X = x * T, Y = y * T;
    if (!grid[idx(x, y - 1)]) { wc.fillStyle = 'rgba(10,6,20,0.34)'; wc.fillRect(X, Y, T, 3); wc.fillStyle = 'rgba(10,6,20,0.16)'; wc.fillRect(X, Y + 3, T, 3); }
    if (x > 0 && !grid[idx(x - 1, y)]) { wc.fillStyle = 'rgba(10,6,20,0.22)'; wc.fillRect(X, Y, 3, T); }
    if (x < W - 1 && !grid[idx(x + 1, y)]) { wc.fillStyle = 'rgba(10,6,20,0.12)'; wc.fillRect(X + 14, Y, 2, T); }
  }
  // rugs (visual only)
  rug(25, 7, 31, 10, '#2C3C6C', '#B89848');
  rug(43, 6, 51, 9, '#6C2430', '#C8A048');
  rug(2, 23, 7, 25, '#1C3048', '#3CBCFC');
  // wall decor
  wc.setTransform(1, 0, 0, 1, -48, 0);
  for (let x = 29; x <= 33; x++) { const X = x * T; F(wc, X + 1, T + 3, 14, 10, '#8C84A4'); F(wc, X + 2, T + 4, 12, 8, '#4C88C8'); F(wc, X + 2, T + 4, 12, 3, '#8CC4F0'); F(wc, X + 2, T + 7, 12, 1, '#68A4DC'); F(wc, X + 3, T + 5, 2, 1, '#E8F8FF'); F(wc, X + 7, T + 4, 1, 8, '#8C84A4'); }
  wc.fillStyle = 'rgba(255,244,210,0.07)'; for (let j = 0; j < 4 * T; j++) wc.fillRect(29 * T + 2 - j * 0.35, 2 * T + j, 5 * T - 4, 1);
  wc.setTransform(1, 0, 0, 1, -32, 0);
  F(wc, 43 * T, T + 2, 5 * T, 13, '#5C4636'); F(wc, 43 * T + 1, T + 3, 5 * T - 2, 11, '#ECECE4'); F(wc, 43 * T + 1, T + 3, 5 * T - 2, 1, '#FFFFFF');
  F(wc, 45 * T + 3, T + 4, 10, 3, '#FCBC3C'); F(wc, 44 * T, T + 8, 3 * T + 8, 1, '#808090'); F(wc, 45 * T + 8, T + 7, 1, 2, '#808090');
  [['#3CBCFC', 43.5], ['#F878F8', 44.6], ['#B8A0FF', 45.9], ['#58D854', 47.0]].forEach(([c, xx]) => { const X = Math.round(xx * T); F(wc, X, T + 10, 9, 3, c); F(wc, X, T + 10, 9, 1, tone(c, 0.4)); });
  wc.setTransform(1, 0, 0, 1, -80, 16);
  F(wc, 54 * T, 15 * T + 2, 7 * T, 13, '#2A2638'); F(wc, 54 * T + 1, 15 * T + 3, 7 * T - 2, 11, '#120A22');
  for (let i = 0; i < 7; i++) { const X = 54 * T + 4 + i * 16; F(wc, X, 15 * T + 5, 10, 7, i % 2 ? '#C858C8' : '#38A8D8'); F(wc, X, 15 * T + 5, 10, 2, i % 2 ? '#F898F8' : '#88D8F8'); F(wc, X + 2, 15 * T + 8, 6, 2, '#120A22'); }
  wc.setTransform(1, 0, 0, 1, -32, 16);
  F(wc, 42 * T, 15 * T + 2, 5 * T, 13, '#5C4636'); F(wc, 42 * T + 1, 15 * T + 3, 5 * T - 2, 11, '#A87848'); for (let i = 0; i < 9; i++) { const X = 42 * T + 4 + i * 8, Y = 15 * T + 5 + (i % 2) * 3; wc.fillStyle = SH; wc.fillRect(X + 1, Y + 1, 6, 4); F(wc, X, Y, 6, 4, i % 3 ? '#F4F4F0' : '#FCE45C'); F(wc, X + 2, Y, 2, 1, '#D83030'); }
  wc.setTransform(1, 0, 0, 1, -32, -32);
  for (let x = 13; x <= 19; x++) { const X = x * T, Y = 33 * T; F(wc, X, Y + 1, T, 14, '#4A3022'); F(wc, X, Y + 1, T, 1, '#6C4A34'); F(wc, X, Y + 7, T, 2, '#6C4A34'); F(wc, X, Y + 8, T, 1, '#2E1C14');
    const bc = ['#8C3030', '#305080', '#3C6C3C', '#8C7030', '#603C80']; for (let b = 0; b < 4; b++) { const c1 = bc[(x + b) % 5], c2 = bc[(x + b + 2) % 5]; F(wc, X + 1 + b * 4, Y + 2, 3, 5, c1); F(wc, X + 1 + b * 4, Y + 2, 1, 5, tone(c1, 0.3)); F(wc, X + 1 + b * 4, Y + 4, 3, 1, '#D8B860'); F(wc, X + 1 + b * 4, Y + 9, 3, 5, c2); F(wc, X + 1 + b * 4, Y + 9, 1, 5, tone(c2, 0.3)); } }
  wc.setTransform(1, 0, 0, 1, -64, -32);
  F(wc, 44 * T, 33 * T + 2, 6 * T, 13, '#5C4636'); F(wc, 44 * T + 1, 33 * T + 3, 6 * T - 2, 11, '#ECECE4');
  [['#3CBCFC', 0, 30], ['#58D854', 18, 40], ['#F878F8', 40, 34], ['#FCBC3C', 10, 50]].forEach(([c, a, w], i) => { const Y = 33 * T + 4 + (i * 2.5 | 0); F(wc, 44 * T + 4 + a, Y, w, 2, c); F(wc, 44 * T + 4 + a, Y, w, 1, tone(c, 0.35)); });
  wc.setTransform(1, 0, 0, 1, -112, -32);
  for (let i = 0; i < 14; i++) { const X = 57 * T + 2 + (i % 7) * 11, Y = 33 * T + 3 + ((i / 7) | 0) * 6, c = ['#FCE45C', '#F878F8', '#58D8F8'][i % 3]; wc.fillStyle = SH; wc.fillRect(X + 1, Y + 1, 8, 5); F(wc, X, Y, 8, 5, c); F(wc, X, Y, 8, 1, tone(c, 0.4)); }
  wc.setTransform(1, 0, 0, 1, -64, -272);
  F(wc, 35 * T, 33 * T + 1, 4 * T, 14, '#2A2C34'); F(wc, 35 * T + 1, 33 * T + 2, 4 * T - 2, 12, '#0C1018');
  for (let i = 0; i < 5; i++) { F(wc, 35 * T + 4, 33 * T + 4 + i * 2, 20 + (i * 13) % 30, 1, i % 2 ? '#F83800' : '#58D854'); F(wc, 35 * T + 2, 33 * T + 4 + i * 2, 1, 1, '#505868'); }
  wc.fillStyle = 'rgba(120,200,255,0.06)'; wc.fillRect(35 * T + 1, 33 * T + 2, 4 * T - 2, 5);
  wc.setTransform(1, 0, 0, 1, 0, 0);
  F(wc, 11 * T + 2, 16 * T + 1, 7 * T - 4, 13, '#5C6070'); F(wc, 11 * T + 3, 16 * T + 2, 7 * T - 6, 10, '#F4F6FA'); F(wc, 11 * T + 3, 16 * T + 2, 7 * T - 6, 1, '#FFFFFF'); F(wc, 11 * T + 8, 16 * T + 4, 30, 2, '#2C4CC8'); F(wc, 11 * T + 8, 16 * T + 8, 46, 1, '#9098B0'); F(wc, 11 * T + 60, 16 * T + 5, 26, 1, '#D83030'); F(wc, 11 * T + 60, 16 * T + 8, 18, 1, '#9098B0'); F(wc, 11 * T + 30, 16 * T + 13, 40, 2, '#3A3C4C');
})();

/* ================= Furniture drawing (16-bit) ================= */
function box(ctx, x, y, w, h, c){ F(ctx, x, y, w, h, '#140A24'); F(ctx, x + 1, y + 1, w - 2, h - 2, c); F(ctx, x + 1, y + 1, w - 2, 1, tone(c, 0.3)); F(ctx, x + 1, y + h - 2, w - 2, 1, tone(c, -0.3)); F(ctx, x + w - 2, y + 1, 1, h - 2, tone(c, -0.2)); }
function drawShadow(fu){
  const ctx = C0; const X = fu.x * T, Y = fu.y * T; ctx.fillStyle = SH;
  if (fu.type === 'desk') ctx.fillRect(X + 3, Y + 14, fu.w * T - 1, 4);
  else if (fu.type === 'chair') ctx.fillRect(X + fu.ox + 4, Y + 9, 11, 3);
  else if (fu.type === 'decor' || fu.type === 'obj') { const w = (fu.w || 1) * T; if (fu.draw === 'table') ctx.fillRect(X + 3, Y + 26, w, 5); else if (fu.draw === 'ctable') ctx.fillRect(X + 3, Y + fu.h * T - 2, w, 5); else ctx.fillRect(X + 3, Y + 13, w - 2, 4); }
}
function drawFurn(fu, now){
  const ctx = C0; const X = fu.x * T, Y = fu.y * T;
  if (fu.type === 'chair') { const cx = X + fu.ox; F(ctx, cx + 2, Y - 3, 12, 13, '#140A24'); F(ctx, cx + 3, Y - 2, 10, 11, '#3E3A5E'); F(ctx, cx + 4, Y - 2, 8, 2, '#5E5A84'); F(ctx, cx + 3, Y + 6, 10, 3, '#2C2844'); F(ctx, cx + 11, Y - 1, 1, 7, '#2C2844'); F(ctx, cx + 7, Y + 9, 2, 3, '#20202C'); return; }
  if (fu.type === 'desk') return drawDesk(fu, now);
  if (fu.type === 'plus') { const n = queue().length - 8; if (n > 0) { F(ctx, X + 3, Y - 10, 2, 18, '#504C60'); hq({ t: 'plus', x: X - 3, y: Y - 16, n }); } return; }
  const d = fu.draw;
  if (d === 'rack') { box(ctx, X, Y - 14, 32, 30, '#323A4E'); for (let j = 0; j < 6; j++) { F(ctx, X + 3, Y - 11 + j * 4, 26, 3, '#1C2232'); F(ctx, X + 3, Y - 11 + j * 4, 26, 1, '#46506A'); const on = (Math.floor(now / 400) + j) % 3 && !RM; F(ctx, X + 5 + ((j * 7) % 18), Y - 10 + j * 4, 2, 1, on ? '#78F078' : '#58C8FC'); F(ctx, X + 24, Y - 10 + j * 4, 3, 1, '#2A3044'); } }
  else if (d === 'ci') { F(ctx, X + 7, Y - 8, 2, 22, '#5C5870'); F(ctx, X + 7, Y - 8, 1, 22, '#7C7890'); box(ctx, X + 3, Y - 16, 10, 9, '#40B848'); F(ctx, X + 5, Y - 14, 3, 2, '#D8FFD8'); ctx.fillStyle = 'rgba(120,255,120,0.12)'; ctx.fillRect(X - 2, Y - 20, 20, 16); }
  else if (d === 'cooler') { box(ctx, X + 3, Y - 2, 10, 16, '#E4E4EC'); F(ctx, X + 5, Y + 3, 3, 2, '#3C78D8'); box(ctx, X + 4, Y - 12, 8, 11, '#6CA8E0'); F(ctx, X + 5, Y - 11, 2, 8, '#B8E0FC'); }
  else if (d === 'easel') { F(ctx, X + 2, Y - 4, 2, 18, '#8C5030'); F(ctx, X + 12, Y - 4, 2, 18, '#6C3C24'); box(ctx, X, Y - 16, 16, 14, '#F8F4EC'); F(ctx, X + 3, Y - 12, 5, 5, '#E060D0'); F(ctx, X + 8, Y - 9, 5, 4, '#38A8E8'); F(ctx, X + 5, Y - 7, 6, 1, '#F0C040'); }
  else if (d === 'cabinet') { box(ctx, X + 1, Y - 10, 14, 26, '#8890A4'); for (let j = 0; j < 3; j++) { F(ctx, X + 2, Y - 2 + j * 8, 12, 1, '#4C5464'); F(ctx, X + 5, Y - 6 + j * 8, 6, 2, '#3C4250'); F(ctx, X + 5, Y - 6 + j * 8, 6, 1, '#B8C0D0'); } F(ctx, X + 11, Y - 8, 2, 2, '#FCBC3C'); F(ctx, X + 11, Y - 8, 1, 1, '#FFF0A0'); }
  else if (d === 'chartscreen') { F(ctx, X + 14, Y + 2, 4, 12, '#504C60'); box(ctx, X + 1, Y - 14, 30, 18, '#0E1620'); [4, 7, 5, 10, 12].forEach((hh, i) => { F(ctx, X + 5 + i * 5, Y + 1 - hh, 3, hh, '#48C848'); F(ctx, X + 5 + i * 5, Y + 1 - hh, 3, 1, '#A8F8A8'); }); ctx.fillStyle = 'rgba(120,255,140,0.08)'; ctx.fillRect(X - 2, Y - 18, 36, 26); }
  else if (d === 'podium') { box(ctx, X + 2, Y - 6, 12, 20, '#8C6A48'); F(ctx, X + 4, Y - 2, 8, 10, '#7A5A3C'); box(ctx, X + 1, Y - 9, 14, 5, '#B08868'); F(ctx, X + 4, Y - 11, 8, 1, '#F4F4FC'); F(ctx, X + 11, Y - 11, 1, 1, '#FCBC3C'); }
  else if (d === 'table') { const w = fu.w * T; F(ctx, X, Y - 6, w, 32, '#140A24'); F(ctx, X + 1, Y - 5, w - 2, 24, '#D4D8E4'); F(ctx, X + 1, Y - 5, w - 2, 2, '#F4F6FC'); for (let k = 0; k < w; k += 24) F(ctx, X + 8 + k, Y - 3, 10, 1, 'rgba(255,255,255,0.6)'); F(ctx, X + 1, Y + 19, w - 2, 6, '#8C90A4'); F(ctx, X + 1, Y + 19, w - 2, 1, '#B4B8CC');
    for (let i = 0; i < 8; i++) { const px = X + 6 + i * 22, py = Y + (i % 3) * 5; ctx.fillStyle = SH; ctx.fillRect(px + 1, py + 1, 8, 6); F(ctx, px, py, 8, 6, '#FCFCFC'); F(ctx, px + 1, py + 1, 5, 1, '#9898B0'); F(ctx, px + 1, py + 3, 6, 1, '#9898B0'); F(ctx, X + 12 + i * 22, Y + 2 + (i % 2) * 6, 6, 1, '#E83020'); F(ctx, X + 12 + i * 22, Y + 2 + (i % 2) * 6, 1, 1, '#202028'); }  drawPlate(ctx, SEATS.rev1.x * T + 8, Y + 18, 'rev1'); drawPlate(ctx, SEATS.rev2.x * T + 8, Y + 18, 'rev2'); }
  else if (d === 'ctable') { const w = fu.w * T, h = fu.h * T; F(ctx, X, Y - 5, w, h + 5, '#140A24'); F(ctx, X + 1, Y - 4, w - 2, h - 4, '#7A5838'); F(ctx, X + 1, Y - 4, w - 2, 1, '#A8805A'); F(ctx, X + 1, Y - 4, 1, h - 4, '#946C48'); for (let k = 0; k < h - 12; k += 9) F(ctx, X + 8, Y + 2 + k, w - 16, 1, '#6A4C30'); F(ctx, X + 1, Y + h - 8, w - 2, 7, '#4E3624'); F(ctx, X + 1, Y + h - 8, w - 2, 1, '#2E1E12'); for (let k = 0; k < 3; k++) { F(ctx, X + 6, Y + 6 + k * 30, 9, 7, '#F4F4FC'); F(ctx, X + 7, Y + 8 + k * 30, 6, 1, '#9898B0'); F(ctx, X + 33, Y + 18 + k * 30, 9, 7, '#F4F4FC'); F(ctx, X + 34, Y + 20 + k * 30, 6, 1, '#9898B0'); } }
  else if (d === 'alarm') { F(ctx, X + 7, Y - 2, 2, 16, '#5C5870'); box(ctx, X + 2, Y - 12, 12, 11, '#B01C14'); F(ctx, X + 5, Y - 9, 6, 5, '#F83800'); F(ctx, X + 5, Y - 9, 6, 1, '#FF9878'); F(ctx, X + 6, Y - 8, 2, 1, '#FFE0D8'); if (!RM && Math.floor(now / 600) % 2) { ctx.fillStyle = 'rgba(255,60,20,0.12)'; ctx.fillRect(X - 3, Y - 17, 22, 21); } }
  else if (d === 'dial') {
    F(ctx, X + 7, Y - 2, 2, 16, '#5C5870'); box(ctx, X + 1, Y - 14, 14, 13, '#ECECE4');
    const t = THS.indexOf(readState().job.threshold); const cols = ['#58D854', '#3CBCFC', '#FCBC3C', '#F83800'];
    for (let i = 0; i < 4; i++) { F(ctx, X + 3 + i * 3, Y - 12, 2, 2, cols[i]); F(ctx, X + 3 + i * 3, Y - 12, 2, 1, tone(cols[i], 0.4)); }
    F(ctx, X + 6, Y - 9, 4, 4, '#9898A8'); F(ctx, X + 7, Y - 8, 2, 2, '#140A24'); const nx = [-4, -1, 2, 4][t]; F(ctx, X + 7 + Math.sign(nx), Y - 9, 1, 1, '#140A24'); F(ctx, X + 7 + nx, Y - 10, 1, 1, '#D82020');
  }
  else if (d === 'board') { F(ctx, X, Y - 14, 48, 18, '#140A24'); F(ctx, X + 1, Y - 13, 46, 16, '#9CA0B0'); F(ctx, X + 2, Y - 12, 44, 14, '#F4F4EE'); F(ctx, X + 2, Y - 12, 44, 1, '#FFFFFF'); for (let i = 1; i < 4; i++) F(ctx, X + 2 + i * 11, Y - 12, 1, 14, '#B0B4C4'); const tk = readState().tickets; Object.keys(tk).forEach((k, i) => tk[k].forEach((_, j) => { F(ctx, X + 3 + i * 11, Y - 9 + j * 5, 8, 4, '#FCE45C'); F(ctx, X + 3 + i * 11, Y - 9 + j * 5, 8, 1, '#FFF8B0'); })); }
  else if (d === 'clock') { box(ctx, X + 2, Y - 14, 12, 28, '#9C8C70'); F(ctx, X + 4, Y - 11, 8, 8, '#F0F0E8'); F(ctx, X + 4, Y - 11, 8, 1, '#FFFFFF'); F(ctx, X + 7, Y - 10, 1, 4, '#140A24'); F(ctx, X + 7, Y - 7, 3, 1, '#140A24'); F(ctx, X + 4, Y, 8, 2, '#140A24'); F(ctx, X + 5, Y + 4, 6, 6, '#7A6C54'); }
  else if (d === 'elevator') { box(ctx, X, Y - 16, 32, 32, '#A8B0C0'); F(ctx, X + 15, Y - 15, 2, 30, '#140A24'); F(ctx, X + 3, Y - 13, 1, 26, '#E0E4EC'); F(ctx, X + 18, Y - 13, 1, 26, '#E0E4EC'); F(ctx, X + 11, Y - 21, 10, 5, '#140A24'); F(ctx, X + 12, Y - 20, 8, 3, '#FCBC3C'); F(ctx, X + 12, Y - 20, 8, 1, '#FFE890'); }
  else if (d === 'bptable') { F(ctx, X + 2, Y + 7, 3, 8, '#4A3426'); F(ctx, X + 27, Y + 7, 3, 8, '#4A3426'); box(ctx, X, Y - 4, 32, 12, '#8C6A48'); F(ctx, X + 4, Y - 2, 24, 7, '#3070D0'); F(ctx, X + 4, Y - 2, 24, 1, '#68A0F0'); F(ctx, X + 6, Y, 10, 1, '#B8D4FC'); F(ctx, X + 6, Y + 2, 16, 1, '#B8D4FC'); F(ctx, X + 18, Y - 1, 1, 4, '#B8D4FC'); }
}
/* Rubber stamp on the President's desk: 16x16 top-down sprite, normal and pressed */
function makeStamp(pressed){
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; const x = c.getContext('2d');
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const o = '#2A160A', d = pressed ? 2 : 0;
  P(3, 14, 10, 1, 'rgba(12,6,24,0.45)'); P(4, 15, 8, 1, 'rgba(12,6,24,0.22)');
  if (pressed) { P(2, 13, 12, 2, o); P(3, 13, 10, 1, '#B01C14'); }
  else { P(3, 12, 10, 2, o); P(4, 12, 8, 1, '#D02820'); P(4, 12, 3, 1, '#F05848'); }
  P(3, 8 + d, 10, 4 - (pressed ? 1 : 0), o); P(4, 8 + d, 8, 3 - (pressed ? 1 : 0), '#8C5A30'); P(4, 8 + d, 8, 1, '#B07A48'); P(11, 9 + d, 1, pressed ? 1 : 2, '#6A4020');
  P(6, 5 + d, 4, pressed ? 1 : 3, o); P(7, 5 + d, 2, pressed ? 1 : 3, '#A06C3C'); P(7, 5 + d, 1, pressed ? 1 : 3, '#C8925A');
  P(6, d, 4, 1, o); P(5, 1 + d, 6, 3, o); P(6, 4 + d, 4, 1, o); P(6, 1 + d, 4, 3, '#C8925A'); P(6, 1 + d, 2, 1, '#F0C890'); P(9, 2 + d, 1, 2, '#8C5A30');
  return c;
}
const STAMP = makeStamp(false), STAMP_DOWN = makeStamp(true);
let stampHover = false, stampUsedAt = -1e9;
function stampUse(){ stampUsedAt = performance.now(); }
function drawDesk(fu, now){
  const ctx = C0; const X = fu.x * T, Y = fu.y * T, w = fu.w * T;
  const k = fu.owner; const bench = fu.kind === 'bench';
  const top = bench ? '#5A3C2C' : fu.kind === 'mine' ? '#94683E' : '#8A6A4A', front = bench ? '#3E281C' : '#5C4232';
  const ty = bench ? Y - 9 : Y - 6;
  F(ctx, X, ty, w, Y + 16 - ty, '#140A24');
  F(ctx, X + 1, ty + 1, w - 2, 7, top); F(ctx, X + 1, ty + 1, w - 2, 1, tone(top, 0.32)); F(ctx, X + 1, ty + 7, w - 2, 1, tone(top, -0.2));
  for (let g = 0; g < w - 8; g += 7) F(ctx, X + 4 + g, ty + 3 + (g % 3), 4, 1, tone(top, -0.1));
  F(ctx, X + 1, ty + 8, w - 2, Y + 14 - ty - 8, front); F(ctx, X + 1, ty + 8, w - 2, 1, tone(front, -0.35)); F(ctx, X + 1, Y + 12, w - 2, 1, tone(front, -0.25));
  if (!bench) { const dw = fu.w === 2 ? 12 : 14; for (let q = 0; q < (fu.w === 2 ? 2 : 3); q++) { const dx = X + 3 + q * (dw + 2); F(ctx, dx, ty + 10, dw, Y + 11 - ty - 10, tone(front, 0.08)); F(ctx, dx + dw / 2 - 2, ty + 12, 4, 1, '#C8A868'); } }
  F(ctx, X + 2, Y + 14, 3, 2, '#140A24'); F(ctx, X + w - 5, Y + 14, 3, 2, '#140A24');
  if (bench) { box(ctx, X + w / 2 - 7, Y + 1, 14, 9, '#B8A0FF'); F(ctx, X + w / 2 - 4, Y + 3, 8, 5, '#5A3C2C'); F(ctx, X + w / 2 - 1, Y + 4, 2, 3, '#D8C870'); }
  drawPlate(ctx, X + w / 2, Y + 4, k);
  if (fu.kind === 'mine') {
    box(ctx, X + 10, Y - 8, 12, 6, '#C8A070'); F(ctx, X + 12, Y - 10, 8, 3, '#FFFFFF'); F(ctx, X + 13, Y - 11, 7, 2, '#ECECF4'); F(ctx, X + 13, Y - 9, 6, 1, '#A8A8C0');
    box(ctx, X + 66, Y - 11, 9, 9, '#9CA0B4'); for (let g = 0; g < 3; g++) F(ctx, X + 68, Y - 9 + g * 2, 3, 1, '#3A3C4C'); F(ctx, X + 72, Y - 9, 2, 2, '#48C848'); F(ctx, X + 72, Y - 9, 1, 1, '#B8FCB8'); F(ctx, X + 72, Y - 6, 2, 2, '#E8E8F0'); F(ctx, X + 65, Y - 3, 11, 1, 'rgba(12,6,24,0.3)');
    F(ctx, X + 55, Y - 5, 8, 1, '#E0D8C8'); F(ctx, X + 55, Y - 4, 8, 1, '#B8B0A0');
    const since = now - stampUsedAt, down = !RM && since < 320;
    F(ctx, X + 62, Y - 6, 3, 3, since < 1600 ? '#F03828' : '#B82418'); F(ctx, X + 63, Y - 5, 1, 1, since < 1600 ? '#FF8C70' : '#D84A38');
    ctx.drawImage(down ? STAMP_DOWN : STAMP, X + 48, Y - 15 - (stampHover && !down ? 1 : 0));
    if (stampHover && !down) { ctx.fillStyle = 'rgba(255,230,160,0.25)'; ctx.fillRect(X + 51, Y - 16, 10, 14); }
    const n = unseenNotes(); if (n > 0) { hq({ t: 'badge', x: X + 21.5, y: Y - 11.5, n }); }
    return;
  }
  const e = ents[k]; const st = k ? roleState(k) : 'idle';
  const tech = ROLE[k] && ROLE[k].tree === 'technology';
  const stopped = st === 'stopped';
  const lx = X + 2;
  if (!stopped) hq({ t: 'glow', x: lx + 2, y: ty - 7, r: 24, c: '255,214,130', a: 0.4 });
  if (!stopped) { ctx.fillStyle = 'rgba(255,230,140,0.16)'; ctx.fillRect(lx - 2, ty - 4, 12, 9); ctx.fillStyle = 'rgba(255,230,140,0.10)'; ctx.fillRect(lx - 4, ty - 1, 16, 7); }
  F(ctx, lx + 2, ty - 6, 1, 6, '#3A3A4C'); F(ctx, lx + 1, ty - 1, 3, 1, '#3A3A4C');
  F(ctx, lx - 1, ty - 10, 7, 5, '#140A24'); F(ctx, lx, ty - 9, 5, 3, stopped ? '#4A4448' : '#E8C040'); F(ctx, lx, ty - 9, 5, 1, stopped ? '#5C5660' : '#FFF0A0'); F(ctx, lx + 1, ty - 6, 3, 1, stopped ? '#302C34' : '#FFFAD8');
  const mx = X + w - 12, my = ty - 11;
  F(ctx, mx + 3, my + 9, 5, 3, '#3A3A4C'); F(ctx, mx + 2, my + 11, 7, 1, '#2A2A38');
  F(ctx, mx, my, 11, 10, '#140A24'); F(ctx, mx + 1, my + 1, 9, 8, '#3A3C4C'); F(ctx, mx + 1, my + 1, 9, 1, '#5C5E70');
  const sx0 = mx + 2, sy0 = my + 2;
  if (stopped) F(ctx, sx0, sy0, 7, 6, '#101018');
  else if (tech) { F(ctx, sx0, sy0, 7, 6, '#0E1A2A'); const cl = ['#58D854', '#3CBCFC', '#F878F8', '#FCBC3C']; for (let j = 0; j < 3; j++) F(ctx, sx0 + (j % 2), sy0 + 1 + j * 2, 2 + ((j * 5 + (st === 'working' && !RM ? Math.floor(now / 300) : 0)) % 5), 1, cl[j]); ctx.fillStyle = 'rgba(80,180,255,0.10)'; ctx.fillRect(mx - 2, my + 10, 15, 4); }
  else { F(ctx, sx0, sy0, 7, 6, '#ECECE4'); F(ctx, sx0, sy0, 7, 1, '#C8C8D8'); for (let j = 0; j < 2; j++) F(ctx, sx0 + 1, sy0 + 2 + j * 2, 5 - j, 1, '#8C8CA0'); ctx.fillStyle = 'rgba(255,255,240,0.10)'; ctx.fillRect(mx - 2, my + 10, 15, 4); }
  F(ctx, sx0, sy0, 1, 1, 'rgba(255,255,255,0.5)');
  if (!stopped) hq({ t: 'glow', x: mx + 5, y: my + 5, r: 15, c: tech ? '90,190,255' : '255,250,230', a: 0.22 });
  if (!e || !atOwnSeat(e)) { const ax = X + (fu.w === 2 ? 9 : w / 2 - 8); hq({ t: 'out', x: ax, y: ty - 7 }); }
  else {
    const hx = X + (e.ox || 0); const skn = lookOf(k).skin;
    const fr = RM ? 0 : Math.floor(now / 160) % 2;
    const hand = (x, y) => { F(ctx, x, y, 2, 2, skn); F(ctx, x, y + 1, 2, 1, tone(skn, -0.2)); };
    if (st === 'working') { hand(hx + 4, ty - 1 + fr); hand(hx + 10, ty - fr); }
    else if (st === 'blocked') { const tp = RM ? 0 : Math.floor(now / 380) % 2; hand(hx + 4, ty); hand(hx + 10, ty - tp); }
    else { hand(hx + 4, ty); hand(hx + 10, ty); }
    if (st === 'sent_back') { box(ctx, X + 4, ty, 10, 6, '#E8C060'); F(ctx, X + 5, ty + 1, 8, 1, '#F8E098'); }
  }
}

/* ================= Character drawing (16-bit) ================= */
function drawEnt(e, now){
  const isYou = e.key === 'you';
  const L = isYou ? Object.assign({}, LOOK.you, { main: SHIRTS[shirt] }) : lookOf(e.key);
  const st = isYou ? '' : roleState(e.key);
  let dir = e.dir; const o = { frame: 0, acc: DEPT[deptOf(e.key)].color };
  const t = now / 1000;
  const seated = !e.moving && (e.key === 'you' ? (e.tx === MYCHAIR.x && e.ty === MYCHAIR.y) : e.seated);
  let sx = Math.round(e.px), sy = Math.round(e.py) - 8;
  if (seated && !e.guest) { sx += e.ox || 0; sy += 4; dir = 'down'; o.seated = true; }
  if (e.moving) { o.walk = true; o.frame = Math.floor(e.dist / 8) % 2; }
  if (!RM) {
    if (st === 'talking') { o.talking = true; o.frame = Math.floor(t * 6) % 2; }
    else if (st === 'in_line' && !e.moving) { const c = (t + e.key.length * 0.37) % 3.4; if (c > 2.7) dir = dir === 'up' ? 'left' : 'up'; o.walk = true; o.frame = Math.floor(t * 0.9 + e.key.length) % 2; }
  }
  if (st === 'sent_back') o.frown = true;
  const q = st === 'in_line' || st === 'delivered' || st === 'talking' ? queue().find(g => g.key === e.key) : null;
  if (q && q.entries.some(x => x.type === 'acceptance') && !o.seated) o.folder = true;
  if (!o.seated) { C0.fillStyle = SH; C0.fillRect(sx + 4, sy + 21, 8, 1); C0.fillRect(sx + 3, sy + 22, 10, 2); C0.fillRect(sx + 4, sy + 24, 8, 1); }
  const id = isYou ? 'you' + shirt : (e.key === 'rev1' || e.key === 'rev2' ? 'reviewer' : e.key);
  C0.drawImage(shaded(id, L, dir, o), sx - 6, sy - 8);
  e.hx = sx + 3; e.hy = sy - 13;
  if (L.feats.indexOf('tophat') >= 0 || L.feats.indexOf('captain') >= 0) e.hy -= 4;
}

/* ================= Rendering ================= */
const cam = { x: 0, y: 0 };
let camSnap = true, camLast = 0, lastRoom = null; const camF = { x: 0, y: 0 };
function camTarget(){
  let tx = P.px + 8 - VW / 2, ty = P.py - VH / 2;
  const rm = roomOf(P.px / T, P.py / T) || lastRoom; if (rm) lastRoom = rm;
  if (rm && !rm.free) {
    const L = (rm.r[0] - 1) * T, R = (rm.r[2] + 2) * T, Tp = (rm.r[1] - 1) * T - 8, B = (rm.r[3] + 2) * T;
    tx = R - L <= VW ? (L + R) / 2 - VW / 2 : Math.max(L, Math.min(R - VW, tx));
    ty = B - Tp <= VH ? (Tp + B) / 2 - VH / 2 : Math.max(Tp, Math.min(B - VH, ty));
  }
  return [Math.max(0, Math.min(W * T - VW, tx)), Math.max(0, Math.min(H * T - VH, ty))];
}
function moveCam(now){
  const [tx, ty] = camTarget(); const dt = Math.min(0.05, (now - camLast) / 1000); camLast = now;
  if (camSnap || RM) { camF.x = tx; camF.y = ty; camSnap = false; }
  else { const k = Math.min(1, dt * 9); camF.x += (tx - camF.x) * k; camF.y += (ty - camF.y) * k; if (Math.abs(tx - camF.x) < 0.5) camF.x = tx; if (Math.abs(ty - camF.y) < 0.5) camF.y = ty; }
  cam.x = Math.round(camF.x); cam.y = Math.round(camF.y);
}
/* ================= 32-bit pipeline: scene at 320x240, smoothed 2x, then lit and labelled at screen resolution ================= */
const HIQ = [];
function hq(item){ HIQ.push(item); }
function scale2x(s, w, h, out){
  const W2 = w * 2;
  for (let y = 0; y < h; y++) {
    const ym = y > 0 ? y - 1 : 0, yp = y < h - 1 ? y + 1 : y;
    for (let x = 0; x < w; x++) {
      const xm = x > 0 ? x - 1 : 0, xp = x < w - 1 ? x + 1 : x;
      const E = s[y * w + x], B = s[ym * w + x], D = s[y * w + xm], Fv = s[y * w + xp], Hh = s[yp * w + x];
      let e0 = E, e1 = E, e2 = E, e3 = E;
      if (B !== Hh && D !== Fv) { if (D === B) e0 = D; if (B === Fv) e1 = Fv; if (D === Hh) e2 = D; if (Hh === Fv) e3 = Fv; }
      const o = y * 2 * W2 + x * 2; out[o] = e0; out[o + 1] = e1; out[o + W2] = e2; out[o + W2 + 1] = e3;
    }
  }
}
const EPXC = new Map();
function smoothCanvas(c){
  let r = EPXC.get(c); if (r) return r;
  const w = c.width, h = c.height; const img = c.getContext('2d').getImageData(0, 0, w, h);
  const out = new ImageData(w * 2, h * 2); scale2x(new Uint32Array(img.data.buffer), w, h, new Uint32Array(out.data.buffer));
  r = document.createElement('canvas'); r.width = w * 2; r.height = h * 2; r.getContext('2d').putImageData(out, 0, 0); EPXC.set(c, r); return r;
}
const MID = document.createElement('canvas'); MID.width = VW * 2; MID.height = VH * 2; const MX = MID.getContext('2d');
const midImg = MX.createImageData(VW * 2, VH * 2); const mid32 = new Uint32Array(midImg.data.buffer);
const LIGHTS = [
  ...[26, 27, 28, 29, 30].map(x => ({ x: x * T + 8, y: T + 8, r: 26, c: '170,215,255', a: 0.22 })),
  { x: 52 * T + 8, y: 16 * T + 8, r: 46, c: '220,110,255', a: 0.16 }, { x: 33 * T, y: 16 * T + 8, r: 34, c: '120,255,160', a: 0.14 },
  { x: 11 * T + 8, y: 2 * T - 12, r: 20, c: '120,255,120', a: 0.3 }, { x: 36 * T + 8, y: 2 * T - 6, r: 22, c: '255,70,30', a: 0.28, pulse: true },
  { x: 54 * T, y: 38 * T - 6, r: 26, c: '110,255,140', a: 0.16 }, { x: 17 * T, y: 2 * T - 2, r: 22, c: '90,200,255', a: 0.14 },
  { x: 37 * T, y: 32 * T - 18, r: 14, c: '255,210,90', a: 0.3 }, { x: 53 * T + 8, y: 21 * T - 8, r: 18, c: '255,255,240', a: 0.1 }
];
function rr(D, x, y, w, h, r){ D.beginPath(); if (D.roundRect) D.roundRect(x, y, w, h, r); else D.rect(x, y, w, h); }
function pill(D, x, y, w, h, top, bot, edge){ const g = D.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot); D.fillStyle = 'rgba(8,4,20,0.35)'; rr(D, x + 0.6, y + 0.9, w, h, Math.min(2, h / 3)); D.fill(); D.fillStyle = g; rr(D, x, y, w, h, Math.min(2, h / 3)); D.fill(); D.strokeStyle = edge || 'rgba(20,10,36,0.9)'; D.lineWidth = 0.5; D.stroke(); }
function label(D, s, x, y, size, color, weight){ D.font = (weight || 700) + ' ' + size + 'px "Chakra Petch", "Arial Narrow", sans-serif'; D.fillStyle = color; D.textAlign = 'center'; D.textBaseline = 'middle'; D.fillText(s, x, y); }
function hiPass(now){
  const D = DC, R = cv.width / VW;
  D.setTransform(R, 0, 0, R, -cam.x * R, -cam.y * R);
  D.globalCompositeOperation = 'source-over'; D.fillStyle = 'rgba(10,8,32,0.14)'; D.fillRect(cam.x, cam.y, VW, VH);
  D.globalCompositeOperation = 'lighter';
  const pulse = RM ? 1 : 0.6 + 0.4 * Math.sin(now / 500);
  const glows = LIGHTS.concat(HIQ.filter(q => q.t === 'glow'));
  glows.forEach(g => { if (g.x + g.r < cam.x || g.x - g.r > cam.x + VW || g.y + g.r < cam.y || g.y - g.r > cam.y + VH) return; const a = g.a * (g.pulse ? pulse : 1); const rg = D.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r); rg.addColorStop(0, 'rgba(' + g.c + ',' + a + ')'); rg.addColorStop(1, 'rgba(' + g.c + ',0)'); D.fillStyle = rg; D.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2); });
  if (cam.y < 6 * T && cam.x < 31 * T && cam.x + VW > 26 * T) { const lg = D.createLinearGradient(0, 2 * T, 0, 6 * T); lg.addColorStop(0, 'rgba(255,240,210,0.13)'); lg.addColorStop(1, 'rgba(255,240,210,0)'); D.fillStyle = lg; D.beginPath(); D.moveTo(26 * T, 2 * T); D.lineTo(31 * T, 2 * T); D.lineTo(31 * T - 26, 6 * T); D.lineTo(26 * T - 40, 6 * T); D.closePath(); D.fill(); }
  D.globalCompositeOperation = 'source-over';
  HIQ.forEach(q => {
    if (q.t === 'plate') { const s = PLATE[q.key]; D.font = '700 5.5px "Chakra Petch", "Arial Narrow", sans-serif'; const w = D.measureText(s).width + 5, h = 7.5, x = q.x - w / 2; pill(D, x, q.y - 0.5, w, h, '#FFF8E6', '#D6CAA6'); D.fillStyle = DEPT[deptOf(q.key)].color; D.fillRect(x + 1, q.y, w - 2, 1); label(D, s, q.x, q.y + h / 2 + 0.2, 5.5, '#2A1E14'); }
    else if (q.t === 'out') { pill(D, q.x, q.y, 17, 8, '#FFFFFF', '#CFD2E6'); label(D, 'OUT', q.x + 8.5, q.y + 4.3, 5.5, '#2A1E3C'); }
    else if (q.t === 'plus') { pill(D, q.x, q.y, 18, 10, '#FFFFFF', '#CFD2E6'); label(D, '+' + Math.min(99, q.n), q.x + 9, q.y + 5.2, 6.5, '#2A1E3C'); }
    else if (q.t === 'badge') { const g = D.createRadialGradient(q.x - 1, q.y - 1.5, 0.5, q.x, q.y, 4); g.addColorStop(0, '#FF9C70'); g.addColorStop(1, '#C81C0C'); D.fillStyle = 'rgba(8,4,20,0.35)'; D.beginPath(); D.arc(q.x + 0.6, q.y + 0.8, 3.8, 0, 7); D.fill(); D.fillStyle = g; D.beginPath(); D.arc(q.x, q.y, 3.8, 0, 7); D.fill(); D.strokeStyle = '#5A0A04'; D.lineWidth = 0.5; D.stroke(); label(D, String(Math.min(9, q.n)), q.x, q.y + 0.3, 5.5, '#FFFFFF'); }
    else if (q.t === 'mk') { const c = q.mk.fill; pill(D, q.x - 0.5, q.y - 0.5, 10, 11.5, tone(c, 0.45), tone(c, -0.2)); D.fillStyle = tone(c, -0.2); D.beginPath(); D.moveTo(q.x + 2.5, q.y + 10.8); D.lineTo(q.x + 6.5, q.y + 10.8); D.lineTo(q.x + 4.5, q.y + 13.5); D.closePath(); D.fill(); D.fillStyle = 'rgba(255,255,255,0.55)'; rr(D, q.x + 1, q.y + 0.5, 7, 2, 1); D.fill(); label(D, q.mk.glyph === 'check' ? '✓' : q.mk.glyph, q.x + 4.5, q.y + 6, 8.5, '#140A24', 800);
      if (q.n > 1) { D.fillStyle = '#FFFFFF'; D.beginPath(); D.arc(q.x + 10.5, q.y - 0.5, 3.4, 0, 7); D.fill(); D.strokeStyle = '#140A24'; D.lineWidth = 0.5; D.stroke(); label(D, String(Math.min(9, q.n)), q.x + 10.5, q.y - 0.2, 5, '#140A24'); } }
    else if (q.t === 'dots') { pill(D, q.x - 1, q.y + 1, 13, 8, '#FFFFFF', '#CFD2E6'); D.fillStyle = '#2A1E3C'; for (let i = 0; i < 3; i++) { D.beginPath(); D.arc(q.x + 2.5 + i * 3, q.y + 5, 1, 0, 7); D.fill(); } }
    else if (q.t === 'hand') { const x = q.x + 1, y = q.y - 2; D.fillStyle = 'rgba(8,4,20,0.35)'; rr(D, x + 0.8, y + 4.8, 8, 7, 2); D.fill(); D.fillStyle = '#FFD8A8'; D.strokeStyle = '#3A1E10'; D.lineWidth = 0.5; [0, 2, 4, 6].forEach((dx, i) => { rr(D, x + dx, y + (i === 0 || i === 3 ? 1.2 : 0), 1.8, 6, 0.9); D.fill(); D.stroke(); }); rr(D, x - 0.2, y + 4, 8, 7, 2.2); D.fill(); D.stroke(); rr(D, x - 2.2, y + 5.2, 3, 2, 1); D.fill(); D.stroke(); }
    else if (q.t === 'pm') { label(D, '!', q.x + 5, q.y + 6.5, 10, 'rgba(12,6,24,0.5)', 800); label(D, '!', q.x + 4.5, q.y + 6, 10, '#FCE45C', 800); }
  });
  D.setTransform(1, 0, 0, 1, 0, 0);
  const vg = D.createRadialGradient(cv.width / 2, cv.height / 2, cv.width * 0.22, cv.width / 2, cv.height / 2, cv.width * 0.7);
  vg.addColorStop(0, 'rgba(10,4,24,0)'); vg.addColorStop(1, 'rgba(10,4,24,0.42)'); D.fillStyle = vg; D.fillRect(0, 0, cv.width, cv.height);
}
function drawOverlays(now){
  queue().forEach(g => { const e = ents[g.key]; if (!e || e.hx == null) return; hq({ t: 'mk', x: e.hx, y: e.hy, mk: markerOf(g.entries[0]), n: g.entries.length }); });
  ROSTER.forEach(k => { const e = ents[k]; if (e.hx == null) return; const st = roleState(k); if (st === 'blocked') hq({ t: 'dots', x: e.hx, y: e.hy }); if (HANDS.indexOf(k) >= 0) hq({ t: 'hand', x: e.hx, y: e.hy }); if (k === 'pm' && st === 'working') hq({ t: 'pm', x: e.hx, y: e.hy }); });
}
function render(now){
  moveCam(now); HIQ.length = 0;
  C0.setTransform(1, 0, 0, 1, 0, 0); C0.fillStyle = '#000'; C0.fillRect(0, 0, VW, VH);
  C0.drawImage(world, cam.x, cam.y, VW, VH, 0, 0, VW, VH);
  C0.setTransform(1, 0, 0, 1, -cam.x, -cam.y);
  const list = [];
  FURN.forEach(f => { if ((f.x + (f.w || 1)) * T < cam.x - 16 || f.x * T > cam.x + VW + 16 || f.y * T < cam.y - 40 || f.y * T > cam.y + VH + 40) return; list.push({ b: f.base, f }); });
  list.forEach(it => drawShadow(it.f));
  ROSTER.forEach(k => { const e = ents[k]; e.hx = null; list.push({ b: Math.round(e.py) + 16 + (e.moving ? 0.5 : 0), e }); });
  list.push({ b: Math.round(P.py) + 16.4, e: P, p: true });
  list.sort((a, b) => a.b - b.b);
  list.forEach(it => { if (it.f) drawFurn(it.f, now); else drawEnt(it.e, now); });
  drawOverlays(now);
  C0.setTransform(1, 0, 0, 1, 0, 0);
  const src = C0.getImageData(0, 0, VW, VH);
  scale2x(new Uint32Array(src.data.buffer), VW, VH, mid32); MX.putImageData(midImg, 0, 0);
  DC.setTransform(1, 0, 0, 1, 0, 0); DC.imageSmoothingEnabled = true; DC.imageSmoothingQuality = 'high';
  DC.drawImage(MID, 0, 0, cv.width, cv.height);
  hiPass(now);
}

/* ================= Minimap ================= */
const mapBase = document.createElement('canvas'); mapBase.width = W; mapBase.height = H;
(function(){ const m = mapBase.getContext('2d'); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = idx(x, y); let c = '#07060E'; if (grid[i]) { const rm = roomAt[i] >= 0 ? ROOMS[roomAt[i]] : null; c = rm ? (rm.mini || mix(rm.trim, '#100C20', 0.5)) : '#2A2640'; } if (block[i] === 1 && grid[i]) c = mix(c, '#000000', 0.25); F(m, x, y, 1, 1, c); } })();
function mix(a, b, t){ const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return '#' + pa.map((v, i) => Math.round(v * (1 - t) + pb[i] * t).toString(16).padStart(2, '0')).join(''); }
function drawMap(ctx, ts, now){
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mapBase, 0, 0, W * ts, H * ts);
  ROSTER.forEach(k => { const e = ents[k]; const x = (e.px / T + 0.5) * ts, y = (e.py / T + 0.5) * ts, s = Math.max(3, ts); F(ctx, x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2, '#000'); F(ctx, x - s / 2, y - s / 2, s, s, DEPT[deptOf(k)].color); });
  if (RM || Math.floor(now / 300) % 2) { const x = (P.px / T + 0.5) * ts, y = (P.py / T + 0.5) * ts, s = Math.max(3, ts) + 1; F(ctx, x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2, '#000'); F(ctx, x - s / 2, y - s / 2, s, s, '#FFFFFF'); }
}
const mini = document.getElementById('mini'); const mctx = mini.getContext('2d');
const big = document.getElementById('bigmap'); const bctx = big.getContext('2d'); let bigTs = 8;
function sizeMini(){ const d = window.devicePixelRatio || 1; mini.width = 192 * d; mini.height = 132 * d; mctx.setTransform(d, 0, 0, d, 0, 0); }
function sizeBig(){ const d = window.devicePixelRatio || 1; const aw = Math.min(innerWidth - 40, innerWidth >= 900 ? innerWidth - 480 : innerWidth - 40); bigTs = Math.max(4, Math.min(14, Math.floor(aw / W))); big.width = W * bigTs * d; big.height = H * bigTs * d; big.style.width = W * bigTs + 'px'; big.style.height = H * bigTs + 'px'; bctx.setTransform(d, 0, 0, d, 0, 0); }
function hitMap(cx, cy, ts){
  let best = null, bd = Math.max(6, ts * 1.4);
  ROSTER.forEach(k => { const e = ents[k]; const x = (e.px / T + 0.5) * ts, y = (e.py / T + 0.5) * ts; const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = { key: k }; } });
  if (best) return best;
  const tx = Math.floor(cx / ts), ty = Math.floor(cy / ts); if (!inb(tx, ty)) return null;
  const rm = roomOf(tx, ty); return rm ? { room: rm.id } : null;
}
const tip = document.getElementById('tip');
function showTip(hit, x, y){
  if (!hit) { tip.hidden = true; return; }
  if (hit.key) { const e = ents[hit.key]; const rm = roomOf(e.px / T, e.py / T); tip.textContent = fullNameOf(hit.key) + ' · ' + (rm ? rm.name : 'Doorway') + ' · ' + stateLabel(hit.key); }
  else tip.textContent = ROOMBY[hit.room].name + ': click to go to its door';
  tip.hidden = false; const w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w - 12)) + 'px'; tip.style.top = (y + 14) + 'px';
}
function mapClick(hit){ if (!hit) return; closeMap(); if (hit.key) goToChar(hit.key); else goToRoom(hit.room); }
[[mini, () => 3], [big, () => bigTs]].forEach(([el, ts]) => {
  el.addEventListener('mousemove', ev => { const b = el.getBoundingClientRect(); showTip(hitMap(ev.clientX - b.left, ev.clientY - b.top, ts()), ev.clientX, ev.clientY); });
  el.addEventListener('mouseleave', () => { tip.hidden = true; });
  el.addEventListener('click', ev => { const b = el.getBoundingClientRect(); tip.hidden = true; mapClick(hitMap(ev.clientX - b.left, ev.clientY - b.top, ts())); });
});

/* ================= Full map ================= */
const mapEl = document.getElementById('map'), roster = document.getElementById('roster');
function rosterOrder(){ const q = queue().map(g => g.key); const rest = ROSTER.filter(k => q.indexOf(k) < 0); return q.concat(rest); }
function buildRoster(){
  roster.textContent = '';
  const keys = rosterOrder(); const q = queue().map(g => g.key);
  keys.forEach(k => {
    if (k === 'rev2') return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem');
    if (q.indexOf(k) >= 0) b.className = 'wait';
    const dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = DEPT[deptOf(k)].color;
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = k === 'rev1' ? 'Nick Pick and Penn Redd, Expert Reviewers' : fullNameOf(k);
    const e = ents[k]; const rm = roomOf(e.px / T, e.py / T);
    const st = document.createElement('span'); st.className = 'st'; st.textContent = (rm ? rm.name : 'Doorway') + ' · ' + stateLabel(k);
    b.append(dot, nm, st); b.addEventListener('click', () => { closeMap(); goToChar(k); });
    roster.appendChild(b);
  });
}
let mapOpen = false;
function openMap(){ if (dlgOpen()) closeDialog(true); mapOpen = true; mapEl.hidden = false; sizeBig(); buildRoster(); const f = roster.querySelector('button'); if (f) f.focus(); }
function closeMap(){ mapOpen = false; mapEl.hidden = true; tip.hidden = true; }
document.getElementById('map-x').addEventListener('click', closeMap);

