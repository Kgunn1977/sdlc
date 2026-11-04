/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= Line logic ================= */
function rankOf(e){
  if (e.fit) return -1;
  if (e.type === 'approval' || e.priority === 'critical') return 0;
  if (e.type === 'question') return e.priority === 'high' ? 1 : 2;
  if (e.type === 'report') return 2;
  return 3;
}
function blockCount(e){ return e.blocksCount != null ? e.blocksCount : (e.blocks ? 1 : 0); }
function reaches(e){
  if (e.type !== 'question') return true;
  if (e.priority === 'critical') return true;
  return PR[e.priority] >= PR[readState().job.threshold];
}
function queue(){
  const s = readState();
  const es = s.line.filter(reaches).slice().sort((a, b) => rankOf(a) - rankOf(b) || blockCount(b) - blockCount(a) || a.seq - b.seq);
  const out = [], map = {};
  es.forEach(e => { if (!map[e.role]) { map[e.role] = { key: e.role, entries: [] }; out.push(map[e.role]); } map[e.role].entries.push(e); });
  return out;
}
function markerOf(e){
  if (e.fit) return { glyph: '?', fill: '#3CBCFC' };
  if (e.type === 'paused') return { glyph: '||', fill: '#3CBCFC' };
  if (e.type === 'acceptance') return { glyph: 'check', fill: '#58D854' };
  if (e.type === 'approval' || e.priority === 'critical') return { glyph: '!', fill: '#F83800' };
  if (e.priority === 'high') return { glyph: '?', fill: '#FCBC3C' };
  return { glyph: '?', fill: '#FCFCFC' };
}
const LISTS = ['working', 'in_review', 'idle', 'blocked', 'sent_back', 'stopped'];
function setList(key, list){ const s = readState(); LISTS.forEach(l => { s[l] = (s[l] || []).filter(k => k !== key); }); if (list) s[list].push(key); }
function listOf(key){ const s = readState(); return LISTS.find(l => (s[l] || []).includes(key)) || null; }
function openCount(){ return readState().line.filter(e => e.type !== 'acceptance' && reaches(e)).length; }
let notesSeen = new Set(); const seenBy = {};
function unseenNotes(){ return readState().decided.filter(d => !notesSeen.has(d.id)).length; }
function cleanOpt(o){ return o.replace(/\s*\(recommended\)\s*$/i, ''); }
function isRec(o){ return /\(recommended\)\s*$/i.test(o); }
function recommended(e){ const r = (e.options || []).find(isRec); return cleanOpt(r || (e.options || [''])[0]); }

function setThreshold(t){
  const s = readState(); s.job.threshold = t;
  refreshHud();
  return api('/threshold', { level: t }).then(r => { if (!r.ok) toast(r.message); });
}
function removeEntry(e){
  const s = readState(); s.line = s.line.filter(x => x.id !== e.id);
}

/* ================= Entities ================= */
const ents = {};
function seatSpot(k){ const s = SEATS[k]; return { x: s.x, y: s.y, face: 'down', seated: true, ox: s.ox }; }
let convo = null; // {key, mode:'visit'|'here', opened}
/* The conference table. KICK holds who has each chair. Real people have sessions; fillers are only there to make the table look full. */
let KICK = null, TABLE_REAL = [], TABLE_WORK = [], FILLER_OUT = null, FILLER_NEXT = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
function freeToFill(k){ return k !== 'ceo' && !TABLE_REAL.includes(k) && !KICK.includes(k) && !hasSession(k) && listOf(k) !== 'working' && !queue().some(g => g.key === k); }
function tableOpen(team){
  TABLE_REAL = team.filter(k => k !== 'ceo'); KICK = new Array(CONF_SEATS.length).fill(null); FILLER_OUT = null; FILLER_NEXT = performance.now() + rnd(60000, 120000);
  TABLE_REAL.forEach((k, i) => { const free = CONF_FIRST[i] != null ? CONF_FIRST[i] : KICK.indexOf(null); KICK[free] = k; });
  ROSTER.filter(k => freeToFill(k)).sort(() => Math.random() - 0.5).forEach(k => { const free = KICK.indexOf(null); if (free >= 0) KICK[free] = k; });
}
/* Someone spoken to or called in becomes real: a filler keeps their chair, anyone else takes a free one or a filler's. */
function tableSync(team, working){
  if (!KICK) return;
  TABLE_WORK = working || [];
  team.filter(k => k !== 'ceo' && !TABLE_REAL.includes(k)).forEach(k => {
    TABLE_REAL.push(k);
    if (FILLER_OUT && FILLER_OUT.key === k) FILLER_OUT = null;
    if (KICK.includes(k)) return;
    let at = KICK.indexOf(null);
    if (at < 0) { const fillers = KICK.filter(x => !TABLE_REAL.includes(x)); const gone = fillers[Math.floor(Math.random() * fillers.length)]; at = KICK.indexOf(gone); if (FILLER_OUT && FILLER_OUT.key === gone) FILLER_OUT = null; }
    if (at >= 0) KICK[at] = k;
  });
}
/* Fillers come and go, one at a time. A filler who gets real work leaves the chair for good. */
function tableTick(now){
  if (!KICK) return;
  KICK.forEach((k, i) => { if (k && !TABLE_REAL.includes(k) && (hasSession(k) || listOf(k) === 'working' || queue().some(g => g.key === k))) { KICK[i] = null; if (FILLER_OUT && FILLER_OUT.key === k) FILLER_OUT = null; } });
  if (FILLER_OUT) {
    const e = ents[FILLER_OUT.key], s = SEATS[FILLER_OUT.key];
    if (!FILLER_OUT.backAt && !e.moving && s && e.tx === s.x && e.ty === s.y) FILLER_OUT.backAt = now + rnd(20000, 40000);
    if (FILLER_OUT.backAt && now >= FILLER_OUT.backAt) { FILLER_OUT = null; FILLER_NEXT = now + rnd(60000, 120000); }
  } else if (now >= FILLER_NEXT) {
    const seated = KICK.filter(k => k && !TABLE_REAL.includes(k) && SEATS[k]);
    if (seated.length) FILLER_OUT = { key: seated[Math.floor(Math.random() * seated.length)], backAt: 0 };
    else FILLER_NEXT = now + rnd(60000, 120000);
  }
}
/* Closing the office: everyone walks out the right side. Whoever is still working stays at their desk until they finish, and someone waiting on your approval still comes to you. */
let LEAVING = false, LEAVE_ALL = false;
const OFFICE_EXIT = { x: 62, y: 22, face: 'right', exit: true };
function leaveSpot(k){
  if (LEAVE_ALL) return OFFICE_EXIT;
  if (convo && convo.key === k) return null;
  const c = readState().closing, w = c ? c.remaining.find(x => x.role === k) : null;
  if (w && w.held) return null;
  return w || (!c && listOf(k) === 'working') ? seatSpot(k) : OFFICE_EXIT;
}
function walkOutThen(done){
  LEAVING = true; LEAVE_ALL = true;
  const t0 = performance.now(), wait = setInterval(() => { if (ROSTER.every(k => ents[k].gone) || performance.now() - t0 > 25000) { clearInterval(wait); done(); } }, 200);
}
function desiredSpot(k){
  if (LEAVING) { const sp = leaveSpot(k); if (sp) return sp; }
  if (KICK && !(FILLER_OUT && FILLER_OUT.key === k)) { if (k === 'ceo') return { x: CONF_CEO.x, y: CONF_CEO.y, face: 'down' }; const ki = KICK.indexOf(k); if (ki >= 0 && ki < CONF_SEATS.length) { const c = CONF_SEATS[ki]; return { x: c.x, y: c.y, face: c.face, seated: true, guest: true, ox: 0 }; } }
  if (k === 'rev1' || k === 'rev2') return seatSpot(k);
  if (convo && convo.key === k) { if (convo.mode === 'visit') return { x: VISIT.x, y: VISIT.y, face: 'up' }; return { hold: true }; }
  const q = queue(); const i = q.findIndex(g => g.key === k);
  if (i >= 0 && i < 8) return { x: SLOTS[i].x, y: SLOTS[i].y, face: i === 0 ? 'up' : 'left', line: true };
  if (listOf(k) === 'in_review') { const j = readState().in_review.indexOf(k) % GUEST.length; return { x: GUEST[j].x, y: GUEST[j].y, face: 'up', seated: true, guest: true, ox: 0 }; }
  return seatSpot(k);
}
function makeEnt(k){ const sp = desiredSpot(k); const e = { key: k, px: sp.x * T, py: sp.y * T, tx: sp.x, ty: sp.y, moving: false, nx: 0, ny: 0, dir: sp.face || 'down', seated: !!sp.seated, guest: !!sp.guest, ox: sp.ox || 0, path: null, goal: '', dist: 0, speed: 4 }; return e; }
ROSTER.forEach(k => { ents[k] = makeEnt(k); });
const P = { key: 'you', px: MYCHAIR.x * T, py: MYCHAIR.y * T, tx: MYCHAIR.x, ty: MYCHAIR.y, moving: false, dir: 'down', dist: 0, speed: 5.5, path: [] };
let shirt = 0;

function startMove(e, nx, ny){
  e.moving = true; e.nx = nx; e.ny = ny;
  const dx = nx - e.tx, dy = ny - e.ty;
  e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
  e.seated = false; e.guest = false;
}
function advance(e, dt, onArrive){
  const tx = e.nx * T, ty = e.ny * T; const step = e.speed * T * dt;
  const dx = tx - e.px, dy = ty - e.py; const d = Math.abs(dx) + Math.abs(dy);
  if (d <= step) { e.px = tx; e.py = ty; e.tx = e.nx; e.ty = e.ny; e.moving = false; e.dist += d; if (onArrive) onArrive(); }
  else { e.px += Math.sign(dx) * step; e.py += Math.sign(dy) * step; e.dist += step; }
}
function updateEnt(e, dt){
  if (e.moving) { advance(e, dt); return; }
  const sp = desiredSpot(e.key);
  if (sp.hold) return;
  if (e.tx === sp.x && e.ty === sp.y) { e.dir = sp.face; e.seated = !!sp.seated; e.guest = !!sp.guest; e.ox = sp.ox || 0; e.path = null; e.gone = !!sp.exit; return; }
  const gk = sp.x + ',' + sp.y;
  if (e.goal !== gk || !e.path) { e.goal = gk; e.path = bfs(e.tx, e.ty, sp.x, sp.y, walkable); if (!e.path) { e.px = sp.x * T; e.py = sp.y * T; e.tx = sp.x; e.ty = sp.y; return; } }
  e.speed = (convo && convo.key === e.key && convo.mode === 'visit') || LEAVING ? 8 : 4;
  const n = e.path.shift(); if (n) startMove(e, n[0], n[1]);
}
function entTile(e){ return e.moving ? [Math.round(e.px / T), Math.round(e.py / T)] : [e.tx, e.ty]; }
function atOwnSeat(e){ const s = SEATS[e.key]; return s && !e.moving && e.tx === s.x && e.ty === s.y; }

function roleState(k){
  if (k === 'rev1' || k === 'rev2') return readState().in_review.length ? 'in_review' : 'idle';
  if (convo && convo.key === k) return 'talking';
  const q = queue(); const i = q.findIndex(g => g.key === k);
  if (i >= 0) {
    const e = ents[k];
    if (i < 8 && q[i].entries.some(x => x.type === 'acceptance') && (e.moving || e.tx !== SLOTS[i].x || e.ty !== SLOTS[i].y)) return 'delivered';
    return 'in_line';
  }
  return listOf(k) || 'idle';
}
function stateLabel(k){
  const st = roleState(k);
  if (st === 'in_line') { const i = queue().findIndex(g => g.key === k); return i < 8 ? 'In line, number ' + (i + 1) : 'In line, at the back of the hall'; }
  if (st === 'idle' && hasSession(k)) return 'At desk, session open';
  return { idle: 'Idle', working: 'Working', in_review: 'In review', blocked: 'Blocked', talking: 'Talking with you', delivered: 'Delivered, carrying a folder to the line', sent_back: 'Sent back', stopped: 'Stopped' }[st] || st;
}

