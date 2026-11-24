/* Pencilwise Bible quiz: categories, solo play, family game, Who am I? and the Bible journey. */
(function () {
  'use strict';
  const C = window.PWCore, D = window.PW_QUIZ_DATA;
  const { DEV, $, $$, esc, icon, stars, overlay, closeOverlay, toast, show, me, save, tone } = C;
  const CATS = {
    k: { name: 'Kids', desc: 'Short questions about favourite Bible accounts. Three answers to pick from, and no timer.', who: 'Ages 4 to 7' },
    kc: { name: 'Kids challenge', desc: 'Harder questions on the accounts in Lessons You Can Learn From the Bible. Four answers, and no timer.', who: 'Ages 8 to 12' },
    g: { name: 'General', desc: 'People, places and events from Genesis to Revelation. Good for the whole family.', who: 'Everyone' },
    f: { name: 'Fun', desc: 'True or false, who said it, odd one out and Bible numbers.', who: 'Everyone' },
    h: { name: 'Hard', desc: 'Names, places and details from the Bible accounts, for those who know their Bible well.', who: 'Teens and adults' },
    x: { name: 'Expert', desc: 'Bible writers, kings, dates, money, measures and the Hebrew calendar, from Insight on the Scriptures and the tables in the New World Translation.', who: 'Adults' }
  };
  const TYPE = { tf: 'True or false', who: 'Who said it?', odd: 'Odd one out', num: 'Bible numbers' };
  const PER_GAME = 10, TIME = 20;
  const lfbUrl = n => 'https://wol.jw.org/en/wol/d/r1/lp-e/' + (1102016010 + n);
  const bibleUrl = ref => { const m = String(ref).match(/^(.+?)\s+(\d+)/); return m ? 'https://www.jw.org/en/library/bible/nwt/books/' + m[1].toLowerCase().replace(/\s+/g, '-') + '/' + m[2] + '/' : null; };
  function links(it, cls = '') {
    const o = [];
    if (it.ref) o.push(`<a class="jwl ${cls}" href="${bibleUrl(it.ref)}" target="_blank" rel="noopener">${icon('book')}Read ${esc(it.ref)} on jw.org</a>`);
    if (it.lfb) o.push(`<a class="jwl ${cls}" href="${lfbUrl(it.lfb)}" target="_blank" rel="noopener">${icon('book')}Lesson ${it.lfb} on jw.org</a>`);
    if (it.src) o.push(`<a class="jwl ${cls}" href="${it.src[1]}" target="_blank" rel="noopener">${icon('book')}${esc(it.src[0])}</a>`);
    return o.length ? `<div class="jwrow">${o.join('')}</div>` : '';
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const defaultCat = p => p.band === 'little' ? 'k' : p.band === 'junior' ? 'kc' : 'h';
  function qp(p) {
    p.quiz = p.quiz || {};
    const q = p.quiz;
    q.best = q.best || {}; q.seen = q.seen || {}; q.journey = q.journey || {};
    q.answered = q.answered || 0; q.correct = q.correct || 0; q.games = q.games || 0;
    if (q.timer == null) q.timer = p.band !== 'little';
    return q;
  }
  function pick(pool, n, seen) {
    const s = shuffle(pool);
    s.sort((a, b) => (seen && seen[a.id] ? 1 : 0) - (seen && seen[b.id] ? 1 : 0));
    return s.slice(0, n);
  }
  const starsFor = pct => pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;

  /* ---------------- quiz home ---------------- */
  function render(m) {
    const p = me(), q = qp(p);
    const doneEras = D.eras.filter(e => q.journey[e.id]).length;
    const pct = q.answered ? Math.round(100 * q.correct / q.answered) : 0;
    m.innerHTML = `<div class="page quizhome">
      <div class="qhead"><div><h1 class="pagetitle">Bible quiz</h1>
        <p class="lede dark">The questions come from the Bible, <a href="https://www.jw.org/en/library/books/bible-stories-lessons" target="_blank" rel="noopener">Lessons You Can Learn From the Bible</a>, Insight on the Scriptures and other publications on jw.org. After each answer you can open the source on jw.org.</p></div>
        <div class="qstat"><b>${q.correct}</b><span>right answers${q.answered ? `, ${pct}% of ${q.answered}` : ''}</span></div></div>
      <h2>Choose a category</h2>
      <div class="cats">${Object.entries(CATS).map(([k, c]) => {
        const n = D.questions.filter(x => x.c === k).length, best = q.best[k];
        return `<button class="cat cat-${k} ${k === defaultCat(p) ? 'mine' : ''}" data-cat="${k}"><span class="cname">${c.name}</span><span class="cwho">${c.who}</span><span class="cdesc">${c.desc}</span>
          <span class="cfoot"><span>${n} questions</span><span>${best != null ? 'Best ' + best + ' of ' + PER_GAME : 'Not played yet'}</span></span></button>`;
      }).join('')}</div>
      <h2>More ways to play</h2>
      <div class="ways">
        <button class="way comp" data-way="family"><span class="wic">${icon('people')}</span><b>Family competition</b><span>Play for points, alone or in teams. Everyone answers at their own level, with gleaning, a final double round and medals.</span></button>
        <button class="way" data-way="board"><span class="wic">${icon('star')}</span><b>Family scoreboard</b><span>Gold, silver and bronze medals, and the results of recent competitions.</span></button>
        <button class="way" data-way="who"><span class="wic">${icon('quiz')}</span><b>Who am I?</b><span>Clues about a Bible character appear one at a time. Guess early for more points.</span></button>
        <button class="way" data-way="journey"><span class="wic">${icon('map')}</span><b>Bible journey</b><span>Travel from creation to Revelation in eight stops. ${doneEras} of 8 finished.</span></button>
      </div>
      <label class="set qtimer"><span><b>Timer</b><em>${TIME} seconds per question in Fun, Hard and Expert. Kids questions never have a timer.</em></span><input type="checkbox" id="qtimer" ${q.timer ? 'checked' : ''}><i></i></label>
      <p class="fine">Links open jw.org when the ${DEV} is online. The quiz itself works without the internet.</p></div>`;
    m.onclick = e => {
      const c = e.target.closest('[data-cat]'); if (c) return startSolo(c.dataset.cat);
      const w = e.target.closest('[data-way]'); if (!w) return;
      if (w.dataset.way === 'family') compChooser();
      if (w.dataset.way === 'board') scoreboardPanel();
      if (w.dataset.way === 'who') startWho();
      if (w.dataset.way === 'journey') journeyPanel();
    };
    $('#qtimer').onchange = e => { q.timer = e.target.checked; save(); };
  }

  /* ---------------- game engine ---------------- */
  let G = null;
  const TIMED = { f: 1, h: 1, x: 1 };
  const sideOf = pl => G.sides ? G.sides[pl.side] : pl;
  function startSolo(cat) {
    const p = me(), q = qp(p);
    const qs = pick(D.questions.filter(x => x.c === cat), PER_GAME, q.seen);
    begin({ kind: 'solo', title: CATS[cat].name, cat, players: [{ name: p.name, pid: p.id, color: p.color, cat }], turns: qs.map(x => ({ pl: 0, q: x })), timer: q.timer });
  }
  function begin(cfg) {
    G = Object.assign({ i: 0, locked: false, sides: null }, cfg);
    G.players.forEach(pl => { pl.score = 0; pl.right = 0; pl.n = 0; pl.streak = 0; pl.best = 0; pl.missed = []; pl.steals = 0; });
    if (G.sides) G.sides.forEach(s => { s.score = 0; s.steals = 0; });
    show('v-quiz');
    if (G.players.length > 1) passScreen(); else turn();
  }
  const isFinal = t => G.comp && G.comp.double && G.comp.win === 'rounds' && t.round === G.comp.n - 1;
  const roundText = t => G.comp.win === 'rounds' ? `Round ${t.round + 1} of ${G.comp.n}` : `Round ${t.round + 1}. First to ${G.comp.n} points`;
  function head() {
    const t = G.turns[G.i], pl = G.players[t.pl], sd = sideOf(pl);
    return `<header class="qbar"><button class="barb" id="qx" aria-label="Stop the quiz">${icon('close')}</button>
      <div class="qtitle"><b>${esc(G.title)}</b><span>${G.comp ? roundText(t) : `Question ${G.i + 1} of ${G.turns.length}`}</span></div>
      ${G.comp ? `<div class="qmini">${G.sides.map(s => `<span style="--c:${s.color}"><i></i>${esc(s.short || s.name)} <b>${s.score}</b></span>`).join('')}</div>` : `<div class="qdots">${G.turns.map((_, k) => `<i class="${k < G.i ? 'done' : k === G.i ? 'cur' : ''}"></i>`).join('')}</div>`}
      ${G.players.length > 1 ? `<div class="qwho"><span class="avatar" style="--c:${pl.color}">${esc(pl.name[0].toUpperCase())}</span><b>${esc(pl.name)}</b></div>` : ''}
      <div class="qscore"><b id="qpts">${sd.score}</b><span>${G.comp && G.teams ? esc(sd.short) : 'points'}</span></div></header>`;
  }
  function board() {
    const top = Math.max(1, ...G.sides.map(s => s.score)), goal = G.comp.win === 'points' ? G.comp.n : top;
    return `<div class="sboard">${G.sides.slice().sort((a, b) => b.score - a.score).map(s => `<div class="srow" style="--c:${s.color}"><span class="sname"><i></i>${esc(s.name)}</span><span class="sbar"><em style="width:${Math.min(100, 100 * s.score / goal)}%"></em></span><b>${s.score}</b></div>`).join('')}</div>`;
  }
  function passScreen() {
    const t = G.turns[G.i], pl = G.players[t.pl];
    if (!G.comp) {
      $('#v-quiz').innerHTML = `<div class="pass"><span class="avatar big" style="--c:${pl.color}">${esc(pl.name[0].toUpperCase())}</span>
        <h1>${esc(pl.name)}'s turn</h1><p class="lede">Pass the ${DEV} to ${esc(pl.name)}. ${esc(CATS[t.q.c].name)} question.</p>
        <button class="btn gold" id="qready">I'm ready</button>
        <div class="board">${G.players.map(x => `<span><i style="--c:${x.color}"></i>${esc(x.name)} <b>${x.score}</b></span>`).join('')}</div>
        <button class="btn ghost light" id="qstop">Stop the game</button></div>`;
    } else {
      const sd = sideOf(pl), fin = isFinal(t);
      $('#v-quiz').innerHTML = `<div class="pass"><p class="kicker">${esc(G.title)}. ${roundText(t)}</p>
        ${fin ? '<p class="dbl">Final round. Every point counts double.</p>' : ''}
        <span class="avatar big" style="--c:${pl.color}">${esc(pl.name[0].toUpperCase())}</span>
        <h1>${esc(pl.name)}'s turn</h1><p class="lede">${G.teams ? `Playing for the ${esc(sd.name)}. ` : ''}${esc(CATS[t.q.c].name)} question. Pass the ${DEV} to ${esc(pl.name)}.</p>
        <button class="btn gold" id="qready">I'm ready</button>
        ${board()}
        <button class="btn ghost light" id="qstop">End the game now</button></div>`;
    }
    $('#qready').onclick = turn;
    $('#qstop').onclick = () => finish(true);
  }
  let timerRaf = 0;
  function turn() {
    cancelAnimationFrame(timerRaf);
    const t = G.turns[G.i], it = t.q, pl = G.players[t.pl];
    const opts = it.t === 'tf' ? ['True', 'False'] : shuffle(it.a.slice(0, it.c === 'k' ? 3 : 4));
    const timed = G.timer && TIMED[it.c];
    G.locked = false; G.stealing = null;
    $('#v-quiz').innerHTML = head() + `<main class="qmain"><div class="qcard qc-${it.c}">
        <div class="qchips"><span class="chip">${esc(CATS[it.c].name)}</span>${TYPE[it.t] ? `<span class="chip soft">${TYPE[it.t]}</span>` : ''}${isFinal(t) ? '<span class="chip hot">Double points</span>' : ''}${pl.streak >= 3 ? `<span class="chip hot">${pl.streak} in a row</span>` : ''}</div>
        ${timed ? '<div class="tbar"><i id="tfill"></i></div>' : ''}
        <h2 class="qq">${esc(it.q)}</h2>
        <div class="opts n${opts.length}">${opts.map((o, k) => `<button class="opt" data-o="${esc(o)}"><span class="ol">${'ABCD'[k]}</span><span class="ot">${esc(o)}</span></button>`).join('')}</div>
        <div class="fb" id="fb" hidden></div></div></main>`;
    $('#qx').onclick = () => confirmStop();
    $$('.opt').forEach(b => b.onclick = () => G.stealing ? stealAnswer(b.dataset.o, b) : answer(b.dataset.o, b));
    if (timed) {
      const t0 = performance.now(), fill = $('#tfill');
      G.t0 = t0;
      (function tick(now) {
        if (G.locked || !fill.isConnected) return;
        const left = 1 - (now - t0) / (TIME * 1000);
        fill.style.transform = `scaleX(${Math.max(0, left)})`;
        fill.classList.toggle('low', left < 0.3);
        if (left <= 0) return answer(null, null);
        timerRaf = requestAnimationFrame(tick);
      })(t0);
    } else G.t0 = null;
  }
  function answer(choice, btn) {
    if (G.locked) return; G.locked = true; cancelAnimationFrame(timerRaf);
    const t = G.turns[G.i], it = t.q, pl = G.players[t.pl], right = choice === it.a[0], mult = isFinal(t) ? 2 : 1;
    pl.n++;
    let pts = 0;
    if (right) {
      pl.right++; pl.streak++; pl.best = Math.max(pl.best, pl.streak);
      pts = 10;
      if (G.t0) pts += Math.round(5 * Math.max(0, 1 - (performance.now() - G.t0) / (TIME * 1000)));
      if (pl.streak >= 3) pts += 2;
      pts *= mult; pl.score += pts; if (G.sides) sideOf(pl).score += pts;
      tone([784, 1047], 0.08, 0.06);
    } else { pl.streak = 0; pl.missed.push(it); tone([330, 262], 0.12, 0.05); }
    $('#qpts').textContent = sideOf(pl).score;
    if (pl.pid) { const p = C.state().profiles.find(x => x.id === pl.pid); if (p) { const q = qp(p); q.seen[it.id] = 1; q.answered++; if (right) q.correct++; save(); } }
    if (!right && G.comp && G.comp.steal && G.sides.length > 1 && it.t !== 'tf') return offerSteal(choice, btn, mult);
    reveal(right ? `Correct! +${pts} points` : choice == null ? 'Time is up.' : 'Not quite.', right, btn);
  }
  function offerSteal(choice, btn, mult) {
    const t = G.turns[G.i], pl = G.players[t.pl], to = G.sides[(pl.side + 1) % G.sides.length];
    G.stealing = { side: to, mult, pts: 5 * mult };
    if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
    const fb = $('#fb'); fb.hidden = false; fb.classList.add('steal');
    fb.innerHTML = `<div class="fbtext"><b class="no">${choice == null ? 'Time is up.' : 'Not quite.'} Time to glean!</b>
      <span>Pass the ${DEV} to ${G.teams ? 'the ' : ''}${esc(to.name)}. Glean the right answer for ${G.stealing.pts} points, as Ruth gleaned in the barley field.</span></div>
      <button class="btn ghost" id="qnosteal">Leave it</button>`;
    $('#qnosteal').onclick = () => { G.stealing = null; fb.classList.remove('steal'); reveal('No one got it this time.', false, null); };
    G.locked = false;
  }
  function stealAnswer(choice, btn) {
    if (G.locked || !G.stealing) return; G.locked = true;
    const it = G.turns[G.i].q, s = G.stealing, ok = choice === it.a[0];
    $('#fb').classList.remove('steal'); G.stealing = null;
    if (ok) { s.side.score += s.pts; s.side.steals++; tone([660, 880, 1175], 0.08, 0.06); }
    else tone([330, 262], 0.12, 0.05);
    reveal(ok ? `${G.teams ? 'The ' : ''}${s.side.name} gleaned ${s.pts} points!` : 'No one got it this time.', ok, ok ? null : btn);
  }
  function reveal(msg, ok, btn) {
    G.locked = true;
    const it = G.turns[G.i].q, last = !G.comp ? G.i === G.turns.length - 1 : gameOverAfter(G.i);
    $$('.opt').forEach(b => { b.disabled = true; if (b.dataset.o === it.a[0]) b.classList.add('right'); else if (b === btn) b.classList.add('wrong'); });
    const fb = $('#fb'); fb.hidden = false;
    fb.innerHTML = `<div class="fbtext"><b class="${ok ? 'ok' : 'no'}">${esc(msg)}</b>
      <span>${ok ? '' : 'The answer is ' + esc(it.a[0]) + '. '}${esc(it.note)}</span>${links(it)}</div>
      <button class="btn gold" id="qnext">${last ? 'See the results' : 'Next question'}</button>`;
    if (G.comp) $('.qmini') && ($('.qmini').outerHTML = `<div class="qmini">${G.sides.map(s => `<span style="--c:${s.color}"><i></i>${esc(s.short || s.name)} <b>${s.score}</b></span>`).join('')}</div>`);
    $('#qnext').onclick = next;
    $('#qnext').focus({ preventScroll: true });
  }
  /* a competition ends after the last round, or at the end of the round in which someone reaches the target */
  function gameOverAfter(i) {
    const t = G.turns[i];
    if (i < G.turns.length - 1) return false;
    if (G.comp.win === 'rounds') return t.round >= G.comp.n - 1;
    return G.sides.some(s => s.score >= G.comp.n) || t.round >= 29;
  }
  function next() {
    if (G.comp) {
      if (gameOverAfter(G.i)) return finish(false);
      if (G.i >= G.turns.length - 1) G.turns.push(...compRound(G.turns[G.i].round + 1));
    } else if (G.i >= G.turns.length - 1) return finish(false);
    const prev = G.turns[G.i].pl; G.i++;
    if (G.players.length > 1 && G.turns[G.i].pl !== prev) passScreen(); else turn();
  }
  function confirmStop() {
    const o = overlay(`<h2>${G.comp ? 'End the game?' : 'Stop the quiz?'}</h2><p class="lede dark">${G.comp ? 'The scores so far decide the winner.' : 'Your answers so far still count towards your progress.'}</p><div class="row end"><button class="btn ghost" data-k>Keep playing</button><button class="btn primary" data-s>${G.comp ? 'End the game' : 'Stop'}</button></div>`);
    o.onclick = e => { if (e.target.closest('[data-k]')) closeOverlay(); if (e.target.closest('[data-s]')) { closeOverlay(); if (G && G.comp) finish(true); else { cancelAnimationFrame(timerRaf); G = null; C.viewHome('quiz'); } } };
  }
  function finish(stopped) {
    cancelAnimationFrame(timerRaf);
    const g = G; if (!g) return;
    const solo = g.players.length === 1 && !g.comp, pl = g.players[0];
    g.players.forEach(x => {
      if (!x.pid) return; const p = C.state().profiles.find(y => y.id === x.pid); if (!p) return;
      const q = qp(p); q.games++;
      if (g.kind === 'solo' && !stopped && x.n === PER_GAME) q.best[g.cat] = Math.max(q.best[g.cat] || 0, x.right);
      if (g.kind === 'journey' && !stopped && x.n) { const s = starsFor(x.right / x.n); if (s >= 2) q.journey[g.era] = Math.max(q.journey[g.era] || 0, s); }
    });
    save();
    if (g.comp && g.comp.match) return matchResults(g);
    if (solo) {
      const pct = pl.n ? pl.right / pl.n : 0, st = starsFor(pct);
      if (st) tone([523, 659, 784, 1047], 0.11, 0.07);
      const msg = g.kind === 'journey' ? (st >= 2 ? 'Stop finished. On to the next part of the journey.' : 'Get at least 70% to finish this stop. Read the lessons on jw.org, then try again.') : (st === 3 ? 'Excellent. You know these accounts well.' : st === 2 ? 'Well done.' : 'Keep going. Reading the accounts on jw.org will help.');
      $('#v-quiz').innerHTML = `<div class="qres"><p class="kicker">${esc(g.title)}</p><h1>${pl.right} of ${pl.n} right</h1><div class="bigstars">${stars(st)}</div>
        <p class="lede">${pl.score} points. ${msg}</p>
        <div class="row center"><button class="btn gold" id="qagain">Play again</button><button class="btn ghost light" id="qhome">Back to the quiz</button></div>
        ${missedHTML(g)}</div>`;
    } else compResults(g);
    $('#qhome').onclick = () => { G = null; C.viewHome('quiz'); };
    $('#qagain').onclick = () => {
      if (g.kind === 'solo') startSolo(g.cat);
      else if (g.kind === 'journey') startJourney(g.era);
      else startComp(g.setup);
    };
  }
  const missedHTML = g => g.players.some(x => x.missed.length) ? `<h2>Questions to look at again</h2><div class="missed">${g.players.flatMap(x => x.missed).map(it => `<div class="miss"><b>${esc(it.q)}</b><span>${esc(it.a[0])}</span>${links(it, 'light')}</div>`).join('')}</div>` : '';
  const MEDAL = ['Gold', 'Silver', 'Bronze'];
  function compResults(g) {
    const ranked = g.sides.slice().sort((a, b) => b.score - a.score);
    let place = 0; ranked.forEach((s, k) => { if (k && s.score < ranked[k - 1].score) place = k; s.place = place; });
    const winners = ranked.filter(s => s.place === 0);
    const people = g.players.filter(x => x.n);
    const awards = [];
    if (people.length) {
      const sharp = people.slice().sort((a, b) => b.right / b.n - a.right / a.n || b.right - a.right)[0];
      if (sharp.right) awards.push(['Sharpest mind', sharp.name, `${sharp.right} of ${sharp.n} right`]);
      const streak = people.slice().sort((a, b) => b.best - a.best)[0];
      if (streak.best >= 3) awards.push(['Longest streak', streak.name, `${streak.best} right in a row`]);
    }
    const thief = g.sides.slice().sort((a, b) => b.steals - a.steals)[0];
    if (thief && thief.steals) awards.push(['Best gleaner', thief.name, `${thief.steals} ${thief.steals === 1 ? 'answer' : 'answers'} gleaned`]);
    if (g.players.some(x => x.n)) {
      const fam = family();
      fam.history.unshift({ id: 'g' + Date.now().toString(36), at: Date.now(), name: g.title, teams: !!g.teams, results: ranked.map(s => ({ name: s.name, score: s.score, place: s.place, members: s.members.map(m => g.players[m].name) })) });
      fam.history = fam.history.slice(0, 80); save();
    }
    tone([523, 659, 784, 1047], 0.11, 0.07);
    $('#v-quiz').innerHTML = `<div class="qres"><p class="kicker">${esc(g.title)}</p>
      <h1>${winners.length > 1 ? 'It\'s a draw!' : (g.teams ? 'The ' : '') + esc(winners[0].name) + ' wins!'}</h1>
      <div class="podium">${ranked.map(s => `<div class="pod ${s.place === 0 ? 'first' : ''}" style="--c:${s.color}">${s.place < 3 ? `<span class="medal m${s.place}">${MEDAL[s.place]}</span>` : ''}
        <span class="avatar" style="--c:${s.color}">${esc(s.name[0].toUpperCase())}</span><b>${esc(s.name)}</b><span>${s.score} points</span>
        <em>${g.teams ? esc(s.members.map(m => g.players[m].name).join(', ')) : `${g.players[s.members[0]].right} of ${g.players[s.members[0]].n} right`}</em></div>`).join('')}</div>
      ${awards.length ? `<div class="awards">${awards.map(a => `<div class="award"><span>${a[0]}</span><b>${esc(a[1])}</b><em>${a[2]}</em></div>`).join('')}</div>` : ''}
      <div class="row center"><button class="btn gold" id="qagain">Play again</button><button class="btn ghost light" id="qboard">Family scoreboard</button><button class="btn ghost light" id="qhome">Back to the quiz</button></div>
      ${missedHTML(g)}</div>`;
    $('#qboard').onclick = () => { G = null; C.viewHome('quiz'); scoreboardPanel(); };
  }

  /* ---------------- family competition ---------------- */
  const TEAMS = [['Blue team', 'Blue', '#3F6FD0'], ['Gold team', 'Gold', '#C9982E'], ['Green team', 'Green', '#2E9E7A'], ['Red team', 'Red', '#D9573F']];
  const GC = ['#7D8494', '#B67B50', '#3F8FD0', '#8A55C8', '#C2577F', '#4E9A8F'];
  function family() { const st = C.state(); st.family = st.family || {}; st.family.setups = st.family.setups || []; st.family.history = st.family.history || []; return st.family; }
  function newSetup() {
    const st = C.state();
    return { id: null, name: 'Family competition', teams: false, nteams: 2, people: st.profiles.map((p, i) => ({ name: p.name, pid: p.id, color: p.color, cat: defaultCat(p), team: i % 2, on: true })), win: 'rounds', n: 5, steal: true, double: true, timer: qp(me()).timer, keep: false };
  }
  function familySetup(from) {
    const st = C.state(), fam = family();
    const S = from ? JSON.parse(JSON.stringify(from)) : newSetup();
    st.profiles.forEach(p => { if (!S.people.some(x => x.pid === p.id)) S.people.push({ name: p.name, pid: p.id, color: p.color, cat: defaultCat(p), team: 0, on: false }); });
    S.people = S.people.filter(x => !x.pid || st.profiles.some(p => p.id === x.pid));
    let guest = '';
    const draw = () => {
      const on = S.people.filter(x => x.on);
      const teamsUsed = new Set(on.map(x => x.team % S.nteams));
      const ready = S.teams ? on.length >= 2 && teamsUsed.size >= 2 : on.length >= 1;
      const lvl = (x, i) => `<select class="lvsel" data-lvl="${i}">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${x.cat === k ? 'selected' : ''}>${c.name}</option>`).join('')}</select>`;
      const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Family competition</h2>
        <p class="lede dark">Everyone answers questions at their own level, so young and old can play together. Take turns on this ${DEV}.</p>
        ${fam.setups.length ? `<div class="saved"><b>Your saved games</b><div class="savedrow">${fam.setups.map((s, i) => `<span class="sgame ${S.id === s.id ? 'on' : ''}"><button data-load="${i}">${esc(s.name)}</button><button class="del" data-del="${i}" aria-label="Delete ${esc(s.name)}">${icon('close')}</button></span>`).join('')}</div></div>` : ''}
        <div class="set"><span><b>Name of the game</b></span><input id="cname" class="tin" maxlength="28" value="${esc(S.name)}" autocomplete="off"></div>
        <div class="set"><span><b>How to play</b></span><div class="seg" data-mode><button class="${!S.teams ? 'on' : ''}" data-v="0">Each person for themselves</button><button class="${S.teams ? 'on' : ''}" data-v="1">In teams</button></div></div>
        ${S.teams ? `<div class="set"><span><b>Number of teams</b></span><div class="seg" data-nt>${[2, 3, 4].map(n => `<button class="${S.nteams === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>` : ''}
        <h3 class="sub">Who is playing</h3>
        <div class="who-pick">${S.people.map((x, i) => `<button class="pchip ${x.on ? 'on' : ''}" data-tog="${i}"><span class="avatar" style="--c:${x.color}">${esc(x.name[0].toUpperCase())}</span>${esc(x.name)}${x.pid ? '' : '<em>guest</em>'}</button>`).join('')}</div>
        <div class="addguest"><input id="gname" maxlength="14" placeholder="Add a guest player" autocomplete="off" autocapitalize="words" value="${esc(guest)}"><button class="btn ghost small" data-add>${icon('plus')}Add</button></div>
        ${on.length ? `<div class="levels">${S.people.map((x, i) => x.on ? `<div class="lvrow"><b>${esc(x.name)}</b><span class="lvctl">${lvl(x, i)}${S.teams ? `<span class="seg tseg" data-team="${i}">${TEAMS.slice(0, S.nteams).map((tm, k) => `<button class="${x.team % S.nteams === k ? 'on' : ''}" data-v="${k}" style="--c:${tm[2]}"><i></i>${tm[1]}</button>`).join('')}</span>` : ''}</span></div>` : '').join('')}</div>` : ''}
        <h3 class="sub">Scoring</h3>
        <div class="set"><span><b>The game ends</b><em>${S.win === 'rounds' ? 'After a set number of rounds. In each round everyone, or every team, gets one question.' : 'At the end of the round in which someone reaches the target, so everyone gets the same number of turns.'}</em></span><div class="seg" data-win><button class="${S.win === 'rounds' ? 'on' : ''}" data-v="rounds">After rounds</button><button class="${S.win === 'points' ? 'on' : ''}" data-v="points">First to a score</button></div></div>
        <div class="set"><span><b>${S.win === 'rounds' ? 'Rounds' : 'Target score'}</b></span><div class="seg" data-n>${(S.win === 'rounds' ? [3, 5, 10] : [30, 50, 100]).map(n => `<button class="${S.n === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>
        <p class="rules">A right answer scores 10 points. Three or more right in a row adds 2 more. With the timer on, quick answers add up to 5 bonus points.</p>
        <label class="set"><span><b>Gleaning</b><em>Like Ruth gathering the barley left behind in the field (Ruth 2:2), after a wrong answer the next ${S.teams ? 'team' : 'player'} can glean the same question for 5 points.</em></span><input type="checkbox" id="csteal" ${S.steal ? 'checked' : ''}><i></i></label>
        ${S.win === 'rounds' ? `<label class="set"><span><b>Double points in the final round</b></span><input type="checkbox" id="cdouble" ${S.double ? 'checked' : ''}><i></i></label>` : ''}
        <label class="set"><span><b>Timer</b><em>${TIME} seconds for Fun, Hard and Expert questions.</em></span><input type="checkbox" id="ctimer" ${S.timer ? 'checked' : ''}><i></i></label>
        <label class="set"><span><b>Save this game</b><em>Keep these players and settings, to play again another day.</em></span><input type="checkbox" id="ckeep" ${S.keep || S.id ? 'checked' : ''}><i></i></label>
        <div class="row end"><button class="btn ghost" data-x>Cancel</button><button class="btn gold" data-go ${ready ? '' : 'disabled'}>Start the competition</button></div>
        ${!ready ? `<p class="fine">${S.teams ? 'Put players in at least two different teams.' : 'Choose at least one player.'}</p>` : ''}`, 'wide');
      o.onclick = e => {
        if (e.target.closest('[data-x]')) return closeOverlay();
        const ld = e.target.closest('[data-load]'); if (ld) { Object.assign(S, JSON.parse(JSON.stringify(fam.setups[+ld.dataset.load]))); return familySetup(S); }
        const dl = e.target.closest('[data-del]'); if (dl) { const s = fam.setups.splice(+dl.dataset.del, 1)[0]; if (s && s.id === S.id) S.id = null; save(); return draw(); }
        const tg = e.target.closest('[data-tog]'); if (tg) { const x = S.people[+tg.dataset.tog]; if (x.pid) x.on = !x.on; else S.people.splice(+tg.dataset.tog, 1); return draw(); }
        if (e.target.closest('[data-add]')) { const n = $('#gname').value.trim(); if (n) { const k = S.people.filter(x => !x.pid).length; S.people.push({ name: n, pid: null, color: GC[k % GC.length], cat: 'g', team: S.people.filter(x => x.on).length % S.nteams, on: true }); guest = ''; draw(); } return; }
        const sg = (sel, fn) => { const b = e.target.closest(sel + ' button'); if (b) { fn(b.dataset.v, b.parentNode); draw(); return true; } };
        if (sg('[data-mode]', v => { S.teams = v === '1'; S.people.forEach((x, i) => { x.team = i % S.nteams; }); })) return;
        if (sg('[data-nt]', v => { S.nteams = +v; })) return;
        if (sg('[data-team]', (v, p) => { S.people[+p.dataset.team].team = +v; })) return;
        if (sg('[data-win]', v => { S.win = v; S.n = v === 'rounds' ? 5 : 50; })) return;
        if (sg('[data-n]', v => { S.n = +v; })) return;
        if (e.target.closest('[data-go]')) {
          S.name = ($('#cname').value.trim() || 'Family competition').slice(0, 28);
          if ($('#ckeep').checked) { if (!S.id) S.id = 's' + Date.now().toString(36); const k = fam.setups.findIndex(x => x.id === S.id); const copy = JSON.parse(JSON.stringify(S)); if (k >= 0) fam.setups[k] = copy; else fam.setups.unshift(copy); fam.setups = fam.setups.slice(0, 12); }
          save(); closeOverlay(); startComp(S);
        }
      };
      $('#cname').oninput = e => { S.name = e.target.value; };
      $('#gname').oninput = e => { guest = e.target.value; };
      $('#gname').onkeydown = e => { if (e.key === 'Enter') o.querySelector('[data-add]').click(); };
      $$('[data-lvl]', o).forEach(s => s.onchange = () => { S.people[+s.dataset.lvl].cat = s.value; });
      $('#csteal').onchange = e => { S.steal = e.target.checked; };
      if ($('#cdouble')) $('#cdouble').onchange = e => { S.double = e.target.checked; };
      $('#ctimer').onchange = e => { S.timer = e.target.checked; };
    };
    draw();
  }
  function startComp(S) {
    const on = S.people.filter(x => x.on);
    const players = on.map(x => ({ name: x.name, pid: x.pid, color: x.color, cat: x.cat, side: 0 }));
    let sides;
    if (S.teams) {
      sides = [];
      TEAMS.slice(0, S.nteams).forEach((tm, k) => {
        const mem = []; on.forEach((x, i) => { if (x.team % S.nteams === k) mem.push(i); });
        if (mem.length) { mem.forEach(i => { players[i].side = sides.length; }); sides.push({ name: tm[0], short: tm[1], color: tm[2], members: mem }); }
      });
    } else sides = players.map((p, i) => { p.side = i; return { name: p.name, short: p.name, color: p.color, members: [i] }; });
    G = null;
    const cfg = { kind: 'comp', title: S.name, teams: !!S.teams, players, sides, turns: [], timer: S.timer, setup: S, comp: { win: S.win, n: S.n, steal: S.steal, double: S.double }, used: new Set(), pools: {} };
    G = Object.assign({ i: 0 }, cfg);
    cfg.turns = compRound(0);
    begin(cfg);
  }
  /* one round: each side answers once, and team members take turns from round to round */
  function compRound(r) {
    const out = [];
    G.sides.forEach(sd => {
      const m = sd.members[r % sd.members.length], pl = G.players[m];
      const q = drawQ(pl); if (q) out.push({ pl: m, q, round: r });
    });
    return out;
  }
  function drawQ(pl) {
    const prof = pl.pid && C.state().profiles.find(p => p.id === pl.pid), seen = prof ? qp(prof).seen : {};
    let pool = G.pools[pl.cat];
    if (!pool || !pool.length) pool = G.pools[pl.cat] = pick(D.questions.filter(x => x.c === pl.cat && !G.used.has(x.id)), 999, seen);
    if (!pool.length) pool = G.pools[pl.cat] = shuffle(D.questions.filter(x => x.c === pl.cat));
    const k = Math.max(0, pool.findIndex(x => !seen[x.id]));
    const q = pool.splice(k, 1)[0]; if (q) G.used.add(q.id);
    return q;
  }
  function scoreboardPanel() {
    const fam = family(), tally = new Map();
    fam.history.forEach(h => h.results.forEach(r => r.members.forEach(n => {
      const t = tally.get(n) || { name: n, games: 0, m: [0, 0, 0], pts: 0 };
      t.games++; if (r.place < 3) t.m[r.place]++; tally.set(n, t);
    })));
    const rows = [...tally.values()].sort((a, b) => b.m[0] - a.m[0] || b.m[1] - a.m[1] || b.m[2] - a.m[2] || b.games - a.games);
    const day = ts => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Family scoreboard</h2>
      ${rows.length ? `<p class="lede dark">Medals won in family competitions on this ${DEV}. In team games, everyone in the team shares the medal.</p>
      <table class="ltable"><thead><tr><th>Player</th><th>Gold</th><th>Silver</th><th>Bronze</th><th>Games</th></tr></thead>
      <tbody>${rows.map((r, k) => `<tr class="${k === 0 ? 'lead' : ''}"><td>${esc(r.name)}</td><td>${r.m[0]}</td><td>${r.m[1]}</td><td>${r.m[2]}</td><td>${r.games}</td></tr>`).join('')}</tbody></table>
      <h3 class="sub">Recent games</h3>
      <div class="hist">${fam.history.slice(0, 12).map(h => `<div class="hrow"><span class="hd">${day(h.at)}</span><b>${esc(h.name)}</b><span>${h.results.map(r => `${r.place === 0 ? '<i class="crown"></i>' : ''}${esc(r.name)} ${r.score}`).join(', ')}</span></div>`).join('')}</div>`
      : '<p class="lede dark">No competitions yet. Start a family competition, and the medals will be counted here.</p>'}
      <div class="row end"><button class="btn gold" data-new>Start a competition</button></div>`, 'wide');
    o.onclick = e => { if (e.target.closest('[data-x]')) return closeOverlay(); if (e.target.closest('[data-new]')) { closeOverlay(); familySetup(); } };
  }
  /* backups carry the family's saved games and competition history */
  function familyData() { const f = family(); return { setups: f.setups, history: f.history }; }
  function mergeFamily(src) {
    if (!src) return; const f = family();
    (src.setups || []).forEach(s => { if (s && s.id && !f.setups.some(x => x.id === s.id)) f.setups.push(s); });
    (src.history || []).forEach(h => { if (h && h.id && !f.history.some(x => x.id === h.id)) f.history.push(h); });
    f.history.sort((a, b) => b.at - a.at); f.history = f.history.slice(0, 80); f.setups = f.setups.slice(0, 12);
  }

  /* ---------------- choosing how to play a competition ---------------- */
  function compChooser() {
    const fam = family();
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Family competition</h2>
      <p class="lede dark">Choose where everyone is playing.</p>
      <div class="choose">
        <button class="chz" data-c="here"><b>On this ${DEV}</b><span>Everyone takes turns on one ${DEV}. Play alone or in teams.</span></button>
        <button class="chz live" data-c="live"><b>Live on phones and iPads</b><span>Phones and iPads link up through your PC, and scores update on all of them. Needs the internet and the Pencilwise window open on the PC.</span></button>
        <button class="chz" data-c="match"><b>Phones and iPads, no internet</b><span>Each phone or iPad plays as a team. Swap short codes at the end to see who won. Good for travelling.</span></button>
      </div>
      ${fam.pending ? `<p class="fine">You have a match from ${new Date(fam.pending.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} waiting for result codes. Choose Phones and iPads, no internet to finish it.</p>` : ''}`, 'wide');
    o.onclick = e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      const c = e.target.closest('[data-c]'); if (!c) return;
      closeOverlay();
      if (c.dataset.c === 'here') familySetup();
      if (c.dataset.c === 'live') window.PWLive && window.PWLive.open();
      if (c.dataset.c === 'match') matchPanel();
    };
  }

  /* ---------------- two iPads without internet: match codes ----------------
     The match code carries the settings, so both iPads play the same number of rounds with the same rules.
     Each iPad plays as one team. At the end each iPad shows a result code to type into the other. */
  const AL = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const enc = (n, len) => { let s = ''; for (let k = 0; k < len; k++) { s = AL[n % 32] + s; n = Math.floor(n / 32); } return s; };
  const dec = s => { let n = 0; for (const ch of s) { const v = AL.indexOf(ch); if (v < 0) return null; n = n * 32 + v; } return n; };
  const chk = n => { let s = 0; while (n > 0) { s += n % 16; n = Math.floor(n / 16); } return s % 16; };
  const clean = s => String(s || '').toUpperCase().replace(/[\s-]+/g, '');
  const RN = [3, 5, 10];
  function matchCode(m) { const p = ((RN.indexOf(m.n) * 2 + (m.double ? 1 : 0)) * 2 + (m.timer ? 1 : 0)) * 4194304 + m.id; const c = enc(p * 16 + chk(p), 6); return c.slice(0, 3) + '-' + c.slice(3); }
  function readMatch(code) {
    const s = clean(code); if (s.length !== 6) return null; const v = dec(s); if (v == null) return null;
    const p = Math.floor(v / 16); if (chk(p) !== v % 16) return null;
    const id = p % 4194304, f = Math.floor(p / 4194304), ri = f >> 2; if (ri > 2) return null;
    return { id, n: RN[ri], double: !!(f & 2), timer: !!(f & 1) };
  }
  function resultCode(r) { const p = (((((r.id % 4096) * 4 + r.col) * 4096 + Math.min(4095, r.score)) * 32 + Math.min(31, r.right)) * 32) + Math.min(31, r.n); const c = enc(p * 16 + chk(p), 8); return c.slice(0, 4) + '-' + c.slice(4); }
  function readResult(code) {
    const s = clean(code); if (s.length !== 8) return null; const v = dec(s); if (v == null) return null;
    const p = Math.floor(v / 16); if (chk(p) !== v % 16) return null;
    const n = p % 32, right = Math.floor(p / 32) % 32, score = Math.floor(p / 1024) % 4096, col = Math.floor(p / 4194304) % 4, mid = Math.floor(p / 16777216);
    return { mid, col, score, right, n };
  }
  function matchPanel() {
    const fam = family(), p = fam.pending;
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Phones and iPads, no internet</h2>
      <p class="lede dark">One phone or iPad starts the match and shows a match code. The other iPad joins with that code. Each phone or iPad then plays as its own team, at the same time.</p>
      <div class="choose">
        <button class="chz" data-m="start"><b>Start a match</b><span>Choose the rules and your team on this ${DEV}. You get a match code for the other phone or iPad.</span></button>
        <button class="chz" data-m="join"><b>Join a match</b><span>Type the match code from the other phone or iPad, then choose your team.</span></button>
        ${p ? `<button class="chz" data-m="finish"><b>Finish the last match</b><span>${esc(TEAMS[p.col][0])}, ${p.score} points. Type result codes from the other phones or iPads.</span></button>` : ''}
      </div>`, 'wide');
    o.onclick = e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      const b = e.target.closest('[data-m]'); if (!b) return;
      if (b.dataset.m === 'start') matchSetup(null);
      if (b.dataset.m === 'join') matchJoin();
      if (b.dataset.m === 'finish') { closeOverlay(); matchResults(null); }
    };
  }
  function matchJoin(err) {
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Join a match</h2>
      <p class="lede dark">Type the match code shown on the other phone or iPad.</p>
      <div class="codein"><input id="mcode" maxlength="9" placeholder="ABC-234" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn gold" data-ok>Next</button></div>
      ${err ? `<p class="err">${esc(err)}</p>` : ''}<p class="fine">Codes use letters and the numbers 2 to 9.</p>`);
    const go = () => { const m = readMatch($('#mcode').value); if (!m) return matchJoin('That code is not right. Check each letter and try again.'); matchSetup(m); };
    o.onclick = e => { if (e.target.closest('[data-x]')) return closeOverlay(); if (e.target.closest('[data-ok]')) go(); };
    $('#mcode').onkeydown = e => { if (e.key === 'Enter') go(); };
    setTimeout(() => $('#mcode') && $('#mcode').focus(), 50);
  }
  function matchSetup(joined) {
    const st = C.state();
    const M = joined ? Object.assign({}, joined) : { id: Math.floor(Math.random() * 4194304), n: 5, double: true, timer: qp(me()).timer };
    let col = joined ? 1 : 0, guest = '';
    const people = st.profiles.map(p => ({ name: p.name, pid: p.id, color: p.color, cat: defaultCat(p), on: p.id === st.current }));
    const draw = () => {
      const on = people.filter(x => x.on);
      const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>${joined ? 'Join match ' + esc(matchCode(M)) : 'Start a match'}</h2>
        ${joined ? `<p class="lede dark">${M.n} rounds${M.double ? ', double points in the final round' : ''}${M.timer ? ', with the timer' : ''}. Choose your team and who is playing on this ${DEV}.</p>` : `<p class="lede dark">Choose the rules, your team colour and who is playing on this ${DEV}.</p>`}
        <div class="set"><span><b>Your team</b><em>Each phone or iPad needs a different colour.</em></span><div class="seg tseg" data-col>${TEAMS.map((tm, k) => `<button class="${col === k ? 'on' : ''}" data-v="${k}" style="--c:${tm[2]}"><i></i>${tm[1]}</button>`).join('')}</div></div>
        <h3 class="sub">Who is playing on this ${DEV}</h3>
        <div class="who-pick">${people.map((x, i) => `<button class="pchip ${x.on ? 'on' : ''}" data-tog="${i}"><span class="avatar" style="--c:${x.color}">${esc(x.name[0].toUpperCase())}</span>${esc(x.name)}${x.pid ? '' : '<em>guest</em>'}</button>`).join('')}</div>
        <div class="addguest"><input id="gname" maxlength="14" placeholder="Add a guest player" autocomplete="off" autocapitalize="words" value="${esc(guest)}"><button class="btn ghost small" data-add>${icon('plus')}Add</button></div>
        ${on.length ? `<div class="levels">${people.map((x, i) => x.on ? `<div class="lvrow"><b>${esc(x.name)}</b><select class="lvsel" data-lvl="${i}">${Object.entries(CATS).map(([k, c]) => `<option value="${k}" ${x.cat === k ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>` : '').join('')}</div>` : ''}
        ${joined ? '' : `<h3 class="sub">Rules for every phone and iPad</h3>
        <div class="set"><span><b>Rounds</b><em>In each round, each phone or iPad answers one question. Team members take turns.</em></span><div class="seg" data-n>${RN.map(n => `<button class="${M.n === n ? 'on' : ''}" data-v="${n}">${n}</button>`).join('')}</div></div>
        <label class="set"><span><b>Double points in the final round</b></span><input type="checkbox" id="mdouble" ${M.double ? 'checked' : ''}><i></i></label>
        <label class="set"><span><b>Timer</b><em>${TIME} seconds for Fun, Hard and Expert questions.</em></span><input type="checkbox" id="mtimer" ${M.timer ? 'checked' : ''}><i></i></label>`}
        <div class="row end"><button class="btn ghost" data-x>Cancel</button><button class="btn gold" data-go ${on.length ? '' : 'disabled'}>${joined ? 'Start playing' : 'Create the match code'}</button></div>`, 'wide');
      o.onclick = e => {
        if (e.target.closest('[data-x]')) return closeOverlay();
        const tg = e.target.closest('[data-tog]'); if (tg) { const x = people[+tg.dataset.tog]; if (x.pid) x.on = !x.on; else people.splice(+tg.dataset.tog, 1); return draw(); }
        if (e.target.closest('[data-add]')) { const n = $('#gname').value.trim(); if (n) { people.push({ name: n, pid: null, color: GC[people.filter(x => !x.pid).length % GC.length], cat: 'g', on: true }); guest = ''; draw(); } return; }
        const cb = e.target.closest('[data-col] button'); if (cb) { col = +cb.dataset.v; return draw(); }
        const nb = e.target.closest('[data-n] button'); if (nb) { M.n = +nb.dataset.v; return draw(); }
        if (e.target.closest('[data-go]')) {
          const players = people.filter(x => x.on);
          if (joined) { closeOverlay(); return startMatch(M, col, players); }
          const code = matchCode(M);
          const o2 = overlay(`<h2>Your match code</h2><p class="bigcode">${code}</p>
            <ol class="howto"><li>On the other phone or iPad, open <b>Bible quiz</b>, then <b>Family competition</b>.</li><li>Choose <b>Phones and iPads, no internet</b>, then <b>Join a match</b>.</li><li>Type <b>${code}</b> and choose a different team colour.</li></ol>
            <div class="row end"><button class="btn gold" data-play>Start playing</button></div>`);
          o2.onclick = ev => { if (ev.target.closest('[data-play]')) { closeOverlay(); startMatch(M, col, players); } };
        }
      };
      $('#gname').oninput = e => { guest = e.target.value; };
      $('#gname').onkeydown = e => { if (e.key === 'Enter') o.querySelector('[data-add]').click(); };
      $$('[data-lvl]', o).forEach(s => s.onchange = () => { people[+s.dataset.lvl].cat = s.value; });
      if ($('#mdouble')) $('#mdouble').onchange = e => { M.double = e.target.checked; };
      if ($('#mtimer')) $('#mtimer').onchange = e => { M.timer = e.target.checked; };
    };
    draw();
  }
  function startMatch(M, col, people) {
    const tm = TEAMS[col];
    const players = people.map(x => ({ name: x.name, pid: x.pid, color: x.color, cat: x.cat, side: 0 }));
    const sides = [{ name: tm[0], short: tm[1], color: tm[2], members: players.map((_, i) => i) }];
    const code = matchCode(M);
    const S = { name: 'Match ' + code, match: { code, id: M.id, col, n: M.n, double: M.double, timer: M.timer }, people: people.map(x => Object.assign({}, x, { on: true })) };
    G = null;
    const cfg = { kind: 'comp', title: tm[0] + '. Match ' + code, teams: true, players, sides, turns: [], timer: M.timer, setup: S, comp: { win: 'rounds', n: M.n, steal: false, double: M.double, match: S.match }, used: new Set(), pools: {} };
    G = Object.assign({ i: 0 }, cfg);
    cfg.turns = compRound(0);
    begin(cfg);
  }
  /* the end of a match on this ${DEV}: show our result code and collect the others */
  function matchResults(g, err) {
    const fam = family();
    if (g) {
      const sd = g.sides[0], right = g.players.reduce((s, x) => s + x.right, 0), n = g.players.reduce((s, x) => s + x.n, 0);
      fam.pending = { code: g.comp.match.code, id: g.comp.match.id, col: g.comp.match.col, score: sd.score, right, n, members: g.players.map(x => x.name), at: Date.now(), others: [], hid: 'm' + Date.now().toString(36) };
      save();
    }
    const p = fam.pending; if (!p) return C.viewHome('quiz');
    const mine = resultCode({ id: p.id, col: p.col, score: p.score, right: p.right, n: p.n });
    const all = [{ col: p.col, score: p.score, right: p.right, n: p.n, members: p.members, me: true }].concat(p.others);
    const ranked = all.slice().sort((a, b) => b.score - a.score);
    let place = 0; ranked.forEach((s, k) => { if (k && s.score < ranked[k - 1].score) place = k; s.place = place; });
    const done = p.others.length > 0;
    if (done) {
      const entry = { id: p.hid, at: p.at, name: 'Match ' + p.code, teams: true, results: ranked.map(s => ({ name: TEAMS[s.col][0], score: s.score, place: s.place, members: s.members || [] })) };
      const k = fam.history.findIndex(h => h.id === p.hid); if (k >= 0) fam.history[k] = entry; else fam.history.unshift(entry);
      fam.history = fam.history.slice(0, 80); save();
    }
    show('v-quiz');
    $('#v-quiz').innerHTML = `<div class="qres"><p class="kicker">Match ${esc(p.code)}</p>
      ${done ? `<h1>${ranked.filter(s => s.place === 0).length > 1 ? 'It\'s a draw!' : 'The ' + esc(TEAMS[ranked[0].col][0]) + ' wins!'}</h1>
        <div class="podium">${ranked.map(s => `<div class="pod ${s.place === 0 ? 'first' : ''}">${s.place < 3 ? `<span class="medal m${s.place}">${MEDAL[s.place]}</span>` : ''}<span class="avatar" style="--c:${TEAMS[s.col][2]}">${TEAMS[s.col][1][0]}</span><b>${esc(TEAMS[s.col][0])}</b><span>${s.score} points</span><em>${s.right} of ${s.n} right${s.me ? '. This ' + DEV : ''}</em></div>`).join('')}</div>`
      : `<h1>${esc(TEAMS[p.col][0])}: ${p.score} points</h1><p class="lede">${p.right} of ${p.n} right. Now swap result codes with the other phone or iPad.</p>`}
      <div class="swap">
        <div class="swapbox"><span>Your result code. Type it on the other phone or iPad.</span><b class="bigcode">${mine}</b></div>
        <div class="swapbox"><span>Result code from ${done ? 'another' : 'the other'} phone or iPad</span><div class="codein"><input id="rcode" maxlength="9" placeholder="ABCD-2345" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn gold" id="radd">Add</button></div>${err ? `<p class="err">${esc(err)}</p>` : ''}</div>
      </div>
      <div class="row center"><button class="btn gold" id="qboard">Family scoreboard</button><button class="btn ghost light" id="qhome">Back to the quiz</button></div>
      ${g ? missedHTML(g) : ''}</div>`;
    const add = () => {
      const r = readResult($('#rcode').value);
      if (!r) return matchResults(null, 'That code is not right. Check each letter and try again.');
      if (r.mid !== p.id % 4096) return matchResults(null, 'That code is from a different match.');
      if (r.col === p.col) return matchResults(null, 'That phone or iPad played as the same colour as this one. Ask them to check their result code.');
      if (p.others.some(x => x.col === r.col)) return matchResults(null, 'You have already added the ' + TEAMS[r.col][0] + '.');
      p.others.push({ col: r.col, score: r.score, right: r.right, n: r.n, members: [] }); save(); tone([523, 659, 784, 1047], 0.11, 0.07); matchResults(null);
    };
    $('#radd').onclick = add; $('#rcode').onkeydown = e => { if (e.key === 'Enter') add(); };
    $('#qhome').onclick = () => { G = null; C.viewHome('quiz'); };
    $('#qboard').onclick = () => { G = null; C.viewHome('quiz'); scoreboardPanel(); };
  }

  /* ---------------- Who am I? ---------------- */
  let W = null;
  function startWho() {
    const p = me(), n = p.band === 'little' ? 6 : 8, opts = p.band === 'little' ? 3 : 4;
    W = { list: shuffle(D.who).slice(0, n), i: 0, score: 0, right: 0, opts, missed: [] };
    show('v-quiz'); whoTurn();
  }
  function whoTurn() {
    const it = W.list[W.i];
    const others = shuffle(D.who.filter(x => x.name !== it.name && x.g === it.g)).slice(0, W.opts - 1).map(x => x.name);
    W.cur = { it, shown: 1, opts: shuffle([it.name, ...others]), wrong: new Set(), done: false };
    whoDraw();
  }
  function whoDraw() {
    const c = W.cur, it = c.it, pts = Math.max(0, 6 - c.shown);
    $('#v-quiz').innerHTML = `<header class="qbar"><button class="barb" id="qx" aria-label="Stop">${icon('close')}</button>
      <div class="qtitle"><b>Who am I?</b><span>Character ${W.i + 1} of ${W.list.length}</span></div>
      <div class="qdots">${W.list.map((_, k) => `<i class="${k < W.i ? 'done' : k === W.i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="qscore"><b>${W.score}</b><span>points</span></div></header>
      <main class="qmain"><div class="qcard whocard">
        <div class="qchips"><span class="chip">Who am I?</span><span class="chip soft">${c.done ? 'Answered' : pts + (pts === 1 ? ' point' : ' points') + ' if you guess now'}</span></div>
        <ol class="clues">${it.clues.map((cl, k) => `<li class="${k < c.shown || c.done ? 'on' : ''}">${k < c.shown || c.done ? esc(cl) : 'Hidden clue'}</li>`).join('')}</ol>
        <div class="opts n${c.opts.length}">${c.opts.map((o, k) => `<button class="opt ${c.wrong.has(o) ? 'wrong' : ''} ${c.done && o === it.name ? 'right' : ''}" data-o="${esc(o)}" ${c.done || c.wrong.has(o) ? 'disabled' : ''}><span class="ol">${'ABCD'[k]}</span><span class="ot">${esc(o)}</span></button>`).join('')}</div>
        ${c.done ? `<div class="fb"><div class="fbtext"><b class="${c.got ? 'ok' : 'no'}">${c.got ? 'Correct! I am ' + esc(it.name) + '.' : 'I am ' + esc(it.name) + '.'}</b>${links(it)}</div><button class="btn gold" id="wnext">${W.i === W.list.length - 1 ? 'See the results' : 'Next character'}</button></div>`
          : `<div class="row center"><button class="btn ghost" id="wclue" ${c.shown >= 5 ? 'disabled' : ''}>Show the next clue</button></div>`}
      </div></main>`;
    $('#qx').onclick = () => { W = null; C.viewHome('quiz'); };
    $$('.opt').forEach(b => b.onclick = () => whoGuess(b.dataset.o));
    const wc = $('#wclue'); if (wc) wc.onclick = () => { c.shown = Math.min(5, c.shown + 1); whoDraw(); };
    const wn = $('#wnext'); if (wn) wn.onclick = () => { if (W.i < W.list.length - 1) { W.i++; whoTurn(); } else whoEnd(); };
  }
  function whoGuess(name) {
    const c = W.cur;
    if (name === c.it.name) { const pts = Math.max(1, 6 - c.shown); W.score += pts; W.right++; c.done = true; c.got = true; tone([784, 1047], 0.08, 0.06); }
    else {
      c.wrong.add(name); tone([330, 262], 0.12, 0.05);
      if (c.shown >= 5 || c.wrong.size >= c.opts.length - 1) { c.done = true; c.got = false; W.missed.push(c.it); }
      else c.shown++;
    }
    whoDraw();
  }
  function whoEnd() {
    const p = me(), q = qp(p); q.best.who = Math.max(q.best.who || 0, W.score); q.games++; save();
    const max = W.list.length * 5, st = starsFor(W.score / max);
    if (st) tone([523, 659, 784, 1047], 0.11, 0.07);
    $('#v-quiz').innerHTML = `<div class="qres"><p class="kicker">Who am I?</p><h1>${W.score} points</h1><div class="bigstars">${stars(st)}</div>
      <p class="lede">You named ${W.right} of ${W.list.length} Bible characters. The fewer clues you need, the more points you get.</p>
      <div class="row center"><button class="btn gold" id="qagain">Play again</button><button class="btn ghost light" id="qhome">Back to the quiz</button></div>
      ${W.missed.length ? `<h2>Characters to read about</h2><div class="missed">${W.missed.map(it => `<div class="miss"><b>${esc(it.name)}</b><span>${esc(it.clues[4])}</span>${links(it, 'light')}</div>`).join('')}</div>` : ''}</div>`;
    $('#qagain').onclick = startWho; $('#qhome').onclick = () => { W = null; C.viewHome('quiz'); };
  }

  /* ---------------- Bible journey ---------------- */
  function journeyPanel() {
    const p = me(), q = qp(p);
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Bible journey</h2>
      <p class="lede dark">Eight stops from creation to Revelation, following the lessons in Lessons You Can Learn From the Bible. Get 70% at a stop to finish it.</p>
      <ol class="journey">${D.eras.map((e, k) => { const s = q.journey[e.id] || 0; return `<li class="${s ? 'done' : ''}"><span class="jn">${k + 1}</span><div class="jt"><b>${esc(e.title)}</b><span>Lessons ${e.from} to ${e.to} <a href="${lfbUrl(e.from)}" target="_blank" rel="noopener">Read on jw.org</a></span></div>${s ? stars(s) : ''}<button class="btn ${s ? 'ghost' : 'primary'} small" data-era="${e.id}">${s ? 'Play again' : 'Start'}</button></li>`; }).join('')}</ol>`, 'wide');
    o.onclick = e => { if (e.target.closest('[data-x]')) return closeOverlay(); const b = e.target.closest('[data-era]'); if (b) { closeOverlay(); startJourney(b.dataset.era); } };
  }
  function startJourney(eraId) {
    const p = me(), q = qp(p), e = D.eras.find(x => x.id === eraId);
    const inEra = D.questions.filter(x => x.lfb && x.lfb >= e.from && x.lfb <= e.to);
    const pref = p.band === 'little' ? ['k'] : p.band === 'junior' ? ['kc', 'g'] : ['g', 'h', 'kc'];
    let qs = pick(inEra.filter(x => pref.includes(x.c)), 8, q.seen);
    if (qs.length < 8) qs = qs.concat(pick(inEra.filter(x => !qs.includes(x)), 8 - qs.length, q.seen));
    qs.sort((a, b) => a.lfb - b.lfb);
    begin({ kind: 'journey', era: eraId, title: e.title, cat: null, players: [{ name: p.name, pid: p.id, color: p.color, cat: null }], turns: qs.map(x => ({ pl: 0, q: x })), timer: q.timer });
  }

  /* ---------------- progress page section ---------------- */
  function progressHTML(p) {
    const q = qp(p), done = D.eras.filter(e => q.journey[e.id]).length;
    return `<h2>Bible quiz</h2><div class="stats"><div class="stat"><b>${q.correct}</b><span>right answers${q.answered ? ' out of ' + q.answered : ''}</span></div><div class="stat"><b>${done}</b><span>of 8 journey stops finished</span></div><div class="stat"><b>${q.best.who || 0}</b><span>best Who am I? score</span></div></div>
      <div class="rows">${Object.entries(CATS).map(([k, c]) => `<div class="lrow"><span>${c.name}</span><em>${q.best[k] != null ? 'Best ' + q.best[k] + ' of ' + PER_GAME : 'Not played yet'}</em></div>`).join('')}</div>`;
  }
  function merge(dst, src) {
    if (!src) return; const q = qp(dst);
    for (const [k, v] of Object.entries(src.best || {})) q.best[k] = Math.max(q.best[k] || 0, v);
    for (const [k, v] of Object.entries(src.journey || {})) q.journey[k] = Math.max(q.journey[k] || 0, v);
    Object.assign(q.seen, src.seen || {});
    q.answered = Math.max(q.answered, src.answered || 0); q.correct = Math.max(q.correct, src.correct || 0); q.games = Math.max(q.games, src.games || 0);
  }

  window.PWQuiz = { render, progressHTML, merge, links, lfbUrl, bibleUrl, familyData, mergeFamily, scoreboardPanel, compChooser,
    _k: { CATS, TYPE, TIME, TIMED, TEAMS, GC, MEDAL, links, family, qp, defaultCat, shuffle, starsFor },
    _start: { startSolo, startWho, startJourney, startComp, familySetup } };
})();
