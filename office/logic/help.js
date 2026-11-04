/* Logic: talks to Claude and runs the game. A new design does not touch this file. */
(function(){
'use strict';
/* ---------- Local tables: no Claude calls here ---------- */
const HELP_DATA = {
  levels: [
    { id: 'owner', name: 'Business Owner', tip: 'New to This', voice: 'Use everyday words only. No technical terms; if one is unavoidable, explain it in the same sentence.' },
    { id: 'manager', name: 'Manager', tip: 'Know the Basics', voice: 'Plain words. Common terms like release or bug are fine; explain anything deeper.' },
    { id: 'lead', name: 'Tech Lead', tip: 'Comfortable with Code', voice: 'Technical terms are fine. Keep it brief and concrete.' },
    { id: 'engineer', name: 'Engineer', tip: 'Programmer', voice: 'Speak like to a fellow programmer: precise, technical, no hand-holding.' }
  ],
  terms: {
    'pull request': 'A bundle of proposed changes, waiting for someone to check and accept it.',
    'release': 'A finished version of the app that people can get and use.',
    'repository': 'The project’s folder of code and its history, kept on GitHub.',
    'merge': 'Folding finished changes into the main copy of the code.',
    'pagination': 'Splitting a long list into pages.',
    'endorsement': 'A public statement that someone backs your product.',
    'threshold': 'The line that decides which questions come to you and which the CEO decides for you.',
    'migration': 'A planned change to how stored information is organized.',
    'acceptance criteria': 'The checklist that says when a task counts as done.',
    'deploy': 'Put a new version where people can reach it.',
    'ADR': 'A short written record of a technical decision and why it was made.',
    'CI': 'Automatic checks that run every time the code changes.',
    'commit': 'A saved step in the project\u2019s history.',
    'branch': 'A side copy of the code where a change is made safely.',
    'push': 'Send saved work up to GitHub.',
    'force push': 'Overwrite what is on GitHub. This can erase other work.',
    'issue': 'A numbered to-do or problem report on GitHub.',
    'workflow': 'An automatic job GitHub runs for the project.',
    'bug': 'Something in the app that does not work as it should.'
  },
  mentor: {
    approval: 'Approvals are for things that can’t be undone. Read the Reversible line first. Deny is always the safe choice.',
    question: 'A question card means work is waiting on you. The recommended answer is usually a safe pick.',
    acceptance: 'Approving says the job is done to your satisfaction. Deny sends it back for another try.',
    fit: 'You asked someone who isn’t the best fit. Sending it to the better fit is usually right.',
    role: 'Give jobs in plain words. The team turns them into a command for you.',
    meeting: 'This meeting plans the work and does none of it. Say what you want. The CEO sends it to the right person, and they answer you. Use a name to talk to someone directly.',
    office: 'People waiting in the hall need you. Click one to call them in, or press Next.'
  }
};
const $ = id => document.getElementById(id);
const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const G = window.SDLC;
let level = 'manager', mentorOn = false, pop = null, mentorSeen = {};
function syncPlayer(){ const p = G.state().player; if (!p) return; const was = level; level = p.level; mentorOn = p.mentor; if (was !== level) document.querySelectorAll('.hl-level').forEach(b => b.setAttribute('aria-checked', String(b.dataset.arg === level))); }
const lvl = () => HELP_DATA.levels.find(l => l.id === level) || HELP_DATA.levels[1];

/* ---------- One small function per button ---------- */
const HELP_ACTIONS = {
  setLevel(id){ if (!HELP_DATA.levels.some(l => l.id === id)) return; level = id; document.querySelectorAll('.hl-level').forEach(b => b.setAttribute('aria-checked', String(b.dataset.arg === id))); G.api('/player', { level: id }).then(r => { if (r.ok) { mentorOn = r.player.mentor; const st = G.state(); st.player = r.player; syncMentorBtn(); if (!$('settings-level')) G.closeCard(); G.refresh(); } else G.toast(r.message); }); },
  toggleMentor(){ mentorOn ? HELP_ACTIONS.mentorOff() : HELP_ACTIONS.mentorOn(); },
  mentorOff(){ mentorOn = false; G.api('/player', { mentor: false }); $('hl-mentor').hidden = true; syncMentorBtn(); },
  mentorOn(){ mentorOn = true; G.api('/player', { mentor: true }); syncMentorBtn(); },
  hideMentor(){ $('hl-mentor').hidden = true; },
  explainToggle(btn){ const row = btn.nextElementSibling; const open = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', String(open)); row.hidden = !open; if (open) row.querySelector('button').focus(); },
  explainSimpler(btn){ explainAgain(btn, 'simpler'); },
  explainTechnical(btn){ explainAgain(btn, 'technical'); },
  explainOriginal(btn){ const tgt = targetOf(btn); if (!tgt || tgt.dataset.orig == null) return; setText(tgt, tgt.dataset.orig); delete tgt.dataset.orig; markVersion(btn, ''); },
  showTerm(btn){ showTerm(btn); }
};
document.addEventListener('click', ev => { const b = ev.target.closest('[data-hl]'); if (b) { const a = b.dataset.hl; if (a === 'setLevel') HELP_ACTIONS.setLevel(b.dataset.arg); else if (HELP_ACTIONS[a]) HELP_ACTIONS[a](b); return; } if (pop && !ev.target.closest('.hl-pop')) closePop(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (pop) { ev.stopPropagation(); closePop(); } } }, true);

/* level picker, used on New Game and in the office */
function levelPicker(where){
  const g = document.createElement('div'); g.className = 'hl-levels'; g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', 'Your level');
  HELP_DATA.levels.forEach(l => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hl-level'; b.setAttribute('role', 'radio'); b.dataset.hl = 'setLevel'; b.dataset.arg = l.id; b.setAttribute('aria-checked', String(l.id === level));
    const tid = 'hl-tip-' + where + '-' + l.id; b.setAttribute('aria-describedby', tid);
    const n = document.createElement('span'); n.textContent = l.name; const t = document.createElement('span'); t.className = 'hl-tip'; t.id = tid; t.setAttribute('role', 'tooltip'); t.textContent = l.tip;
    b.append(n, t); g.append(b);
  });
  g.addEventListener('keydown', ev => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(ev.key) < 0) return; ev.preventDefault(); ev.stopPropagation(); const bs = Array.from(g.children); let i = bs.indexOf(document.activeElement); i = (i + (ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length; bs[i].focus(); HELP_ACTIONS.setLevel(bs[i].dataset.arg); });
  return g;
}
/* plain meanings for technical words */
const termList = Object.keys(HELP_DATA.terms).sort((a, b) => b.length - a.length);
const termRe = new RegExp('\\b(' + termList.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi');
function markTerms(el){
  if (!el || level === 'engineer') return;
  const text = el.textContent; termRe.lastIndex = 0; if (!termRe.test(text)) return; termRe.lastIndex = 0;
  const frag = document.createDocumentFragment(); let last = 0, m;
  while ((m = termRe.exec(text))) {
    frag.append(text.slice(last, m.index));
    const key = termList.find(t => t.toLowerCase() === m[0].toLowerCase());
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hl-term'; b.dataset.hl = 'showTerm'; b.dataset.term = key; b.setAttribute('aria-expanded', 'false'); b.title = 'Tap for the plain meaning'; b.textContent = m[0];
    frag.append(b); last = m.index + m[0].length;
  }
  frag.append(text.slice(last)); el.replaceChildren(frag);
}
function showTerm(btn){
  const same = pop && pop.owner === btn; closePop(); if (same) return;
  const p = document.createElement('div'); p.className = 'hl-pop'; p.setAttribute('role', 'note');
  const h = document.createElement('b'); h.textContent = btn.dataset.term.toUpperCase(); const t = document.createElement('span'); t.textContent = HELP_DATA.terms[btn.dataset.term]; 
  p.append(h, t); document.body.append(p);
  const r = btn.getBoundingClientRect(), w = p.offsetWidth, hh = p.offsetHeight;
  p.style.left = Math.max(16, Math.min(innerWidth - w - 16, r.left)) + 'px';
  p.style.top = (r.bottom + hh + 12 > innerHeight ? r.top - hh - 8 : r.bottom + 8) + 'px';
  btn.setAttribute('aria-expanded', 'true'); pop = p; pop.owner = btn;
}
function closePop(){ if (!pop) return; pop.owner.setAttribute('aria-expanded', 'false'); pop.remove(); pop = null; }

/* Explain that again: Simpler / More technical */
function explainControl(target){
  const wrap = document.createElement('div'); wrap.className = 'hl-explain'; wrap.dataset.target = target.id;
  const t = document.createElement('button'); t.type = 'button'; t.className = 'hl-small'; t.textContent = 'Explain that again'; t.dataset.hl = 'explainToggle'; t.setAttribute('aria-expanded', 'false');
  const row = document.createElement('div'); row.className = 'hl-explain'; row.hidden = true; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Explain that again');
  [['Simpler', 'explainSimpler'], ['More technical', 'explainTechnical'], ['Original', 'explainOriginal']].forEach(([label, act]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hl-small'; b.textContent = label; b.dataset.hl = act; row.append(b); });
  const v = document.createElement('span'); v.className = 'hl-ver'; v.setAttribute('aria-live', 'polite'); row.append(v);
  wrap.append(t, row); return wrap;
}
function targetOf(btn){ const w = btn.closest('.hl-explain[data-target]'); return w ? $(w.dataset.target) : null; }
function markVersion(btn, s){ const w = btn.closest('.hl-explain[data-target]'); const v = w && w.querySelector('.hl-ver'); if (v) v.textContent = s; }
function setText(el, s){ el.textContent = s; markTerms(el); }
function explainAgain(btn, dir){
  const tgt = targetOf(btn); if (!tgt) return;
  const orig = tgt.dataset.orig != null ? tgt.dataset.orig : tgt.textContent; tgt.dataset.orig = orig;
  markVersion(btn, 'Rewriting\u2026');
  G.api('/quick', { kind: 'explain', direction: dir, text: orig }).then(r => {
    if (tgt.dataset.orig !== orig) return;
    if (!r.ok) { markVersion(btn, r.message); return; }
    setText(tgt, r.text); markVersion(btn, dir === 'simpler' ? 'SIMPLER' : 'MORE TECHNICAL');
  });
}

/* mentor */
const owl = $('hl-owl').getContext('2d');
(function drawOwl(){ const P = (x, y, w, h, c) => { owl.fillStyle = c; owl.fillRect(x, y, w, h); }; owl.clearRect(0, 0, 28, 28);
  P(7, 6, 14, 16, '#140A24'); P(8, 7, 12, 14, '#8C6A48'); P(6, 4, 4, 4, '#140A24'); P(18, 4, 4, 4, '#140A24'); P(7, 5, 2, 2, '#8C6A48'); P(19, 5, 2, 2, '#8C6A48');
  P(9, 9, 4, 4, '#FFFFFF'); P(15, 9, 4, 4, '#FFFFFF'); P(10, 10, 2, 2, '#140A24'); P(16, 10, 2, 2, '#140A24'); P(13, 13, 2, 2, '#E8A020');
  P(10, 15, 8, 5, '#E8D8B8'); P(11, 16, 1, 1, '#B89868'); P(14, 17, 1, 1, '#B89868'); P(16, 16, 1, 1, '#B89868'); P(9, 22, 3, 2, '#E8A020'); P(16, 22, 3, 2, '#E8A020'); P(4, 24, 20, 2, '#5A3C28'); })();
function syncMentorBtn(){ const t = $('hl-mentor-toggle'); if (t) { t.setAttribute('aria-pressed', String(mentorOn)); t.textContent = mentorOn ? 'Mentor on' : 'Mentor off'; } }
// Comments come only from the real office state and this local table.
function mentorTick(){
  syncPlayer();
  if (!mentorOn || !$('ts').hidden) return;
  const s = G.state(); if (!s.connected) return;
  const held = s.line.filter(e => e.type === 'approval').length, others = s.otherWaiting;
  const say = held ? [ 'held' + held, held + (held === 1 ? ' approval is' : ' approvals are') + ' waiting for you. Nothing happens until you click. Deny is always the safe choice.' ]
    : s.line.length ? [ 'line' + s.line.length, s.line.length + (s.line.length === 1 ? ' person is' : ' people are') + ' in line outside your door. Press Next to call them in.' ]
    : others ? [ 'others' + others, others + ' waiting in your other projects. Main menu and Load Game switch projects.' ]
    : s.working.length ? [ 'work' + s.working.length, s.working.length + (s.working.length === 1 ? ' person is' : ' people are') + ' working. You can leave them to it.' ]
    : !s.sessions.length ? [ 'idle', 'Nobody is working yet. Walk up to someone and give them a job in plain words.' ] : null;
  if (!say || mentorSeen[say[0]]) return; mentorSeen[say[0]] = true;
  const m = $('hl-mentor'); $('hl-say').textContent = say[1]; m.hidden = false;
}
(window.SDLCTicks = window.SDLCTicks || []).push(mentorTick);
function comment(kind){
  if (!mentorOn || !HELP_DATA.mentor[kind]) return;
  if (mentorSeen[kind]) return; mentorSeen[kind] = true;
  const m = $('hl-mentor'); $('hl-say').textContent = HELP_DATA.mentor[kind]; m.hidden = false;
  if (!RM()) { m.classList.remove('in'); void m.offsetWidth; m.classList.add('in'); }
}

/* hook for game conversation cards */
function decorate(o){
  if (!o || !o.key || !o.textEl || !o.body) return;
  if (!o.textEl.id) o.textEl.id = 'hl-t-' + Math.random().toString(36).slice(2);
  delete o.textEl.dataset.orig;
  markTerms(o.textEl);
  if (o.textEl.textContent.trim()) o.body.prepend(explainControl(o.textEl));
  const sub = o.sub || '';
  comment(/^Approval/.test(sub) ? 'approval' : /^Question/.test(sub) ? 'question' : /^Delivered/.test(sub) ? 'acceptance' : /^Fit/.test(sub) ? 'fit' : 'role');
}

window.SDLCHelp = { level: () => lvl(), levelPicker: levelPicker, markTerms: markTerms, explainControl: explainControl, decorate: decorate, comment: comment };
})();
