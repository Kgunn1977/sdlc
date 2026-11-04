/* Look: comes from the design. A new design replaces this file. */
'use strict';
/* ================= Detailed headshots for conversation popups (48x48 pixel art, smoothed 2x) ================= */
const HEADS = new Map();
function headshot(k, talk){
  const L = k === 'you' ? Object.assign({}, LOOK.you, { main: SHIRTS[shirt] }) : lookOf(k);
  const id = (k === 'you' ? 'you' + shirt : (k === 'rev1' || k === 'rev2' ? 'reviewer' : k)) + (talk ? '|t' : '');
  if (HEADS.has(id)) return HEADS.get(id);
  const c = document.createElement('canvas'); c.width = 48; c.height = 48; const x = c.getContext('2d');
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const has = n => L.feats.indexOf(n) >= 0;
  const acc = DEPT[deptOf(k)].color, sk = L.skin, hr = L.hair, m = L.main, ink = '#1A1022';
  const skD = tone(sk, -0.22), skDD = tone(sk, -0.42), skL = tone(sk, 0.18);
  const hw = y => y < 20 ? Math.round(11 * Math.sqrt(Math.max(0, 1 - Math.pow((20 - y) / 12.6, 2)))) : Math.max(5, Math.round(11 - Math.max(0, y - 24) * 0.75));
  const row = (y, x1, x2, col) => { if (x2 >= x1) P(x1, y, x2 - x1 + 1, 1, col); };
  const headRow = y => [24 - hw(y), 23 + hw(y)];

  // things behind the head
  if (has('hood')) { for (let y = 4; y < 48; y++) { const w = y < 16 ? Math.round(15 * Math.sqrt(Math.max(0, 1 - Math.pow((16 - y) / 12.5, 2)))) : 15; row(y, 24 - w, 23 + w, tone(m, -0.1)); } }
  if (has('ponytail')) { for (let y = 12; y < 34; y++) row(y, 33, 38 - Math.max(0, (y - 26) >> 1), y % 4 === 0 ? tone(hr, 0.15) : hr); }
  if (L.hairStyle === 'long' && !has('hood')) { for (let y = 12; y < 38; y++) { row(y, 9, 14, hr); row(y, 33, 38, hr); } P(9, 12, 1, 26, tone(hr, -0.3)); P(38, 12, 1, 26, tone(hr, -0.3)); }
  if (has('wig')) { for (let y = 12; y < 38; y++) { const c1 = (y >> 2) % 2 ? '#F4F4F4' : '#D8D8DC'; row(y, 7, 13, c1); row(y, 34, 40, c1); } }

  // shoulders and outfit
  const robe = L.torso === 'robe', base = robe ? '#1A1A22' : m;
  for (let y = 36; y < 48; y++) { const w = y === 36 ? 12 : y === 37 ? 14 : y === 38 ? 15 : 16; row(y, 24 - w, 23 + w, base); P(24 - w, y, 1, 1, tone(base, -0.5)); P(23 + w, y, 1, 1, tone(base, -0.5)); P(25 - w, y, 2, 1, tone(base, 0.16)); P(20 + w, y, 3, 1, tone(base, -0.18)); }
  row(36, 12, 35, tone(base, -0.5));
  // neck
  P(20, 29, 8, 9, sk); P(20, 29, 8, 3, skD); P(26, 32, 2, 6, skD);
  const vneck = () => { for (let y = 36; y < 41; y++) row(y, 20 + (y - 36), 27 - (y - 36), sk); row(36, 20, 27, skD); };
  const shirtV = (col) => { for (let y = 36; y < 46; y++) row(y, 19 + ((y - 36) >> 1), 28 - ((y - 36) >> 1), col); };
  const lanyard = () => { for (let y = 36; y < 44; y++) { P(18 + ((y - 36) >> 1), y, 1, 1, acc); P(29 - ((y - 36) >> 1), y, 1, 1, acc); } P(21, 43, 6, 5, tone(acc, -0.3)); P(22, 44, 4, 3, '#F4F4FC'); P(22, 44, 4, 1, acc); };
  const t = L.torso;
  if (t === 'suitTie') { shirtV('#F4F4FC'); P(23, 37, 2, 11, '#E8B830'); P(23, 37, 2, 1, '#FFE070'); P(22, 36, 4, 2, '#C89820'); for (let y = 37; y < 46; y++) { P(18 + ((y - 36) >> 1), y, 1, 1, tone(m, -0.4)); P(29 - ((y - 36) >> 1), y, 1, 1, tone(m, -0.4)); } }
  else if (t === 'sleeves') { vneck(); P(14, 40, 3, 3, '#A8A8B8'); P(15, 41, 1, 1, '#60606C'); lanyard(); }
  else if (t === 'vest') { shirtV('#ECECEC'); for (let y = 37; y < 48; y++) { row(y, 9, 18 + ((y - 37) >> 2), '#3AA84A'); row(y, 29 - ((y - 37) >> 2), 38, '#3AA84A'); } P(9, 37, 1, 11, '#1E6A28'); lanyard(); }
  else if (t === 'badge') { vneck(); P(30, 40, 4, 4, '#E8B830'); P(31, 41, 2, 2, '#FFF0A0'); P(8, 46, 32, 2, '#101018'); lanyard(); }
  else if (t === 'flight') { for (let y = 35; y < 40; y++) row(y, 13, 34, y % 2 ? '#E8D4A8' : '#D4BC90'); P(23, 40, 2, 8, '#2A1A10'); P(23, 41, 2, 1, '#C8A060'); }
  else if (t === 'feather') { shirtV('#F4F4FC'); for (let y = 37; y < 46; y++) { P(18 + ((y - 36) >> 1), y, 2, 1, tone(m, -0.35)); P(28 - ((y - 36) >> 1), y, 2, 1, tone(m, -0.35)); } for (let i = 0; i < 6; i++) P(31 + (i >> 1), 38 + i, 2, 1, i % 2 ? '#58D8F8' : '#9CF0FF'); }
  else if (t === 'smock') { vneck(); [[13, 40, '#F83800'], [30, 39, '#3CBCFC'], [18, 44, '#FCBC3C'], [33, 45, '#58D854'], [26, 46, '#F878F8']].forEach(([a, b, c2]) => P(a, b, 2, 2, c2)); lanyard(); }
  else if (t === 'cardigan') { shirtV('#EDE4D2'); for (let y = 38; y < 48; y += 3) { P(19 + ((y - 36) >> 1), y, 1, 1, ink); P(28 - ((y - 36) >> 1), y, 1, 1, ink); } lanyard(); }
  else if (t === 'robe') { P(20, 36, 8, 3, '#FFFFFF'); P(22, 39, 4, 3, '#F0F0F0'); P(22, 41, 4, 1, '#C8C8D0'); for (let y = 37; y < 48; y++) { P(15, y, 3, 1, acc); P(30, y, 3, 1, acc); } }
  else if (t === 'suitDark') { shirtV('#F4F4FC'); P(23, 37, 2, 10, '#101014'); for (let y = 37; y < 46; y++) { P(18 + ((y - 36) >> 1), y, 1, 1, '#000000'); P(29 - ((y - 36) >> 1), y, 1, 1, '#000000'); } lanyard(); }
  else if (t === 'bowtie') { P(19, 36, 10, 5, '#F4F4FC'); P(19, 37, 4, 3, '#C83030'); P(25, 37, 4, 3, '#C83030'); P(23, 37, 2, 3, '#901818'); lanyard(); }
  else if (t === 'buttons') { vneck(); [40, 43, 46].forEach(y => { P(23, y, 2, 2, '#E8B830'); P(23, y, 1, 1, '#FFF0A0'); }); lanyard(); }
  else if (t === 'sticky') { vneck(); P(12, 40, 5, 5, '#FCE45C'); P(29, 41, 5, 5, '#F878F8'); P(17, 44, 5, 4, '#58D8F8'); P(12, 40, 5, 1, '#FFF4A0'); lanyard(); }
  else if (t === 'tweed') { shirtV('#EDE4D2'); for (let i = 0; i < 18; i++) P(9 + ((i * 7) % 30), 38 + ((i * 5) % 10), 1, 1, tone(m, 0.25)); lanyard(); }
  else { vneck(); lanyard(); }

  // ears and head
  P(11, 19, 3, 6, sk); P(34, 19, 3, 6, sk); P(12, 20, 1, 4, skD); P(35, 20, 1, 4, skD);
  for (let y = 8; y < 34; y++) { const [a, b] = headRow(y); row(y, a, b, sk); P(a, y, 1, 1, skDD); P(b, y, 1, 1, skDD); P(b - 3, y, 3, 1, skD); if (y > 12 && y < 26) P(a + 1, y, 2, 1, skL); }
  row(33, headRow(33)[0], headRow(33)[1], skDD);
  P(15, 24, 3, 2, tone(sk, -0.06)); P(30, 24, 3, 2, tone(sk, -0.1));

  // hair
  const hl = tone(hr, 0.28), hd = tone(hr, -0.3);
  if (!has('hood') && L.hairStyle !== 'none') {
    for (let y = 7; y < 15; y++) { const [a, b] = headRow(y + 1); row(y, a - (y > 9 ? 1 : 0), b + (y > 9 ? 1 : 0), hr); }
    for (let y = 15; y < 21; y++) { P(12, y, 3, 1, hr); P(33, y, 3, 1, hr); }
    for (let i = 0; i < 6; i++) P(15 + i * 3, 14, 2, 1 + (i % 2), hr);
    P(17, 8, 8, 1, hl); P(15, 9, 6, 1, hl); P(30, 9, 3, 4, hd);
  }
  if (has('hood')) { for (let y = 6; y < 12; y++) { const [a, b] = headRow(Math.max(y, 8)); row(y, a, b, m); } P(14, 11, 20, 2, hr); }

  // eyes, brows, nose, mouth
  const eye = (ex) => { P(ex, 19, 5, 3, '#FFFFFF'); P(ex + 1, 19, 3, 3, '#4A3020'); P(ex + 2, 20, 1, 1, '#0A0608'); P(ex + 1, 19, 1, 1, '#FFFFFF'); P(ex, 22, 5, 1, skD); };
  eye(16); eye(27);
  const brow = has('wig') || hr === '#F0F0F0' ? '#9C9CA4' : tone(hr, -0.1);
  P(16, 17, 5, 1, brow); P(27, 17, 5, 1, brow); P(16, 18, 1, 1, brow); P(31, 18, 1, 1, brow);
  P(23, 21, 2, 4, skD); P(22, 25, 4, 1, skDD); P(24, 21, 1, 3, skL);
  if (has('beardGray') || has('beardRed')) {
    const bc = has('beardRed') ? hr : '#A4A4AC', bd = tone(bc, -0.25);
    for (let y = 24; y < 34; y++) { const [a, b] = headRow(y); row(y, a + 1, b - 1, (y + a) % 3 ? bc : bd); }
    P(19, 25, 10, 2, bc); P(22, 27, 4, 1, sk);
  }
  if (talk) { P(21, 28, 6, 3, '#4A1418'); P(22, 28, 4, 1, '#F4F4F4'); P(22, 30, 4, 1, '#C84A50'); }
  else { P(21, 28, 6, 1, '#8C3A34'); P(20, 27, 1, 1, '#8C3A34'); P(27, 27, 1, 1, '#8C3A34'); }

  // eyewear and headwear
  if (has('glasses')) { [15, 26].forEach(a => { P(a, 18, 7, 1, ink); P(a, 23, 7, 1, ink); P(a, 18, 1, 6, ink); P(a + 6, 18, 1, 6, ink); P(a + 1, 19, 2, 1, 'rgba(255,255,255,0.6)'); }); P(22, 19, 4, 1, ink); P(12, 19, 3, 1, ink); P(33, 19, 3, 1, ink); }
  if (has('sunglasses')) { [15, 26].forEach(a => { P(a, 18, 7, 5, '#0C0C14'); P(a + 1, 19, 2, 1, '#5A5A78'); }); P(22, 19, 4, 1, '#0C0C14'); P(12, 19, 3, 1, '#0C0C14'); P(33, 19, 3, 1, '#0C0C14'); }
  if (has('goggles')) { P(12, 11, 24, 3, '#3A2A1A'); [16, 26].forEach(a => { P(a - 1, 9, 8, 6, ink); P(a, 10, 6, 4, '#58D8F8'); P(a + 1, 10, 2, 1, '#E0FCFF'); }); }
  if (has('headband')) { P(13, 12, 22, 2, '#E03018'); P(13, 12, 22, 1, '#FF7050'); }
  if (has('pencil')) { for (let i = 0; i < 8; i++) P(34 + (i >> 2), 12 + i, 2, 1, i < 2 ? '#F0A0A0' : '#F0C030'); P(35, 20, 1, 1, ink); }
  if (has('headphones')) { for (let a = 0; a < 26; a++) { const y = Math.round(5 - 4 * Math.sin(Math.PI * a / 25)); P(11 + a, y + 1, 1, 2, '#24242E'); } P(8, 16, 6, 10, '#24242E'); P(34, 16, 6, 10, '#24242E'); P(9, 18, 3, 6, '#E03018'); P(36, 18, 3, 6, '#E03018'); }
  if (has('headset')) { P(34, 17, 4, 8, '#24242E'); P(35, 18, 2, 6, '#5A5A68'); for (let i = 0; i < 8; i++) P(34 - i, 25 + (i >> 1), 1, 1, '#24242E'); P(25, 28, 3, 2, '#24242E'); }
  if (has('beret')) { for (let y = 3; y < 11; y++) { const w = Math.round(12 * Math.sqrt(Math.max(0, 1 - Math.pow((7 - y) / 4.5, 2)))); row(y, 22 - w, 21 + w + 3, '#D02828'); } P(12, 4, 8, 1, '#F06060'); P(22, 1, 2, 3, '#8C1414'); P(10, 10, 26, 1, '#8C1414'); }
  if (has('cap')) { for (let y = 3; y < 12; y++) { const [a, b] = headRow(Math.max(y + 2, 8)); row(y, a, b, '#2A2A58'); } P(15, 4, 6, 1, '#4A4A88'); P(22, 6, 4, 4, '#E8B830'); P(23, 7, 2, 2, '#FFF0A0'); P(10, 11, 28, 3, '#141430'); P(10, 11, 28, 1, '#3A3A6A'); }
  if (has('tophat')) { P(15, 0, 18, 9, '#1A1A22'); P(16, 0, 2, 9, '#3A3A48'); P(15, 6, 18, 2, '#C83030'); P(9, 9, 30, 3, '#101016'); P(9, 9, 30, 1, '#3A3A48'); }
  if (has('captain')) { for (let y = 2; y < 10; y++) { const [a, b] = headRow(Math.max(y + 4, 8)); row(y, a - 1, b + 1, '#F4F4F8'); } P(12, 3, 10, 1, '#FFFFFF'); P(21, 4, 6, 4, '#E8B830'); P(22, 5, 4, 2, '#FFF0A0'); P(11, 9, 26, 2, '#141418'); P(10, 11, 28, 2, '#101014'); P(12, 11, 10, 1, '#4A4A58'); }
  if (has('scarf')) { const sc = '#F8D838', sd = '#D8A818'; for (let y = 4; y < 16; y++) { const [a, b] = headRow(Math.max(y + 1, 8)); row(y, a - 1, b + 1, (y % 3) ? sc : sd); } for (let y = 16; y < 30; y++) { P(10, y, 4, 1, sc); P(34, y, 4, 1, sc); } P(35, 28, 6, 5, '#F878F8'); P(36, 29, 3, 2, '#FFB8F8'); }
  if (has('wig')) { for (let y = 4; y < 14; y++) { const [a, b] = headRow(Math.max(y + 2, 8)); row(y, a - 2, b + 2, (y % 3) ? '#F4F4F4' : '#D8D8DC'); } for (let i = 0; i < 6; i++) { P(8, 14 + i * 4, 6, 1, '#C8C8CC'); P(34, 14 + i * 4, 6, 1, '#C8C8CC'); } }

  const out = smoothCanvas(c);
  HEADS.set(id, out); return out;
}
function paintHead(canvas, k, talk){
  const x = canvas.getContext('2d'), w = canvas.width, h = canvas.height, bg = DEPT[deptOf(k)].color;
  x.setTransform(1, 0, 0, 1, 0, 0);
  const lg = x.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, mix(bg, '#100C20', 0.2)); lg.addColorStop(1, mix(bg, '#100C20', 0.82)); x.fillStyle = lg; x.fillRect(0, 0, w, h);
  const rg = x.createRadialGradient(w * 0.42, h * 0.3, 2, w / 2, h / 2, w * 0.62); rg.addColorStop(0, 'rgba(255,255,255,0.3)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, w, h);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(headshot(k, talk), 0, 0, w, h);
}
function paintFace(k, talk){ paintHead(face, k, talk); }
function setFace(k){
  clearInterval(faceTimer); faceKey = k;
  if (!k) { face.hidden = true; return; }
  face.hidden = false; paintFace(k, false);
}
function talkFace(on){ clearInterval(faceTimer); if (!faceKey) return; if (on && !RM) { let f = 0; faceTimer = setInterval(() => { f ^= 1; paintFace(faceKey, f); }, 140); } else paintFace(faceKey, false); }
function openDialog(opt){
  // opt: {key, name, sub, text, build(body), onClose}
  if (mapOpen) closeMap();
  setFace(opt.key || null);
  dlgName.textContent = opt.name || (opt.key ? fullNameOf(opt.key) : '');
  dlgSub.textContent = opt.sub || (opt.key ? DEPT[deptOf(opt.key)].name + ' · ' + stateLabel(opt.key) : '');
  onDlgClose = opt.onClose || null;
  dlg.hidden = false; dlgBody.textContent = '';
  const after = () => { dlgBody.textContent = ''; if (opt.build) opt.build(dlgBody); if (window.SDLCHelp) window.SDLCHelp.decorate({ key: opt.key, sub: opt.sub, textEl: dlgText, body: dlgBody }); const f = dlgBody.querySelector('[data-autofocus]') || dlgBody.querySelector('button:not([disabled]), input, textarea, a[href]') || document.getElementById('dlg-x'); if (f) f.focus(); };
  typeText(opt.text || '', after);
}
function typeText(s, done){
  dlgText.textContent = ''; dlgText.hidden = !s;
  if (!s || RM) { dlgText.textContent = s; typing = null; done(); return; }
  let i = 0; talkFace(true);
  typing = { done, s, timer: setInterval(() => { i += 2; dlgText.textContent = s.slice(0, i); if (i % 6 === 0) blip(300 + (i % 5) * 40, 0.02, 0.025); if (i >= s.length) finishTyping(); }, 22) };
  dlg.focus?.();
}
function finishTyping(){ if (!typing) return; clearInterval(typing.timer); dlgText.textContent = typing.s; const d = typing.done; typing = null; talkFace(false); d(); }
function closeDialog(silent){
  if (typing) { clearInterval(typing.timer); typing = null; }
  clearInterval(faceTimer); dlg.hidden = true; dlgBody.textContent = '';
  const cb = onDlgClose; onDlgClose = null;
  if (cb && !silent) cb(); else if (cb && silent) cb();
  refreshHud(); cv.focus?.();
}
document.getElementById('dlg-x').addEventListener('click', () => closeDialog());
dlgText.addEventListener('click', finishTyping);
const toastEl = document.getElementById('toast'); let toastT = 0;
function toast(s){ toastEl.textContent = s; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 3200); }

function cmdBox(text, label){
  const inp = el('input', { type: 'text', readonly: '', value: text, 'aria-label': label || 'Command' });
  const b = el('button', { class: 'btn', type: 'button', text: 'Copy' });
  b.addEventListener('click', () => {
    const v = inp.value;
    const ok = () => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1400); };
    const fall = () => { inp.focus(); inp.select(); b.textContent = 'Press Ctrl+C'; };
    try { navigator.clipboard.writeText(v).then(ok, fall); } catch (e) { fall(); }
  });
  return { node: el('div', { class: 'cmd' }, [label ? el('span', { class: 'lbl', text: label }) : null, inp, b]), input: inp };
}
function legalLine(k){ return isLegal(k) ? el('p', { class: 'legal', text: 'Informational analysis, not legal advice.' }) : null; }
function optButtons(list){ return el('div', { class: 'opts' }, list.map((o, i) => { const b = el('button', { class: 'opt', type: 'button', 'data-num': String(i + 1), onclick: o.fn }, [el('span', { class: 'n', text: String(i + 1) }), el('span', { text: o.label })]); if (o.rec) b.append(el('span', { class: 'rec', text: 'RECOMMENDED' })); return b; })); }
function fieldList(pairs){ const dl = el('dl', { class: 'fields' }); pairs.forEach(([k, v]) => { if (v == null || v === '') return; dl.append(el('dt', { text: k }), el('dd', {}, [v instanceof Node ? v : document.createTextNode(String(v))])); }); return dl; }
function priChip(p){ const c = { critical: '#F83800', high: '#FCBC3C', medium: '#FCFCFC', low: '#C8C4E4' }[p] || '#FCFCFC'; const s = el('span', { class: 'pri', text: (p || '').toUpperCase() }); s.style.background = c; return s; }

