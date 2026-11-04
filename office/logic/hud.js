/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= HUD and layout ================= */
function refreshHud(){
  const s = readState();
  document.getElementById('hud-goal').textContent = s.job.goal;
  const n = openCount(); const w = queue().length;
  document.getElementById('hud-proj').textContent = s.project.name;
  document.getElementById('hud-repo').textContent = s.connected ? s.liveTotal + ' ' + LW('sessions') : '';
  const others = document.getElementById('hud-others'); others.hidden = !s.otherWaiting; others.textContent = s.otherWaiting + ' waiting in other projects';
  const ghChip = document.getElementById('hud-gh'); ghChip.hidden = !(s.github && !s.github.signedIn); ghChip.textContent = 'GitHub: sign in';
  document.getElementById('hud-open').textContent = n + ' open item' + (n === 1 ? '' : 's') + ' · ' + w + ' waiting';
  document.getElementById('hud-th').textContent = LW('Threshold') + ': ' + s.job.threshold.toUpperCase();
  renderClosing();
  (window.SDLCTicks || []).forEach(f => f());
  document.getElementById('hud-status').textContent = s.job.status !== 'active' && s.job.status !== 'none' ? 'Job ' + s.job.status : '';
}
document.getElementById('hud-th').addEventListener('click', dialCard);
document.getElementById('hud-others').addEventListener('click', projectsCard);
document.getElementById('hud-gh').addEventListener('click', githubCard);
document.getElementById('b-next').addEventListener('click', callNext);
document.getElementById('b-map').addEventListener('click', openMap);
document.getElementById('b-help').addEventListener('click', helpCard);
document.getElementById('b-close').addEventListener('click', closeOfficeCard);
document.getElementById('b-settings').addEventListener('click', settingsCard);
document.getElementById('b-shirt').addEventListener('click', () => { shirt = (shirt + 1) % SHIRTS.length; });
let compact = false;
function layout(){
  const aw0 = Math.max(200, document.documentElement.clientWidth - 32), ah = window.innerHeight;
  compact = window.innerWidth < 700;
  const side = compact ? 0 : 226; const aw = aw0 - side;
  let s = compact ? Math.floor(aw / VW) : Math.floor(Math.min(aw / VW, ah / VH));
  s = Math.max(1, Math.min(s, compact ? 2 : 6));
  let cw = VW * s, ch = VH * s; if (cw > aw) { cw = aw; ch = Math.round(aw * 0.75); }
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  const dpr = window.devicePixelRatio || 1; cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  document.getElementById('app').style.width = (cw + side) + 'px';
  document.body.classList.toggle('compact', compact);
  document.getElementById('pad').classList.toggle('on', compact || matchMedia('(pointer: coarse)').matches);
  if (mapOpen) sizeBig();
}
window.addEventListener('resize', layout);
/* Bridge for the title screens and help layer (their own sections at the end of the page) */
window.SDLCTicks = window.SDLCTicks || [];
window.SDLC = {
  state: () => readState(),
  api: (p, b) => api(p, b),
  token: () => TOKEN,
  closeUi: () => { if (mapOpen) closeMap(); if (dlgOpen()) closeDialog(); tip.hidden = true; },
  setBlocked: v => { titleBlock = !!v; keys.clear(); padDir.d = null; },
  blip: (f, d) => blip(f, d),
  toast: t => toast(t),
  current: () => readState().project.id,
  name: k => nameOf(k),
  talking: k => { convo = k ? { key: k, mode: 'meeting' } : null; },
  table: (team, working) => tableSync(team, working),
  tableTick: () => tableTick(performance.now()),
  names: () => { const out = {}; ROSTER.forEach(k => { out[k] = nameOf(k); }); return out; },
  refresh: () => refreshHud(),
  closeCard: () => { if (dlgOpen()) closeDialog(); },
  busy: () => dlgOpen() || mapOpen,
  kickoff: team => {
    convo = null;
    if (!team) { KICK = null; TABLE_REAL = []; TABLE_WORK = []; FILLER_OUT = null; return; }
    tableOpen(team);
    ['ceo'].concat(KICK).forEach(k => { const e = ents[k]; if (!e) return; const sp = desiredSpot(k); e.moving = false; e.path = null; e.goal = ''; e.px = sp.x * T; e.py = sp.y * T; e.tx = sp.x; e.ty = sp.y; e.dir = sp.face; e.seated = !!sp.seated; e.guest = !!sp.guest; e.ox = 0; });
    placePlayer(CONF_YOU.x, CONF_YOU.y, 'up');
  },
  portrait: (canvas, k, talk) => paintHead(canvas, k, talk)
};
sizeMini(); layout(); refreshHud(); connect();
setInterval(refreshHud, 1000);
requestAnimationFrame(frame);
