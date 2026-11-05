/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
'use strict';
/* ================= Conversations ================= */
function openConvo(k){
  if (k === 'rev1' || k === 'rev2') { reviewerMenu(k); return; }
  const inLine = queue().some(g => g.key === k);
  convo = { key: k, mode: 'here' };
  if (inLine) openCards(k); else roleMenu(k);
}
function endConvo(){ convo = null; refreshHud(); }
function summon(k){
  if (convo && convo.mode === 'visit' && convo.key === k) return;
  if (mapOpen) closeMap();
  if (dlgOpen()) closeDialog();
  if (carrying) return;
  const go = () => { convo = { key: k, mode: 'visit', opened: false }; blip(660); toast(nameOf(k) + ' is coming to your desk.'); };
  if (P.tx === MYCHAIR.x && P.ty === MYCHAIR.y && !P.moving) go(); else carry({ x: MYCHAIR.x, y: MYCHAIR.y, face: 'down' }, go);
}
function callNext(){
  const q = queue();
  if (unseenNotes() > 0) { inboxPaper(() => setTimeout(callNext, 50), 'Got it, next'); return; }
  if (!q.length) { toast('No one is waiting in the line.'); return; }
  summon(q[0].key);
}
/* The next card this person has for you, leaving out one you just answered that stays waiting. */
function nextEntry(k, skip){ const g = queue().find(x => x.key === k); return g ? g.entries.find(x => x.id !== skip) || null : null; }
function openCards(k, skip){
  const e = nextEntry(k, skip);
  if (!e) { endConvo(); return; }
  /* The character's words are still being written; the card opens when they arrive. */
  if (e.translating && e.source !== 'permission') {
    openDialog({ key: k, text: 'Give me a moment...', onClose: endConvo, build: body => {
      const here = el('span'); body.append(here); clearInterval(approvalWatch);
      approvalWatch = setInterval(() => { const now = readState().line.find(x => x.id === e.id); if (!here.isConnected) { clearInterval(approvalWatch); return; } if (!now || !now.translating) { clearInterval(approvalWatch); onDlgClose = null; dlg.hidden = true; openCards(k); } }, 500);
    } });
    return;
  }
  if (e.type === 'question') questionCard(k, e);
  else if (e.type === 'approval') approvalCard(k, e);
  else if (e.type === 'acceptance') acceptanceCard(k, e);
  else if (e.type === 'report') reportCard(k, e);
  else if (e.type === 'paused') pausedCard(k, e);
}
/* After you answer, the person stays at your desk while a quick reply comes back, so they do not walk off and straight back (the owner's decision, 2026-11-05). */
const REPLY_WAIT = 10000;
let replyWatch = null;
function afterAnswer(k, msg, wait, skip){
  toast(msg);
  blip(990, 0.06);
  if (nextEntry(k, skip)) { dlg.hidden = true; onDlgClose = null; openCards(k, skip); return; }
  if (wait) { waitForReply(k, skip); return; }
  onDlgClose = null; dlg.hidden = true; endConvo();
}
function waitForReply(k, skip){
  const until = Date.now() + REPLY_WAIT;
  clearInterval(replyWatch);
  openDialog({ key: k, text: 'Let me see...', onClose: () => { clearInterval(replyWatch); endConvo(); }, build: body => {
    const mark = el('p', { class: 'note', text: 'If I have an answer in a few seconds, I will give it to you right here.' });
    body.append(mark, el('div', { class: 'row' }, [stepBack(true)]));
    clearInterval(replyWatch);
    replyWatch = setInterval(() => {
      if (!mark.isConnected) { clearInterval(replyWatch); return; }
      if (nextEntry(k, skip)) { clearInterval(replyWatch); onDlgClose = null; dlg.hidden = true; openCards(k, skip); return; }
      if (Date.now() >= until) { clearInterval(replyWatch); onDlgClose = null; leaveSaying(k); }
    }, 300);
  } });
}
function leaveSaying(k){
  openDialog({ key: k, text: 'I will get right on that, and I will come back when I have something for you.', onClose: endConvo, build: body => {
    const ok = el('button', { class: 'btn', type: 'button', 'data-autofocus': '', text: 'OK', onclick: () => closeDialog() });
    body.append(el('div', { class: 'row' }, [ok]));
    setTimeout(() => { if (ok.isConnected) closeDialog(); }, 2500);
  } });
}
function stepBack(focusHere){ const b = el('button', { class: 'btn', type: 'button', text: 'Step back (Esc)', onclick: () => closeDialog() }); if (focusHere) b.setAttribute('data-autofocus', ''); return b; }
function ownAnswerBox(label, send){
  const ta = el('textarea', { 'aria-label': label });
  const go = () => { const t = ta.value.trim(); if (!t) { ta.focus(); toast('Write the answer first.'); return; } send(t); };
  return [el('label', { class: 'lab', text: label.toUpperCase() }), ta, el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Send answer', onclick: go })])];
}
let replySeq = 0;
function replyBtn(to){ return el('button', { class: 'btn', type: 'button', text: 'Reply', onclick: ev => openReply(ev.currentTarget, typeof to === 'function' ? to() : to) }); }
function openReply(btn, to){
  const open = dlgBody.querySelector('.reply-box'); if (open) { open.querySelector('textarea').focus(); return; }
  const id = 'reply-' + (++replySeq);
  const ta = el('textarea', { id: id, 'aria-label': 'Reply to ' + nameOf(to) });
  let panel = null;
  const send = el('button', { class: 'btn', type: 'button', text: 'Send', onclick: async ev => {
    const t = ta.value.trim(); if (!t) { ta.focus(); toast('Type a reply first.'); return; }
    const b = ev.currentTarget; b.disabled = true;
    const r = await api('/send', { role: to, text: t });
    b.disabled = false;
    if (!r.ok) { toast(r.message); return; }
    blip(990, 0.06); toast('Reply sent to ' + nameOf(to) + '.'); panel.remove();
  } });
  const cancel = el('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => panel.remove() });
  panel = el('div', { class: 'reply-box' }, [el('label', { class: 'lab', for: id, text: 'REPLY TO ' + nameOf(to).toUpperCase() }), ta, el('div', { class: 'row' }, [send, cancel])]);
  (btn.closest('.row') || btn).after(panel); ta.focus();
}
/* Links that open a file in another tab, and the words before they were put at your level. Both stay out of the way. */
function cardExtras(body, e){
  if (e.files && e.files.length) body.append(el('div', { class: 'row' }, e.files.map(f => el('a', { class: 'btn', href: f.url, target: '_blank', rel: 'noopener noreferrer', text: 'Open ' + (f.name.length > 50 ? f.name.slice(0, 50) + '...' : f.name) }))));
  if (!e.full) return;
  const said = el('div', { class: 'said', text: e.full, tabindex: '0' }); said.hidden = true;
  const b = el('button', { class: 'hl-small', type: 'button', 'aria-expanded': 'false', text: 'Full explanation', onclick: () => { said.hidden = !said.hidden; b.setAttribute('aria-expanded', String(!said.hidden)); } });
  body.append(el('div', { class: 'hl-explain' }, [b]), said);
}
function questionCard(k, e){
  const send = t => act('/file-answer', { id: e.id, text: t }, k, e, 'Sent to ' + nameOf(e.owner) + '. Back to work.');
  openDialog({ key: k, sub: 'Question · ' + e.title, text: e.question, onClose: endConvo, build: body => {
    cardExtras(body, e);
    body.append(fieldList([['TITLE', e.title], ['PRIORITY', priChip(e.priority)], ['RAISED BY', e.raisedByText || nameOf(k)], ['BLOCKS', e.blocks], ['JOB', e.jobId]]));
    const gh = readState().github;
    if (gh && !gh.signedIn && /\b(gh|github|sign)\b/i.test(e.title + ' ' + e.question)) body.append(el('p', { class: 'note', text: 'Please sign in here first, then answer me.' }), githubSignIn());
    if (e.ownerAsleep) body.append(el('p', { class: 'note', text: e.owner === k ? 'I am not in a session right now. If you answer, I will reopen my earlier session and pick this up.' : nameOf(e.owner) + ' is not in a session right now. If you answer, I will pass this on and they will reopen their earlier session.' }));
    if (e.owner) {
      if (e.options.length) body.append(optButtons(e.options.map(o => ({ label: cleanOpt(o), rec: isRec(o), fn: () => send(cleanOpt(o)) }))));
      body.append(...ownAnswerBox(e.options.length ? 'Or type your own answer' : 'Your answer', send));
    } else {
      if (e.options.length) body.append(el('ul', { class: 'plain' }, e.options.map(o => el('li', { text: o }))));
      body.append(el('p', { class: 'note', text: e.ownerReason }));
      body.append(cmdBox(e.copyCommand, 'Copy this').node);
    }
    const lg = legalLine(k); if (lg) body.append(lg);
  } });
}
const LEVEL_WORDS = {
  owner: { COMMAND: 'EXACT COMMAND', AFFECTS: 'WHAT IT TOUCHES', REVERSIBLE: 'CAN IT BE UNDONE?', Threshold: 'What reaches you', sessions: 'people working' },
  manager: { REVERSIBLE: 'CAN IT BE UNDONE?', Threshold: 'What reaches you', sessions: 'people working' },
  lead: {}, engineer: {}
};
function LV(){ const p = readState().player; return (p && p.level) || 'manager'; }
function LW(w){ return (LEVEL_WORDS[LV()] || {})[w] || w; }
// The level changes wording only. Every level gets this same card and the command is at most one click away.
function commandEl(cmd){
  const code = el('code', { class: 'exact', text: cmd });
  if (LV() !== 'owner' && LV() !== 'manager') return code;
  const wrap = el('div', {}); code.hidden = true;
  wrap.append(el('button', { class: 'hl-small', type: 'button', text: 'Show the exact command', onclick: ev => { code.hidden = false; ev.currentTarget.remove(); } }), code);
  return wrap;
}
let approvalWatch = 0;
function approvalCard(k, e){
  clearInterval(approvalWatch);
  const decide = v => {
    const word = v === 'approve' ? 'approved' : 'denied';
    if (v === 'approve') stampUse();
    if (e.source === 'permission') act('/permission', { requestId: e.requestId, role: k, decision: v }, k, e, nameOf(k) + ': ' + word + '.');
    else act('/file-answer', { id: e.id, text: v }, k, e, nameOf(k) + ': ' + word + '.');
  };
  openDialog({ key: k, sub: e.source === 'file' ? 'Approval needed · ' + e.title : 'Approval needed', text: e.translating ? 'Give me a moment, I am putting this into plain words...' : e.plain, onClose: endConvo, build: body => {
    cardExtras(body, e);
    body.append(fieldList([['PROJECT', e.projectName], ['ASKED BY', nameOf(k)], [LW('COMMAND'), commandEl(e.command)], ['REPOSITORY', e.repository], [LW('AFFECTS'), e.affects], [LW('REVERSIBLE'), e.reversible], ['WHY', e.why], ['BLOCKS', e.blocks], ['JOB', e.jobId]]));
    if (e.source === 'file' && !e.owner) {
      body.append(el('p', { class: 'note', text: e.ownerReason }));
      body.append(cmdBox(e.copyCommand, 'Copy this').node);
    } else {
      body.append(el('p', { class: 'note', text: 'I will not do anything until you click, and I will wait as long as you need.' }));
      body.append(el('div', { class: 'row' }, [el('button', Object.assign({ class: 'btn', type: 'button', text: 'Approve', onclick: () => decide('approve') }, e.translating ? { disabled: 'disabled' } : {})), el('button', { class: 'btn', type: 'button', text: 'Deny', onclick: () => decide('deny') })]));
      // Typing an answer does not run the step; your words go to me instead.
      body.append(...ownAnswerBox('Or tell me what to do instead', t => {
        if (e.source === 'permission') act('/permission', { requestId: e.requestId, role: k, decision: 'deny', note: t }, k, e, 'Sent to ' + nameOf(k) + '. The step did not run.');
        else act('/file-answer', { id: e.id, text: t }, k, e, 'Sent to ' + nameOf(e.owner || k) + '.');
      }));
    }
    body.append(el('div', { class: 'row' }, [stepBack(true)]));
    /* The plain words arrive a moment after the card; Approve waits for them. */
    if (e.translating) { const here = body.firstChild; approvalWatch = setInterval(() => { const now = readState().line.find(x => x.id === e.id); if (!now || !here.isConnected) { clearInterval(approvalWatch); return; } if (!now.translating) approvalCard(k, now); }, 500); }
  } });
}
function acceptanceCard(k, e){
  openDialog({ key: k, sub: 'Delivered, waiting for your acceptance', text: e.outcome, onClose: endConvo, build: body => {
    cardExtras(body, e);
    body.append(fieldList([['TASK', e.title], ['JOB', e.jobId], ['PULL REQUEST', e.pr || 'None found in the report']]));
    if (e.ownerAsleep) body.append(el('p', { class: 'note', text: e.owner === k ? 'I am not in a session right now. If you accept, I will reopen my earlier session and finish up.' : nameOf(e.owner) + ' is not in a session right now. If you accept, I will pass this on and they will reopen their earlier session.' }));
    if (e.owner) {
      body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Accept', onclick: () => { stampUse(); act('/accept', { id: e.id }, k, e, 'Accepted ' + e.title + '.'); } })]));
      // Words instead of Accept go to whoever did the work; the delivery keeps waiting for your Accept.
      body.append(...ownAnswerBox('Or tell ' + (e.owner === k ? 'me' : nameOf(e.owner)) + ' what is not right yet', t => act('/send', { role: e.owner, text: t }, k, e, 'Sent to ' + nameOf(e.owner) + '. This stays waiting for your Accept.', { keep: true })));
      body.append(el('p', { class: 'note', text: (e.owner === k ? 'If you press Accept, I will get this message: ' : 'If you press Accept, ' + nameOf(e.owner) + ' will get this message: ') + e.acceptMessage }));
    } else body.append(el('p', { class: 'note', text: e.ownerReason }), cmdBox(e.copyCommand, 'Copy this').node);
    body.append(el('p', { class: 'note', text: DATA.rules.find(r => r.name === 'Acceptance').text }));
    body.append(el('div', { class: 'row' }, [stepBack(true)]));
  } });
}
function reportCard(k, e){
  const intro = e.resumeFailed ? 'I could not be reopened. ' : e.ended ? 'My session has ended. ' : e.fit ? 'I may be the wrong person for this. Here is what I think. ' : '';
  openDialog({ key: k, sub: e.ended ? 'Session ended' : e.fit ? 'Fit check' : 'Reply', text: intro + e.text, onClose: endConvo, build: body => {
    cardExtras(body, e);
    const row = el('div', { class: 'row' });
    if (e.resumeFailed) {
      body.append(el('p', { class: 'note', text: 'If you press Start fresh, I will open a new session. I will not remember the earlier work, but I will get anything that was not delivered. Or you can copy this into Claude Code yourself.' }), cmdBox(e.copyCommand, 'Copy this').node);
      row.append(el('button', { class: 'btn', type: 'button', text: 'Start fresh', onclick: () => act('/fresh', { role: k, id: e.id }, k, e, nameOf(k) + ' has a new session.') }), forgetButton(k, e));
      body.append(...ownAnswerBox('Or start me fresh with these words', t => act('/send', { role: k, text: t }, k, e, nameOf(k) + ' has a new session and your words.', { steps: [['/fresh', { role: k, id: e.id }]] })));
    }
    else if (e.ended) {
      row.append(el('button', { class: 'btn', type: 'button', 'data-autofocus': '', text: 'Got it', onclick: () => act('/dismiss', { role: k, id: e.id }, k, e, nameOf(k) + ' is back at their desk.') }));
      body.append(...ownAnswerBox('Or tell me something', t => act('/dismiss', { role: k, id: e.id }, k, e, 'Sent to ' + nameOf(k) + '.', { steps: [['/send', { role: k, text: t }]] })));
    }
    else {
      const answer = t => act('/answer', { role: k, id: e.id, text: t }, k, e, 'Sent to ' + nameOf(k) + '.');
      if (e.choices && e.choices.length) body.append(optButtons(e.choices.map(c => ({ label: c, fn: () => answer(c) }))));
      body.append(...ownAnswerBox(e.choices && e.choices.length ? 'Or type your own answer' : 'Your answer', answer));
      if (e.acceptMessage) {
        row.append(el('button', { class: 'btn', type: 'button', text: 'Accept', onclick: () => act('/accept', { id: e.id }, k, e, 'Accepted.') }));
        body.append(el('p', { class: 'note', text: 'I think this is delivered. If you press Accept, I will get this message: ' + e.acceptMessage }));
      }
      row.append(el('button', { class: 'btn', type: 'button', text: 'Back to work', onclick: () => act('/dismiss', { role: k, id: e.id }, k, e, nameOf(k) + ' is back at their desk.') }));
      if (e.asleep) row.append(forgetButton(k, e)); else row.append(endSessionButton(k, e));
      if (e.asleep) body.append(el('p', { class: 'note', text: 'I saved this from before the office closed. If you answer, I will reopen my earlier session.' }));
    }
    const lg = legalLine(k); if (lg) body.append(lg);
    body.append(row, el('div', { class: 'row' }, [stepBack(true)]));
  } });
}
function forgetButton(k, e){
  return el('button', { class: 'btn', type: 'button', text: 'End for good', onclick: () => act('/forget', { role: k }, k, e || null, nameOf(k) + ': saved session dropped. Their project files are untouched.') });
}
function pausedCard(k, e){
  openDialog({ key: k, sub: 'Paused work', text: e.interrupted ? 'I was stopped before I could finish my step, so some work may be half done.' : 'I saved my place when the office closed.', onClose: endConvo, build: body => {
    body.append(fieldList([['PROJECT', e.projectName], ['WAS DOING', e.doing]]));
    cardExtras(body, e);
    if (e.lastSaid) body.append(el('h3', { text: 'LAST THING I SAID' }), el('div', { class: 'said', text: e.lastSaid, tabindex: '0' }));
    const others = readState().line.filter(x => x.type === 'paused').length;
    const row = el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Continue', onclick: () => act('/continue', { role: k }, k, e, nameOf(k) + ' is picking the work back up.') })]);
    if (others > 1) row.append(el('button', { class: 'btn', type: 'button', text: 'Continue everyone', onclick: async ev => {
      const b = ev.currentTarget; b.disabled = true;
      const r = await api('/continue-all');
      b.disabled = false;
      if (!r.ok) { toast(r.message); return; }
      onDlgClose = null; dlg.hidden = true; endConvo();
      toast(r.started + ' picking work back up.');
    } }));
    row.append(forgetButton(k, e));
    body.append(row);
    body.append(...ownAnswerBox('Or tell me what to do when I pick it back up', t => act('/continue', { role: k, text: t }, k, e, nameOf(k) + ' is picking the work back up with your words.')));
    body.append(el('p', { class: 'note', text: 'If you press End for good, I will drop my saved session. No project files get deleted.' }));
    body.append(el('div', { class: 'row' }, [stepBack(true)]));
  } });
}
function endSessionButton(k, e){
  return el('button', { class: 'btn', type: 'button', text: 'End this session', onclick: () => act('/end', { role: k }, k, e || null, nameOf(k) + ': session ended.') });
}
function roleMenu(k, keepText){
  const R = ROLE[k]; const live = hasSession(k);
  openDialog({ key: k, text: keepText === false ? '' : R.motto, onClose: endConvo, build: body => {
    body.append(optButtons([
      { label: 'Give a job', fn: () => jobView(k) },
      { label: 'What do you do', fn: () => aboutView(k) },
      { label: 'Show your steps', fn: () => stepsView(k) },
      { label: 'Wrong person', fn: () => wrongView(k) }
    ].concat(live ? [{ label: 'See what I am doing', fn: () => transcriptView(k) }] : [])));
    if (!live && hasSaved(k)) body.append(el('p', { class: 'note', text: 'I have a saved session. If you give me a job, I will reopen it and remember the earlier work.' }));
    body.append(...ownAnswerBox('Say something to me', t => act('/send', { role: k, text: t }, k, null, 'Sent to ' + nameOf(k) + '.')));
    const lg = legalLine(k); if (lg) body.append(lg);
    const row = el('div', { class: 'row' });
    if (live) row.append(endSessionButton(k));
    else if (hasSaved(k)) row.append(forgetButton(k));
    row.append(el('button', { class: 'btn', type: 'button', text: 'Bye (Esc)', onclick: () => closeDialog() }));
    body.append(row);
  } });
}
const LOGWORD = { you: 'YOU', reply: 'REPLY', helper: 'HELPER', tool: 'USING', allowed: 'ROUTINE', held: 'APPROVAL', system: 'OFFICE' };
let transcriptNode = null, transcriptRole = null;
function logLine(item){ return el('div', {}, [el('b', { text: LOGWORD[item.kind] || 'OFFICE' }), document.createTextNode(item.text)]); }
function addLog(item){
  const key = item.project + '|' + item.role;
  (LOGS[key] = LOGS[key] || []).push(item);
  if (LOGS[key].length > 300) LOGS[key].shift();
  if (item.project === STATE.project.id && transcriptRole === item.role && transcriptNode && document.body.contains(transcriptNode)) { transcriptNode.append(logLine(item)); transcriptNode.scrollTop = transcriptNode.scrollHeight; }
}
function transcriptView(k){
  subView(k, 'Here is what I am doing right now.', body => {
    transcriptNode = el('div', { class: 'transcript', tabindex: '0' }, (LOGS[STATE.project.id + '|' + k] || []).map(logLine)); transcriptRole = k;
    body.append(transcriptNode); transcriptNode.scrollTop = transcriptNode.scrollHeight;
  });
}
function subView(k, title, fill){
  dlgText.hidden = false; dlgText.textContent = title; dlgBody.textContent = '';
  fill(dlgBody);
  const lg = legalLine(k); if (lg) dlgBody.append(lg);
  dlgBody.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Back', onclick: () => roleMenu(k, false) }), el('button', { class: 'btn', type: 'button', text: 'Bye (Esc)', onclick: () => closeDialog() })]));
  const f = dlgBody.querySelector('textarea, button'); if (f) f.focus();
}
function jobView(k){
  const R = ROLE[k];
  subView(k, 'What job do you have for me?', body => {
    const ta = el('textarea', { id: 'job-' + k, 'aria-label': 'The job' });
    body.append(el('label', { class: 'lab', for: 'job-' + k, text: 'THE JOB' }), ta);
    if (R.quests.length) { body.append(el('h3', { text: 'IDEAS FOR A JOB' })); body.append(el('div', { class: 'opts' }, R.quests.map(q => el('button', { class: 'mini-btn', type: 'button', text: q.text, onclick: () => { ta.value = q.text; ta.focus(); } })))); }
    if (hasSession(k)) body.append(el('p', { class: 'note', text: 'I already have a session open, so this goes into that same session.' }));
    const give = async ev => {
      const job = ta.value.trim(); if (!job) { ta.focus(); toast('Write the job first, or pick an example.'); return; }
      const b = ev.currentTarget; b.disabled = true;
      const r = await api('/job', { role: k, text: job });
      b.disabled = false;
      if (!r.ok) { toast(r.message); return; }
      onDlgClose = null; dlg.hidden = true; endConvo(); toast(nameOf(k) + ' is on it.');
    };
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Give the job', onclick: give })]));
    ta.focus();
  });
}
function aboutView(k){
  const R = ROLE[k];
  subView(k, R.motto, body => {
    body.append(el('h3', { text: 'OWNS' }), el('ul', { class: 'plain' }, R.owns.map(x => el('li', { text: x }))));
    body.append(el('h3', { text: 'GOOD FOR' }), el('ul', { class: 'plain' }, R.goodFor.map(x => el('li', { text: x }))));
    body.append(fieldList([['CHANGES REPO FILES', R.commits ? 'Yes' : 'No'], ['WORKSPACE', R.workspace || 'None listed'], ['COMMAND', '/sdlc:' + k]]));
  });
}
let stepTimer = 0;
function stepsView(k){
  const R = ROLE[k];
  subView(k, 'Here are my steps, in order.', body => {
    const ol = el('ol', { class: 'steps' }, R.path.map((s, i) => el('li', {}, [el('b', { text: String(i + 1) }), el('span', { text: s })])));
    body.append(ol);
    clearInterval(stepTimer);
    if (!RM) { let i = 0; const lis = ol.children; const tick = () => { if (!document.body.contains(ol)) { clearInterval(stepTimer); return; } Array.from(lis).forEach((li, j) => li.classList.toggle('on', j === i)); blip(400 + i * 60, 0.03); i = (i + 1) % (lis.length + 2); }; tick(); stepTimer = setInterval(tick, 650); }
  });
}
function wrongView(k){
  const R = ROLE[k];
  subView(k, 'Not my job. Here is who to ask instead.', body => {
    R.notFor.forEach(n => {
      const row = el('div', { class: 'row' }, [el('span', { text: n.what })]);
      if (n.go) row.append(el('button', { class: 'btn', type: 'button', text: 'Walk me to ' + nameOf(n.go), onclick: () => { onDlgClose = null; dlg.hidden = true; endConvo(); walkTo(n.go); } }));
      body.append(row);
    });
  });
}
const FIELD_STYLE = 'background:rgba(4,6,40,.55);border:2px solid #8C94D4;border-radius:6px;color:#FCFCFC;font:inherit;padding:4px 8px;min-width:0';
async function runInOffice(ev, what, who, msg){
  const b = ev.currentTarget; b.disabled = true;
  const r = await api('/run', what);
  b.disabled = false;
  if (!r.ok) { toast(r.message); return; }
  closeDialog(); toast(msg);
}
function reviewBox(body){
  const s = readState(), work = s.reviewable || [], started = 'The Architect is running the review. The answer comes to your line.';
  const sizeBox = (id, label, value) => { const n = el('input', { type: 'number', id: id, min: '1', max: '9', 'aria-label': label }); n.value = String(value); n.style.cssText = FIELD_STYLE + ';width:64px'; return n; };
  const seats = sizeBox('rev-seats', 'Reviewers at the table', 2), rounds = sizeBox('rev-rounds', 'Rounds at most', 5);
  const size = () => ({ reviewers: Number(seats.value), rounds: Number(rounds.value) });
  body.append(el('div', { class: 'row' }, [el('label', { class: 'lab', for: 'rev-seats', text: 'REVIEWERS AT THE TABLE' }), seats, el('label', { class: 'lab', for: 'rev-rounds', text: 'ROUNDS AT MOST' }), rounds]), el('p', { class: 'note', text: 'You can leave these alone. More reviewers and rounds catch more, and use more of your Claude usage.' }));
  if (s.reviewing) body.append(el('p', { class: 'note', text: 'Right now the Architect and I are working on this: ' + s.reviewing }));
  else if (s.in_review.length) body.append(el('p', { class: 'note', text: 'Right now I am checking work with ' + s.in_review.map(nameOf).join(', ') + '.' }));
  const ask = el('textarea', { id: 'rev-request', 'aria-label': 'What to check' });
  const askGo = el('button', { class: 'btn', type: 'button', text: 'Check what I typed', onclick: ev => { if (!ask.value.trim()) { ask.focus(); toast('Type what you want checked first.'); return; } runInOffice(ev, { command: 'expert-review', request: ask.value, ...size() }, 'architect', started); } });
  body.append(el('label', { class: 'lab', for: 'rev-request', text: 'TYPE WHAT TO CHECK, OR ADD A NOTE (OPTIONAL)' }), ask, el('div', { class: 'row' }, [askGo]));
  if (work.length) {
    body.append(el('h3', { text: 'OR PICK A TICKET' }), el('p', { class: 'note', text: 'Anything you typed above goes along with the ticket you pick.' }));
    work.forEach(w => body.append(el('div', { class: 'row' }, [el('span', { text: w.title + ' (' + w.state + ')' }), el('button', { class: 'btn', type: 'button', text: 'Check this', onclick: ev => runInOffice(ev, { command: 'expert-review', target: w.target, title: w.title, request: ask.value, ...size() }, 'architect', started) })])));
  } else {
    body.append(el('p', { class: 'note', text: 'Your team has no work I can check yet. Give someone a job, and it will show up here.' }), el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Walk me to the CEO', onclick: () => { closeDialog(); walkTo('ceo'); } })]));
  }
  const Rv = DATA.reviewer, ta = el('input', { type: 'text', id: 'rev-target', 'aria-label': 'Review target', placeholder: 'PR number, branch or path' }); ta.style.cssText = FIELD_STYLE;
  const go = el('button', { class: 'btn', type: 'button', text: 'Start the review with the Architect', onclick: ev => runInOffice(ev, { command: 'expert-review', target: ta.value.trim(), ...size() }, 'architect', started) });
  body.append(el('details', {}, [el('summary', { text: 'For programmers' }),
    fieldList([['TOOLS', Rv.tools], ['MODEL', Rv.model], ['COMMAND', '/sdlc:expert-review']]),
    el('ul', { class: 'plain' }, CMD['expert-review'].args.map(a => el('li', { text: a }))),
    el('p', { class: 'note', text: 'Leave the target empty to review changes in the project folder itself.' + (hasSession('architect') ? ' The Architect already has a session open, so it goes there.' : '') }),
    el('label', { class: 'lab', for: 'rev-target', text: 'TARGET (OPTIONAL)' }), ta, el('div', { class: 'row' }, [go])]));
}
function setupBox(body){
  const repo = el('input', { type: 'text', id: 'setup-repo', 'aria-label': 'GitHub repository', placeholder: 'owner/repo' }); repo.style.cssText = FIELD_STYLE;
  const proj = el('input', { type: 'text', id: 'setup-proj', 'aria-label': 'GitHub project', placeholder: 'number or address' }); proj.style.cssText = FIELD_STYLE;
  const go = el('button', { class: 'btn', type: 'button', text: 'Start setup with the CEO', onclick: ev => runInOffice(ev, { command: 'setup', repo: repo.value.trim(), projectBoard: proj.value.trim() }, 'ceo', 'The CEO is starting setup. Watch the line for their questions.') });
  body.append(el('p', { class: 'note', text: 'The CEO runs this in the current project and asks you questions through the line. Anything that changes GitHub waits for your Approve or Deny.' + (hasSession('ceo') ? ' The CEO already has a session open, so it goes there.' : '') }));
  body.append(el('label', { class: 'lab', for: 'setup-repo', text: 'REPOSITORY (OPTIONAL)' }), repo, el('label', { class: 'lab', for: 'setup-proj', text: 'GITHUB PROJECT (OPTIONAL)' }), proj, el('div', { class: 'row' }, [go]));
}
function reviewerMenu(k){
  openDialog({ key: k, sub: 'Review Room', text: 'I’m a second pair of eyes. Your team already sends me every change before they deliver it, so you only need me for an extra look. Pick a ticket, or type what you want checked. I’ll find the mistakes, the Architect will fix what’s real, and the answer comes to your line.', build: body => {
    reviewBox(body);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Bye (Esc)', onclick: () => closeDialog() })]));
  } });
}

/* ================= Object cards ================= */
function cmdCard(key, label, id){
  if (key === 'expert-review') { reviewerMenu('rev1'); return; }
  if (key === 'stop') { alarmCard(); return; }
  if (key === 'resume') { clockCard(); return; }
  if (key === 'transfer') { elevatorCard(); return; }
  const c = CMD[key];
  openDialog({ name: label, sub: '/sdlc:' + key + '', text: c.does, build: body => {
    body.append(fieldList([['COMMAND', '/sdlc:' + key + (c.hint ? ' ' + c.hint : '')]]));
    body.append(el('ul', { class: 'plain' }, c.args.map(a => el('li', { text: a }))));
    if (key === 'setup') setupBox(body);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]));
  } });
}
const closeRow = () => el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]);
async function runCommand(ev, what, msg){
  const b = ev.currentTarget; b.disabled = true;
  const r = await api('/command', what);
  b.disabled = false;
  if (!r.ok) { toast(r.message); return; }
  closeDialog(); toast(msg);
}
const cmdBtn = (text, what, msg) => el('button', { class: 'btn', type: 'button', text: text, onclick: ev => runCommand(ev, what, msg) });
/* Stopping right now can leave work half done, so it asks once more. */
function glassBtn(text, what, msg){
  return el('button', { class: 'btn', type: 'button', text: text, onclick: ev => {
    const row = ev.currentTarget.closest('.row');
    row.replaceChildren(el('span', { text: 'This stops right now, so some work may be left half done.' }), cmdBtn('Yes, stop right now', what, msg), el('button', { class: 'btn', type: 'button', text: 'No', onclick: alarmCard }));
  } });
}
function alarmCard(){
  const s = readState(), jobs = s.jobs.filter(j => j.status === 'active' && j.ownerAlive);
  openDialog({ name: 'Red stop alarm', sub: 'Stop work', text: 'Press the button and people finish the step they are on, save their place, and stop. Break the glass and they stop this instant.', build: body => {
    body.append(el('h3', { text: 'EVERYONE IN THIS PROJECT' }));
    if (s.sessions.length) body.append(el('div', { class: 'row' }, [cmdBtn('Press the button', { command: 'stop', everyone: true }, 'Everyone is finishing their step, then stopping.'), glassBtn('Break the glass', { command: 'stop', everyone: true, mode: 'now' }, 'Everyone is stopping now.')]));
    else body.append(el('p', { class: 'note', text: 'Nobody is working right now.' }));
    jobs.forEach(j => {
      body.append(el('h3', { text: j.goal.toUpperCase() }), el('div', { class: 'row' }, [cmdBtn('Press the button', { command: 'stop', jobId: j.id }, 'That job is finishing its step, then stopping.'), glassBtn('Break the glass', { command: 'stop', jobId: j.id, mode: 'now' }, 'That job is stopping now.')]));
      j.tasks.filter(t => t.ticket && !['done', 'delivered', 'stopped'].includes(t.desk)).forEach(t => body.append(el('div', { class: 'row' }, [el('span', { text: t.task }), cmdBtn('Stop just this ticket', { command: 'stop', jobId: j.id, ticket: t.ticket }, 'That ticket is stopping. The rest of the job keeps going.')])));
    });
    body.append(closeRow());
  } });
}
function clockCard(){
  const s = readState(), jobs = s.jobs.filter(j => j.status === 'stopped' || j.status === 'transferred' || j.tasks.some(t => t.desk === 'stopped'));
  openDialog({ name: 'Time clock', sub: 'Pick stopped work back up', text: 'Each stopped job has a time card. Punch back in and the same worker carries on where they left off. New shift brings in a fresh worker, who takes over from the notes.', build: body => {
    const paused = s.line.filter(e => e.type === 'paused').length;
    if (!jobs.length && !paused) body.append(el('p', { class: 'note', text: 'There are no time cards, because nothing is stopped.' }));
    if (jobs.length + paused > 1) body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Punch everyone back in', onclick: async ev => { if (paused) { const c = await api('/continue-all', {}); if (!c.ok) { toast(c.message); return; } } if (jobs.length) { runCommand(ev, { command: 'resume', everyone: true }, 'Everyone is picking their work back up.'); return; } closeDialog(); toast('Everyone is picking their work back up.'); } })]));
    if (paused) body.append(el('p', { class: 'note', text: paused + (paused === 1 ? ' person is' : ' people are') + ' also waiting in line with paused work from when the office closed.' }));
    jobs.forEach(j => {
      body.append(el('h3', { text: j.goal.toUpperCase() }), el('div', { class: 'row' }, [cmdBtn('Punch back in', { command: 'resume', jobId: j.id }, 'That job is picking back up.'), cmdBtn('New shift', { command: 'resume', jobId: j.id, mode: 'fresh' }, 'A fresh worker is taking over.')]));
      j.tasks.filter(t => t.ticket && t.desk === 'stopped').forEach(t => body.append(el('div', { class: 'row' }, [el('span', { text: t.task }), cmdBtn('Punch back in', { command: 'resume', jobId: j.id, ticket: t.ticket }, 'That ticket is picking back up.'), cmdBtn('New shift', { command: 'resume', jobId: j.id, ticket: t.ticket, mode: 'fresh' }, 'A fresh worker is taking over.')])));
    });
    body.append(closeRow());
  } });
}
function elevatorCard(){
  const s = readState(), leaving = s.jobs.filter(j => j.status === 'active' && j.owner), left = s.jobs.filter(j => j.status === 'transferred');
  openDialog({ name: 'Elevator', sub: 'Hand off work', text: 'Handing off stops the work and writes a note that lets another session pick it up. Another floor means on this computer, with a short note. Another building means anywhere, with a full note.', build: body => {
    if (!leaving.length && !left.length) body.append(el('p', { class: 'note', text: 'There is no job to hand off right now.' }));
    leaving.forEach(j => {
      body.append(el('h3', { text: j.goal.toUpperCase() }), el('div', { class: 'row' }, [cmdBtn('Another floor', { command: 'transfer', jobId: j.id, mode: 'same-machine' }, 'That job is stopping and writing its handoff.'), cmdBtn('Another building', { command: 'transfer', jobId: j.id }, 'That job is stopping and writing its handoff.')]));
      j.tasks.filter(t => t.ticket && !['done', 'delivered'].includes(t.desk)).forEach(t => body.append(el('div', { class: 'row' }, [el('span', { text: t.task }), cmdBtn('Just this ticket', { command: 'transfer', jobId: j.id, ticket: t.ticket }, 'That ticket is stopping and writing its handoff.')])));
    });
    left.forEach(j => {
      body.append(el('h3', { text: 'HANDED OFF: ' + j.goal.toUpperCase() }));
      if (j.handoff) body.append(el('div', { class: 'said', text: j.handoff, tabindex: '0' }));
      else body.append(el('p', { class: 'note', text: 'The note is still being written.' }));
      const row = el('div', { class: 'row' }, [cmdBtn('Bring it back up', { command: 'resume', jobId: j.id }, 'That job is picking back up here.')]);
      if (j.handoff) row.append(el('button', { class: 'btn', type: 'button', text: 'Copy the note', onclick: async () => { try { await navigator.clipboard.writeText(j.handoff); toast('Copied.'); } catch { toast('The browser would not copy it. Select the note and copy it yourself.'); } } }));
      body.append(row);
    });
    body.append(closeRow());
  } });
}
function stampCard(){
  const jobs = readState().jobs.filter(j => j.tasks.some(t => t.desk === 'delivered'));
  openDialog({ name: 'Rubber stamp', sub: 'Accept a whole job at once', text: 'Stamp a job and you accept everything in it that was delivered, and the team cleans up after it. To accept one thing at a time, call people in from the line.', build: body => {
    if (!jobs.length) body.append(el('p', { class: 'note', text: 'Nothing is waiting for your stamp.' }));
    jobs.forEach(j => {
      const ready = j.tasks.filter(t => t.desk === 'delivered');
      body.append(el('h3', { text: j.goal.toUpperCase() }), el('ul', { class: 'plain' }, ready.map(t => el('li', { text: t.task }))), el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Stamp it accepted', onclick: async ev => {
        const b = ev.currentTarget; b.disabled = true;
        const r = await api('/accept-job', { jobId: j.id });
        b.disabled = false;
        if (!r.ok) { toast(r.message); return; }
        stampUse(); closeDialog(); toast('Accepted ' + r.count + (r.count === 1 ? ' delivery.' : ' deliveries.'));
      } })]));
    });
    body.append(closeRow());
  } });
}
const TH_WORDS = {
  low: { you: 'Every question comes to you.', team: 'The team decides nothing on its own.' },
  medium: { you: 'Everything comes to you except small things with few consequences.', team: 'The team decides the small things and tells you what it chose.' },
  high: { you: 'Big direction comes to you: creative choices, lasting design, trade-offs.', team: 'The team decides small things and moderate things that can be undone, and tells you what it chose.' },
  critical: { you: 'Only what must be yours comes to you: approvals, anything that cannot be undone, security, data loss, publishing and changes of scope.', team: 'The team decides everything else and tells you what it chose.' }
};
function thresholdPicker(body, again){
  const now = readState().job.threshold;
  THS.forEach((t, i) => body.append(el('div', { class: 'row' }, [
    el('button', { class: 'btn', type: 'button', 'data-num': String(i + 1), 'aria-pressed': String(now === t), text: (i + 1) + ' ' + t.toUpperCase(), onclick: () => { setThreshold(t).then(again); } }),
    el('span', { text: TH_WORDS[t].you })
  ])));
  body.append(el('p', { class: 'note', text: 'Set to ' + now.toUpperCase() + ': ' + TH_WORDS[now].you + ' ' + TH_WORDS[now].team + ' Approvals and anything critical always come to you. This is one setting for all your projects, and anyone with a job running hears about a change right away.' }));
}
function dialCard(){
  openDialog({ name: 'Threshold dial', sub: 'What comes to you, and what the team decides', text: '', build: body => {
    thresholdPicker(body, dialCard);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]));
  } });
}
async function settingsCard(){
  const r = await api('/settings-get', {});
  if (!r.ok) { toast(r.message); return; }
  const v = r.settings;
  openDialog({ name: 'Settings', sub: 'How you and your team work', text: '', build: body => {
    const box = (id, label, note, value) => { const n = el('textarea', { id: id, 'aria-label': label }); n.value = value; body.append(el('label', { class: 'lab', for: id, text: label.toUpperCase() }), el('p', { class: 'note', text: note }), n); return n; };
    const line = (id, label, note, value, kind) => { const n = el('input', { type: kind, id: id, 'aria-label': label }); n.value = value; n.style.cssText = FIELD_STYLE; body.append(el('label', { class: 'lab', for: id, text: label.toUpperCase() }), el('p', { class: 'note', text: note }), n); return n; };
    body.append(el('h3', { text: 'YOU' }), el('p', { class: 'note', text: 'The team talks to you at this level. It changes wording only, never what needs your approval.' }));
    const picker = window.SDLCHelp.levelPicker('settings'); picker.id = 'settings-level'; body.append(picker);
    const mentorOn = readState().player && readState().player.mentor;
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', id: 'hl-mentor-toggle', 'data-hl': 'toggleMentor', 'aria-pressed': String(!!mentorOn), text: mentorOn ? 'Mentor on' : 'Mentor off' })]));
    body.append(el('h3', { text: 'WHAT COMES TO YOU' }));
    const dial = el('div', {}); const showDial = () => { dial.textContent = ''; thresholdPicker(dial, showDial); }; showDial(); body.append(dial);
    body.append(el('h3', { text: 'WHAT COUNTS AS YOURS' }), el('p', { class: 'note', text: 'Your own GitHub account always counts. The plugin needs no approval to write to what is listed here, but the office still asks you before anyone touches something outside the project they are working on.' }));
    const users = box('set-users', 'Other accounts of yours', 'One per line.', v.users.join('\n'));
    const orgs = box('set-orgs', 'Your organizations', 'One per line.', v.orgs.join('\n'));
    const repos = box('set-repos', 'Other repositories that count as yours', 'One per line, as owner/repo.', v.repos.join('\n'));
    body.append(el('h3', { text: 'YOUR TEAM' }));
    const places = line('set-places', 'Where legal work applies', 'Countries or states, such as US-ID, EU. If this is empty, the legal team asks you first.', v.jurisdictions, 'text');
    const span = line('set-span', 'Tasks one lead handles at a time', 'A bigger job splits into groups this size, each with its own lead.', String(v.span), 'number');
    const orders = box('set-orders', 'Standing orders', 'Anything every person on the team should always follow. One per line.', v.orders.join('\n'));
    const save = el('button', { class: 'btn next', type: 'button', text: 'Save', onclick: async () => {
      save.disabled = true;
      const sr = await api('/settings', { users: users.value, orgs: orgs.value, repos: repos.value, jurisdictions: places.value, span: Number(span.value), orders: orders.value });
      save.disabled = false;
      if (!sr.ok) { toast(sr.message); return; }
      toast('Saved. The team uses these from their next job.'); closeDialog();
    } });
    body.append(el('div', { class: 'row' }, [save, el('button', { class: 'btn', type: 'button', text: 'Close without saving (Esc)', onclick: () => closeDialog() })]));
  } });
}
const TICKET_WORD = { issue: 'Issue', pr: 'Pull request', draft: 'Draft', task: 'Job task' };
function ticketLabel(t){ return (t.number ? '#' + t.number + ' ' : '') + t.title; }
function boardCard(which){
  openDialog({ name: 'Ticket board', sub: 'Everything in this project', text: '', build: async body => {
    const wait = el('p', { class: 'note', role: 'status', text: 'Reading GitHub...' }); body.append(wait);
    const r = await api('/board', which ? { board: which } : {});
    if (!body.isConnected || !wait.isConnected) return;
    wait.remove();
    if (!r.ok) { body.append(el('p', { class: 'note', text: r.message }), closeRow()); return; }
    if (r.boards.length > 1) body.append(el('div', { class: 'row' }, r.boards.map(b => el('button', { class: 'btn', type: 'button', 'aria-pressed': String(b.number === r.board), text: b.title, onclick: () => boardCard(b.number) }))));
    else if (r.boards.length === 1) body.append(el('p', { class: 'note', text: 'GitHub project: ' + r.boards[0].title }));
    if (r.message) body.append(el('p', { class: 'note', text: r.message }));
    if (r.signIn) body.append(githubSignIn());
    const detail = el('div', {});
    const show = t => {
      detail.textContent = '';
      const peeps = t.people.join(', ') + (t.who ? (t.people.length ? '; ' : '') + t.who : '');
      detail.append(el('h3', { text: ticketLabel(t).toUpperCase() }), fieldList([['KIND', TICKET_WORD[t.kind]], ['COLUMN', t.column], ['STATE', t.state], ['WHO', peeps], ['LABELS', t.labels.join(', ')], ...Object.keys(t.fields).filter(f => f !== 'Status').map(f => [f.toUpperCase(), t.fields[f]])]));
      if (t.url) detail.append(el('div', { class: 'row' }, [el('a', { class: 'btn', href: t.url, target: '_blank', rel: 'noopener noreferrer', text: 'Open on GitHub' })]));
      if (t.number && (t.kind === 'issue' || t.kind === 'pr')) {
        const text = el('div', { class: 'said', tabindex: '0', text: 'Reading...' }); detail.append(text);
        api('/ticket', { number: t.number, kind: t.kind }).then(d => { text.textContent = d.ok ? (d.body || 'This ticket has no description.') : d.message; });
      }
    };
    body.append(el('div', { class: 'cols' }, r.columns.map(c => {
      const list = r.items.filter(t => t.column === c);
      return el('div', { class: 'col' }, [el('h3', { text: c.toUpperCase() + ' (' + list.length + ')' })].concat(list.length ? list.map(t => el('button', { class: 'card', type: 'button', text: ticketLabel(t), onclick: () => show(t) })) : [el('div', { class: 'note', text: 'Empty' })]));
    })), detail);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Refresh', onclick: () => boardCard(which) }), el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]));
  } });
}
function orgCard(){
  openDialog({ name: 'Org chart', sub: 'Pick anyone to walk over', text: DATA.rules.find(r => r.name === 'Large jobs').text, build: body => {
    const g = el('div', { class: 'dept' });
    ['leadership', 'technology', 'marketing', 'legal', 'product'].forEach(t => {
      const col = el('div', { class: 'col' }); const h = el('h3', { text: DEPT[t].name.toUpperCase() }); h.style.color = DEPT[t].color; col.append(h);
      DATA.roles.filter(r => r.tree === t).forEach(r => col.append(el('button', { class: 'mini-btn', type: 'button', text: fullNameOf(r.key) + (r.conducts ? ' (lead)' : ''), onclick: () => { closeDialog(); walkTo(r.key); } })));
      g.append(col);
    });
    body.append(g);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]));
  } });
}
function inboxPaper(after, closeLabel, onlyJob){
  const openJobs = readState().jobs, notes = readState().decided.filter(d => !onlyJob || d.jobId === onlyJob);
  const fresh = new Set(notes.filter(d => !notesSeen.has(d.id)).map(d => d.id));
  const firstNew = notes.findIndex(d => fresh.has(d.id));
  let i = firstNew >= 0 ? firstNew : 0;
  const markAll = () => { notes.forEach(d => notesSeen.add(d.id)); };
  openDialog({ name: 'Inbox', sub: 'Decided on your behalf, below the threshold', text: '', onClose: after ? () => { markAll(); refreshHud(); after(); } : refreshHud, build: body => {
    const close = el('button', { class: 'btn', type: 'button', 'data-autofocus': '', text: closeLabel || 'Close', onclick: () => closeDialog() });
    const held = openJobs.find(j => j.id === onlyJob);
    const cond = (held && held.owner) || readState().job.conductor;
    const line = el('p', { class: 'note', text: openCount() + ' waiting in the line.' });
    const acts = el('div', { class: 'row' }, [
      el('button', { class: 'btn next', type: 'button', text: 'Call the next one in', onclick: () => { markAll(); onDlgClose = refreshHud; closeDialog(); callNext(); } }),
      el('button', { class: 'btn', type: 'button', text: 'Ask ' + nameOf(cond) + ' to check the inbox', onclick: async () => { const r = await api('/send', { role: cond, text: onlyJob ? '/sdlc:inbox ' + onlyJob : inboxCmd() }); toast(r.ok ? nameOf(cond) + ' is checking the inbox.' : r.message); if (r.ok) closeDialog(); } })
    ]);
    if (openJobs.length > 1) body.append(el('div', { class: 'row', role: 'group', 'aria-label': 'One job at a time' }, [{ id: '', goal: 'All jobs' }].concat(openJobs).map(j => el('button', { class: 'mini-btn', type: 'button', 'aria-pressed': String((onlyJob || '') === j.id), text: j.goal.length > 40 ? j.goal.slice(0, 40) + '...' : j.goal, onclick: () => { onDlgClose = null; dlg.hidden = true; inboxPaper(after, closeLabel, j.id); } }))));
    if (!notes.length) { body.append(el('p', { class: 'note', text: 'The inbox is empty.' }), line, el('div', { class: 'row' }, [close]), acts); return; }
    const head = el('div', { class: 'paper-h' }), txt = el('p', { class: 'paper-t' }), cnt = el('div', { class: 'paper-n' }), extra = el('div', {});
    const back = el('button', { class: 'btn', type: 'button', 'data-prev': '1', text: 'Back' });
    const next = el('button', { class: 'btn', type: 'button', 'data-next': '1', text: 'Next' });
    const reply = replyBtn(() => notes[i].by);
    const show = () => { const old = body.querySelector('.reply-box'); if (old) old.remove(); const d = notes[i]; head.textContent = 'From: ' + nameOf(d.by); txt.textContent = d.text; extra.textContent = ''; cardExtras(extra, d); cnt.textContent = 'Note ' + (i + 1) + ' of ' + notes.length + (fresh.has(d.id) ? ' · NEW' : ''); back.disabled = i === 0; next.disabled = i === notes.length - 1; reply.hidden = !hasSession(d.by); notesSeen.add(d.id); refreshHud(); };
    back.addEventListener('click', () => { if (i > 0) { i--; show(); blip(440); } });
    next.addEventListener('click', () => { if (i < notes.length - 1) { i++; show(); blip(560); } });
    body.append(el('div', { class: 'paper' }, [head, txt, cnt]), extra, el('div', { class: 'row' }, [back, next, reply, close]), line, acts);
    show();
  } });
}
async function chooseProject(p){
  closeDialog();
  if (p.current) return;
  const r = await api('/project', { id: p.id });
  if (!r.ok) toast(r.message);
}
/* GitHub sign-in, offered right where it is needed. The code goes in on GitHub's own page; the office never sees a password. */
function githubSignIn(){
  const g = readState().github;
  if (g && g.missing) return el('p', { class: 'note', text: 'The GitHub tool was not found on this computer, so nobody here can reach GitHub.' });
  const status = el('div', { role: 'status' });
  const go = el('button', { class: 'btn', type: 'button', text: 'Sign in to GitHub', onclick: async () => {
    go.disabled = true; status.textContent = '';
    const r = await api('/gh-signin', {});
    if (!r.ok) { status.append(el('p', { class: 'note', text: r.message })); go.disabled = false; return; }
    const link = el('a', { class: 'btn', text: 'Open GitHub', href: /^https:\/\/github\.com\//.test(r.url) ? r.url : 'https://github.com/login/device', target: '_blank', rel: 'noopener noreferrer' });
    const note = el('p', { class: 'note', text: 'Type the code on that page and approve. This card notices when you are done.' });
    status.append(el('p', { text: 'Your one-time code: ' + r.code }), el('div', { class: 'row' }, [link]), note);
    const watch = setInterval(() => {
      const s = readState();
      if (!status.isConnected) { clearInterval(watch); return; }
      if (s.github && s.github.signedIn) { clearInterval(watch); note.textContent = 'Signed in to GitHub.'; }
      else if (s.signin && s.signin.status === 'failed') { clearInterval(watch); note.textContent = s.signin.message; go.disabled = false; }
    }, 1000);
  } });
  return el('div', {}, [el('div', { class: 'row' }, [go]), status]);
}
function githubCard(){
  openDialog({ name: 'GitHub sign-in', sub: 'Nobody here can reach GitHub yet', text: 'The office cannot find a GitHub sign-in on this computer, so nobody can read from GitHub or send work to it. Nothing is asked of GitHub until you press the button.', build: body => { body.append(githubSignIn()); } });
}
function projectsCard(){
  openDialog({ name: 'File cabinet', sub: 'Choose the project you are working on', text: '', build: body => {
    body.append(optButtons(readState().projects.map(p => ({ label: p.name + (p.current ? ' (current)' : '') + ' \u00b7 ' + (p.missing ? 'folder missing' : p.hasJob ? p.goal : 'no active job') + ' \u00b7 ' + p.waiting + ' waiting', fn: () => chooseProject(p) }))));
    const inp = el('input', { type: 'text', id: 'proj-new', 'aria-label': 'New project, owner/repo', placeholder: 'owner/repo' }); inp.style.cssText = 'background:rgba(4,6,40,.55);border:2px solid #8C94D4;border-radius:6px;color:#FCFCFC;font:inherit;padding:4px 8px';
    const box = cmdBox('/sdlc:setup', 'Set it up for real'); box.node.hidden = true;
    const status = el('p', { class: 'note', role: 'status' });
    let checkT = 0, checkN = 0;
    inp.addEventListener('input', () => {
      const v = inp.value.trim(); box.input.value = ('/sdlc:setup ' + v).trim(); box.node.hidden = true; status.textContent = '';
      clearTimeout(checkT); const n = ++checkN;
      if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_][A-Za-z0-9._-]{0,99}$/.test(v)) return;
      checkT = setTimeout(async () => {
        const r = await api('/project-check', { repo: v });
        if (n !== checkN) return;
        status.textContent = r.message; box.node.hidden = !(r.ok && !r.exists);
      }, 500);
    });
    const add = el('button', { class: 'btn', type: 'button', text: 'Add drawer', onclick: async () => {
      const v = inp.value.trim(); checkN++; clearTimeout(checkT);
      add.disabled = true; status.textContent = 'Checking GitHub, then copying the project here. This can take a minute.';
      const r = await api('/project-add', { repo: v });
      add.disabled = false;
      if (!r.ok) { status.textContent = r.message; box.node.hidden = !r.missing; inp.focus(); return; }
      if (!document.body.contains(add)) return;
      STATE.projects = r.projects; toast('Added ' + v + '. Pick its drawer to work there.'); projectsCard();
    } });
    body.append(el('h3', { text: 'ADD A PROJECT' }), el('label', { class: 'lab', for: 'proj-new', text: 'OWNER/REPO' }), inp, el('div', { class: 'row' }, [add]), status, box.node);
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close', onclick: () => closeDialog() })]));
  } });
}
function closeOfficeCard(){
  const s = readState(); const n = s.workTotal;
  openDialog({ name: 'Close Office', sub: 'Stops the helper', text: n ? n + (n === 1 ? ' person has' : ' people have') + ' work going. They will finish their current step and save their place, then the office closes by itself within about 2 minutes. Next time, they wait in line so you can continue.' : 'This closes the office. Anyone with a saved session can be reopened next time.', build: body => {
    body.append(el('div', { class: 'row' }, [
      el('button', { class: 'btn', type: 'button', 'data-autofocus': '', text: 'Keep it open', onclick: () => closeDialog() }),
      el('button', { class: 'btn', type: 'button', text: 'Close Office', onclick: async () => {
        closedByYou = true;
        const r = await api('/close');
        if (!r.ok) { closedByYou = false; toast(r.message); return; }
        closeDialog();
        LEAVING = true;
        if (r.waiting) return;
        if (es) es.close();
        walkOutThen(() => goOffline('OFFICE CLOSED', 'The office is closed and every session has stopped. You can close this tab.'));
      } })
    ]));
  } });
}
function renderClosing(){
  const c = readState().closing; const box = document.getElementById('closing');
  box.hidden = !c; document.body.classList.toggle('closing', !!c);
  if (!c) return;
  const left = c.remaining.length;
  const names = c.remaining.map(w => nameOf(w.role)).join(', ');
  document.getElementById('closing-text').textContent = 'People are finishing their current step. ' + left + ' of ' + c.total + ' still going' + (left ? ': ' + names : '') + '. The office closes by itself ' + (c.secondsLeft > 60 ? 'in about ' + Math.ceil(c.secondsLeft / 60) + ' minutes' : 'in ' + c.secondsLeft + ' seconds') + ' at the latest.';
  const held = c.remaining.filter(w => w.held).map(w => nameOf(w.role));
  const heldEl = document.getElementById('closing-held');
  heldEl.textContent = held.length ? held.join(', ') + ' cannot finish until you approve or deny what they asked. Press Next to decide, or leave it and the request is dropped when the office closes.' : '';
  heldEl.hidden = !held.length;
}
document.getElementById('b-closenow').addEventListener('click', async ev => {
  ev.currentTarget.disabled = true; closedByYou = true;
  const r = await api('/close-now');
  ev.currentTarget.disabled = false;
  if (!r.ok) { toast(r.message); return; }
  if (es) es.close();
  walkOutThen(() => goOffline('OFFICE CLOSED', 'The office is closed and every session has stopped. You can close this tab.'));
});
function helpCard(){
  openDialog({ name: 'How to play', sub: 'SDLC Office', text: 'You run the plugin. Roles that need you wait in The Line outside your door.', build: body => {
    body.append(el('ul', { class: 'plain' }, ['Arrow keys or WASD: walk', 'E, Space or Enter: talk or use', 'M: full map. Click any dot on the minimap to go straight to that person.', 'Esc: close', '1 to 9: pick a numbered answer'].map(t => el('li', { text: t }))));
    body.append(el('h3', { text: 'HOUSE RULES FROM THE PLUGIN' }), el('ul', { class: 'plain' }, DATA.rules.map(r => el('li', { text: r.name + ': ' + r.text }))));
    body.append(el('p', { class: 'note', text: 'Giving a job, answering, approving and accepting all go straight to the live sessions. Routine actions run on their own; anything else waits for your Approve or Deny. The file cabinet in your office switches projects, and sessions keep running when you switch. In your office, the red alarm stops work, the time clock picks it back up, the elevator hands it off, and the rubber stamp on your desk accepts a whole job. The blueprint table in the conference room runs setup, and the Review Room runs expert review.' }));
    body.append(el('div', { class: 'row' }, [el('button', { class: 'btn', type: 'button', text: 'Close (Esc)', onclick: () => closeDialog() })]));
  } });
}

