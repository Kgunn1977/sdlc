/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= Live state. All game state lives here; the office helper fills it. ================= */
const EMPTY = () => ({
  connected: false, repo: { name: 'Not connected', hasRemote: false },
  job: { id: '', goal: 'Not connected', status: 'none', conductor: 'ceo', threshold: 'high' },
  line: [], decided: [], working: [], in_review: [], idle: [], blocked: [], sent_back: [], stopped: [], reviewable: [], reviewing: '',
  jobs: [], tickets: { "Todo": [], "In Progress": [], "In Review": [], "Done": [] },
  sessions: [],
  project: { id: '', name: 'Not connected' }, projects: [], otherWaiting: 0, liveTotal: 0, workTotal: 0, saved: [], closing: null
});
const STATE = EMPTY();
/* The single read path. */
function readState(){ return STATE; }

/* ================= Connection to the office helper ================= */
const TOKEN = new URLSearchParams(location.search).get('token') || '';
const LOGS = {};
let closedByYou = false, es = null;
function applyState(next){
  const was = STATE.project.id;
  Object.assign(STATE, next); showOffline(null);
  if (STATE.project.id !== was) onProjectChanged(was);
  refreshHud();
}
/* Everyone stands where this project has them; nothing from the last project stays open on screen. */
function onProjectChanged(was){
  const id = STATE.project.id;
  notesSeen = seenBy[id] = seenBy[id] || new Set();
  if (dlgOpen()) closeDialog(true);
  if (mapOpen) closeMap();
  convo = null; transcriptRole = null; transcriptNode = null; rosterSig = '';
  ROSTER.forEach(k => { ents[k] = makeEnt(k); });
  if (was) toast('Now working on ' + STATE.project.name + '.');
}
function goOffline(head, text){ Object.assign(STATE, EMPTY()); showOffline(head, text); if (dlgOpen()) closeDialog(true); refreshHud(); }
function showOffline(head, text){
  const box = document.getElementById('offline');
  box.hidden = !head;
  if (head) { document.getElementById('offline-head').textContent = head; document.getElementById('offline-text').textContent = text; }
}
const START_HELP = 'To start it, double-click Start Office in the office folder. It opens this page at the right address. Nothing shown here is live until then.';
function connect(){
  if (location.protocol === 'file:' || !TOKEN) { goOffline('NOT CONNECTED', 'The office helper is not connected, so nothing here is live.\n\n' + START_HELP); return; }
  es = new EventSource('/events?token=' + encodeURIComponent(TOKEN));
  es.onopen = () => { Object.keys(LOGS).forEach(k => delete LOGS[k]); };
  es.addEventListener('state', ev => applyState(JSON.parse(ev.data)));
  es.addEventListener('log', ev => addLog(JSON.parse(ev.data)));
  es.onerror = () => {
    if (closedByYou || STATE.closing) { if (es) es.close(); walkOutThen(() => goOffline('OFFICE CLOSED', 'The office is closed and every session has stopped. You can close this tab.')); return; }
    if (es.readyState === 2) goOffline('OLD ADDRESS', 'This page was opened from an earlier start of the office, so the helper refused it.\n\nClose this tab and use the one that Start Office opened, or start it again. ' + START_HELP);
    else goOffline('NOT CONNECTED', 'The office helper has stopped, or its window was closed.\n\n' + START_HELP);
  };
}
async function api(path, body){
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Office-Token': TOKEN }, body: JSON.stringify({ project: STATE.project.id || undefined, ...(body || {}) }) });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.ok ? { ...j, ok: true } : { ok: false, missing: !!j.missing, message: j.message || 'The office helper refused that.' };
  } catch (e) { return { ok: false, message: 'The office helper is not answering. ' + START_HELP }; }
}
function hasSession(k){ return readState().sessions.some(x => x.role === k); }
function hasSaved(k){ return readState().saved.some(x => x.role === k); }
function stillOpen(e){ return readState().line.some(x => x.id === e.id); }
function inboxCmd(){ const id = readState().job.id; return '/sdlc:inbox' + (id ? ' ' + id : ''); }
/* Sends one thing to the helper from a dialog. Buttons stay off until it answers; on success, the entry leaves the line. */
/* opt.keep leaves the entry waiting; opt.steps are earlier calls that must succeed first. */
async function act(path, body, k, e, msg, opt){
  opt = opt || {};
  if (e && !stillOpen(e)) { toast('That is no longer waiting.'); closeDialog(); return; }
  const ctl = Array.from(dlgBody.querySelectorAll('button, textarea'));
  ctl.forEach(c => { c.disabled = true; });
  for (const [p, b] of opt.steps || []) { const r = await api(p, b); if (!r.ok) { toast(r.message); ctl.forEach(c => { c.disabled = false; }); return; } }
  const r = await api(path, body);
  if (!r.ok) { toast(r.message); ctl.forEach(c => { c.disabled = false; }); return; }
  if (e && !opt.keep) removeEntry(e);
  afterAnswer(k, msg, !/^\/(dismiss|forget)$/.test(path) || !!(opt.steps && opt.steps.length), opt.keep && e ? e.id : null);
}

