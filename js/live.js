/* Pencilwise live competitions: two or more iPads linked through the Pencilwise server on the PC.
   The server keeps one ordered list of moves for each game. Every iPad replays the same list with the
   same seeded random numbers, so every iPad shows exactly the same game. */
(function () {
  'use strict';
  const C = window.PWCore, Q = window.PWQuiz, K = Q._k, D = window.PW_QUIZ_DATA;
  const { DEV, $, $$, esc, icon, overlay, closeOverlay, toast, show, save, tone } = C;
  const { CATS, TYPE, TIME, TIMED, TEAMS, GC, MEDAL, links, family, qp, defaultCat } = K;
  const QSIG = D.questions.length + ':' + D.questions[D.questions.length - 1].id;
  const DEF = { mode: 'ipad', win: 'rounds', n: 5, glean: true, double: true, timer: true, name: 'Live family game' };
  const devId = () => { const st = C.state(); if (!st.dev) { st.dev = 'd' + Math.random().toString(36).slice(2, 10); save(); } return st.dev; };
  let L = null;

  /* ---------- talking to the PC ---------- */
  function baseFrom(input) {
    let s = String(input || '').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '');
    s = s.toLowerCase().replace(/\s+/g, '-').replace(/\.trycloudflare\.com.*$/, '').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
    return s ? 'https://' + s + '.trycloudflare.com' : null;
  }
  function defaultWords() {
    const st = C.state(), h = location.hostname;
    if (st.liveWords) return st.liveWords;
    if (h.endsWith('.trycloudflare.com')) return h.replace('.trycloudflare.com', '');
    if (h === 'localhost' || /^\d+(\.\d+){3}$/.test(h)) return location.origin;
    return '';
  }
  async function api(base, path, body) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 8000);
    const opt = body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal } : { cache: 'no-store', signal: ctl.signal };
    try { const r = await fetch(base + path, opt); const j = await r.json().catch(() => ({ ok: false })); j.status = r.status; return j; }
    catch (_) { return { ok: false, status: 0 }; }
    finally { clearTimeout(tm); }
  }
  function absorb(from, actions) {
    const add = (actions || []).slice(Math.max(0, L.log.length - from));
    if (add.length) L.log.push(...add);
    return add.length;
  }
  async function pull() {
    if (!L || L.busy) return;
    const from = L.log.length, r = await api(L.base, '/live/' + L.code + '?since=' + from);
    if (!L) return;
    if (!r.ok) { L.fails++; if (L.fails > 1) conn(r.status === 404 ? 'This game is no longer on the PC.' : 'Reconnecting to the PC...'); return; }
    L.fails = 0; conn('');
    if (absorb(from, r.actions)) update();
  }
  function poll() {
    if (!L) return;
    clearTimeout(L.pt);
    L.pt = setTimeout(async () => { await pull(); poll(); }, 900);
  }
  async function act(a) {
    if (!L) return false;
    a.dev = L.dev; L.busy = true;
    try {
      for (let k = 0; k < 5; k++) {
        const from = L.log.length, r = await api(L.base, '/live/' + L.code + '/act', { after: from, act: a });
        if (!L) return false;
        if (r.ok) { if (L.log.length === from) L.log.push(a); conn(''); update(); return true; }
        if (r.status === 409) { absorb(from, r.actions); update(); if (!valid(a)) return false; continue; }
        conn('Reconnecting to the PC...'); await new Promise(res => setTimeout(res, 900));
      }
      toast('Could not reach the PC. Check that the Pencilwise window is still open on the PC.');
      return false;
    } finally { if (L) L.busy = false; }
  }
  function valid(a) {
    const S = L.S;
    if (a.t === 'ans') return S.started && S.phase === 'ask' && a.turn === S.i;
    if (a.t === 'glean' || a.t === 'leave') return S.started && S.phase === 'glean' && a.turn === S.i;
    if (a.t === 'next') return S.started && S.phase === 'reveal' && a.turn === S.i;
    if (a.t === 'start' || a.t === 'settings' || a.t === 'players') return !S.started;
    if (a.t === 'end') return S.started && S.phase !== 'done';
    return true;
  }
  function conn(msg) {
    let b = $('#lconn');
    if (!b) { b = document.createElement('div'); b.id = 'lconn'; b.className = 'lconn'; document.body.appendChild(b); }
    b.textContent = msg; b.hidden = !msg;
  }

  /* ---------- the shared game: every iPad replays the same moves ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const shuffleR = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function replay(log) {
    const S = { host: null, qsig: null, devs: [], players: {}, set: Object.assign({}, DEF), started: false, phase: 'lobby', plist: [], sides: [], turns: [], i: 0, glean: null, last: null, events: [] };
    log.forEach((a, k) => step(S, a, k));
    return S;
  }
  const addDev = (S, d) => { if (d && !S.devs.includes(d)) S.devs.push(d); };
  function step(S, a, k) {
    if (a.t === 'host') { if (!S.host) { S.host = a.dev; S.qsig = a.qsig; } addDev(S, a.dev); return; }
    if (a.t === 'join') return addDev(S, a.dev);
    if (!S.started) {
      if (a.t === 'players') { addDev(S, a.dev); S.players[a.dev] = (a.list || []).slice(0, 8); }
      else if (a.t === 'settings' && a.dev === S.host) S.set = Object.assign({}, DEF, a.s);
      else if (a.t === 'start' && a.dev === S.host) start(S, a.seed);
      return;
    }
    if (a.t === 'end') { if (S.phase !== 'done') { S.phase = 'done'; S.stopped = true; } return; }
    if (S.phase === 'done' || a.turn !== S.i) return;
    const cur = S.turns[S.i], pl = S.plist[cur.pl], it = cur.q, sd = S.sides[pl.side], mult = isFinal(S, cur) ? 2 : 1;
    if (a.t === 'ans' && S.phase === 'ask') {
      const right = a.choice === it.a[0]; let pts = 0;
      pl.n++;
      if (right) {
        pl.right++; pl.streak++; pl.best = Math.max(pl.best, pl.streak);
        pts = 10;
        if (S.set.timer && TIMED[it.c] && typeof a.ms === 'number') pts += Math.round(5 * Math.max(0, 1 - a.ms / (TIME * 1000)));
        if (pl.streak >= 3) pts += 2;
        pts *= mult; pl.score += pts; sd.score += pts;
      } else { pl.streak = 0; pl.missed.push(it); }
      S.events.push({ k, dev: pl.dev, pid: pl.pid, qid: it.id, right });
      S.last = { choice: a.choice, right, pts, who: pl.name, wrong: right ? null : a.choice };
      if (right) S.phase = 'reveal';
      else if (S.set.glean && S.sides.length > 1 && it.t !== 'tf') { S.phase = 'glean'; S.glean = { side: (pl.side + 1) % S.sides.length, pts: 5 * mult }; }
      else S.phase = 'reveal';
      return;
    }
    if (a.t === 'glean' && S.phase === 'glean') {
      const g = S.sides[S.glean.side], ok = a.choice === it.a[0];
      if (ok) { g.score += S.glean.pts; g.steals++; }
      S.last.gleaned = ok ? 1 : -1; S.last.wrong2 = ok ? null : a.choice; S.phase = 'reveal';
      return;
    }
    if (a.t === 'leave' && S.phase === 'glean') { S.last.gleaned = 0; S.phase = 'reveal'; return; }
    if (a.t === 'next' && S.phase === 'reveal') {
      if (over(S)) { S.phase = 'done'; return; }
      if (S.i >= S.turns.length - 1) S.turns.push(...round(S, cur.round + 1));
      S.i++; S.phase = 'ask'; S.glean = null; S.last = null;
    }
  }
  function start(S, seed) {
    const order = S.devs.filter(d => (S.players[d] || []).length);
    S.plist = [];
    order.forEach(d => S.players[d].forEach(p => S.plist.push({ name: String(p.name || 'Player').slice(0, 14), pid: p.pid || null, color: p.color || GC[0], cat: CATS[p.cat] ? p.cat : 'g', dev: d, n: 0, right: 0, streak: 0, best: 0, missed: [], score: 0 })));
    if (!S.plist.length) return;
    S.teams = S.set.mode === 'ipad' && order.length > 1;
    S.sides = S.teams
      ? order.map((d, k) => ({ name: TEAMS[k % 4][0], short: TEAMS[k % 4][1], color: TEAMS[k % 4][2], dev: d, members: S.plist.map((p, i) => p.dev === d ? i : -1).filter(i => i >= 0), score: 0, steals: 0 }))
      : S.plist.map((p, i) => ({ name: p.name, short: p.name, color: p.color, dev: p.dev, members: [i], score: 0, steals: 0 }));
    S.plist.forEach((p, i) => { p.side = S.sides.findIndex(s => s.members.includes(i)); });
    S.seed = seed >>> 0; S.rand = rng(S.seed); S.pools = {}; S.used = new Set();
    S.started = true; S.phase = 'ask'; S.i = 0; S.turns = round(S, 0);
  }
  function round(S, r) {
    return S.sides.map(sd => { const m = sd.members[r % sd.members.length]; return { pl: m, q: drawQ(S, S.plist[m].cat), round: r }; });
  }
  function drawQ(S, cat) {
    let pool = S.pools[cat];
    if (!pool || !pool.length) { let all = D.questions.filter(x => x.c === cat && !S.used.has(x.id)); if (!all.length) all = D.questions.filter(x => x.c === cat); pool = S.pools[cat] = shuffleR(all, S.rand); }
    const q = pool.shift(); S.used.add(q.id); return q;
  }
  const isFinal = (S, t) => S.set.win === 'rounds' && S.set.double && t.round === S.set.n - 1;
  function over(S) {
    const cur = S.turns[S.i];
    if (S.i < S.turns.length - 1) return false;
    if (S.set.win === 'rounds') return cur.round >= S.set.n - 1;
    return S.sides.some(s => s.score >= S.set.n) || cur.round >= 29;
  }
  const optsFor = (S, i, it) => it.t === 'tf' ? ['True', 'False'] : shuffleR(it.a.slice(0, it.c === 'k' ? 3 : 4), rng(S.seed + (i + 1) * 7919));
  const roundText = (S, t) => S.set.win === 'rounds' ? `Round ${t.round + 1} of ${S.set.n}` : `Round ${t.round + 1}. First to ${S.set.n} points`;

  /* ---------- after every change ---------- */
  function update() {
    if (!L) return;
    L.S = replay(L.log);
    const S = L.S, st = C.state();
    S.events.forEach(ev => {
      if (ev.k < L.done || ev.dev !== L.dev || !ev.pid) return;
      const p = st.profiles.find(x => x.id === ev.pid); if (!p) return;
      const q = qp(p); q.seen[ev.qid] = 1; q.answered++; if (ev.right) q.correct++;
    });
    L.done = L.log.length;
    if (S.phase === 'done' && !L.recorded && S.plist.some(p => p.n)) { L.recorded = true; record(S); }
    save();
    render();
  }
  function ranked(S) {
    const r = S.sides.slice().sort((a, b) => b.score - a.score);
    let place = 0; r.forEach((s, k) => { if (k && s.score < r[k - 1].score) place = k; s.place = place; });
    return r;
  }
  function record(S) {
    const fam = family(), id = 'L' + L.code + '-' + S.seed, st = C.state();
    if (fam.history.some(h => h.id === id)) return;
    fam.history.unshift({ id, at: Date.now(), name: S.set.name, teams: !!S.teams, results: ranked(S).map(s => ({ name: s.name, score: s.score, place: s.place, members: s.members.map(m => S.plist[m].name) })) });
    fam.history = fam.history.slice(0, 80);
    S.plist.forEach(p => { if (p.dev === L.dev && p.pid) { const pr = st.profiles.find(x => x.id === p.pid); if (pr) qp(pr).games++; } });
  }

  /* ---------- screens ---------- */
  function render() {
    if (!L || !L.S) return;
    const S = L.S;
    const key = [S.started, S.phase, S.i, L.ui.ready === S.i, L.log.length].join('|');
    if (key === L.key) return;
    L.key = key;
    cancelAnimationFrame(L.ui.raf);
    if (!S.started) return lobby(S);
    if (S.phase === 'done') return results(S);
    game(S);
  }
  const avatar = (name, color, cls = '') => `<span class="avatar ${cls}" style="--c:${color}">${esc((name || '?')[0].toUpperCase())}</span>`;
  function lobby(S) {
    const host = S.host === L.dev;
    if (L.typing && $('#llobby')) { $('#lall').innerHTML = allHTML(S); return; }
    const mine = L.people.filter(x => x.on), set = host ? L.set : S.set;
    const others = S.devs.filter(d => d !== L.dev && (S.players[d] || []).length);
    const canStart = S.devs.some(d => (S.players[d] || []).length) && (others.length > 0) && mine.length > 0;
    $('#v-quiz').innerHTML = `<div class="llobby" id="llobby">
      <header class="lhead"><button class="barb" id="lx" aria-label="Leave the live game">${icon('close')}</button>
        <div><p class="kicker">Live game</p><h1>Game number <span class="gnum">${esc(L.code)}</span></h1>
        <p class="lede">${host ? 'On the other phone or iPad: Bible quiz, Family competition, Live on phones and iPads, then Join a live game with this number.' : `You have joined the game. Choose who is playing on this ${DEV}, then wait for the other phone or iPad to start.`}</p></div></header>
      <div class="lcols">
        <section class="lcard"><h2>Playing on this ${DEV}</h2>
          <div class="who-pick">${L.people.map((x, i) => `<button class="pchip ${x.on ? 'on' : ''}" data-tog="${i}">${avatar(x.name, x.color)}${esc(x.name)}${x.pid ? '' : '<em>guest</em>'}</button>`).join('')}</div>
          <div class="addguest"><input id="lguest" maxlength="14" placeholder="Add a guest player" autocomplete="off" autocapitalize="words" value="${esc(L.guest)}"><button class="btn ghost small" data-add>${icon('plus')}Add</button></div>
          ${mine.length ? `<div class="levels">${L.people.map((x, i) => x.on ? `<div class="lvrow"><b>${esc(x.name)}</b><select class="lvsel" data-lvl="${i}">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${x.cat === k ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>` : '').join('')}</div>` : '<p class="fine">Choose at least one player.</p>'}
        </section>
        <section class="lcard"><h2>Everyone in the game</h2><div id="lall">${allHTML(S)}</div>
          <h2>Rules</h2>
          ${host ? `
          <div class="set"><span><b>Name of the game</b></span><input id="lname" class="tin" maxlength="28" value="${esc(set.name)}" autocomplete="off"></div>
          <div class="set"><span><b>How to play</b></span><div class="seg" data-k="mode"><button class="${set.mode === 'ipad' ? 'on' : ''}" data-v="ipad">Each phone or iPad is a team</button><button class="${set.mode === 'solo' ? 'on' : ''}" data-v="solo">Each person for themselves</button></div></div>
          <div class="set"><span><b>The game ends</b></span><div class="seg" data-k="win"><button class="${set.win === 'rounds' ? 'on' : ''}" data-v="rounds">After rounds</button><button class="${set.win === 'points' ? 'on' : ''}" data-v="points">First to a score</button></div></div>
          <div class="set"><span><b>${set.win === 'rounds' ? 'Rounds' : 'Target score'}</b></span><div class="seg" data-k="n">${(set.win === 'rounds' ? [3, 5, 10] : [30, 50, 100]).map(n => `<button class="${set.n === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>
          <label class="set"><span><b>Gleaning</b><em>After a wrong answer, the next ${set.mode === 'ipad' ? 'team' : 'player'} can glean the question for 5 points.</em></span><input type="checkbox" data-c="glean" ${set.glean ? 'checked' : ''}><i></i></label>
          ${set.win === 'rounds' ? `<label class="set"><span><b>Double points in the final round</b></span><input type="checkbox" data-c="double" ${set.double ? 'checked' : ''}><i></i></label>` : ''}
          <label class="set"><span><b>Timer</b><em>${TIME} seconds for Fun, Hard and Expert questions.</em></span><input type="checkbox" data-c="timer" ${set.timer ? 'checked' : ''}><i></i></label>
          <div class="row end"><button class="btn gold" id="lstart" ${canStart ? '' : 'disabled'}>Start the game</button></div>
          ${canStart ? '' : '<p class="fine">The game can start when the other phone or iPad has joined and chosen its players.</p>'}`
          : `<p class="lsum">${esc(set.name)}. ${set.mode === 'ipad' ? 'Each phone or iPad is a team' : 'Each person for themselves'}. ${set.win === 'rounds' ? set.n + ' rounds' : 'First to ' + set.n + ' points'}${set.glean ? ', with gleaning' : ''}${set.win === 'rounds' && set.double ? ', double points in the final round' : ''}${set.timer ? ', with the timer' : ''}.</p><p class="fine">The phone or iPad that started the game chooses the rules and starts it.</p>`}
        </section></div></div>`;
    const v = $('#v-quiz');
    $('#lx').onclick = leave;
    v.onclick = e => {
      const tg = e.target.closest('[data-tog]'); if (tg) { const x = L.people[+tg.dataset.tog]; if (x.pid) x.on = !x.on; else L.people.splice(+tg.dataset.tog, 1); return mineChanged(); }
      if (e.target.closest('[data-add]')) { const n = $('#lguest').value.trim(); if (n) { L.people.push({ name: n, pid: null, color: GC[L.people.filter(x => !x.pid).length % GC.length], cat: 'g', on: true }); L.guest = ''; L.typing = false; mineChanged(); } return; }
      const sb = e.target.closest('[data-k] button'); if (sb && host) { const k = sb.parentNode.dataset.k; L.set[k] = k === 'n' ? +sb.dataset.v : sb.dataset.v; if (k === 'win') L.set.n = sb.dataset.v === 'rounds' ? 5 : 50; return setChanged(); }
      if (e.target.closest('#lstart') && host) { e.target.closest('#lstart').disabled = true; act({ t: 'start', seed: Math.floor(Math.random() * 4294967296) }); }
    };
    $('#lguest').oninput = e => { L.guest = e.target.value; L.typing = !!L.guest; };
    $('#lguest').onblur = () => { L.typing = false; };
    $('#lguest').onkeydown = e => { if (e.key === 'Enter') v.querySelector('[data-add]').click(); };
    $$('[data-lvl]', v).forEach(s => s.onchange = () => { L.people[+s.dataset.lvl].cat = s.value; mineChanged(); });
    if (host) {
      $$('[data-c]', v).forEach(c => c.onchange = () => { L.set[c.dataset.c] = c.checked; setChanged(); });
      $('#lname').onchange = e => { L.set.name = (e.target.value.trim() || DEF.name).slice(0, 28); setChanged(); };
    }
  }
  function allHTML(S) {
    const rows = S.devs.map((d, k) => { const list = S.players[d] || []; return list.length ? `<div class="ldev"><span class="ldn">${d === L.dev ? 'This ' + DEV : d === S.host ? 'The phone or iPad that started' : 'Another phone or iPad'}</span>${list.map(p => `<span class="lpl">${avatar(p.name, p.color)}${esc(p.name)}<em>${esc((CATS[p.cat] || CATS.g).name)}</em></span>`).join('')}</div>` : ''; }).join('');
    return rows || '<p class="fine">No players yet.</p>';
  }
  function mineChanged() {
    L.key = ''; render();
    clearTimeout(L.pp);
    L.pp = setTimeout(() => act({ t: 'players', list: L.people.filter(x => x.on).map(x => ({ name: x.name, pid: x.pid, color: x.color, cat: x.cat })) }), 250);
  }
  function setChanged() { L.key = ''; render(); clearTimeout(L.sp); L.sp = setTimeout(() => act({ t: 'settings', s: Object.assign({}, L.set) }), 250); }

  function head(S, cur, pl) {
    const sd = S.sides[pl.side];
    return `<header class="qbar"><button class="barb" id="lx" aria-label="End or leave the live game">${icon('close')}</button>
      <div class="qtitle"><b>${esc(S.set.name)}</b><span>Live game ${esc(L.code)}. ${roundText(S, cur)}</span></div>
      <div class="qmini">${S.sides.map(s => `<span style="--c:${s.color}"><i></i>${esc(s.short)} <b>${s.score}</b></span>`).join('')}</div>
      <div class="qwho">${avatar(pl.name, pl.color)}<b>${esc(pl.name)}</b></div>
      <div class="qscore"><b>${sd.score}</b><span>${S.teams ? esc(sd.short) : 'points'}</span></div></header>`;
  }
  function board(S) {
    const goal = S.set.win === 'points' ? S.set.n : Math.max(1, ...S.sides.map(s => s.score));
    return `<div class="sboard">${S.sides.slice().sort((a, b) => b.score - a.score).map(s => `<div class="srow" style="--c:${s.color}"><span class="sname"><i></i>${esc(s.name)}</span><span class="sbar"><em style="width:${Math.min(100, 100 * s.score / goal)}%"></em></span><b>${s.score}</b></div>`).join('')}</div>`;
  }
  function game(S) {
    const cur = S.turns[S.i], pl = S.plist[cur.pl], it = cur.q, sd = S.sides[pl.side];
    const gl = S.phase === 'glean' ? S.sides[S.glean.side] : null;
    const activeDev = gl ? gl.dev : pl.dev, mine = activeDev === L.dev;
    const fin = isFinal(S, cur);
    if (S.phase === 'ask' && mine && L.ui.ready !== S.i) {
      $('#v-quiz').innerHTML = `<div class="pass"><p class="kicker">${esc(S.set.name)}. ${roundText(S, cur)}</p>
        ${fin ? '<p class="dbl">Final round. Every point counts double.</p>' : ''}
        ${avatar(pl.name, pl.color, 'big')}<h1>${esc(pl.name)}'s turn</h1>
        <p class="lede">${S.teams ? `Playing for the ${esc(sd.name)}. ` : ''}${esc(CATS[it.c].name)} question.</p>
        <button class="btn gold" id="lready">I'm ready</button>${board(S)}
        <button class="btn ghost light" id="lend">End the game for everyone</button></div>`;
      $('#lready').onclick = () => { L.ui.ready = S.i; L.ui.t0 = performance.now(); render(); };
      $('#lend').onclick = endGame;
      return;
    }
    const opts = optsFor(S, S.i, it), timed = S.phase === 'ask' && mine && S.set.timer && TIMED[it.c];
    const last = S.last || {};
    const canPick = mine && (S.phase === 'ask' || S.phase === 'glean');
    const cls = o => {
      if (S.phase === 'reveal') return o === it.a[0] ? 'right' : (o === last.wrong || o === last.wrong2) ? 'wrong' : '';
      if (S.phase === 'glean') return o === last.wrong ? 'wrong' : '';
      return '';
    };
    let fb = '';
    if (S.phase === 'ask' && !mine) fb = `<div class="fb wait"><div class="fbtext"><b>${esc(pl.name)} is answering on the other phone or iPad.</b><span>${S.teams ? 'The ' + esc(sd.name) + ' has this question.' : ''}</span></div></div>`;
    if (S.phase === 'glean') fb = mine
      ? `<div class="fb steal"><div class="fbtext"><b class="no">${last.choice == null ? 'Time is up.' : 'Not quite.'} Time to glean!</b><span>${S.teams ? 'The ' + esc(gl.name) : esc(gl.name)}: glean the right answer for ${S.glean.pts} points, as Ruth gleaned in the barley field.</span></div><button class="btn ghost" id="lleave">Leave it</button></div>`
      : `<div class="fb wait"><div class="fbtext"><b class="no">${last.choice == null ? 'Time is up.' : 'Not quite.'}</b><span>${S.teams ? 'The ' : ''}${esc(gl.name)} can glean this question on the other phone or iPad.</span></div></div>`;
    if (S.phase === 'reveal') {
      const msg = last.gleaned === 1 ? `${S.teams ? 'The ' : ''}${esc(S.sides[S.glean.side].name)} gleaned ${S.glean.pts} points!`
        : last.right ? `${esc(pl.name)} is right! +${last.pts} points` : last.gleaned != null ? 'No one got it this time.' : last.choice == null ? 'Time is up.' : 'Not quite.';
      const ok = last.right || last.gleaned === 1;
      fb = `<div class="fb"><div class="fbtext"><b class="${ok ? 'ok' : 'no'}">${msg}</b><span>${ok ? '' : 'The answer is ' + esc(it.a[0]) + '. '}${esc(it.note || '')}</span>${links(it)}</div>
        <button class="btn gold" id="lnext">${over(S) ? 'See the results' : 'Next question'}</button></div>`;
      if (L.ui.toned !== S.i) { L.ui.toned = S.i; ok ? tone([784, 1047], 0.08, 0.06) : tone([330, 262], 0.12, 0.05); }
    }
    $('#v-quiz').innerHTML = head(S, cur, pl) + `<main class="qmain"><div class="qcard qc-${it.c}">
      <div class="qchips"><span class="chip">${esc(CATS[it.c].name)}</span>${TYPE[it.t] ? `<span class="chip soft">${TYPE[it.t]}</span>` : ''}${fin ? '<span class="chip hot">Double points</span>' : ''}${pl.streak >= 3 ? `<span class="chip hot">${pl.streak} in a row</span>` : ''}</div>
      ${timed ? '<div class="tbar"><i id="tfill"></i></div>' : ''}
      <h2 class="qq">${esc(it.q)}</h2>
      <div class="opts n${opts.length}">${opts.map((o, k) => `<button class="opt ${cls(o)}" data-o="${esc(o)}" ${canPick && !(S.phase === 'glean' && o === last.wrong) ? '' : 'disabled'}><span class="ol">${'ABCD'[k]}</span><span class="ot">${esc(o)}</span></button>`).join('')}</div>
      ${fb}</div></main>`;
    $('#lx').onclick = () => confirmLeave(S);
    const sendT = S.i;
    $$('.opt:not([disabled])').forEach(b => b.onclick = () => {
      if (L.ui.sent === S.phase + S.i) return; L.ui.sent = S.phase + S.i;
      $$('.opt').forEach(x => { x.disabled = true; }); b.classList.add('picked');
      act(S.phase === 'glean' ? { t: 'glean', turn: sendT, choice: b.dataset.o } : { t: 'ans', turn: sendT, choice: b.dataset.o, ms: Math.round(performance.now() - (L.ui.t0 || performance.now())) });
    });
    if ($('#lleave')) $('#lleave').onclick = () => { if (L.ui.sent === 'leave' + S.i) return; L.ui.sent = 'leave' + S.i; act({ t: 'leave', turn: sendT }); };
    if ($('#lnext')) $('#lnext').onclick = e => { e.target.disabled = true; act({ t: 'next', turn: sendT }); };
    if (timed) {
      const fill = $('#tfill'), t0 = L.ui.t0 || performance.now();
      (function tick(now) {
        if (!fill.isConnected || L.ui.sent === 'ask' + sendT) return;
        const left = 1 - (now - t0) / (TIME * 1000);
        fill.style.transform = `scaleX(${Math.max(0, left)})`; fill.classList.toggle('low', left < 0.3);
        if (left <= 0) { L.ui.sent = 'ask' + sendT; $$('.opt').forEach(x => { x.disabled = true; }); act({ t: 'ans', turn: sendT, choice: null, ms: TIME * 1000 }); return; }
        L.ui.raf = requestAnimationFrame(tick);
      })(performance.now());
    }
  }
  function results(S) {
    const r = ranked(S), winners = r.filter(s => s.place === 0);
    const people = S.plist.filter(p => p.n), awards = [];
    if (people.length) {
      const sharp = people.slice().sort((a, b) => b.right / b.n - a.right / a.n || b.right - a.right)[0];
      if (sharp.right) awards.push(['Sharpest mind', sharp.name, `${sharp.right} of ${sharp.n} right`]);
      const streak = people.slice().sort((a, b) => b.best - a.best)[0];
      if (streak.best >= 3) awards.push(['Longest streak', streak.name, `${streak.best} right in a row`]);
    }
    const gl = S.sides.slice().sort((a, b) => b.steals - a.steals)[0];
    if (gl && gl.steals) awards.push(['Best gleaner', gl.name, `${gl.steals} ${gl.steals === 1 ? 'answer' : 'answers'} gleaned`]);
    if (!L.ui.cheered) { L.ui.cheered = true; tone([523, 659, 784, 1047], 0.11, 0.07); }
    const missed = S.plist.filter(p => p.dev === L.dev).flatMap(p => p.missed);
    $('#v-quiz').innerHTML = `<div class="qres"><p class="kicker">${esc(S.set.name)}. Live game ${esc(L.code)}</p>
      <h1>${winners.length > 1 ? 'It\'s a draw!' : (S.teams ? 'The ' : '') + esc(winners[0].name) + ' wins!'}</h1>
      <div class="podium">${r.map(s => `<div class="pod ${s.place === 0 ? 'first' : ''}">${s.place < 3 ? `<span class="medal m${s.place}">${MEDAL[s.place]}</span>` : ''}${avatar(s.name, s.color)}<b>${esc(s.name)}</b><span>${s.score} points</span><em>${S.teams ? esc(s.members.map(m => S.plist[m].name).join(', ')) : `${S.plist[s.members[0]].right} of ${S.plist[s.members[0]].n} right`}</em></div>`).join('')}</div>
      ${awards.length ? `<div class="awards">${awards.map(a => `<div class="award"><span>${a[0]}</span><b>${esc(a[1])}</b><em>${a[2]}</em></div>`).join('')}</div>` : ''}
      <div class="row center"><button class="btn gold" id="lboard">Family scoreboard</button><button class="btn ghost light" id="lhome">Back to the quiz</button></div>
      ${missed.length ? `<h2>Questions to look at again</h2><div class="missed">${missed.map(it => `<div class="miss"><b>${esc(it.q)}</b><span>${esc(it.a[0])}</span>${links(it, 'light')}</div>`).join('')}</div>` : ''}</div>`;
    $('#lhome').onclick = () => stop();
    $('#lboard').onclick = () => { stop(); Q.scoreboardPanel(); };
  }
  function endGame() {
    const o = overlay(`<h2>End the game for everyone?</h2><p class="lede dark">The scores so far decide the winner, on every phone and iPad.</p><div class="row end"><button class="btn ghost" data-k>Keep playing</button><button class="btn primary" data-s>End the game</button></div>`);
    o.onclick = e => { if (e.target.closest('[data-k]')) closeOverlay(); if (e.target.closest('[data-s]')) { closeOverlay(); act({ t: 'end' }); } };
  }
  function confirmLeave(S) {
    const o = overlay(`<h2>End or leave the game?</h2><p class="lede dark">Ending the game shows the results on every phone and iPad. Leaving only closes it on this ${DEV}.</p>
      <div class="row end"><button class="btn ghost" data-k>Keep playing</button><button class="btn ghost" data-l>Leave on this ${DEV}</button><button class="btn primary" data-s>End for everyone</button></div>`);
    o.onclick = e => { if (e.target.closest('[data-k]')) closeOverlay(); if (e.target.closest('[data-l]')) { closeOverlay(); stop(); } if (e.target.closest('[data-s]')) { closeOverlay(); act({ t: 'end' }); } };
  }
  function leave() {
    if (!L) return;
    const o = overlay(`<h2>Leave the live game?</h2><p class="lede dark">You can join again with game number ${esc(L.code)} while the Pencilwise window is open on the PC.</p><div class="row end"><button class="btn ghost" data-k>Stay</button><button class="btn primary" data-s>Leave</button></div>`);
    o.onclick = e => { if (e.target.closest('[data-k]')) closeOverlay(); if (e.target.closest('[data-s]')) { closeOverlay(); stop(); } };
  }
  function stop() {
    if (L) { clearTimeout(L.pt); clearTimeout(L.pp); clearTimeout(L.sp); cancelAnimationFrame(L.ui.raf); }
    L = null; conn(''); C.viewHome('quiz');
  }

  /* ---------- starting or joining ---------- */
  function open(err, keepWords) {
    const words = keepWords != null ? keepWords : defaultWords();
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Live on phones and iPads</h2>
      <ol class="howto"><li>On your PC, double-click <b>Start Pencilwise</b> in the pencilwise folder, and wait for the words to appear.</li><li>Type those words below, on each phone or iPad.</li><li>One phone or iPad starts the game. The other joins with the game number.</li></ol>
      <div class="set"><span><b>Words from the PC</b><em>For example: bright-river-tune-lamp</em></span><input id="lwords" class="tin" value="${esc(words)}" autocomplete="off" autocapitalize="none" spellcheck="false"></div>
      ${err ? `<p class="err">${esc(err)}</p>` : ''}
      <div class="choose">
        <button class="chz live" data-l="new"><b>Start a live game</b><span>You choose the rules. The others join with a game number.</span></button>
        <div class="chz"><b>Join a live game</b><span>Type the game number shown on the other phone or iPad.</span><div class="codein"><input id="lcode" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off"><button class="btn gold" data-l="join">Join</button></div></div>
      </div>`, 'wide');
    o.onclick = async e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      const b = e.target.closest('[data-l]'); if (!b || b.disabled) return;
      const typed = $('#lwords').value.trim(), base = baseFrom(typed);
      if (!base) return open('Type the words shown on the PC first.', typed);
      const st = C.state(); st.liveWords = typed; save();
      const code = ($('#lcode').value || '').replace(/\D/g, '');
      b.disabled = true; b.classList.add('wait');
      const ping = await api(base, '/live/ping');
      if (!ping.ok) return open('Could not reach the PC. Check the words, and that the Pencilwise window is open on the PC.', typed);
      L = { base, code: null, dev: devId(), log: [], S: null, ui: {}, done: 0, fails: 0, recorded: false, key: '', guest: '', typing: false, set: Object.assign({}, DEF) };
      L.people = st.profiles.map(p => ({ name: p.name, pid: p.id, color: p.color, cat: defaultCat(p), on: p.id === st.current }));
      if (b.dataset.l === 'new') {
        const r = await api(base, '/live/new', {});
        if (!r.ok) { L = null; return open('The PC could not start a game. Try again.', typed); }
        L.code = r.code; L.set.timer = qp(C.state().profiles.find(p => p.id === st.current) || { quiz: {} }).timer !== false;
        L.S = replay([]);
        closeOverlay(); show('v-quiz');
        await act({ t: 'host', qsig: QSIG });
        await act({ t: 'settings', s: Object.assign({}, L.set) });
      } else {
        if (code.length !== 4) { L = null; return open('Type the 4-digit game number from the other phone or iPad.', typed); }
        L.code = code;
        const r = await api(base, '/live/' + code + '?since=0');
        if (!r.ok) { L = null; return open(r.status === 404 ? 'There is no game with that number. Check the number on the other phone or iPad.' : 'Could not reach the PC. Try again.', typed); }
        L.log = r.actions; L.S = replay(L.log);
        if (L.S.qsig && L.S.qsig !== QSIG) { L = null; return open('The phones and iPads have different versions of Pencilwise. Update every phone and iPad, then try again.', typed); }
        if (L.S.started && !L.S.devs.includes(L.dev)) { L = null; return open('That game has already started without you.', typed); }
        if (L.S.host === L.dev) L.set = Object.assign({}, L.S.set);
        const had = L.S.players[L.dev];
        if (had && had.length) L.people.forEach(x => { const h = had.find(y => y.pid && y.pid === x.pid); x.on = !!h; if (h) x.cat = h.cat; });
        closeOverlay(); show('v-quiz');
        L.done = L.log.length; update();
        if (!L.S.devs.includes(L.dev)) await act({ t: 'join' });
      }
      if (!L.S.started) mineChanged();
      poll();
    };
    $('#lcode').onkeydown = e => { if (e.key === 'Enter') o.querySelector('[data-l=join]').click(); };
  }

  window.PWLive = { open, _replay: replay, _baseFrom: baseFrom, state: () => L };
})();
