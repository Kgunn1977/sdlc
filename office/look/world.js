/* Look: comes from the design. A new design replaces this file. */
'use strict';
/* ================= Constants ================= */
const T = 16, W = 64, H = 44, VW = 320, VH = 240;
const O = '#100C20';
const PR = { low: 0, medium: 1, high: 2, critical: 3 };
const THS = ['low', 'medium', 'high', 'critical'];
const DEPT = {
  leadership: { name: 'Leadership', color: '#FCBC3C' },
  technology: { name: 'Technology', color: '#3CBCFC' },
  marketing:  { name: 'Marketing',  color: '#F878F8' },
  legal:      { name: 'Legal',      color: '#B8A0FF' },
  product:    { name: 'Product',    color: '#58D854' },
  review:     { name: 'Review Room', color: '#E0E0E8' },
  player:     { name: 'Player',     color: '#FCFCFC' }
};
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => { RM = e.matches; });

/* ================= Map ================= */
const ROOMS = [
  { id: 'office', name: 'Your Office', r: [20, 2, 37, 12], floor: ['#4E4C60', '#525064'], trim: '#A8A4C8', mini: '#5C5A78', door: { x: 28, y: 4 } },
  { id: 'line', name: 'The Line', r: [20, 14, 37, 15], floor: ['#3E3C4C', '#413F50'], trim: null, mini: '#2A2640', door: { x: 22, y: 15 } },
  { id: 'ceo', name: 'CEO Suite', r: [39, 2, 56, 12], floor: ['#5A4E46', '#5E5249'], trim: '#FCBC3C', door: { x: 47, y: 12 } },
  { id: 'tech', name: 'Technology', r: [1, 2, 18, 12], floor: ['#3C4858', '#3F4B5B'], trim: '#3CBCFC', door: { x: 10, y: 12 } },
  { id: 'cto', name: 'CTO Office', r: [1, 17, 8, 27], floor: ['#3A4658', '#3D495B'], trim: '#3CBCFC', door: { x: 5, y: 17 } },
  { id: 'conference', name: 'Conference Room', r: [10, 17, 18, 27], floor: ['#5A4E46', '#5E5249'], trim: '#E8C890', door: { x: 14, y: 26 } },
  { id: 'review', name: 'Review Room', r: [20, 17, 37, 27], floor: ['#4A5058', '#4D535B'], trim: '#C8D0D8', mini: '#4C5468', door: { x: 28, y: 27 } },
  { id: 'marketing', name: 'Marketing', r: [39, 17, 56, 27], floor: ['#58465A', '#5C4A5E'], trim: '#F878F8', door: { x: 47, y: 17 } },
  { id: 'legal', name: 'Legal', r: [1, 32, 18, 42], floor: ['#4E4860', '#514B63'], trim: '#B8A0FF', door: { x: 10, y: 32 } },
  { id: 'lobby', name: 'Lobby', r: [20, 32, 37, 42], floor: ['#4A4656', '#4D4959'], trim: '#C8C0A8', mini: '#4A4660', door: { x: 28, y: 32 } },
  { id: 'product', name: 'Product', r: [39, 32, 56, 42], floor: ['#435444', '#465747'], trim: '#58D854', door: { x: 47, y: 32 } },
  { id: 'corridor', name: 'Main corridor', r: [1, 29, 62, 30], rs: [[1, 14, 18, 15], [39, 14, 62, 15], [58, 16, 62, 28], [1, 29, 62, 30]], free: true, floor: ['#44404E', '#47434F'], trim: null, mini: '#2A2640', door: { x: 30, y: 30 } }
];
const ROOMBY = {}; ROOMS.forEach(r => ROOMBY[r.id] = r);
const grid = new Uint8Array(W * H);         // 1 = walkable floor
const roomAt = new Int8Array(W * H).fill(-1);
const block = new Uint8Array(W * H);        // 1 = furniture, 2 = chair
ROOMS.forEach((rm, i) => (rm.rs || [rm.r]).forEach(([x1, y1, x2, y2]) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) { grid[y * W + x] = 1; roomAt[y * W + x] = i; } }));
const DOORS = [[10, 13], [28, 13], [47, 13], [19, 14], [19, 15], [38, 14], [38, 15], [5, 16], [47, 16], [14, 28], [28, 28], [47, 28], [10, 31], [28, 31], [47, 31]];
DOORS.forEach(([x, y]) => { grid[y * W + x] = 1; });
const idx = (x, y) => y * W + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
function roomOf(x, y){ const i = roomAt[idx(Math.round(x), Math.round(y))]; return i >= 0 ? ROOMS[i] : null; }
function isGlassWall(x, y){ return ((x === 9 || x === 19 || x === 38) && y >= 16 && y <= 28) || ((y === 16 || y === 28) && ((x >= 0 && x <= 9) || (x >= 19 && x <= 38))); }

/* ================= Characters ================= */
const S1 = '#F8B888', S2 = '#C88050', S3 = '#8C5030';
const LOOK = {
  you:      { skin: S1, main: '#5878C8', hair: '#583018', hairStyle: 'short', feats: [], torso: 'plain', prop: 'mug' },
  ceo:      { skin: S1, main: '#203070', hair: '#C8C8D4', hairStyle: 'short', feats: [], torso: 'suitTie', prop: 'baton' },
  cto:      { skin: S2, main: '#C8C0B0', hair: '#201818', hairStyle: 'short', feats: [], torso: 'sleeves', prop: 'tabwrench' },
  architect:{ skin: S1, main: '#5C6478', hair: '#9C9CA4', hairStyle: 'short', feats: ['glasses', 'beardGray'], torso: 'plain', prop: 'blueprint' },
  engineer: { skin: S1, main: '#4C5C70', hair: '#C84820', hairStyle: 'short', feats: ['hood', 'beardRed', 'headphones'], torso: 'plain', prop: 'laptop' },
  qa:       { skin: S3, main: '#E0E0E0', hair: '#181818', hairStyle: 'short', feats: [], torso: 'vest', prop: 'magnifier' },
  security: { skin: S2, main: '#283040', hair: '#181818', hairStyle: 'short', feats: [], torso: 'badge', prop: 'shield' },
  release:  { skin: S1, main: '#7A5030', hair: '#D8A838', hairStyle: 'short', feats: ['goggles'], torso: 'flight', prop: 'rocket' },
  cmo:      { skin: S2, main: '#C83890', hair: '#301810', hairStyle: 'long', feats: [], torso: 'feather', prop: 'megaphone' },
  'brand-designer': { skin: S1, main: '#E4E0D4', hair: '#402818', hairStyle: 'short', feats: ['beret'], torso: 'smock', prop: 'palette' },
  writer:   { skin: S3, main: '#8C6848', hair: '#181818', hairStyle: 'long', feats: ['glasses'], torso: 'cardigan', prop: 'quill' },
  community:{ skin: S3, main: '#3878C8', hair: '#181818', hairStyle: 'none', feats: ['scarf', 'headset'], torso: 'plain', prop: 'speechmug' },
  clo:      { skin: S2, main: '#18181E', hair: '#F0F0F0', hairStyle: 'none', feats: ['wig'], torso: 'robe', prop: 'gavel' },
  compliance:{ skin: S1, main: '#6040A0', hair: '#502810', hairStyle: 'short', feats: ['cap'], torso: 'plain', prop: 'clipboard' },
  privacy:  { skin: S3, main: '#202028', hair: '#181818', hairStyle: 'short', feats: ['sunglasses'], torso: 'suitDark', prop: 'lockfolder' },
  ip:       { skin: S1, main: '#384058', hair: '#806040', hairStyle: 'short', feats: ['tophat'], torso: 'bowtie', prop: 'coin' },
  cpo:      { skin: S2, main: '#287838', hair: '#402010', hairStyle: 'short', feats: ['captain'], torso: 'buttons', prop: 'compass' },
  pm:       { skin: S1, main: '#D4CCE4', hair: '#A04818', hairStyle: 'short', feats: [], torso: 'sticky', prop: 'scroll' },
  analyst:  { skin: S2, main: '#208484', hair: '#181818', hairStyle: 'long', feats: [], torso: 'cardigan', prop: 'chart' },
  'product-designer': { skin: S3, main: '#E07830', hair: '#281810', hairStyle: 'short', feats: ['headband', 'ponytail', 'pencil'], torso: 'plain', prop: 'sketch' },
  reviewer: { skin: S1, main: '#7A6040', hair: '#A0A0A8', hairStyle: 'short', feats: [], torso: 'tweed', prop: 'redpen' }
};
const SHIRTS = ['#5878C8', '#C84848', '#E0A030', '#48A058', '#8858C0'];
const SEATS = {
  ceo: { x: 47, y: 4, ox: 0, desk: { x: 46, y: 5, w: 3, kind: 'exec' } },
  cto: { x: 4, y: 20, ox: 8, desk: { x: 4, y: 21, w: 2 } },
  architect: { x: 3, y: 4, ox: 8, desk: { x: 3, y: 5, w: 2 } },
  engineer: { x: 8, y: 4, ox: 8, desk: { x: 8, y: 5, w: 2 } },
  qa: { x: 13, y: 4, ox: 8, desk: { x: 13, y: 5, w: 2 } },
  security: { x: 3, y: 9, ox: 8, desk: { x: 3, y: 10, w: 2 } },
  release: { x: 8, y: 9, ox: 8, desk: { x: 8, y: 10, w: 2 } },
  cmo: { x: 41, y: 19, ox: 8, desk: { x: 41, y: 20, w: 2 } },
  'brand-designer': { x: 45, y: 19, ox: 8, desk: { x: 45, y: 20, w: 2 } },
  writer: { x: 41, y: 23, ox: 8, desk: { x: 41, y: 24, w: 2 } },
  community: { x: 45, y: 23, ox: 8, desk: { x: 45, y: 24, w: 2 } },
  clo: { x: 14, y: 33, ox: 0, desk: { x: 13, y: 34, w: 3, kind: 'bench' } },
  compliance: { x: 2, y: 36, ox: 8, desk: { x: 2, y: 37, w: 2 } },
  privacy: { x: 7, y: 36, ox: 8, desk: { x: 7, y: 37, w: 2 } },
  ip: { x: 2, y: 39, ox: 8, desk: { x: 2, y: 40, w: 2 } },
  cpo: { x: 41, y: 34, ox: 8, desk: { x: 41, y: 35, w: 2 } },
  pm: { x: 48, y: 34, ox: 8, desk: { x: 48, y: 35, w: 2 } },
  analyst: { x: 41, y: 38, ox: 8, desk: { x: 41, y: 39, w: 2 } },
  'product-designer': { x: 48, y: 38, ox: 8, desk: { x: 48, y: 39, w: 2 } },
  rev1: { x: 27, y: 20, ox: 0, desk: null },
  rev2: { x: 30, y: 20, ox: 0, desk: null }
};
const GUEST = [{ x: 28, y: 23 }, { x: 26, y: 23 }, { x: 31, y: 23 }];
const SLOTS = []; for (let i = 0; i < 8; i++) SLOTS.push({ x: 28 + i, y: 14 });
const VISIT = { x: 28, y: 6 };
const CONF_CEO = { x: 14, y: 18 }, CONF_YOU = { x: 14, y: 26 };
const CONF_SEATS = []; for (let i = 0; i < 6; i++) { CONF_SEATS.push({ x: 12, y: 20 + i, face: 'right' }); CONF_SEATS.push({ x: 16, y: 20 + i, face: 'left' }); }
const MYCHAIR = { x: 28, y: 4 };
const ROSTER = DATA.roles.map(r => r.key).concat(['rev1', 'rev2']);
const NAMES = { ceo: 'Max Agenda', cto: 'Morgan Merge', architect: 'Lloyd Plans', engineer: 'Rusty Patch', qa: 'Dee Bugg', security: 'Ward Shield', release: 'Skye Launch', cmo: 'Mira Hype', 'brand-designer': 'Pablo Hue', writer: 'Paige Turner', community: 'Faye Kew', clo: 'Justine Case', compliance: 'Connie Form', privacy: 'Anne Onymous', ip: 'Pat Ent', cpo: 'Skip Roadmap', pm: 'Tess Ticket', analyst: 'Annie Lytics', 'product-designer': 'Wanda Frame', rev1: 'Nick Pick', rev2: 'Penn Redd' };
function nameOf(k){ return k === 'you' ? 'You' : NAMES[k]; }
function fullNameOf(k){ return k === 'you' ? 'You' : NAMES[k] + ', ' + (k === 'rev1' || k === 'rev2' ? 'Expert Reviewer' : ROLE[k].title); }
function deptOf(k){ if (k === 'rev1' || k === 'rev2') return 'review'; if (k === 'you') return 'player'; return ROLE[k].tree; }
function lookOf(k){ if (k === 'rev1' || k === 'rev2') return LOOK.reviewer; return LOOK[k]; }
function isLegal(k){ return ROLE[k] && ROLE[k].tree === 'legal'; }

/* furniture: desks, chairs, and objects */
const FURN = [];
function blockRect(x, y, w, h, v){ for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) block[idx(x + i, y + j)] = v || 1; }
Object.keys(SEATS).forEach(k => {
  const s = SEATS[k];
  FURN.push({ type: 'chair', x: s.x, y: s.y, ox: s.ox, owner: k, base: s.y * T + 15 });
  block[idx(s.x, s.y)] = 2;
  if (s.desk) { FURN.push({ type: 'desk', x: s.desk.x, y: s.desk.y, w: s.desk.w, kind: s.desk.kind || 'desk', owner: k, base: s.desk.y * T + 16 }); blockRect(s.desk.x, s.desk.y, s.desk.w, 1); }
});
GUEST.forEach(g => { FURN.push({ type: 'chair', x: g.x, y: g.y, ox: 0, owner: null, base: g.y * T + 15 }); block[idx(g.x, g.y)] = 2; });
CONF_SEATS.forEach(c => { FURN.push({ type: 'chair', x: c.x, y: c.y, ox: 0, owner: null, base: c.y * T + 15 }); block[idx(c.x, c.y)] = 2; });
// your desk + chair
FURN.push({ type: 'chair', x: MYCHAIR.x, y: MYCHAIR.y, ox: 0, owner: 'you', base: MYCHAIR.y * T + 15 }); block[idx(MYCHAIR.x, MYCHAIR.y)] = 2;
FURN.push({ type: 'desk', x: MYCHAIR.x - 1, y: MYCHAIR.y + 1, w: 3, kind: 'mine', owner: 'you', base: (MYCHAIR.y + 1) * T + 16 }); blockRect(MYCHAIR.x - 1, MYCHAIR.y + 1, 3, 1);
const OBJS = [
  { id: 'intray', tip: 'Inbox', tiles: [[27, 5]], label: 'Inbox', act: 'notes', rect: [432, 66, 16, 15] },
  { id: 'mydesk', tiles: [[28, 5]], label: 'Your desk', act: 'next', noclick: true },
  { id: 'intercom', tip: 'Call CEO', tiles: [[29, 5]], label: 'Intercom: call the CEO', act: 'intercom', rect: [466, 66, 11, 15] },
  { id: 'stamp', tip: 'Rubber stamp', tiles: [[30, 5]], label: 'Rubber stamp: accept a whole job', act: 'stamp', rect: [447, 63, 12, 17] },
  { id: 'cabinet', tip: 'Choose project', tiles: [[33, 2]], label: 'File cabinet: choose project', act: 'projects', draw: 'cabinet', solid: true },
  { id: 'alarm', tip: 'Stop alarm', tiles: [[36, 2]], label: 'Red stop alarm', cmd: 'stop', draw: 'alarm', solid: true },
  { id: 'dial', tip: 'Threshold dial', tiles: [[21, 2]], label: 'Threshold dial', act: 'dial', draw: 'dial', solid: true },
  { id: 'door', tip: 'Call next', tiles: [[28, 13]], label: 'Office door', act: 'next' },
  { id: 'board', tip: 'Ticket board', tiles: [[21, 13], [22, 13], [23, 13]], label: 'Ticket board', act: 'board', draw: 'board', dy: 0.875 },
  { id: 'clock', tip: 'Time clock', tiles: [[31, 2]], label: 'Time clock', cmd: 'resume', draw: 'clock', solid: true },
  { id: 'elevator', tip: 'Elevator', tiles: [[24, 2], [25, 2]], label: 'Elevator', cmd: 'transfer', draw: 'elevator', solid: true },
  { id: 'blueprint', tip: 'Blueprint table', tiles: [[10, 17], [11, 17]], label: 'Blueprint table', cmd: 'setup', draw: 'bptable', solid: true },
  { id: 'rdoor', tip: 'Review Room door', tiles: [[28, 28]], label: 'Review Room door', cmd: 'expert-review' },
  { id: 'rscreen', tip: 'Review screen', tiles: [[31, 16], [32, 16], [33, 16], [34, 16]], label: 'Review round screen', cmd: 'expert-review' },
  { id: 'cabinet', tip: 'Project files', tiles: [[33, 2]], label: 'File cabinet: project files', act: 'files', draw: 'cabinet', solid: true },
  { id: 'ccabinet', tip: 'Project files', tiles: [[18, 17]], label: 'File cabinet: project files', act: 'files', draw: 'cabinet', solid: true },
  { id: 'org', tip: 'Org chart', tiles: [[41, 1], [42, 1], [43, 1], [44, 1], [45, 1]], label: 'Org chart', act: 'org' }
];
const OBJAT = {}; OBJS.forEach(o => o.tiles.forEach(([x, y]) => { OBJAT[idx(x, y)] = o; if (o.solid) block[idx(x, y)] = 1; }));
const DECOR = [
  { draw: 'rack', x: 16, y: 2, w: 2, h: 1 }, { draw: 'ci', x: 11, y: 2, w: 1, h: 1 }, { draw: 'cooler', x: 33, y: 32, w: 1, h: 1 },
  { draw: 'easel', x: 53, y: 21, w: 1, h: 1 }, { draw: 'cabinet', x: 17, y: 41, w: 1, h: 1 }, { draw: 'chartscreen', x: 53, y: 38, w: 2, h: 1 },
  { draw: 'podium', x: 53, y: 7, w: 1, h: 1 }, { draw: 'table', x: 23, y: 21, w: 12, h: 2 }, { draw: 'ctable', x: 13, y: 20, w: 3, h: 6 }
];
DECOR.forEach(d => { blockRect(d.x, d.y, d.w, d.h); FURN.push({ type: 'decor', ...d, base: (d.y + d.h) * T }); });
OBJS.filter(o => o.draw).forEach(o => { const [x, y] = o.tiles[0]; FURN.push({ type: 'obj', draw: o.draw, x, y: y + (o.dy || 0), w: o.tiles.length, base: (y + 1) * T }); });
FURN.push({ type: 'plus', x: 36, y: 14, base: 15 * T });

function walkable(x, y){ return inb(x, y) && grid[idx(x, y)] === 1 && !block[idx(x, y)]; }
function playerPass(x, y){ return (x === MYCHAIR.x && y === MYCHAIR.y) || walkable(x, y); }

function bfs(sx, sy, tx, ty, pass){
  if (sx === tx && sy === ty) return [];
  const prev = new Int32Array(W * H).fill(-1); const s = idx(sx, sy), goal = idx(tx, ty);
  const q = [s]; prev[s] = s; let h = 0;
  while (h < q.length) {
    const c = q[h++]; if (c === goal) break;
    const cx = c % W, cy = (c / W) | 0;
    for (const d of ['up', 'down', 'left', 'right']) {
      const nx = cx + DV[d][0], ny = cy + DV[d][1]; if (!inb(nx, ny)) continue;
      const n = idx(nx, ny); if (prev[n] !== -1) continue;
      if (!(pass(nx, ny) || n === goal)) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[goal] === -1) return null;
  const path = []; let c = goal; while (c !== s) { path.push([c % W, (c / W) | 0]); c = prev[c]; }
  return path.reverse();
}

