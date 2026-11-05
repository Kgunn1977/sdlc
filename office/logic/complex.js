/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= Office complex (the owner's decision, 2026-11-05) =================
   One building per project: lit while people work there, a marker when someone waits on you, an arrow on the one you are in.
   Click a building to work on that project, or an empty plot to start a new one. Eight plots to a street. */
const cxEl = document.getElementById('complex'), cxCv = document.getElementById('complexmap'), cxList = document.getElementById('complex-list');
const cxCtx = cxCv.getContext('2d');
let complexOpen = false, cxPage = 0, cxHover = -1, cxFrame = 0, cxTimer = null;
function cxStyle(id){ let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 4; }
// One more plot than projects, so there is always an empty one for a new project.
function cxPages(){ return Math.max(1, Math.ceil(((readState().projects || []).length + 1) / 8)); }
function cxSlots(){ const all = readState().projects || []; return COMPLEX.PLOTS.map((pl, i) => all[cxPage * 8 + i] || null); }
function cxShort(p){ return String(p.name || '').replace(/^.*\//, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().slice(0, COMPLEX.SIGN_CHARS).trim(); }
function cxSays(p){
  if (!p) return 'Empty plot: start a new project here';
  const bits = [p.name];
  if (p.current) bits.push('you are here');
  if (p.waiting) bits.push(p.waiting === 1 ? 'someone is waiting on you' : p.waiting + ' people are waiting on you');
  bits.push(p.working ? (p.working === 1 ? '1 person working' : p.working + ' people working') : 'quiet');
  return bits.join(' · ');
}
function drawComplexMap(){
  cxCtx.imageSmoothingEnabled = false;
  COMPLEX.drawComplex(cxCtx);
  cxSlots().forEach((p, i) => {
    const pl = COMPLEX.PLOTS[i];
    if (!p) { COMPLEX.drawLot(cxCtx, pl.x, pl.y); if (cxHover === i) COMPLEX.drawHover(cxCtx, pl.x, pl.y); return; }
    const st = cxStyle(p.id), sp = COMPLEX.signSpot(pl, st);
    COMPLEX.drawBuilding(cxCtx, pl.x, pl.y, st, p.working > 0);
    COMPLEX.drawSign(cxCtx, sp.x, sp.y); COMPLEX.writeName(cxCtx, cxShort(p), sp.x + 22, sp.y + 2);
    if (cxHover === i) COMPLEX.drawHover(cxCtx, pl.x, pl.y);
    if (p.waiting) COMPLEX.drawWaiting(cxCtx, pl.x + 40, sp.y - 11, RM ? 0 : cxFrame);
    if (p.current) COMPLEX.drawHere(cxCtx, pl.x + 21, sp.y - 11);
  });
}
function cxList_(){
  cxList.textContent = '';
  cxSlots().forEach((p, i) => {
    if (!p && cxSlots().slice(0, i).some(x => !x)) return; // one empty plot is enough in the list
    const b = el('button', { type: 'button', role: 'listitem', class: p && p.waiting ? 'wait' : '' }, [el('span', { class: 'nm', text: p ? p.name : 'New project' }), el('span', { class: 'st', text: p ? cxSays(p).split(' · ').slice(1).join(' · ') : 'Start a new project on an empty plot' })]);
    b.addEventListener('click', () => cxPick(i));
    cxList.append(b);
  });
  if (cxPages() > 1) {
    const row = el('div', { class: 'row' });
    if (cxPage > 0) row.append(el('button', { class: 'btn', type: 'button', text: 'Previous street', onclick: () => { cxPage--; cxRefresh(); } }));
    if (cxPage < cxPages() - 1) row.append(el('button', { class: 'btn', type: 'button', text: 'Next street', onclick: () => { cxPage++; cxRefresh(); } }));
    cxList.append(row);
  }
}
function cxSize(){ const s = Math.max(1, Math.min(4, Math.floor(Math.min(innerWidth - 40, (innerWidth >= 900 ? innerWidth - 420 : innerWidth - 40)) / 320), Math.floor((innerHeight - 120) / 240))); cxCv.style.width = 320 * s + 'px'; cxCv.style.height = 240 * s + 'px'; }
function cxRefresh(){ if (cxPage > cxPages() - 1) cxPage = cxPages() - 1; drawComplexMap(); cxList_(); }
function openComplex(){
  if (dlgOpen()) closeDialog(true);
  if (mapOpen) closeMap();
  const all = readState().projects || [], here = all.findIndex(p => p.current);
  cxPage = here >= 0 ? Math.floor(here / 8) : 0;
  complexOpen = true; cxEl.hidden = false; cxHover = -1; cxSize(); cxRefresh();
  clearInterval(cxTimer);
  cxTimer = setInterval(() => { cxFrame ^= 1; drawComplexMap(); }, 450);
  const f = cxList.querySelector('button'); if (f) f.focus();
}
function closeComplex(){ complexOpen = false; cxEl.hidden = true; clearInterval(cxTimer); tip.hidden = true; }
function cxPick(i){
  const p = cxSlots()[i];
  closeComplex();
  if (!p) { if (window.SDLCTitle && window.SDLCTitle.newGame) window.SDLCTitle.newGame(); return; }
  if (p.current) { toast('You are already working on ' + p.name + '.'); return; }
  chooseProject(p);
}
function cxHit(ev){
  const b = cxCv.getBoundingClientRect(), x = (ev.clientX - b.left) * 320 / b.width, y = (ev.clientY - b.top) * 240 / b.height;
  return COMPLEX.PLOTS.findIndex(pl => x >= pl.x - 2 && x < pl.x + 50 && y >= pl.y - 14 && y < pl.y + 48);
}
cxCv.addEventListener('mousemove', ev => {
  const i = cxHit(ev);
  if (i !== cxHover) { cxHover = i; cxCv.style.cursor = i >= 0 ? 'pointer' : 'default'; drawComplexMap(); }
  if (i < 0) { tip.hidden = true; return; }
  tip.textContent = cxSays(cxSlots()[i]); tip.hidden = false;
  const w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, ev.clientX - w / 2)) + 'px'; tip.style.top = (ev.clientY + 18) + 'px';
});
cxCv.addEventListener('mouseleave', () => { cxHover = -1; tip.hidden = true; drawComplexMap(); });
cxCv.addEventListener('click', ev => { const i = cxHit(ev); if (i >= 0) cxPick(i); });
document.getElementById('complex-x').addEventListener('click', closeComplex);
document.getElementById('b-complex').addEventListener('click', openComplex);
window.addEventListener('resize', () => { if (complexOpen) cxSize(); });
