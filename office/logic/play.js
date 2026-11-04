/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= Movement, carry and approach ================= */
const fade = document.getElementById('fade');
let carrying = false;
function placePlayer(x, y, face){ if (dlgOpen() && roomOf(P.tx, P.ty) !== roomOf(x, y)) closeDialog(); camSnap = true; P.px = x * T; P.py = y * T; P.tx = x; P.ty = y; P.moving = false; P.dir = face || P.dir; P.path = []; }
function carry(spot, cb){
  if (RM) { placePlayer(spot.x, spot.y, spot.face); if (cb) cb(); return; }
  carrying = true; fade.style.opacity = '1';
  setTimeout(() => { placePlayer(spot.x, spot.y, spot.face); fade.style.opacity = '0'; carrying = false; if (cb) setTimeout(cb, 60); }, 170);
}
function faceTo(fx, fy, tx, ty){ return tx > fx ? 'right' : tx < fx ? 'left' : ty > fy ? 'down' : 'up'; }
function approachOf(k){
  const e = ents[k]; const [cx, cy] = entTile(e);
  const targets = [];
  const s = SEATS[k];
  if (s && s.desk && atOwnSeat(e)) for (let i = 0; i < s.desk.w; i++) targets.push([s.desk.x + i, s.desk.y]);
  targets.push([cx, cy]);
  for (const [tx, ty] of targets) for (const d of ['down', 'left', 'right', 'up']) {
    const nx = tx + DV[d][0], ny = ty + DV[d][1];
    if (!playerPass(nx, ny)) continue;
    if (targets.some(([a, b]) => a === nx && b === ny)) continue;
    if (ROSTER.some(o => o !== k && !ents[o].moving && ents[o].tx === nx && ents[o].ty === ny)) continue;
    return { x: nx, y: ny, face: faceTo(nx, ny, tx, ty) };
  }
  return { x: cx, y: cy + 1, face: 'up' };
}
function goToChar(k){ if (queue().some(g => g.key === k)) { summon(k); return; } const a = approachOf(k); carry(a, () => openConvo(k)); }
function goToRoom(id){ const d = ROOMBY[id].door; carry({ x: d.x, y: d.y, face: 'down' }, () => toast(ROOMBY[id].name)); }
let autoCb = null;
function walkTo(k){
  const a = approachOf(k);
  const path = bfs(P.tx, P.ty, a.x, a.y, playerPass);
  if (RM || !path) { carry(a, () => openConvo(k)); return; }
  P.path = path; P.speed = 11; autoCb = () => { P.dir = a.face; openConvo(k); };
}

/* ================= Input ================= */
const keys = new Set(); const padDir = { d: null };
const KEYDIR = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
function heldDir(){ if (padDir.d) return padDir.d; const arr = Array.from(keys); for (let i = arr.length - 1; i >= 0; i--) if (KEYDIR[arr[i]]) return KEYDIR[arr[i]]; return null; }
function uiBusy(){ return dlgOpen() || mapOpen || carrying; }
function typingInField(ev){ const t = ev.target; return t && ((t.tagName === 'INPUT' && !t.readOnly) || t.tagName === 'TEXTAREA'); }
let titleBlock = true;
window.addEventListener('keydown', ev => {
  if (titleBlock) return;
  if (typingInField(ev)) { if (ev.key === 'Escape') { ev.target.blur(); } return; }
  const k = ev.key;
  if (mapOpen) { if (k === 'Escape' || k === 'm' || k === 'M') { ev.preventDefault(); closeMap(); } return; }
  if (dlgOpen()) {
    if (typing) { if (k === 'Escape') { ev.preventDefault(); closeDialog(); } else if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') { ev.preventDefault(); finishTyping(); } return; }
    if (k === 'Escape' || k === 'x' || k === 'X') { ev.preventDefault(); closeDialog(); return; }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { const b = dlgBody.querySelector(k === 'ArrowLeft' ? '[data-prev]' : '[data-next]'); if (b) { ev.preventDefault(); b.click(); } return; }
    if (/^[1-9]$/.test(k)) { const b = dlgBody.querySelector('[data-num="' + k + '"]'); if (b) { ev.preventDefault(); b.click(); } }
    return;
  }
  if (KEYDIR[k]) { ev.preventDefault(); keys.add(k); P.path = []; autoCb = null; return; }
  if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter') { ev.preventDefault(); interact(); return; }
  if (k === 'm' || k === 'M') { ev.preventDefault(); openMap(); return; }
});
window.addEventListener('keyup', ev => { keys.delete(ev.key); if (ev.key.length === 1) { keys.delete(ev.key.toLowerCase()); keys.delete(ev.key.toUpperCase()); } });
window.addEventListener('blur', () => keys.clear());
document.querySelectorAll('#pad .dpad button').forEach(b => {
  const on = ev => { ev.preventDefault(); padDir.d = b.dataset.d; P.path = []; autoCb = null; };
  const off = ev => { ev.preventDefault(); if (padDir.d === b.dataset.d) padDir.d = null; };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});
document.getElementById('pad-a').addEventListener('click', () => { if (dlgOpen()) { if (typing) finishTyping(); } else interact(); });
document.getElementById('pad-b').addEventListener('click', () => { if (dlgOpen()) closeDialog(); });
function canvasHit(ev){
  const b = cv.getBoundingClientRect(); const sc = b.width / VW;
  const wx = (ev.clientX - b.left) / sc + cam.x, wy = (ev.clientY - b.top) / sc + cam.y;
  const ro = OBJS.find(o => o.rect && wx >= o.rect[0] && wx < o.rect[0] + o.rect[2] && wy >= o.rect[1] && wy < o.rect[1] + o.rect[3]);
  if (ro) return { o: ro };
  let hit = null, hb = -1;
  ROSTER.forEach(k => { const e = ents[k]; if (e.gone) return; const sx = e.px + (e.seated && !e.guest && !e.moving ? e.ox || 0 : 0), sy = e.py - 8; if (wx >= sx + 2 && wx <= sx + 14 && wy >= sy && wy <= sy + 24 && e.py > hb) { hb = e.py; hit = k; } });
  if (hit) return { k: hit };
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T), below = OBJAT[idx(tx, ty + 1)];
  const o = OBJAT[idx(tx, ty)] || (below && below.draw ? below : null);
  return o && !o.rect && !o.noclick ? { o } : null;
}
function hitTip(h){ if (!h) return ''; if (h.o) return h.o.tip || h.o.label; return (queue().some(g => g.key === h.k) ? 'Call ' : 'Talk to ') + nameOf(h.k); }
cv.addEventListener('click', ev => {
  if (uiBusy()) return;
  const h = canvasHit(ev); tip.hidden = true;
  if (!h) return;
  if (h.o) { blip(520); useObj(h.o); } else goToChar(h.k);
});
/* While a card or meeting is open, hovering still says who and what things are, but nothing can be clicked. */
function lookTip(h){ if (!h) return ''; if (h.o) return h.o.label || h.o.tip; return fullNameOf(h.k); }
function showTip(ev, s){
  if (!s) { tip.hidden = true; return; }
  tip.textContent = s; tip.hidden = false; const w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, ev.clientX + 14)) + 'px'; tip.style.top = (ev.clientY + 16) + 'px';
}
cv.addEventListener('mousemove', ev => {
  if (mapOpen || carrying) { cv.style.cursor = 'default'; tip.hidden = true; return; }
  const h = canvasHit(ev), busy = uiBusy();
  cv.style.cursor = h && !busy ? 'pointer' : 'default';
  showTip(ev, busy ? lookTip(h) : hitTip(h));
});
cv.addEventListener('mouseleave', () => { tip.hidden = true; stampHover = false; });
/* A meeting makes the office inert, so the game itself never sees the mouse. */
window.addEventListener('mousemove', ev => {
  const ts = document.getElementById('ts');
  if (ts.hidden || !ts.classList.contains('dock')) return;
  const b = cv.getBoundingClientRect(), over = ev.clientX >= b.left && ev.clientX < b.right && ev.clientY >= b.top && ev.clientY < b.bottom;
  showTip(ev, over && !ts.contains(ev.target) ? lookTip(canvasHit(ev)) : '');
});
cv.addEventListener('mousemove', ev => { const b = cv.getBoundingClientRect(), sc = b.width / VW, wx = (ev.clientX - b.left) / sc + cam.x, wy = (ev.clientY - b.top) / sc + cam.y, X = (MYCHAIR.x - 2) * T, Y = (MYCHAIR.y + 1) * T; stampHover = !uiBusy() && wx >= X + 52 && wx < X + 64 && wy >= Y - 17 && wy < Y; });

function targetAt(x, y){
  for (const k of ROSTER) { const [tx, ty] = entTile(ents[k]); if (tx === x && ty === y) return { char: k }; }
  const o = OBJAT[idx(x, y)]; if (o) return { obj: o };
  for (const k of ROSTER) { const s = SEATS[k]; if (s && s.desk && y === s.desk.y && x >= s.desk.x && x < s.desk.x + s.desk.w) return { char: k, desk: true }; }
  return null;
}
function nearTarget(){
  const [dx, dy] = DV[P.dir]; const f = targetAt(P.tx + dx, P.ty + dy); if (f) return f;
  const here = OBJAT[idx(P.tx, P.ty)]; if (here) return { obj: here };
  for (const d of ['up', 'down', 'left', 'right']) { const t = targetAt(P.tx + DV[d][0], P.ty + DV[d][1]); if (t && t.char) return t; }
  return null;
}
function interact(){
  if (uiBusy()) return;
  if (convo && convo.mode === 'visit' && !convo.opened) { const e = ents[convo.key]; e.moving = false; e.path = null; e.px = VISIT.x * T; e.py = VISIT.y * T; e.tx = VISIT.x; e.ty = VISIT.y; return; }
  const t = nearTarget(); if (!t) return;
  blip(520);
  if (t.char) { openConvo(t.char); return; }
  useObj(t.obj);
}
function useObj(o){
  if (o.act === 'intercom') summon('ceo');
  else if (o.act === 'notes') inboxPaper();
  else if (o.act === 'files') { if (window.SDLCTitle) window.SDLCTitle.openFiles(); }
  else if (o.act === 'next') callNext();
  else if (o.act === 'dial') dialCard();
  else if (o.act === 'board') boardCard();
  else if (o.act === 'org') orgCard();
  else if (o.act === 'projects') projectsCard();
  else if (o.act === 'stamp') stampCard();
  else if (o.act === 'meeting') { if (window.SDLCTitle) window.SDLCTitle.callMeeting(); }
  else if (o.cmd) cmdCard(o.cmd, o.label, o.id);
}
function promptText(){
  if (convo && convo.mode === 'visit' && !convo.opened) return ['E', nameOf(convo.key) + ' is on the way in. Press to skip.'];
  const t = nearTarget(); if (!t) return null;
  if (t.char) return ['E', 'Talk to ' + nameOf(t.char) + (t.desk && !atOwnSeat(ents[t.char]) ? ' (away from desk)' : '')];
  const o = t.obj;
  if (o.act === 'next') return ['E', queue().length ? 'Call the next person in' : 'No one is waiting'];
  return ['E', o.label + (o.cmd ? ': /sdlc:' + o.cmd : '')];
}

/* ================= Update loop ================= */
function onPlayerArrive(){
  if (P.tx === 28 && P.ty === 13 && unseenNotes() > 0) inboxPaper(() => {}, 'Got it');
}
function updatePlayer(dt){
  if (P.moving) { advance(P, dt, () => { onPlayerArrive(); if (!P.path.length && autoCb) { const cb = autoCb; autoCb = null; P.speed = 5.5; cb(); } }); return; }
  if (P.path.length) { const n = P.path.shift(); startMove(P, n[0], n[1]); return; }
  if (uiBusy()) return;
  const d = heldDir(); if (!d) return;
  P.dir = d; P.speed = 5.5;
  const nx = P.tx + DV[d][0], ny = P.ty + DV[d][1];
  if (playerPass(nx, ny)) startMove(P, nx, ny);
}
let lastPrompt = '';
function update(dt){
  updatePlayer(dt);
  ROSTER.forEach(k => updateEnt(ents[k], dt));
  if (convo && convo.mode === 'visit' && !convo.opened) { const e = ents[convo.key]; if (!e.moving && e.tx === VISIT.x && e.ty === VISIT.y) { convo.opened = true; e.dir = 'up'; (queue().some(g => g.key === convo.key) ? openCards : roleMenu)(convo.key); } }
  const pt = uiBusy() ? null : promptText(); const s = pt ? pt.join('|') : '';
  if (s !== lastPrompt) { lastPrompt = s; const el = document.getElementById('prompt'); if (pt) { el.innerHTML = ''; const k = document.createElement('span'); k.className = 'k'; k.textContent = pt[0]; el.append(k, document.createTextNode(pt[1])); el.hidden = false; } else el.hidden = true; }
}
let last = performance.now();
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); render(now);
  if (!compact) { mctx.clearRect(0, 0, 192, 132); drawMap(mctx, 3, now); }
  if (mapOpen) { bctx.clearRect(0, 0, W * bigTs, H * bigTs); drawMap(bctx, bigTs, now); if (Math.floor(now / 500) !== Math.floor((now - dt * 1000) / 500)) buildRosterSoft(); }
  requestAnimationFrame(frame);
}
let rosterSig = '';
function buildRosterSoft(){ const sig = rosterOrder().map(k => k + stateLabel(k)).join(','); if (sig !== rosterSig && !roster.contains(document.activeElement)) { rosterSig = sig; buildRoster(); } }

/* ================= Sound ================= */
let AC = null, soundOn = false;
function blip(f, d, v){ if (!soundOn || !AC) return; try { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = f || 660; g.gain.value = v || 0.04; o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (d || 0.04)); } catch (e) {} }
document.getElementById('b-sound').addEventListener('click', ev => {
  soundOn = !soundOn; const b = ev.currentTarget; b.setAttribute('aria-pressed', String(soundOn)); b.textContent = soundOn ? 'Sound on' : 'Sound off';
  if (soundOn && !AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  blip(880);
});

/* ================= Dialog ================= */
const dlg = document.getElementById('dlg'), dlgName = document.getElementById('dlg-name'), dlgSub = document.getElementById('dlg-sub'), dlgText = document.getElementById('dlg-text'), dlgBody = document.getElementById('dlg-body'), face = document.getElementById('dlg-face');
let typing = null, onDlgClose = null, faceKey = null, faceTimer = null;
function dlgOpen(){ return !dlg.hidden; }
function el(tag, attrs, kids){ const n = document.createElement(tag); if (attrs) Object.keys(attrs).forEach(a => { if (a === 'text') n.textContent = attrs[a]; else if (a === 'class') n.className = attrs[a]; else if (a.startsWith('on')) n.addEventListener(a.slice(2), attrs[a]); else n.setAttribute(a, attrs[a]); }); (kids || []).forEach(c => { if (c != null) n.append(c); }); return n; }
