/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
(function(){
'use strict';
/* ---------- Example content: the only place title-screen data comes from ---------- */
const G = window.SDLC;
const $ = id => document.getElementById(id);
const ts = $('ts');
const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const LIMIT = 200 * 1024 * 1024;
let slotAsk = null; // the saved game being taken off the list
let screen = 'title', attract = true, loadTimer = 0, loadDone = null, uid = 0, filesKey = null, filesFrom = null, drawerSel = 'uploads', tPick = null, drawers = [], errors = [], adding = [];
let pending = null; // the project being started: { mode, project, name, what, visibility, gh, folder }
$('ts-ver').textContent = 'v0.2';

/* ---------- One small function per button ---------- */
const TITLE_ACTIONS = {
  pressStart(){ attract = false; $('ts-press').hidden = true; $('ts-menu').hidden = false; items[0].focus(); setSel(items[0]); G.blip(660, 0.05); },
  newGame(){ show('newchoice'); },
  loadGame(){ show('loadgame'); },
  chooseScratch(){ show('new'); },
  chooseTakeover(){ tPick = null; $('ts-picked').textContent = 'No folder picked'; show('takeover'); },
  async pickTakeoverFolder(){ const e = $('ts-terr'); e.hidden = true; $('ts-picked').textContent = 'The folder picker is open. It may be behind this window.'; const r = await G.api('/pick-folder', {}); if (r.ok) { tPick = r; $('ts-picked').textContent = r.folder; } else { tPick = null; $('ts-picked').textContent = 'No folder picked'; if (r.message) { e.textContent = r.message; e.hidden = false; } } },
  async continueScratch(form){
    const e = $('ts-err'); e.hidden = true;
    const r = await G.api('/new-project', { name: form.name, what: form.what, visibility: form.visibility });
    if (!r.ok) { e.textContent = r.message; e.hidden = false; return; }
    pending = { mode: 'scratch', project: r.project.id, name: r.project.name, what: form.what, visibility: form.visibility };
    startKickoff();
  },
  async continueTakeover(form){
    const e = $('ts-terr'); e.hidden = true; $('ts-picked').textContent = form.folder ? form.folder.folder : 'Checking GitHub. This can take a minute.';
    const r = await G.api('/takeover', { repo: form.gh, pickId: form.folder ? form.folder.pickId : undefined });
    if (!r.ok) { e.textContent = r.message; e.hidden = false; if (!form.folder) $('ts-picked').textContent = 'No folder picked'; return; }
    const st = await G.api('/study', { project: r.project.id });
    if (!st.ok) { e.textContent = st.message; e.hidden = false; return; }
    pending = { mode: 'takeover', project: r.project.id, name: r.project.name, gh: r.project.repo || form.gh, folder: form.folder ? { name: form.folder.name } : null };
    show('studying');
  },
  async startWork(){
    const box = $('ts-wf'); box.textContent = '';
    const a = await G.api('/gh-status', {});
    if (!a.ok || !a.hasWorkflow) { renderWorkflow(a.message || 'Your GitHub sign-in could not be checked.'); return; }
    const r = await G.api('/kickoff-finish', { project: pending.project });
    if (!r.ok) { if (r.needsWorkflow) renderWorkflow(r.message); else box.append(el('p', 'note', r.message)); return; }
    finishKickoff('The CEO is starting setup. Anything that changes GitHub waits for your Approve or Deny.');
  },
  async signIn(){
    const r = await G.api('/gh-signin', {}); const box = $('ts-wfcode'); if (!box) return; box.textContent = '';
    if (!r.ok) { box.append(el('p', 'note', r.message)); return; }
    box.append(el('p', 'ts-say', 'Your one-time code: ' + r.code));
    const a = el('a', 'btn', 'OPEN GITHUB'); a.href = /^https:\/\/github\.com\//.test(r.url) ? r.url : 'https://github.com/login/device'; a.target = '_blank'; a.rel = 'noopener noreferrer'; box.append(a);
    box.append(el('p', 'note', 'Type the code on that page and approve. This page notices when you are done.'));
  },
  getToWork(){ takeoverChoice('work', 'The CEO is starting on the first recommendation.'); },
  bringUp(){ takeoverChoice('standards', 'The CEO is starting setup. It asks your approval before it changes anything.'); },
  keepNotes(){ takeoverChoice('notes', 'The notes are in the file cabinet. Nobody is working on this project.'); },
  async loadProject(id){
    const r = await G.api('/project', { id: id });
    if (!r.ok) { G.toast(r.message); return; }
    clockIn(id);
  },
  mainMenu(){ G.closeUi(); open('title'); },
  openFiles(){ G.closeUi(); filesKey = G.current(); filesFrom = 'office'; errors = []; open('files'); },
  openKickoffFiles(){ filesKey = pending.project; filesFrom = 'kickoff'; errors = []; show('files'); },
  closeFiles(){ if (filesFrom === 'kickoff') show('kickoff'); else close(); },
  uploadFiles(){ $('ts-upload').value = ''; $('ts-upload').click(); },
  async connectFolder(){ const r = await G.api('/cabinet-connect', { project: filesKey }); if (!r.ok && r.message) errors.push({ id: 'e' + (++uid), name: 'That folder', reason: r.message }); await refreshFiles(); },
  async removeItem(drawerId, name){ const r = await G.api('/cabinet-remove', { project: filesKey, name: name }); if (!r.ok) errors.push({ id: 'e' + (++uid), name: name, reason: r.message }); await refreshFiles(); },
  async removeFolder(drawerId){ const d = drawers.find(x => x.id === drawerId); if (d) await G.api('/cabinet-unlink', { project: filesKey, folder: d.folder }); drawerSel = 'uploads'; await refreshFiles(); },
  dismissError(errId){ errors = errors.filter(e => e.id !== errId); refreshFiles(); },
  callMeeting(){ const s = G.state(); if (!s.connected) { G.toast('The office is not connected.'); return; } G.closeUi(); pending = { mode: 'meeting', project: s.project.id, name: s.project.name, what: s.job.status === 'none' ? '' : 'What the team is working on now: ' + s.job.goal }; startKickoff(); },
  meetingToWork(){ finishMeeting('work', 'Max Agenda has the notes and is getting the team moving.'); },
  meetingNotes(){ finishMeeting('notes', 'The notes are in the file cabinet.'); },
  meetingNext(){ if (!M) return; if (M.skip) M.skip(); else release(); },
  leaveMeeting(){ G.api('/meeting-leave', { project: pending.project }); endMeeting(); },
  removeAsk(id){ slotAsk = id; renderSlots(); },
  removeNo(){ slotAsk = null; renderSlots(); },
  async removeYes(id){ slotAsk = null; const r = await G.api('/project-remove', { project: id }); if (!r.ok) G.toast(r.message); await new Promise(ok => setTimeout(ok, 150)); renderSlots(); },
  async readFiles(){
    const r = await G.api('/read-files', { project: pending.project });
    if (!r.ok) { G.toast(r.message); return; }
    M.reading = true; G.state().reading = { status: 'reading' }; renderReadBox();
    enqueue([{ speaker: 'ceo', text: 'Off they go. The team is reading everything now, and this can take a while. I will pick this up as soon as they are back.', ask: true }]);
  },
  answerCards(){ G.kickoff(null); close(); G.toast('The meeting comes back by itself when the team has finished reading.'); },
  leaveStudy(){ close(); G.toast('They keep studying. The meeting opens by itself when the briefing is ready.'); },
  back(){ goBack(); }
};
function goBack(){
  if (screen === 'files') { TITLE_ACTIONS.closeFiles(); return; }
  if (screen === 'kickoff' && pending && pending.mode === 'meeting') { TITLE_ACTIONS.leaveMeeting(); return; }
  const to = ({ newchoice: 'title', new: 'newchoice', takeover: 'newchoice', loadgame: 'title', studying: 'title', kickoff: pending && pending.mode === 'takeover' ? 'title' : 'new' })[screen];
  if (screen === 'kickoff') { stopMeeting(); G.kickoff(null); if (pending) G.api(pending.mode === 'scratch' ? '/new-project-cancel' : '/meeting-leave', { project: pending.project }); pending = null; }
  if (to) show(to);
}
ts.addEventListener('click', ev => {
  if (screen === 'title' && attract) { TITLE_ACTIONS.pressStart(); return; }
  const b = ev.target.closest('[data-act]'); if (!b || !ts.contains(b)) return;
  const a = b.dataset.act; if (TITLE_ACTIONS[a]) TITLE_ACTIONS[a](b.dataset.arg, b.dataset.arg2);
});
function endMeeting(notice){ stopMeeting(); pending = null; G.kickoff(null); close(); if (notice) G.toast(notice); }
async function finishMeeting(choice, notice){
  const r = await G.api('/meeting-finish', { project: pending.project, choice: choice });
  if (!r.ok) { G.toast(r.message); return; }
  endMeeting(notice);
}
async function takeoverChoice(choice, notice){
  const r = await G.api('/takeover-finish', { project: pending.project, choice: choice });
  if (!r.ok) { G.toast(r.message); return; }
  finishKickoff(notice);
}
function renderWorkflow(msg){
  const box = $('ts-wf'); if (!box) return; box.textContent = '';
  box.append(el('p', 'ts-say', msg), cmdRow([btn('btn next', 'SIGN IN TO GITHUB', 'signIn')]));
  const c = el('div'); c.id = 'ts-wfcode'; box.append(c);
  box.append(el('p', 'note', 'Nothing is asked of GitHub until you press that button. Then press START WORK again.'));
}

/* ---------- Screens ---------- */
function open(name){ ts.hidden = false; G.setBlocked(true); document.getElementById('app').inert = true; show(name); }
function close(){ ts.hidden = true; ts.className = ''; G.setBlocked(false); document.getElementById('app').inert = false; stopFace(); }
function show(name){
  screen = name;
  ['title', 'newchoice', 'new', 'takeover', 'kickoff', 'studying', 'loadgame', 'files', 'loading'].forEach(n => { $('ts-' + n).hidden = n !== name; });
  ts.className = name === 'kickoff' || name === 'studying' ? 'dock' : (name === 'files' && filesFrom === 'office') ? 'dim' : '';
  stopFace();
  if (name === 'title') { if (attract) { $('ts-press').hidden = false; $('ts-menu').hidden = true; } else { $('ts-press').hidden = true; $('ts-menu').hidden = false; (ts.querySelector('.ts-item.sel') || items[0]).focus(); } }
  if (name === 'newchoice') { if (window.SDLCHelp) $('ts-levels').replaceChildren(window.SDLCHelp.levelPicker('new')); ts.querySelector('#ts-newchoice .ts-choice').focus(); }
  if (name === 'new') { $('ts-err').hidden = true; startFace('ts-face'); $('ts-name').focus(); }
  if (name === 'takeover') { $('ts-terr').hidden = true; startFace('ts-face2'); $('ts-gh').focus(); }
  if (name === 'kickoff') renderKickoff();
  if (name === 'studying') renderStudying();
  if (name === 'loadgame') { renderSlots(); const f = $('ts-list').querySelector('button') || ts.querySelector('#ts-loadgame [data-act="back"]'); f.focus(); }
  if (name === 'files') { drawerSel = 'uploads'; refreshFiles().then(() => { const f = $('ts-fpanel').querySelector('button'); if (f) f.focus(); }); }
  G.blip(520, 0.04);
}

/* title menu */
const items = Array.from(ts.querySelectorAll('.ts-item'));
function setSel(b){ items.forEach(i => i.classList.toggle('sel', i === b)); }
items.forEach(b => { b.addEventListener('mouseenter', () => setSel(b)); b.addEventListener('focus', () => setSel(b)); });

/* CEO face on the forms */
let faceT = 0;
function startFace(id){ stopFace(); let f = 0, n = 0; G.portrait($(id), 'ceo', false); if (RM()) return; faceT = setInterval(() => { f ^= 1; G.portrait($(id), 'ceo', !!f); if (++n > 14) { stopFace(); G.portrait($(id), 'ceo', false); } }, 150); }
function stopFace(){ clearInterval(faceT); faceT = 0; }

/* new game: from scratch */
$('ts-form').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('ts-name').value.trim(), what = $('ts-what').value.trim();
  if (!name) { const e = $('ts-err'); e.textContent = 'Give the project a name.'; e.hidden = false; $('ts-name').focus(); return; }
  TITLE_ACTIONS.continueScratch({ name: name, what: what, visibility: (ts.querySelector('input[name="ts-vis"]:checked') || {}).value || 'private' });
});
/* new game: take over */
$('ts-tform').addEventListener('submit', ev => {
  ev.preventDefault();
  const gh = $('ts-gh').value.trim(), e = $('ts-terr');
  if (gh && !/^[\w.-]+\/[\w.-]+$/.test(gh)) { e.textContent = 'Type the GitHub project as owner/repo.'; e.hidden = false; $('ts-gh').focus(); return; }
  if (!gh && !tPick) { e.textContent = 'Choose a GitHub project, a folder, or both.'; e.hidden = false; $('ts-gh').focus(); return; }
  TITLE_ACTIONS.continueTakeover({ gh: gh, folder: tPick });
});

/* studying: the people are at their desks, the panel docks beside them */
function renderStudying(){
  const P = $('ts-spanel'); P.textContent = '';
  const s = G.state();
  P.append(el('h2', 'ts-h', 'THE TEAM IS STUDYING'));
  P.append(el('p', 'ts-say', 'The Architect and the Product Manager are learning ' + (pending ? pending.name : 'this project') + ' at their desks. They were told to change nothing on GitHub. The CEO briefs you when they go quiet.'));
  const st = s.study ? s.study.status : '';
  P.append(el('p', 'ts-team', st === 'briefing' ? 'The CEO is writing the briefing.' : 'Working now: ' + s.working.map(k => G.name(k)).join(', ').replace(/^$/, 'nobody yet')));
  if (s.line.some(e => e.type === 'approval')) P.append(el('p', 'ts-say', 'Someone is waiting for your approval. They stop until you decide.'));
  P.append(cmdRow([btn('btn', 'WALK THE OFFICE', 'leaveStudy'), btn('btn', 'MAIN MENU', 'back')]));
}
let lastStudy = '';
function tick(){
  const s = G.state();
  if (!ts.hidden && screen === 'loadgame') { const sig = JSON.stringify(s.projects.map(p => [p.id, p.waiting, p.working, p.paused, p.goal])); if (sig !== lastStudy) { lastStudy = sig; const f = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.arg : null; renderSlots(); if (f) { const b = $('ts-list').querySelector('[data-arg="' + CSS.escape(f) + '"]'); if (b) b.focus(); } } }
  /* The meeting opens by itself once the briefing is ready, from the study screen or the office. It waits for a card or map you have open, and does not pull you out of the menus. */
  if (s.study && s.study.status === 'ready' && (ts.hidden ? !G.busy() : screen === 'studying')) {
    if (!pending || pending.project !== s.project.id) pending = { mode: 'takeover', project: s.project.id, name: s.project.name, gh: s.repo.name };
    startKickoff();
  } else if (pending && pending.mode === 'takeover' && s.project.id === pending.project && s.study && !ts.hidden && screen === 'studying') renderStudying();
  G.tableTick();
  if (pending && M && s.project.id === pending.project) syncMeeting(s);
  if (pending && pending.mode === 'meeting' && M && s.project.id === pending.project) {
    renderReadBox();
    const st = (s.reading || {}).status;
    if (M.reading && st !== 'reading' && (!ts.hidden || !G.busy())) {
      M.reading = false;
      if (ts.hidden) startKickoff();
      enqueue([{ speaker: 'ceo', ask: true, text: st === 'done' ? 'The team is back and has read everything. What do you want to talk about?' : 'The team could not finish reading. Press Read project files to send them again.' }]);
    }
  }
  const code = s.signin;
  if (code && screen === 'kickoff') { const c = $('ts-wfcode'); if (c && code.status !== 'waiting' && c.dataset.st !== code.status) { c.dataset.st = code.status; c.textContent = code.message; } }
}
(window.SDLCTicks = window.SDLCTicks || []).push(tick);

/* kickoff meeting, held in the office's Conference Room */
let opening = false;
async function startKickoff(){
  if (opening || !pending) return;
  opening = true;
  const p = pending, r = await G.api('/meeting-open', { project: p.project, mode: p.mode, what: p.what || '', names: G.names() });
  opening = false;
  if (!r.ok) { G.toast(r.message); return; }
  if (pending !== p) return;
  G.kickoff(r.meeting.team);
  open('kickoff');
  if (window.SDLCHelp) window.SDLCHelp.comment('meeting');
}
function el(tag, cls, text){ const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function btn(cls, text, act, arg, arg2){ const b = el('button', cls, text); b.type = 'button'; b.dataset.act = act; if (arg != null) b.dataset.arg = arg; if (arg2 != null) b.dataset.arg2 = arg2; return b; }
/* ---------- The meeting: real sessions in the helper. This screen shows what they say, in order, once it is ready ---------- */
let M = null;
function renderKickoff(){
  const P = $('ts-kpanel'); P.textContent = '';
  if (!M || M.key !== pending.project) M = { key: pending.project, lines: [], queue: [], seen: 0, catchUp: true, speaking: false, holding: false, started: false, current: null };
  const head = el('div', 'ts-headrow'); head.append(el('h2', 'ts-h', pending.mode === 'meeting' ? 'TEAM MEETING' : 'KICKOFF MEETING')); P.append(head);
  const card = el('div', 'ts-card'); card.id = 'ts-card'; const face = el('canvas', 'ts-face sm'); face.width = 144; face.height = 144; face.id = 'ts-cface'; face.setAttribute('aria-hidden', 'true');
  const cbody = el('div'); const cn = el('div', 'dname'); cn.id = 'ts-cname'; const ct = el('p', 'ts-say'); ct.id = 'ts-ctext'; cbody.append(cn, ct); if (window.SDLCHelp) cbody.append(window.SDLCHelp.explainControl(ct)); card.append(face, cbody);
  card.addEventListener('click', ev => { if (!ev.target.closest('button') && M.skip) M.skip(); });
  P.append(card);
  const nextB = btn('btn next', 'NEXT', 'meetingNext'); nextB.id = 'ts-next'; P.append(cmdRow([nextB]));
  const status = el('div', 'ts-hands'); status.id = 'ts-status'; P.append(status);
  const log = el('div', 'ts-log'); log.id = 'ts-log'; log.setAttribute('role', 'log'); log.setAttribute('aria-label', 'Meeting transcript'); P.append(log);
  const form = el('form', 'ts-sayform'); form.id = 'ts-sayform'; form.noValidate = true;
  const lab = el('label', 'lab', 'SAY SOMETHING. THE CEO PASSES IT ON.'); lab.htmlFor = 'ts-sayin';
  const ta = el('textarea'); ta.id = 'ts-sayin'; ta.rows = 2;
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  const sendB = el('button', 'btn next', 'SEND'); sendB.type = 'submit'; sendB.id = 'ts-send';
  form.append(lab, ta, cmdRow([sendB, el('span', 'note', 'Enter sends. Shift+Enter starts a new line. Use a name to talk to someone directly, or ask to bring someone in.')]));
  form.addEventListener('submit', e => { e.preventDefault(); TITLE_ACTIONS.sayToMeeting(ta.value); });
  P.append(form);
  if (pending.mode === 'takeover') {
    const S = (G.state().study || {}).sections || {}, d = el('details', 'ts-brief'); d.open = true; d.append(el('summary', null, 'The CEO’s briefing'));
    [['What this project is', 'what'], ['What shape it’s in', 'shape'], ['What the team found', 'found'], ['What we recommend first', 'first'], ['Questions for you', 'questions']].forEach(([t, k]) => { const p = el('p', null, S[k] || 'The team did not report on this.'); p.style.whiteSpace = 'pre-wrap'; d.append(sec(t, p)); });
    P.append(d);
  }
  const dec = el('div', 'ts-sec'); dec.id = 'ts-decisions'; dec.hidden = true; P.append(dec);
  if (pending.mode === 'meeting') { const rb = el('div', 'ts-sec'); rb.id = 'ts-readbox'; P.append(rb); renderReadBox(true); }
  P.append(filesBlock());
  const wf = el('div', 'ts-sec'); wf.id = 'ts-wf'; P.append(wf);
  P.append(pending.mode === 'meeting' ? cmdRow([btn('btn next', 'GET TO WORK ON THIS', 'meetingToWork'), btn('btn', 'JUST KEEP THE NOTES', 'meetingNotes'), btn('btn', 'LEAVE', 'leaveMeeting')])
    : pending.mode === 'scratch' ? cmdRow([btn('btn next', 'START WORK', 'startWork'), btn('btn', 'BACK', 'back')])
    : cmdRow([btn('btn next', 'GET TO WORK', 'getToWork'), btn('btn', 'BRING IT UP TO OUR STANDARDS', 'bringUp'), btn('btn', 'JUST KEEP THE NOTES', 'keepNotes')]));
  P.append(el('p', 'note', pending.mode === 'meeting' ? 'GET TO WORK ON THIS gives the notes to the CEO, and changes still wait for your approval. LEAVE saves nothing. Nobody at this table starts work until you press a button.' : pending.mode === 'scratch' ? 'START WORK sends your description and these notes to the CEO, who runs setup in a new folder. Changes wait for your approval.' : 'BRING IT UP TO OUR STANDARDS may change settings on the project. It asks your approval first.'));
  M.lines.forEach(addLog); showCard(M.current, true);
  if (!M.started) { M.started = true; openMeeting(); } else pump();
  syncMeeting(G.state()); renderNext();
  ta.focus();
}
/* Whether the people at the table know the project. Only redrawn when it changes, so it never takes your place in the text box. */
function renderReadBox(force){
  const box = $('ts-readbox'); if (!box) return;
  const s = G.state(), r = s.reading || { status: 'none' }, held = s.line.some(e => e.type === 'approval');
  const sig = r.status + '|' + (r.at || '') + '|' + held;
  if (!force && box.dataset.sig === sig) return;
  box.dataset.sig = sig; box.textContent = '';
  box.append(el('h3', null, 'THE PROJECT FILES'));
  const words = { none: 'The team has not read this project’s files.', failed: 'The team could not finish reading. You can send them again.', reading: 'The team is reading everything now.', done: 'The team last read the files on ' + new Date(r.at || 0).toLocaleDateString() + '.' };
  box.append(el('p', null, words[r.status] || words.none));
  if (r.status === 'reading') {
    if (held) { box.append(el('p', 'ts-say', 'Someone is waiting for your approval. They stop until you decide.')); box.append(cmdRow([btn('btn next', 'GO ANSWER THEM', 'answerCards')])); }
  } else box.append(cmdRow([btn(r.status === 'done' ? 'btn' : 'btn next', 'READ PROJECT FILES', 'readFiles')]));
}
function sourceText(){ return [pending.gh ? 'GitHub project ' + pending.gh : null, pending.folder ? 'the folder ' + pending.folder.name + ' on your computer' : null].filter(Boolean).join(' and '); }
function title(k){ return k === 'you' ? 'You' : G.name(k); }
/* What the helper says has happened. Lines wait here until they are worded for you, so they always appear in order. */
function syncMeeting(s){
  const mt = s.meeting; if (!mt || !M) return;
  G.table(mt.team, mt.working);
  while (M.seen < mt.lines.length && !mt.lines[M.seen].pending) {
    const l = mt.lines[M.seen++];
    if (M.catchUp || l.speaker === 'you') { M.lines.push(l); addLog(l); if (l.speaker === 'you') { M.current = l; showCard(l); } }
    else enqueue([l]);
  }
  M.catchUp = false;
  renderStatus(mt); renderDecisions(mt);
}
function renderStatus(mt){
  const box = $('ts-status'); if (!box) return;
  const ceo = G.name('ceo'), text = mt.asking.length ? ceo + ' is asking ' + mt.asking.map(k => G.name(k)).join(' and ') : mt.ceoBusy ? ceo + ' is working out who to ask' : 'Your turn';
  if (box.textContent !== text) box.textContent = text;
}
function renderDecisions(mt){
  const box = $('ts-decisions'); if (!box) return;
  const heads = Object.keys(mt.lists).filter(k => mt.lists[k].length), sig = JSON.stringify([mt.decisions, mt.lists]);
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig; box.textContent = '';
  box.hidden = !mt.decisions.length && !heads.length;
  const list = (head, items) => { box.append(el('h3', null, head)); const u = el('ul', 'ts-notes'); items.forEach(x => u.append(el('li', null, x))); box.append(u); };
  if (mt.decisions.length) list('DECISIONS SO FAR', mt.decisions);
  heads.forEach(k => list('AFTER THE MEETING: ' + G.name(k).toUpperCase(), mt.lists[k]));
}
function addLog(line){ const log = $('ts-log'); if (!log) return; const p = el('p', line.speaker === 'you' ? 'me' : (line.speaker === 'note' ? 'sys' : null)); if (line.speaker !== 'note') p.append(el('b', null, title(line.speaker) + ': ')); p.append(document.createTextNode(line.text)); log.append(p); log.scrollTop = log.scrollHeight; }
function showCard(line, instant){
  const card = $('ts-card'); if (!card) return;
  if (!line) { card.hidden = true; return; }
  card.hidden = false; const who = line.speaker === 'you' ? 'you' : line.speaker === 'note' ? 'ceo' : line.speaker;
  G.portrait($('ts-cface'), who, false);
  $('ts-cname').textContent = title(line.speaker === 'note' ? 'ceo' : line.speaker);
  $('ts-ctext').textContent = line.text;
  if (!instant && !RM()) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
}
function enqueue(lines){ lines.forEach(l => M.queue.push(l)); pump(); renderNext(); }
/* One person at a time: a line stays up until you answer it or press NEXT. */
function release(){ M.holding = false; pump(); renderNext(); }
function renderNext(){
  const b = $('ts-next'); if (!b || !M) return;
  const n = M.queue.length;
  b.textContent = n ? 'NEXT (' + n + ' more waiting)' : 'NEXT';
  b.disabled = !M.speaking && !n;
}
function pump(){
  if (!M || M.speaking || M.holding || screen !== 'kickoff') return;
  const line = M.queue.shift();
  if (line) speak(line);
}
function speak(line){
  M.speaking = true; M.current = line; M.lines.push(line); addLog(line);
  if (line.speaker !== 'you') G.talking(line.speaker);
  showCard(line); const ct = $('ts-ctext'); if (ct) delete ct.dataset.orig; const ver = $('ts-card') && $('ts-card').querySelector('.hl-ver'); if (ver) ver.textContent = '';
  let i = 0, typer = 0;
  const done = () => { clearInterval(typer); M.skip = null; if (ct && ct.isConnected && ct.dataset.orig == null) { ct.textContent = line.text; if (window.SDLCHelp) window.SDLCHelp.markTerms(ct); } G.talking(null); M.speaking = false; M.holding = true; if (line.ask) { const ta = $('ts-sayin'); if (ta) ta.focus(); } renderNext(); };
  M.skip = done;
  renderNext();
  if (RM() || !ct) { done(); return; }
  ct.textContent = ''; G.blip(300, 0.02);
  typer = setInterval(() => { i += 2; ct.textContent = line.text.slice(0, i); if (i >= line.text.length) done(); }, 18);
}
function openMeeting(){
  if (pending.mode === 'scratch') return; // the CEO session opens this one
  if (pending.mode === 'meeting') {
    const st = (G.state().reading || {}).status;
    M.reading = st === 'reading';
    enqueue([{ speaker: 'ceo', ask: true, text: st === 'done' ? 'Everyone is here. What do you want to talk about?' : st === 'reading' ? 'The team is still reading the project files. I will pick this up as soon as they are back.' : 'Before we start: the team has not read this project’s files, so we would only be guessing. Press Read project files and they will go read everything.' }]);
    return;
  }
  enqueue([{ speaker: 'ceo', text: 'The briefing is below. Ask anything, answer my questions, or pick what happens next.', ask: true }]);
}
TITLE_ACTIONS.sayToMeeting = text => {
  text = String(text || '').trim(); if (!text || !M) return;
  const ta = $('ts-sayin'); if (ta) ta.value = '';
  if (M.skip) M.skip();
  release();
  G.api('/meeting-say', { project: pending.project, text: text }).then(r => { if (!r.ok) G.toast(r.message); });
};
function stopMeeting(){ if (M && M.skip) { const s = M.skip; M.skip = null; s(); } M = null; G.talking(null); }
function sec(title, body){ const s = el('div', 'ts-sec'); s.append(el('h3', null, title.toUpperCase())); if (body) s.append(body); return s; }
function cmdRow(btns){ const r = el('div', 'row'); btns.forEach(b => r.append(b)); return r; }
function filesBlock(){
  const s = sec('Files for the team');
  const p = el('p', null, 'Checking the cabinet.'); s.append(p);
  G.api('/cabinet', { project: pending.project }).then(r => { const n = r.ok ? r.drawers.reduce((a, d) => a + d.items.length, 0) : 0; p.textContent = n ? n + ' file' + (n === 1 ? '' : 's') + ' in the cabinet so far.' : 'The cabinet is empty so far.'; });
  s.append(cmdRow([btn('btn', 'OPEN THE FILE CABINET', 'openKickoffFiles')]));
  return s;
}
function finishKickoff(notice){
  stopMeeting(); const p = pending; pending = null;
  G.kickoff(null);
  clockIn(p.project, notice);
}

/* load game slots: the real project list */
function whenText(t){ if (!t) return 'Not yet'; const d = Date.now() - t, m = Math.round(d / 60000); if (m < 2) return 'Just now'; if (m < 60) return m + ' minutes ago'; const h = Math.round(m / 60); if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago'); return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function renderSlots(){
  const list = $('ts-list'); list.textContent = '';
  const all = G.state().projects;
  if (!all.length) { const e = el('div', 'ts-empty'); e.append(el('p', null, 'No projects yet.'), el('p', 'note', 'Start one with New Game.'), btn('btn next', 'NEW GAME', 'newGame')); list.append(e); return; }
  all.forEach(p => {
    const row = el('div', 'ts-slotrow'); row.setAttribute('role', 'listitem');
    const b = el('button', 'ts-slot'); b.type = 'button'; b.dataset.act = 'loadProject'; b.dataset.arg = p.id; b.disabled = !!p.missing;
    const job = p.missing ? 'The folder is missing: ' + p.folder : p.hasJob ? 'Job: ' + p.goal : 'No job yet';
    b.append(el('span', 'nm', p.name), p.current ? el('span', 'ts-badge', 'CURRENT') : el('span'));
    b.append(el('span', 'rp', p.folder), el('span', 'jb', job));
    const stats = el('span', 'ts-stats');
    const w = el('span', 'ts-wait'); if (p.waiting) w.append(el('span', 'ts-dot')); w.append(el('b', null, String(p.waiting)), document.createTextNode(' waiting for you'));
    const wk = el('span'); wk.append(el('b', null, String(p.working)), document.createTextNode(' working'));
    const pz = el('span'); pz.append(el('b', null, String(p.paused)), document.createTextNode(' paused'));
    stats.append(w, wk, pz, el('span', null, 'Last played: ' + whenText(p.lastPlayed))); b.append(stats);
    b.setAttribute('aria-label', p.name + '. ' + job + '. ' + p.waiting + ' waiting, ' + p.working + ' working, ' + p.paused + ' paused. Last played ' + whenText(p.lastPlayed) + '.');
    row.append(b);
    if (slotAsk === p.id) { row.append(el('p', 'ts-say', 'Take ' + p.name + ' off this list? This only removes it from the game. Its folder, files and GitHub project stay as they are, and you can get it back with New Game, Take Over.')); row.append(cmdRow([btn('btn next', 'TAKE IT OFF THE LIST', 'removeYes', p.id), btn('btn', 'KEEP IT', 'removeNo')])); }
    else row.append(cmdRow([btn('btn ts-slotoff', 'REMOVE', 'removeAsk', p.id)]));
    list.append(row);
  });
}

/* ---------- File cabinet: one store per project, shared by both cabinets ---------- */
function typeOf(n){ const e = (n.split('.').pop() || '').toLowerCase(); return ({ pdf: 'PDF', png: 'Image', jpg: 'Image', jpeg: 'Image', gif: 'Image', svg: 'Image', webp: 'Image', doc: 'Word', docx: 'Word', xls: 'Spreadsheet', xlsx: 'Spreadsheet', csv: 'Spreadsheet', md: 'Text', txt: 'Text', mov: 'Video', mp4: 'Video', wav: 'Audio', mp3: 'Audio', zip: 'Archive', js: 'Code', ts: 'Code', py: 'Code', html: 'Code', css: 'Code', json: 'Data' })[e] || (e && e !== n.toLowerCase() ? e.toUpperCase() : 'File'); }
function fmtDate(t){ try { return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }
async function refreshFiles(){
  const r = await G.api('/cabinet', { project: filesKey });
  drawers = r.ok ? r.drawers : [{ id: 'uploads', name: 'Uploads', items: [] }];
  if (!r.ok) errors.push({ id: 'e' + (++uid), name: 'The cabinet', reason: r.message });
  const P = $('ts-fpanel'); const focusId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fid : null;
  P.textContent = '';
  const nm = (G.state().projects.find(p => p.id === filesKey) || {}).name || '';
  const head = el('div', 'ts-headrow'); head.append(el('h2', 'ts-h', 'FILE CABINET')); P.append(head);
  P.append(el('p', 'ts-team', nm + ' · the same files open from your office and the Conference Room.'));
  if (!drawers.some(d => d.id === drawerSel)) drawerSel = 'uploads';
  const dr = el('div', 'ts-drawers'); dr.setAttribute('role', 'group'); dr.setAttribute('aria-label', 'Drawers');
  drawers.forEach(d => { const b = btn('ts-drawer', null, 'pickDrawer', d.id); b.setAttribute('aria-pressed', String(d.id === drawerSel)); b.append(el('span', 'dn', d.name), el('span', 'dc', d.items.length + ' item' + (d.items.length === 1 ? '' : 's') + (d.readOnly ? ' · READ ONLY' : ''))); dr.append(b); });
  P.append(dr);
  const d = drawers.find(x => x.id === drawerSel);
  if (d.readOnly) P.append(cmdRow([el('span', 'ts-badge ro', 'READ ONLY'), el('span', 'ts-team', d.missing ? 'This folder could not be found.' : 'Connected folder. The team can read these files but not change them. Removing it only unlinks it.'), btn('ts-mini', 'Remove folder from cabinet', 'removeFolder', d.id)]));
  const rows = d.id === 'uploads' ? d.items.concat(adding) : d.items;
  if (!rows.length) { const e = el('div', 'ts-empty'); e.append(el('p', null, 'This drawer is empty.'), el('p', 'note', 'Drag files into the area below, or press UPLOAD.')); P.append(e); }
  else {
    const t = el('div', 'ts-ftable'); t.setAttribute('role', 'list');
    const hr = el('div', 'ts-frow head'); hr.append(el('span', null, 'NAME'), el('span', null, 'TYPE'), el('span', null, 'DATE'), el('span')); t.append(hr);
    rows.forEach(it => {
      const r = el('div', 'ts-frow'); r.setAttribute('role', 'listitem'); r.dataset.row = it.id;
      r.append(el('span', 'fn', it.name), el('span', 'ft', typeOf(it.name)), el('span', 'fd', it.adding ? 'Adding…' : fmtDate(it.date)));
      if (d.readOnly || it.adding) r.append(el('span'));
      else { const rb = btn('ts-mini', 'Remove', 'removeItem', d.id, it.name); rb.setAttribute('aria-label', 'Remove ' + it.name); rb.dataset.fid = 'rm-' + it.id; r.append(rb); }
      if (it.adding) { const pr = el('div', 'ts-prog'); pr.setAttribute('role', 'progressbar'); pr.setAttribute('aria-label', 'Adding ' + it.name); pr.setAttribute('aria-valuemin', '0'); pr.setAttribute('aria-valuemax', '100'); pr.setAttribute('aria-valuenow', String(it.pct)); const i = el('i'); i.style.width = it.pct + '%'; pr.append(i); r.append(pr); }
      t.append(r);
    });
    P.append(t);
  }
  errors.forEach(er => { const r = el('div', 'ts-frow err'); r.setAttribute('role', 'alert'); r.append(el('span', 'x', 'COULDN’T ADD'), el('span', 'fn', er.name + ' ' + er.reason + '.'), btn('ts-mini', 'Dismiss', 'dismissError', er.id)); P.append(r); });
  const drop = el('div', 'ts-drop' + (filesFrom === 'kickoff' ? ' small' : '')); drop.id = 'ts-drop';
  drop.append(el('p', null, 'Drag files here'), cmdRow([btn('btn next', 'UPLOAD', 'uploadFiles'), btn('btn', 'CONNECT A FOLDER', 'connectFolder')]));
  ['dragenter', 'dragover'].forEach(n => drop.addEventListener(n, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(n => drop.addEventListener(n, () => drop.classList.remove('over')));
  drop.addEventListener('drop', e => { e.preventDefault(); takeDrop(e.dataTransfer); });
  P.append(drop);
  P.append(el('p', 'note', 'Uploads are copied to a private folder outside the project, up to 200 MB each, and never enter the project without your approval. The team reads them as information, not instructions.'));
  P.append(cmdRow([btn('btn', filesFrom === 'kickoff' ? 'BACK TO THE MEETING' : 'CLOSE', 'closeFiles')]));
  if (focusId) { const f = P.querySelector('[data-fid="' + focusId + '"]'); if (f) f.focus(); }
}
TITLE_ACTIONS.pickDrawer = id => { drawerSel = id; refreshFiles().then(() => { const b = $('ts-fpanel').querySelector('[data-act="pickDrawer"][data-arg="' + id + '"]'); if (b) b.focus(); }); };
function takeDrop(dt){
  const files = [];
  Array.from(dt.items || []).forEach(i => { const en = i.webkitGetAsEntry ? i.webkitGetAsEntry() : null; if (en && en.isDirectory) errors.push({ id: 'e' + (++uid), name: en.name, reason: 'is a folder. Use CONNECT A FOLDER for folders' }); else { const f = i.getAsFile(); if (f) files.push(f); } });
  if (!dt.items) Array.from(dt.files || []).forEach(f => files.push(f));
  addFiles(files);
}
function addFiles(files){
  drawerSel = 'uploads';
  files.forEach(f => {
    if (f.size > LIMIT) { errors.push({ id: 'e' + (++uid), name: f.name, reason: 'is over the 200 MB limit for this cabinet' }); return; }
    if (f.size === 0) { errors.push({ id: 'e' + (++uid), name: f.name, reason: 'is empty' }); return; }
    const it = { id: 'i' + (++uid), name: f.name, pct: 0, adding: true, date: f.lastModified }; adding.push(it);
    const x = new XMLHttpRequest(); const project = filesKey;
    x.open('POST', '/materials/upload?project=' + encodeURIComponent(project) + '&name=' + encodeURIComponent(f.name));
    x.setRequestHeader('X-Office-Token', G.token()); x.setRequestHeader('Content-Type', 'application/octet-stream');
    x.upload.onprogress = e => { if (!e.lengthComputable) return; it.pct = Math.round(100 * e.loaded / e.total); const row = $('ts-fpanel').querySelector('[data-row="' + it.id + '"]'); if (row) { const bar = row.querySelector('.ts-prog'); if (bar) { bar.firstChild.style.width = it.pct + '%'; bar.setAttribute('aria-valuenow', String(it.pct)); } } };
    const end = reason => { adding = adding.filter(a => a !== it); if (reason) errors.push({ id: 'e' + (++uid), name: f.name, reason: reason }); if (screen === 'files') refreshFiles(); };
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch (e) { j = {}; } end(j.ok ? null : (j.message || 'could not be added')); };
    x.onerror = () => end('could not be added');
    x.send(f);
  });
  refreshFiles();
}
$('ts-upload').addEventListener('change', ev => addFiles(Array.from(ev.target.files || [])));

/* loading */
function clockIn(id, notice){
  show('loading');
  const meta = G.state().projects.find(p => p.id === id); $('ts-loadname').textContent = meta ? meta.name : '';
  const bar = $('ts-bar'); bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = '';
  loadDone = () => {
    clearTimeout(loadTimer); loadDone = null;
    const s = G.state();
    if (s.study && s.project.id === id && !notice) { pending = { mode: 'takeover', project: id, name: s.project.name, gh: s.repo.name }; if (s.study.status === 'ready') startKickoff(); else show('studying'); return; }
    close(); if (notice) G.toast(notice); if (window.SDLCHelp) window.SDLCHelp.comment('office');
  };
  if (RM()) { bar.style.width = '100%'; loadTimer = setTimeout(() => loadDone && loadDone(), 400); }
  else { requestAnimationFrame(() => { bar.style.width = '100%'; }); loadTimer = setTimeout(() => loadDone && loadDone(), 1500); }
  $('ts-loadbox').focus();
}
$('ts-loadbox').addEventListener('click', () => loadDone && loadDone());


/* keyboard */
function focusables(){ return Array.from($('ts-' + screen).querySelectorAll('button:not([disabled]), input, textarea')).filter(n => n.offsetParent !== null); }
window.addEventListener('keydown', ev => {
  if (ts.hidden) return;
  const k = ev.key, t = ev.target, inField = t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type === 'text'));
  if (screen === 'loading') { if (['e', 'E', 'Enter', ' ', 'Escape'].indexOf(k) >= 0) { ev.preventDefault(); loadDone && loadDone(); } return; }
  if (screen === 'title' && attract) { if (['e', 'E', 'Enter', ' '].indexOf(k) >= 0) { ev.preventDefault(); TITLE_ACTIONS.pressStart(); } return; }
  if (k === 'Escape') { if (inField && screen === 'kickoff') { ev.preventDefault(); t.blur(); return; } if (screen !== 'title') { ev.preventDefault(); goBack(); } return; }
  if (inField || (t && t.closest && t.closest('.hl-levels'))) return;
  if ((k === 'ArrowDown' || k === 'ArrowUp' || k === 'ArrowLeft' || k === 'ArrowRight') && (screen === 'title' || screen === 'loadgame' || screen === 'newchoice')) {
    ev.preventDefault(); const f = screen === 'title' ? items : focusables(); if (!f.length) return;
    let i = f.indexOf(document.activeElement); i = i < 0 ? 0 : (i + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : f.length - 1)) % f.length; f[i].focus(); G.blip(440, 0.03); return;
  }
  if (k === 'e' || k === 'E' || (k === 'Enter' && screen === 'title')) {
    const a = document.activeElement;
    if (a && ts.contains(a) && a.tagName === 'BUTTON') { ev.preventDefault(); a.click(); }
    else if (screen === 'title') { ev.preventDefault(); (ts.querySelector('.ts-item.sel') || items[0]).click(); }
  }
}, true);

/* dusk skyline */
const sky = $('ts-sky'), sx = sky.getContext('2d');
let seed = 20261103; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const back = [], front = [], wins = [];
for (let x = -10; x < 490;) { const w = 18 + rnd() * 26, h = 50 + rnd() * 70; back.push({ x, w, h }); x += w + 2; }
for (let x = -8; x < 490;) { const w = 34 + rnd() * 40, h = 80 + rnd() * 110; front.push({ x, w, h }); for (let wy = 270 - h + 8; wy < 262; wy += 9) for (let wx = x + 5; wx < x + w - 6; wx += 8) wins.push({ x: wx, y: wy, on: rnd() < 0.38, warm: rnd() < 0.8 }); x += w + 4 + rnd() * 6; }
const tower = { x: 205, w: 70, h: 236 };
for (let wy = 270 - tower.h + 26; wy < 262; wy += 8) for (let wx = tower.x + 6; wx < tower.x + tower.w - 6; wx += 7) wins.push({ x: wx, y: wy, on: rnd() < 0.55, warm: true });
let blink = 0;
function drawSky(){
  const g = sx.createLinearGradient(0, 0, 0, 270); g.addColorStop(0, '#140C3C'); g.addColorStop(0.42, '#4A2A78'); g.addColorStop(0.72, '#C85E5A'); g.addColorStop(0.9, '#FFA860'); g.addColorStop(1, '#FFC878');
  sx.fillStyle = g; sx.fillRect(0, 0, 480, 270);
  const sun = sx.createRadialGradient(350, 236, 4, 350, 236, 120); sun.addColorStop(0, 'rgba(255,236,170,.95)'); sun.addColorStop(0.15, 'rgba(255,190,110,.6)'); sun.addColorStop(1, 'rgba(255,140,90,0)'); sx.fillStyle = sun; sx.fillRect(0, 0, 480, 270);
  sx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 40; i++) sx.fillRect((i * 97) % 480, (i * 53) % 90, 1, 1);
  sx.fillStyle = 'rgba(255,170,150,.16)'; [[80, 70, 120], [300, 52, 150], [420, 96, 90]].forEach(([x, y, w]) => { sx.beginPath(); sx.ellipse(x, y, w, 9, 0, 0, 7); sx.fill(); });
  sx.fillStyle = '#3A2460'; back.forEach(b => sx.fillRect(b.x, 270 - b.h - 20, b.w, b.h + 20));
  front.forEach(b => { const fg = sx.createLinearGradient(0, 270 - b.h, 0, 270); fg.addColorStop(0, '#2A1A4C'); fg.addColorStop(1, '#140C2A'); sx.fillStyle = fg; sx.fillRect(b.x, 270 - b.h, b.w, b.h); sx.fillStyle = 'rgba(255,190,140,.18)'; sx.fillRect(b.x + b.w - 3, 270 - b.h, 3, b.h); });
  const tg = sx.createLinearGradient(tower.x, 0, tower.x + tower.w, 0); tg.addColorStop(0, '#22163E'); tg.addColorStop(0.7, '#36245A'); tg.addColorStop(1, '#5A3A6A'); sx.fillStyle = tg; sx.fillRect(tower.x, 270 - tower.h, tower.w, tower.h);
  sx.fillStyle = '#1A1030'; sx.fillRect(tower.x + 32, 270 - tower.h - 26, 4, 26); sx.fillStyle = blink ? '#FF3A20' : '#6A1A10'; sx.fillRect(tower.x + 31, 270 - tower.h - 30, 6, 5);
  wins.forEach(w => { if (!w.on) { sx.fillStyle = 'rgba(10,6,24,.55)'; sx.fillRect(w.x, w.y, 4, 5); return; } sx.fillStyle = w.warm ? '#FFD27A' : '#9CD8FF'; sx.fillRect(w.x, w.y, 4, 5); sx.fillStyle = w.warm ? 'rgba(255,200,110,.18)' : 'rgba(140,210,255,.16)'; sx.fillRect(w.x - 2, w.y - 2, 8, 9); });
  const gr = sx.createLinearGradient(0, 252, 0, 270); gr.addColorStop(0, 'rgba(10,6,20,0)'); gr.addColorStop(1, 'rgba(10,6,20,.9)'); sx.fillStyle = gr; sx.fillRect(0, 252, 480, 18);
}
drawSky();
setInterval(() => { if (ts.hidden || ts.className || RM()) return; for (let i = 0; i < 4; i++) { const w = wins[(Math.random() * wins.length) | 0]; w.on = !w.on; } blink ^= 1; drawSky(); }, 450);

/* game hooks */
window.SDLCTitle = { openFiles: TITLE_ACTIONS.openFiles, mainMenu: TITLE_ACTIONS.mainMenu, callMeeting: TITLE_ACTIONS.callMeeting };
$('b-menu').addEventListener('click', TITLE_ACTIONS.mainMenu);
open('title');
})();
