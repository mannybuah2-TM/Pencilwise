/* Pencilwise app: profiles, home, lessons, studio, gallery, progress. */
(function () {
  'use strict';
  const { lessons: LESSONS, tracks: TRACKS, skills: SKILLS } = window.PW_LESSONS;
  const { Engine, BRUSH, drawArt, lessonPaths } = window.PW;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DEV = /iPhone|iPod/.test(navigator.userAgent) ? 'iPhone' : 'iPad';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = Object.fromEntries(LESSONS.map(l => [l.id, l]));
  const INK = '#2B3040';

  /* ---------- icons ---------- */
  const I = {
    back: 'M15 5l-7 7 7 7', undo: 'M8 7L4 11l4 4M4 11h10a5 5 0 010 10h-3', redo: 'M16 7l4 4-4 4M20 11H10a5 5 0 000 10h3',
    trash: 'M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13', replay: 'M5 13a7 7 0 107-7H7M10 3L7 6l3 3',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    gear: 'M4 7h9M19 7h1M4 17h1M11 17h9M16 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 14.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
    speaker: 'M4 10v4h4l5 4V6L8 10H4zM17 9a4 4 0 010 6', share: 'M12 15V4M8 8l4-4 4 4M5 13v6h14v-6',
    check: 'M5 12l5 5 9-10', plus: 'M12 5v14M5 12h14', next: 'M9 5l7 7-7 7',
    pencil: 'M4 20l1-5L16 4l4 4L9 19l-5 1zM14 6l4 4', pen: 'M12 3l4.5 9L12 21l-4.5-9L12 3zM12 12v9',
    marker: 'M8 21v-4l-1.5-2V4h11v11L16 17v4zM6.5 12h11', crayon: 'M8.5 21V9L12 3l3.5 6v12zM8.5 13h7',
    shader: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 4v16M15 5v14M18 7.5v9', eraser: 'M4 15l9-10 7 6-8 9H8l-4-5zM9 10l7 6',
    learn: 'M4 6l8-3 8 3-8 3-8-3zM7 8v6c2 2 8 2 10 0V8M20 6v7', studio: 'M4 20l1-5L16 4l4 4L9 19l-5 1z',
    gallery: 'M4 5h16v14H4zM4 15l5-5 4 4 3-2 4 3', progress: 'M5 20V10M12 20V4M19 20v-7', people: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M17 11a3 3 0 000-6M18 14c2 .7 3.5 2.6 3.5 5',
    quiz: 'M4 5h16v11H10l-5 4V5zM10 8.6a2 2 0 113 1.7c-.6.4-1 .8-1 1.5M12 13.6v.1', book: 'M4 5.5C6 4.5 9 4.5 12 6c3-1.5 6-1.5 8-.5V19c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5V5.5zM12 6v13.5',
    map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zM9 4v14M15 6v14', picture: 'M4 5h16v14H4zM4 15l5-5 4 4 3-2 4 3M15.5 8.5a1.5 1.5 0 100 .1',
    star: 'M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z', close: 'M6 6l12 12M18 6L6 18', hand: 'M8 12V5.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-4.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1c-2 0-3.3-1-4.3-2.6L4 14.5c-.6-1 .6-2.2 1.7-1.4L8 15'
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${I[n]}"/></svg>`;
  const stars = (n, max = 3) => `<span class="stars" aria-label="${n} of ${max} stars">${Array.from({ length: max }, (_, i) => `<svg class="ic star ${i < n ? 'on' : ''}" viewBox="0 0 24 24"><path d="${I.star}"/></svg>`).join('')}</span>`;

  /* ---------- storage ---------- */
  const LS = 'pencilwise.v1';
  let state = { profiles: [], current: null };
  try { const s = JSON.parse(localStorage.getItem(LS)); if (s && s.profiles) state = s; } catch (_) { }
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(state)); } catch (_) { } };
  const me = () => state.profiles.find(p => p.id === state.current);
  const mem = { art: new Map(), draft: new Map(), pics: new Map() };
  let idb = null;
  const dbReady = new Promise(res => {
    try {
      const rq = indexedDB.open('pencilwise', 2);
      rq.onupgradeneeded = () => { for (const n of ['art', 'draft', 'pics']) if (!rq.result.objectStoreNames.contains(n)) rq.result.createObjectStore(n, { keyPath: 'id' }); };
      rq.onsuccess = () => { idb = rq.result; res(); }; rq.onerror = () => res(); rq.onblocked = () => res();
    } catch (_) { res(); }
  });
  const tx = (store, mode, fn) => dbReady.then(() => new Promise(res => {
    if (!idb) { const r = fn(null); return res(r ? r.result : undefined); }
    try { const t = idb.transaction(store, mode), rq = fn(t.objectStore(store)); t.oncomplete = () => res(rq && rq.result); t.onerror = t.onabort = () => res(undefined); } catch (_) { res(undefined); }
  }));
  const db = {
    put: (s, v) => { mem[s].set(v.id, v); return tx(s, 'readwrite', o => o && o.put(v)); },
    get: (s, k) => tx(s, 'readonly', o => o ? o.get(k) : { result: mem[s].get(k) }).then(v => v || mem[s].get(k)),
    del: (s, k) => { mem[s].delete(k); return tx(s, 'readwrite', o => o && o.delete(k)); },
    all: s => tx(s, 'readonly', o => o ? o.getAll() : { result: [...mem[s].values()] }).then(v => v || [...mem[s].values()])
  };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });

  /* ---------- sound ---------- */
  let actx = null;
  function tone(freqs, gap = 0.09, vol = 0.07) {
    const p = me(); if (p && p.settings.sound === false) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * gap;
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.55);
      });
    } catch (_) { }
  }
  const speak = () => { };
  const hush = () => { try { speechSynthesis.cancel(); } catch (_) { } };

  /* ---------- small UI helpers ---------- */
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2200); }
  function show(id) { $$('.view').forEach(v => v.hidden = v.id !== id); closeOverlay(); }
  function overlay(html, cls = '') { const o = $('#overlay'); o.className = 'overlay ' + cls; o.innerHTML = `<div class="panel">${html}</div>`; o.hidden = false; return o; }
  function closeOverlay() { const o = $('#overlay'); o.hidden = true; o.innerHTML = ''; }
  $('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay' && !e.target.classList.contains('modal')) closeOverlay(); });
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const thumbs = new Map();
  function thumb(lesson) {
    if (thumbs.has(lesson.id)) return thumbs.get(lesson.id);
    const c = document.createElement('canvas'); c.width = 400; c.height = 300;
    drawArt(c.getContext('2d'), lesson, 400, { lw: 2.6 });
    const u = c.toDataURL('image/png'); thumbs.set(lesson.id, u); return u;
  }

  /* ---------- profiles ---------- */
  const BANDS = { little: ['Young artist', 'Ages 4 to 7'], junior: ['Explorer', 'Ages 8 to 12'], studio: ['Artist', 'Teens and adults'] };
  const PCOL = ['#27468C', '#C9982E', '#2E9E7A', '#D9573F', '#8A55C8', '#3F8FD0'];
  function newProfile(name, band, color) {
    return { id: 'p' + Date.now().toString(36), name, band, color, progress: {}, streak: { last: '', count: 0 }, settings: { sound: true, left: false, finger: 'auto', teacher: true, mode: 'trace' } };
  }
  function viewProfiles(adding) {
    show('v-profiles');
    const v = $('#v-profiles');
    if (!state.profiles.length || adding) {
      let band = 'junior', color = PCOL[state.profiles.length % PCOL.length];
      v.innerHTML = `<div class="who">
        <div class="brand"><span class="mark"></span>Pencilwise</div>
        <h1>${state.profiles.length ? 'Add someone new' : 'Learn to draw, one line at a time'}</h1>
        <p class="lede">${state.profiles.length ? 'Everyone keeps their own lessons, stars and gallery.' : 'Tell us who is drawing. Each person keeps their own lessons, stars and gallery, and you can add more people later.'}</p>
        <label class="field">Name<input id="pname" maxlength="16" autocomplete="off" autocapitalize="words" placeholder="First name"></label>
        <div class="field">Lessons to start with<div class="bands">${Object.entries(BANDS).map(([k, b]) => `<button class="band ${k === band ? 'on' : ''}" data-band="${k}"><b>${b[0]}</b><span>${b[1]}</span></button>`).join('')}</div></div>
        <div class="field">Colour<div class="pcols">${PCOL.map(c => `<button class="pcol ${c === color ? 'on' : ''}" data-c="${c}" style="--c:${c}" aria-label="colour"></button>`).join('')}</div></div>
        <div class="row"><button class="btn primary" id="pgo">Start drawing</button>${state.profiles.length ? '<button class="btn ghost" id="pcancel">Cancel</button>' : ''}</div>
        <p class="fine">Every lesson is open to everyone. This only decides what is suggested first.</p>
        <p class="fine">Moving from another copy of Pencilwise? <button class="linkb" id="prestore">Restore from a backup file</button></p></div>`;
      v.onclick = e => {
        const b = e.target.closest('[data-band]'), c = e.target.closest('[data-c]');
        if (b) { band = b.dataset.band; $$('.band', v).forEach(x => x.classList.toggle('on', x === b)); }
        if (c) { color = c.dataset.c; $$('.pcol', v).forEach(x => x.classList.toggle('on', x === c)); }
        if (e.target.closest('#pcancel')) viewProfiles(false);
        if (e.target.closest('#prestore')) pickRestore();
        if (e.target.closest('#pgo')) {
          const name = $('#pname').value.trim() || 'Artist';
          const p = newProfile(name, band, color); state.profiles.push(p); state.current = p.id; save(); viewHome('learn');
        }
      };
      return;
    }
    v.innerHTML = `<div class="who"><div class="brand"><span class="mark"></span>Pencilwise</div><h1>Who is drawing today?</h1>
      <div class="people">${state.profiles.map(p => `<button class="person" data-p="${p.id}"><span class="avatar" style="--c:${p.color}">${esc(p.name[0].toUpperCase())}</span><b>${esc(p.name)}</b><span>${Object.values(p.progress).reduce((s, x) => s + (x.stars || 0), 0)} stars</span></button>`).join('')}
      <button class="person add" id="padd"><span class="avatar">${icon('plus')}</span><b>Add a person</b><span>&nbsp;</span></button></div>
      <div class="row backrow"><button class="btn ghost" id="pbackall">${icon('share')}Back up everyone</button><button class="btn ghost" id="prestore">Restore from a backup file</button></div></div>`;
    v.onclick = e => {
      const p = e.target.closest('[data-p]');
      if (p) { state.current = p.dataset.p; save(); viewHome('learn'); }
      if (e.target.closest('#padd')) viewProfiles(true);
      if (e.target.closest('#pbackall')) backupPanel(state.profiles.map(x => x.id));
      if (e.target.closest('#prestore')) pickRestore();
    };
  }

  /* ---------- home ---------- */
  function pathFor(band) {
    const t = id => LESSONS.filter(l => l.track === id).map(l => l.id);
    const zip = (a, b) => { const o = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) o.push(a[i]); if (b[i]) o.push(b[i]); } return o; };
    const bib = lv => LESSONS.filter(l => l.track === 'bible' && l.level === lv).map(l => l.id);
    if (band === 'little') return [...zip(bib('little'), t('first')), ...t('steps'), ...bib('junior'), ...t('school')];
    if (band === 'junior') return [...zip(bib('junior'), zip(t('school'), t('steps'))), ...bib('little'), ...t('studio')];
    return [...t('school').slice(0, 4), ...zip(t('school').slice(4), t('studio')), ...bib('junior'), ...t('steps')];
  }
  const nextLesson = p => byId[pathFor(p.band).find(id => !p.progress[id]) || pathFor(p.band)[0]];
  let heroRaf = 0, homeTab = 'learn';
  function viewHome(tab) {
    const p = me(); if (!p) return viewProfiles();
    homeTab = tab || homeTab; hush(); show('v-home');
    document.body.classList.toggle('left', !!p.settings.left);
    const tabs = [['learn', 'Learn'], ['studio', 'Free drawing'], ['quiz', 'Bible quiz'], ['gallery', 'Gallery'], ['progress', 'Progress']];
    $('#rail').innerHTML = `<div class="brand"><span class="mark"></span><span class="bt">Pencilwise</span></div>
      ${tabs.map(([k, t]) => `<button class="navb ${k === homeTab ? 'on' : ''}" data-tab="${k}">${icon(k)}<span>${t}</span></button>`).join('')}
      <div class="grow"></div>
      <button class="navb" data-tab="settings">${icon('gear')}<span>Settings</span></button>
      <button class="navb who" data-tab="who"><span class="avatar" style="--c:${p.color}">${esc(p.name[0].toUpperCase())}</span><span>${esc(p.name)}</span></button>`;
    $('#rail').onclick = e => {
      const b = e.target.closest('[data-tab]'); if (!b) return;
      const k = b.dataset.tab;
      if (k === 'who') viewProfiles(); else if (k === 'settings') settingsPanel(); else if (k === 'studio') openStudio(); else viewHome(k);
    };
    cancelAnimationFrame(heroRaf);
    const m = $('#main'); m.scrollTop = 0;
    if (homeTab === 'gallery') return renderGallery(m);
    if (homeTab === 'progress') return renderProgress(m);
    if (homeTab === 'quiz') return window.PWQuiz ? window.PWQuiz.render(m) : null;
    const nl = nextLesson(p), drills = ['lines', 'curves', 'circles', 'ellipses', 'hatch'], warm = byId[drills[Math.floor(Date.now() / 864e5) % drills.length]];
    const doneCount = Object.keys(p.progress).length;
    const ORDER = { little: ['bible', 'first', 'steps', 'school', 'studio'], junior: ['bible', 'steps', 'school', 'studio', 'first'], studio: ['school', 'studio', 'bible', 'steps', 'first'] };
    const order = ORDER[p.band].map(id => TRACKS.find(t => t.id === id));
    const shelf = t => { const ls = LESSONS.filter(l => l.track === t.id); return t.id !== 'bible' ? ls : ls.slice().sort((a, b) => (a.level === (p.band === 'little' ? 'little' : 'junior') ? 0 : 1) - (b.level === (p.band === 'little' ? 'little' : 'junior') ? 0 : 1)); };
    m.innerHTML = `<div class="hero">
        <div class="herotext"><p class="kicker">${doneCount ? 'Next up for ' + esc(p.name) : 'Welcome, ' + esc(p.name)}</p>
          <h1>${esc(nl.title)}</h1>
          <p class="lede">${esc(nl.steps[0].say)} ${nl.steps.length} steps, about ${nl.mins} minutes.</p>
          <div class="row"><button class="btn gold" data-lesson="${nl.id}">Start drawing</button><button class="btn ghost light" data-lesson="${warm.id}">${warm.mins}-minute warm-up: ${esc(warm.title.toLowerCase())}</button></div></div>
        <div class="herosheet"><canvas id="heroc" width="640" height="480"></canvas></div></div>
      ${order.map(t => `<section class="shelf"><div class="shelfhead"><h2>${t.title}</h2><p>${t.blurb}</p></div>
        <div class="tiles">${shelf(t).map((l, i) => { const pr = p.progress[l.id]; return `<button class="tile" data-lesson="${l.id}"><span class="paper"><img alt="" loading="lazy" src="${thumb(l)}"></span><span class="tt"><b>${t.id === 'bible' ? '' : i + 1 + '. '}${esc(l.title)}</b><span>${pr ? stars(pr.stars) : l.mins + ' min'}${l.level ? `<em class="lv">${l.level === 'little' ? 'Young artist' : 'Explorer'}</em>` : ''}</span></span></button>`; }).join('')}</div></section>`).join('')}`;
    m.onclick = e => { const b = e.target.closest('[data-lesson]'); if (b) openLesson(byId[b.dataset.lesson]); };
    const hc = $('#heroc'), hx = hc.getContext('2d'), items = lessonPaths(nl), t0 = performance.now();
    (function loop(now) {
      if (!hc.isConnected || $('#v-home').hidden) return;
      const t = ((now - t0) % 9000) / 9000, prog = Math.min(1, t / 0.62);
      hx.clearRect(0, 0, 640, 480);
      drawArt(hx, nl, 640, { items, progress: prog, lw: 3.4, head: prog < 1 ? '#C9982E' : null });
      heroRaf = requestAnimationFrame(loop);
    })(t0);
  }

  function renderProgress(m) {
    const p = me(), pr = p.progress, total = Object.values(pr).reduce((s, x) => s + (x.stars || 0), 0), done = Object.keys(pr).length;
    const sk = Object.entries(SKILLS).map(([k, name]) => {
      const all = LESSONS.filter(l => l.skill === k), got = all.filter(l => pr[l.id]);
      const v = got.length ? Math.round(got.reduce((s, l) => s + pr[l.id].best, 0) / all.length) : 0;
      return `<div class="skill"><div class="skl"><b>${name}</b><span>${got.length} of ${all.length} lessons</span></div><div class="meter"><i style="width:${v}%"></i></div></div>`;
    }).join('');
    const streak = p.streak.last === today() || p.streak.last === yesterday() ? p.streak.count : 0;
    m.innerHTML = `<div class="page"><h1 class="pagetitle">${esc(p.name)}'s progress</h1>
      <div class="stats"><div class="stat"><b>${total}</b><span>stars earned of ${LESSONS.length * 3}</span></div><div class="stat"><b>${done}</b><span>lessons finished of ${LESSONS.length}</span></div><div class="stat"><b>${streak}</b><span>${streak === 1 ? 'day' : 'days'} in a row</span></div></div>
      <h2>Skills</h2><div class="skills">${sk}</div>
      ${window.PWQuiz ? window.PWQuiz.progressHTML(p) : ''}
      <p class="fine">A skill bar fills as you finish its lessons and raise your scores. Repeat a lesson with less help to score higher.</p>
      ${TRACKS.map(t => `<h2>${t.title}</h2><div class="rows">${LESSONS.filter(l => l.track === t.id).map(l => `<button class="lrow" data-lesson="${l.id}"><span>${esc(l.title)}</span>${pr[l.id] ? stars(pr[l.id].stars) + `<em>${pr[l.id].best}%</em>` : '<em>Not started</em>'}</button>`).join('')}</div>`).join('')}</div>`;
    m.onclick = e => { const b = e.target.closest('[data-lesson]'); if (b) openLesson(byId[b.dataset.lesson]); };
  }
  function yesterday() { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  async function renderGallery(m) {
    const p = me();
    m.innerHTML = `<div class="page"><div class="pagehead"><div><h1 class="pagetitle">${esc(p.name)}'s gallery</h1><p class="fine">${lastBackupText(p)}</p></div><button class="btn ghost" id="gback">${icon('share')}Back up ${esc(p.name)}'s work</button></div><div class="gal" id="gal"></div></div>`;
    $('#gback').onclick = () => backupPanel([p.id]);
    const arts = (await db.all('art')).filter(a => a.pid === p.id).sort((a, b) => b.date - a.date);
    const g = $('#gal'); if (!g) return;
    if (!arts.length) { g.outerHTML = `<div class="empty"><p>Nothing here yet. Every lesson you finish and every free drawing is kept here automatically.</p><button class="btn primary" id="gstart">Open a blank sheet</button></div>`; $('#gstart').onclick = () => openStudio(); return; }
    g.innerHTML = arts.map(a => `<button class="art" data-art="${a.id}"><span class="paper" style="background:${a.paper || '#FBF8F1'}"><img alt="" src="${a.thumb}"></span><b>${esc(a.title)}</b><span>${new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></button>`).join('');
    g.onclick = e => { const b = e.target.closest('[data-art]'); if (b) viewArt(arts.find(a => a.id === b.dataset.art)); };
  }
  function viewArt(a) {
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><div class="artview"><span class="paper big" style="background:${a.paper || '#FBF8F1'}"><img alt="${esc(a.title)}" src="${a.full || a.thumb}"></span>
      <div class="artside"><h2>${esc(a.title)}</h2><p class="fine">${new Date(a.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <button class="btn primary" data-go>Keep drawing</button><button class="btn ghost" data-share>${icon('share')}Share or save picture</button><button class="btn ghost danger" data-del>Delete</button></div></div>`, 'wide');
    let armed = false;
    o.onclick = async e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      if (e.target.closest('[data-go]')) return openStudio(a);
      if (e.target.closest('[data-share]')) return shareArt(a);
      const d = e.target.closest('[data-del]');
      if (d) { if (!armed) { armed = true; d.textContent = 'Tap again to delete for good'; return; } await db.del('art', a.id); closeOverlay(); viewHome('gallery'); toast('Deleted'); }
    };
  }
  async function shareArt(a) {
    try {
      const blob = await (await fetch(a.full || a.thumb)).blob(), file = new File([blob], a.title.replace(/[^\w ]+/g, '') + '.jpg', { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: a.title }); return; }
    } catch (err) { if (err && err.name === 'AbortError') return; }
    overlay(`<button class="x" data-x>${icon('close')}</button><h2>Save this picture</h2><p class="lede dark">Touch and hold the picture, then choose Save to Photos or Share.</p><img class="saveimg" alt="${esc(a.title)}" src="${a.full || a.thumb}">`, 'wide').onclick = e => { if (e.target.closest('[data-x]')) closeOverlay(); };
  }

  function settingsPanel() {
    const p = me(), s = p.settings;
    const tog = (k, label, hint) => `<label class="set"><span><b>${label}</b><em>${hint}</em></span><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><i></i></label>`;
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Settings for ${esc(p.name)}</h2>
      ${tog('sound', 'Sounds', 'A soft chime when a step is finished.')}
      ${tog('teacher', 'Teacher picks my tools', 'Each step chooses the right brush and colour for you.')}
      ${tog('left', 'Left-handed layout', 'Moves the tools to the right so your hand does not cover them.')}
      <div class="set"><span><b>Drawing with a finger</b><em>Automatic lets you use a finger until an Apple Pencil touches the screen, then ignores your palm.</em></span>
        <div class="seg" data-seg="finger">${[['auto', 'Automatic'], ['on', 'Always'], ['off', 'Never']].map(([k, t]) => `<button class="${s.finger === k ? 'on' : ''}" data-v="${k}">${t}</button>`).join('')}</div></div>
      <div class="set"><span><b>Lessons to suggest first</b><em>Every lesson stays open whichever you choose.</em></span>
        <div class="seg" data-seg="band">${Object.entries(BANDS).map(([k, b]) => `<button class="${p.band === k ? 'on' : ''}" data-v="${k}">${b[0]}</button>`).join('')}</div></div>
      <div class="set"><span><b>Back up ${esc(p.name)}'s work</b><em>${lastBackupText(p)} Saves drawings, stars and progress to a file you can restore later, even in a new copy of Pencilwise.</em></span><button class="btn ghost small" data-backup>Back up</button></div>
      <div class="row end"><button class="btn ghost danger" data-remove>Remove ${esc(p.name)}</button><button class="btn primary" data-x>Done</button></div>
      <p class="fine">Pencilwise works without the internet. Nothing you draw leaves this ${DEV}.</p>`);
    let armed = false;
    o.onchange = e => { const k = e.target.dataset.set; if (k) { s[k] = e.target.checked; save(); applySettings(); } };
    o.onclick = e => {
      if (e.target.closest('[data-x]')) { closeOverlay(); if (!$('#v-home').hidden) viewHome(); return; }
      if (e.target.closest('[data-backup]')) return backupPanel([p.id]);
      const sb = e.target.closest('.seg button');
      if (sb) { const seg = sb.parentNode.dataset.seg; if (seg === 'band') p.band = sb.dataset.v; else s[seg] = sb.dataset.v; $$('button', sb.parentNode).forEach(b => b.classList.toggle('on', b === sb)); save(); applySettings(); }
      const r = e.target.closest('[data-remove]');
      if (r) { if (!armed) { armed = true; r.textContent = 'Tap again to remove all progress'; return; } state.profiles = state.profiles.filter(x => x.id !== p.id); state.current = null; save(); closeOverlay(); viewProfiles(); }
    };
  }
  function applySettings() { const p = me(); if (!p) return; document.body.classList.toggle('left', !!p.settings.left); if (eng) eng.fingerDraw = p.settings.finger; }

  /* ---------- backup and restore ---------- */
  function lastBackupText(p) {
    if (!p.lastBackup) return 'Not backed up yet.';
    return 'Last backed up ' + new Date(p.lastBackup).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '.';
  }
  const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  async function shareFile(blob, name) {
    for (const type of ['application/json', 'text/plain']) {
      const f = new File([blob], name, { type });
      let can = false; try { can = !!(navigator.canShare && navigator.canShare({ files: [f] })); } catch (_) { }
      if (!can) continue;
      try { await navigator.share({ files: [f] }); return true; }
      catch (e) { if (e && e.name === 'AbortError') return false; break; }
    }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000); return true;
  }
  async function backupPanel(ids) {
    const people = state.profiles.filter(p => ids.includes(p.id)); if (!people.length) return;
    const all = await db.all('art');
    const data = { app: 'pencilwise', version: 1, exported: Date.now(), people: people.map(p => ({ profile: p, art: all.filter(a => a.pid === p.id) })), family: window.PWQuiz ? window.PWQuiz.familyData() : null };
    const n = data.people.reduce((s, x) => s + x.art.length, 0);
    const one = people.length === 1, who = one ? people[0].name : 'everyone';
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const fname = 'Pencilwise backup - ' + who.replace(/[^\w -]+/g, '') + ' - ' + today() + '.json';
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Back up ${one ? esc(who) + "'s" : "everyone's"} work</h2>
      <p class="lede dark">${one ? '' : esc(people.map(p => p.name).join(', ')) + '. '}${n} ${n === 1 ? 'drawing' : 'drawings'}, plus stars and progress. The file is ${fmtSize(blob.size)}.</p>
      <ol class="howto"><li>Tap <b>Save backup file</b>.</li><li>Choose <b>Save to Files</b>.</li><li>Pick <b>On My iPad</b> or <b>iCloud Drive</b>, then tap <b>Save</b>.</li></ol>
      <div class="row end"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" data-save>${icon('share')}Save backup file</button></div>`);
    o.onclick = async e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      if (!e.target.closest('[data-save]')) return;
      const ok = await shareFile(blob, fname);
      if (!ok) return;
      people.forEach(p => p.lastBackup = Date.now()); save(); closeOverlay(); toast('Backup saved');
      if (!$('#v-home').hidden && homeTab === 'gallery') viewHome('gallery');
      if (!$('#v-profiles').hidden) viewProfiles();
    };
  }
  function pickRestore() { const i = $('#restorein'); i.value = ''; i.click(); }
  $('#restorein').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) restoreFrom(f); });
  async function restoreFrom(file) {
    let d = null; try { d = JSON.parse(await file.text()); } catch (_) { }
    if (!d || d.app !== 'pencilwise' || !Array.isArray(d.people)) return toast('That file is not a Pencilwise backup. Choose a file that starts with "Pencilwise backup".');
    const have = new Set((await db.all('art')).map(a => a.id)), names = []; let added = 0, lastId = null;
    for (const entry of d.people) {
      const src = entry && entry.profile; if (!src || !src.id) continue;
      let p = state.profiles.find(x => x.id === src.id);
      if (!p) {
        const base = newProfile(src.name || 'Artist', src.band || 'junior', src.color || PCOL[0]);
        p = Object.assign(base, src, { settings: Object.assign(base.settings, src.settings || {}), progress: src.progress || {}, streak: src.streak || base.streak });
        state.profiles.push(p);
      } else {
        for (const [id, v] of Object.entries(src.progress || {})) {
          const o = p.progress[id];
          p.progress[id] = o ? { stars: Math.max(o.stars || 0, v.stars || 0), best: Math.max(o.best || 0, v.best || 0), times: Math.max(o.times || 0, v.times || 0), last: Math.max(o.last || 0, v.last || 0) } : v;
        }
        if (src.streak && (src.streak.last || '') > (p.streak.last || '')) p.streak = src.streak;
        if (window.PWQuiz) window.PWQuiz.merge(p, src.quiz);
      }
      for (const a of entry.art || []) if (a && a.id && !have.has(a.id)) { a.pid = p.id; await db.put('art', a); have.add(a.id); added++; }
      names.push(p.name); lastId = p.id;
    }
    if (window.PWQuiz && d.family) window.PWQuiz.mergeFamily(d.family);
    if (!names.length) return toast('That backup file is empty.');
    save();
    toast('Restored ' + names.join(', ') + ': ' + added + (added === 1 ? ' drawing' : ' drawings'));
    if (names.length === 1) { state.current = lastId; save(); viewHome('learn'); } else viewProfiles();
  }

  /* ---------- drawing view (lessons and free drawing) ---------- */
  let eng = null, S = null; // S = session
  const PALETTE = ['#2B3040', '#7D8494', '#FFFFFF', '#7A4A2E', '#E2483F', '#F2811E', '#F2A91E', '#3E9B4F', '#2E9E7A', '#3F8FD0', '#27468C', '#8A55C8', '#E0528A', '#F3C9A8'];
  const PAPERS = [['#FBF8F1', 'Cream'], ['#FFFFFF', 'White'], ['#D9D5CC', 'Grey'], ['#F3E3C3', 'Sand'], ['#23283A', 'Night']];
  function ensureEngine() {
    if (eng) return;
    eng = new Engine($('#sheet'));
    eng.onUndoState = (u, r) => { const a = $('#b-undo'), b = $('#b-redo'); if (a) a.disabled = !u; if (b) b.disabled = !r; };
    eng.onGesture = t => toast(t);
    eng.onPen = () => { if (me().settings.finger === 'auto') toast('Apple Pencil found. Your palm is now ignored.'); };
    eng.onProgress = lessonProgress;
    eng.onStroke = st => { if (!S) return; S.dirty = true; if (S.lesson && st.steady != null && st.tool !== 'eraser' && S.lesson.steps[S.i].kind === 'trace') S.steady.push(st.steady); queueSave(); if (S.lesson) afterStroke(); };
    const fit = () => {
      const st = $('#stage'), w = st.clientWidth - 24, h = st.clientHeight - 24; if (w <= 0 || h <= 0) return;
      const sw = Math.floor(Math.min(w, h * 4 / 3)); $('#sheet').style.width = sw + 'px'; $('#sheet').style.height = Math.floor(sw * 3 / 4) + 'px'; eng.resize();
    };
    eng.fit = fit; window.addEventListener('resize', () => { if (!$('#v-draw').hidden) fit(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { if (!$('#v-draw').hidden) fit(); }, 250));
  }
  function hsl(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
    return ('#' + f(0) + f(8) + f(4)).toUpperCase();
  }
  const HUES = [[2, 78], [22, 88], [44, 92], [78, 62], [135, 50], [172, 60], [200, 72], [224, 64], [268, 52], [325, 64], [24, 45]];
  const LIGHT = [86, 72, 56, 42, 28];
  const SHADES = LIGHT.map(l => HUES.map(([h, s]) => hsl(h, h === 44 ? s : s, h === 44 && l > 50 ? l - 4 : l)));
  const SKIN = ['#FBE3D1', '#F3C9A8', '#E8B48E', '#D19A6E', '#B67B50', '#8D5A3B', '#6B4228', '#4A2C1A'];
  const GREYS = ['#FFFFFF', '#E4E6EB', '#C4C8D1', '#9CA2AE', '#737A88', '#4E5462', '#2B3040', '#000000'];
  let recent = [];
  function colourPanel() {
    const sw = c => `<button class="sw big ${eng.color.toUpperCase() === c.toUpperCase() ? 'on' : ''}" data-pick="${c}" style="--c:${c}" aria-label="colour"></button>`;
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Colours</h2>
      <div class="pal">${SHADES.flat().map(sw).join('')}</div>
      <h3>Skin tones</h3><div class="pal row8">${SKIN.map(sw).join('')}</div>
      <h3>Greys</h3><div class="pal row8">${GREYS.map(sw).join('')}</div>
      ${recent.length ? `<h3>Used recently</h3><div class="pal row8">${recent.map(sw).join('')}</div>` : ''}
      <label class="anyc"><span class="sw" style="--c:${eng.color}" id="anysw"></span><b>Any colour</b><span class="fine">Opens a colour wheel</span><input type="color" id="anyin" value="${/^#[0-9a-f]{6}$/i.test(eng.color) ? eng.color : '#C9982E'}"></label>`, 'colours');
    const pick = (c, close) => { setColor(c); if (eng.tool === 'eraser') setTool(S && S.lastTool || 'pencil'); recent = [c, ...recent.filter(x => x.toUpperCase() !== c.toUpperCase())].slice(0, 8); if (close) closeOverlay(); };
    o.onclick = e => { if (e.target.closest('[data-x]')) return closeOverlay(); const b = e.target.closest('[data-pick]'); if (b) pick(b.dataset.pick, true); };
    const ai = $('#anyin');
    ai.oninput = () => { setColor(ai.value); $('#anysw').style.setProperty('--c', ai.value); };
    ai.onchange = () => pick(ai.value.toUpperCase(), true);
  }
  function setTool(t) { eng.tool = t; $$('#dock [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); }
  function setSize(n) { eng.size = n; $$('#dock [data-size]').forEach(b => b.classList.toggle('on', +b.dataset.size === n)); }
  function setColor(c) {
    eng.color = c; let found = false;
    $$('#dock [data-color]').forEach(b => { const on = b.dataset.color.toLowerCase() === c.toLowerCase(); b.classList.toggle('on', on); found = found || on; });
    const mc = $('#morec'); if (mc) { mc.classList.toggle('on', !found); if (!found) mc.style.setProperty('--c', c); }
    $('#dock').style.setProperty('--cur', c);
  }
  function renderDock() {
    const tools = ['pencil', 'pen', 'marker', 'crayon', 'shader', 'eraser'];
    $('#dock').innerHTML = `<div class="grp tools">${tools.map(t => `<button class="tool" data-tool="${t}">${icon(t)}<span>${BRUSH[t].name}</span></button>`).join('')}</div>
      <div class="grp sizes">${[1, 2, 3, 4, 5].map(n => `<button class="size" data-size="${n}" aria-label="Size ${n}"><i style="--d:${4 + n * 4}px"></i></button>`).join('')}</div>
      <div class="grp colors">${PALETTE.map(c => `<button class="sw" data-color="${c}" style="--c:${c}" aria-label="colour"></button>`).join('')}<button class="sw custom" id="morec" aria-label="More colours"></button></div>
      <div class="grp acts"><button class="act" id="b-undo" aria-label="Undo">${icon('undo')}</button><button class="act" id="b-redo" aria-label="Redo">${icon('redo')}</button><button class="act" id="b-clear" aria-label="Clear the sheet">${icon('trash')}</button></div>`;
    $('#dock').onclick = e => {
      const t = e.target.closest('[data-tool]'), s = e.target.closest('[data-size]'), c = e.target.closest('[data-color]');
      if (t) setTool(t.dataset.tool); if (s) setSize(+s.dataset.size);
      if (c) { setColor(c.dataset.color); if (eng.tool === 'eraser') setTool(S.lastTool || 'pencil'); }
      if (t && t.dataset.tool !== 'eraser') S.lastTool = t.dataset.tool;
      if (e.target.closest('#b-undo')) eng.undo(); if (e.target.closest('#b-redo')) eng.redo();
      if (e.target.closest('#b-clear')) clearSheet();
      if (e.target.closest('#morec')) colourPanel();
    };
  }
  let clearArm = 0;
  function clearSheet() {
    if (!eng.strokes.length) return;
    if (Date.now() - clearArm > 2500) { clearArm = Date.now(); return toast('Tap the bin again to clear the whole sheet'); }
    clearArm = 0; eng.clear(); if (S) { S.dirty = true; queueSave(); } toast('Sheet cleared');
  }
  let saveT = 0;
  function queueSave() { clearTimeout(saveT); saveT = setTimeout(persist, 1200); }
  async function persist() {
    clearTimeout(saveT); if (!S || !S.dirty) return; S.dirty = false;
    const p = me(); if (!p) return;
    if (S.lesson) { await db.put('draft', { id: p.id + ':' + S.lesson.id, step: S.i, strokes: eng.strokes.slice(), on: eng.guide.on, off: eng.guide.off, cov: S.cov.slice(), steady: S.steady.slice() }); return; }
    if (!eng.strokes.length && !S.artId) return;
    S.artId = S.artId || 'a' + Date.now().toString(36);
    await db.put('art', { id: S.artId, pid: p.id, title: S.title || 'Free drawing', date: S.date || (S.date = Date.now()), paper: S.paper, thumb: eng.snapshot(480, S.paper).toDataURL('image/jpeg', 0.85), full: eng.snapshot(1600, S.paper).toDataURL('image/jpeg', 0.9), strokes: eng.strokes.slice() });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', () => persist());
  function setPaper(c) { S.paper = c; const sh = $('#sheet'); sh.style.setProperty('--paper', c); sh.classList.toggle('dark', c === '#23283A'); $$('#bar [data-paper]').forEach(b => b.classList.toggle('on', b.dataset.paper === c)); }
  async function leaveDraw() { hush(); await persist(); const wasLesson = S && S.lesson; S = null; viewHome(wasLesson ? 'learn' : 'gallery'); }

  async function saveArt(title, lessonId) {
    const p = me(), id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    await db.put('art', { id, pid: p.id, title, lessonId, date: Date.now(), paper: S.paper, thumb: eng.snapshot(480, S.paper).toDataURL('image/jpeg', 0.85), full: eng.snapshot(1600, S.paper).toDataURL('image/jpeg', 0.9), strokes: eng.strokes.slice() });
    return id;
  }

  /* picture to copy: a picture saved on this iPad, shown beside or under the sheet. Never saved into drawings or backups. */
  const PIC = { cur: null, mode: 'beside', grid: false, big: false };
  function picApply() {
    const sh = $('#sheet'); let under = $('#underpic'), card = $('#refpic'), grid = $('#sgrid');
    if (!under) { under = document.createElement('img'); under.id = 'underpic'; under.className = 'underpic'; under.alt = ''; sh.insertBefore(under, sh.firstChild); }
    if (!grid) { grid = document.createElement('div'); grid.id = 'sgrid'; grid.className = 'sgrid'; sh.appendChild(grid); }
    if (!card) {
      card = document.createElement('div'); card.id = 'refpic'; card.className = 'refpic'; card.setAttribute('role', 'button'); card.setAttribute('aria-label', 'Make the picture bigger or smaller');
      card.innerHTML = '<img alt="Picture to copy"><span class="sgrid"></span>'; sh.appendChild(card);
      for (const ev of ['pointerdown', 'pointermove', 'touchstart']) card.addEventListener(ev, e => e.stopPropagation(), { passive: true });
      card.addEventListener('pointerup', e => { e.stopPropagation(); PIC.big = !PIC.big; card.classList.toggle('big', PIC.big); });
    }
    const on = !!(PIC.cur && S && !S.lesson);
    under.hidden = !(on && PIC.mode === 'under'); card.hidden = !(on && PIC.mode === 'beside'); grid.hidden = !(on && PIC.grid);
    card.querySelector('.sgrid').hidden = !PIC.grid; card.classList.toggle('big', PIC.big);
    if (on) { under.src = PIC.cur.data; card.querySelector('img').src = PIC.cur.data; }
    const b = $('#b-pic'); if (b) b.classList.toggle('on', on);
  }
  function shrinkImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.86)); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }
  async function picPanel() {
    const pics = (await db.all('pics')).sort((a, b) => b.date - a.date);
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>Picture to copy</h2>
      <p class="lede dark">Choose a picture saved on this ${DEV}, such as a children's activity page you downloaded from jw.org. It appears next to your sheet so you can copy it. It stays on this ${DEV} and is never added to your drawings or backups.</p>
      <div class="row"><label class="btn primary filebtn">${icon('picture')}Choose a picture<input type="file" id="picin" accept="image/*"></label>${PIC.cur ? '<button class="btn ghost danger" data-off>Hide the picture</button>' : ''}</div>
      ${pics.length ? `<h3 class="sub">Recent pictures</h3><div class="pics">${pics.map(x => `<span class="pic ${PIC.cur && PIC.cur.id === x.id ? 'on' : ''}"><button data-use="${x.id}"><img alt="" src="${x.data}"></button><button class="picdel" data-del="${x.id}" aria-label="Remove this picture">${icon('close')}</button></span>`).join('')}</div>` : ''}
      <div class="set"><span><b>Show the picture</b><em>Underneath is for tracing, which is best for young children.</em></span><div class="seg" data-seg="mode"><button class="${PIC.mode === 'beside' ? 'on' : ''}" data-v="beside">Beside</button><button class="${PIC.mode === 'under' ? 'on' : ''}" data-v="under">Underneath</button></div></div>
      <label class="set"><span><b>Copying grid</b><em>Lines on the picture and the sheet. Copy one square at a time, the way artists do.</em></span><input type="checkbox" id="picgrid" ${PIC.grid ? 'checked' : ''}><i></i></label>
      <h3 class="sub">Finding pictures on jw.org</h3>
      <p class="fine">Open one of these pages when you are online. Download or open an activity, then touch and hold the picture and choose Save to Photos.</p>
      <div class="jwrow"><a class="jwl" href="https://www.jw.org/en/library/series/become-jehovahs-friend-children-activities/" target="_blank" rel="noopener">${icon('book')}Children's activities on jw.org</a><a class="jwl" href="https://www.jw.org/en/bible-teachings/children" target="_blank" rel="noopener">${icon('book')}Videos and activities for children</a></div>`, 'wide');
    o.onclick = async e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      if (e.target.closest('[data-off]')) { PIC.cur = null; picApply(); return closeOverlay(); }
      const u = e.target.closest('[data-use]'); if (u) { PIC.cur = pics.find(x => x.id === u.dataset.use); picApply(); return closeOverlay(); }
      const d = e.target.closest('[data-del]'); if (d) { await db.del('pics', d.dataset.del); if (PIC.cur && PIC.cur.id === d.dataset.del) { PIC.cur = null; picApply(); } return picPanel(); }
      const sb = e.target.closest('.seg button'); if (sb) { PIC.mode = sb.dataset.v; $$('button', sb.parentNode).forEach(b => b.classList.toggle('on', b === sb)); picApply(); }
    };
    $('#picgrid').onchange = e => { PIC.grid = e.target.checked; picApply(); };
    $('#picin').onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try {
        const data = await shrinkImage(f), rec = { id: 'pic' + Date.now().toString(36), date: Date.now(), data };
        await db.put('pics', rec);
        const all = (await db.all('pics')).sort((a, b) => b.date - a.date); for (const x of all.slice(8)) await db.del('pics', x.id);
        PIC.cur = rec; picApply(); closeOverlay(); toast('Picture ready. Tap it to make it bigger.');
      } catch (_) { toast('That file could not be opened. Choose a photo or picture file.'); }
    };
  }

  /* free drawing */
  function openStudio(art, opt) {
    const p = me(); ensureEngine(); show('v-draw'); renderDock();
    S = { lesson: null, artId: art ? art.id : null, title: art ? art.title : 'Free drawing', date: null, paper: art ? art.paper || '#FBF8F1' : '#FBF8F1', dirty: false };
    $('#bar').innerHTML = `<button class="barb" id="b-back" aria-label="Back">${icon('back')}</button><div class="say"><b>Free drawing</b><span>Two-finger tap to undo. Your drawing is saved as you go.</span></div>
      <div class="papers" aria-label="Paper">${PAPERS.map(([c, n]) => `<button class="pp" data-paper="${c}" style="--c:${c}" aria-label="${n} paper"></button>`).join('')}</div>
      <button class="barb" id="b-pic" aria-label="Picture to copy">${icon('picture')}<span>Picture to copy</span></button><button class="barb" id="b-set" aria-label="Settings">${icon('gear')}</button><button class="btn gold" id="b-done">Save and close</button>`;
    $('#bar').onclick = e => {
      const pp = e.target.closest('[data-paper]');
      if (pp) { setPaper(pp.dataset.paper); S.dirty = true; queueSave(); if (pp.dataset.paper === '#23283A' && eng.color === INK) setColor('#FFFFFF'); }
      if (e.target.closest('#b-back') || e.target.closest('#b-done')) { if (eng.strokes.length) toast('Saved to your gallery'); leaveDraw(); }
      if (e.target.closest('#b-set')) settingsPanel();
      if (e.target.closest('#b-pic')) picPanel();
    };
    $('#ref').hidden = true; eng.guide.reset(); eng.fingerDraw = p.settings.finger; eng.fit();
    eng.setStrokes(art ? (art.strokes || []).slice() : []); setPaper(S.paper); setTool('pencil'); setSize(2); setColor(S.paper === '#23283A' ? '#FFFFFF' : INK); eng.dirty();
    picApply(); if (opt && opt.pics) picPanel();
  }

  /* lessons */
  const MODES = [['trace', 'Trace', 'Dotted guide to draw over'], ['fade', 'Faint guide', 'The guide is barely visible'], ['copy', 'Copy', 'No guide. Draw from the small picture']];
  async function openLesson(lesson) {
    const p = me(); ensureEngine(); show('v-draw'); renderDock();
    S = { lesson, i: 0, cov: [], steady: [], mode: p.settings.mode || 'trace', paper: '#FBF8F1', dirty: false, adv: 0, lastTool: lesson.brush };
    setPaper(S.paper); eng.fingerDraw = p.settings.finger; eng.guide.reset(); eng.fit(); eng.setStrokes([]); picApply();
    const d = await db.get('draft', p.id + ':' + lesson.id);
    if (!S || S.lesson !== lesson) return;
    if (d && d.strokes && d.strokes.length && d.step < lesson.steps.length) {
      eng.setStrokes(d.strokes); S.i = d.step; S.cov = d.cov || []; S.steady = d.steady || [];
      for (let k = 0; k <= S.i; k++) { const st = lesson.steps[k]; eng.guide.setStep(st, { mode: S.mode, tol: tolFor(), fresh: !!st.fresh }); if (k < S.i) for (const q of eng.guide.pts) eng.guide.feed(q[0], q[1]); }
      eng.guide.on = d.on || 0; eng.guide.off = d.off || 0;
      toast('Picked up where you left off'); startStep(S.i, true);
    } else startStep(0);
  }
  function tolFor() { const b = me().band, base = b === 'little' ? 30 : b === 'junior' ? 23 : 18; return S.mode === 'copy' ? base * 1.7 : base; }
  function thrFor() { return S.mode === 'copy' ? 0.55 : me().band === 'little' ? 0.72 : 0.8; }
  function startStep(i, resumed) {
    const L = S.lesson, st = L.steps[i], p = me(); S.i = i; clearTimeout(S.adv); S.adv = 0; S.ready = false;
    if (st.own && !resumed && eng.strokes.length) saveArt(L.title + ' (guided)', L.id);
    if (st.fresh && !resumed) eng.setStrokes([]);
    if (!resumed) eng.guide.setStep(st, { mode: S.mode, tol: tolFor(), fresh: !!st.fresh }); else { eng.guide.mode = S.mode; eng.guide.replay(); }
    if (p.settings.teacher) { setTool(st.brush || L.brush || 'pencil'); setSize(st.size || L.size || 2); if (st.kind !== 'free' || st.color) setColor(st.color || INK); S.lastTool = eng.tool; }
    else if (i === 0 && !resumed) { setTool(L.brush || 'pencil'); setSize(L.size || 2); setColor(st.color || INK); }
    renderBar(); eng.fit(); drawRef(); eng.dirty(); lessonProgress();
  }
  function renderBar() {
    const L = S.lesson, st = L.steps[S.i], last = S.i === L.steps.length - 1;
    $('#bar').innerHTML = `<button class="barb" id="b-back" aria-label="Leave lesson">${icon('close')}</button>
      <div class="say"><div class="dots">${L.steps.map((_, k) => `<i class="${k < S.i ? 'done' : k === S.i ? 'cur' : ''}"></i>`).join('')}<em>Step ${S.i + 1} of ${L.steps.length}</em></div><b>${esc(st.say)}</b>${st.tip ? `<span>${esc(st.tip)}</span>` : ''}</div>
      <div class="bartools">
        ${L.lfb || L.ref || L.more ? `<button class="barb" id="b-story" aria-label="The Bible account">${icon('book')}<span>The account</span></button>` : ''}
        ${st.paths.length ? `<button class="barb" id="b-replay" aria-label="Show me again">${icon('replay')}<span>Show me</span></button>` : ''}
        ${st.own ? '' : `<button class="barb" id="b-help" aria-label="Guide">${icon('eye')}<span>${MODES.find(m => m[0] === S.mode)[1]}</span></button>`}
        <button class="barb" id="b-set" aria-label="Settings">${icon('gear')}</button>
      </div>
      <button class="btn gold nextb" id="b-next"><svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle id="ringv" cx="18" cy="18" r="15" stroke-dasharray="94.25" stroke-dashoffset="94.25"/></svg><span>${last ? 'Finish' : 'Next'}</span></button>`;
    $('#bar').onclick = e => {
      if (e.target.closest('#b-back')) return leaveConfirm();
      if (e.target.closest('.say')) { const o = overlay(`<button class="x" data-x>${icon('close')}</button><p class="kicker dark">Step ${S.i + 1} of ${L.steps.length}</p><h2>${esc(st.say)}</h2>${st.tip ? `<p class="lede dark">${esc(st.tip)}</p>` : ''}`); o.onclick = ev => { if (ev.target.closest('[data-x]')) closeOverlay(); }; return; }
      if (e.target.closest('#b-replay')) { eng.guide.replay(); eng.dirty(); }
      if (e.target.closest('#b-help')) return helpPanel();
      if (e.target.closest('#b-story')) return storyPanel(L);
      if (e.target.closest('#b-set')) settingsPanel();
      if (e.target.closest('#b-next')) nextStep();
    };
  }
  function drawRef() {
    const r = $('#ref'), L = S.lesson, st = L.steps[S.i];
    if (st.own) {
      r.hidden = false; const x = r.getContext('2d'); x.clearRect(0, 0, 300, 225);
      x.strokeStyle = '#D5DAE6'; x.lineWidth = 1;
      for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(75 * k, 0); x.lineTo(75 * k, 225); x.stroke(); }
      for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(0, 75 * k); x.lineTo(300, 75 * k); x.stroke(); }
      drawArt(x, L, 300, { items: lessonPaths(L).filter(it => !it.f), lw: 2.2 }); return;
    }
    if (S.mode !== 'copy' || !st.paths.length) { r.hidden = true; return; }
    r.hidden = false; const x = r.getContext('2d'); x.clearRect(0, 0, 300, 225);
    const items = lessonPaths(L, S.i), n = st.paths.length;
    items.forEach((it, k) => { if (!it.f) it.c = k >= items.length - n ? '#C9982E' : '#9AA3B8'; });
    drawArt(x, L, 300, { items, lw: 2.2 });
  }
  const lfbUrl = n => 'https://wol.jw.org/en/wol/d/r1/lp-e/' + (1102016010 + n);
  const bibleUrl = ref => { const m = String(ref).match(/^(.+?)\s+(\d+)/); return m ? 'https://www.jw.org/en/library/bible/nwt/books/' + m[1].toLowerCase().replace(/\s+/g, '-') + '/' + m[2] + '/' : '#'; };
  const jwLinks = (L, all) => `<div class="jwrow">${L.ref ? `<a class="jwl" href="${bibleUrl(L.ref)}" target="_blank" rel="noopener">${icon('book')}Read ${esc(L.ref.replace(/:.*/, ''))} on jw.org</a>` : ''}${L.lfb ? `<a class="jwl" href="${lfbUrl(L.lfb)}" target="_blank" rel="noopener">${icon('book')}Lesson ${L.lfb} on jw.org</a>` : ''}${all && L.more ? L.more.map(([t, u]) => `<a class="jwl" href="${u}" target="_blank" rel="noopener">${icon('book')}${esc(t)}</a>`).join('') : ''}</div>`;
  function storyPanel(L) {
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><p class="kicker dark">The Bible account</p><h2>${esc(L.title)}</h2>
      <p class="lede dark">${L.lfb ? 'Read the account in the Bible, and the lesson about it in Lessons You Can Learn From the Bible.' : 'This lesson shows how people dressed in Bible times.'} ${L.more ? 'The details in this drawing come from the jw.org articles below.' : ''} Everything opens on jw.org when the iPad is online.</p>${jwLinks(L, true)}
      <p class="fine pt">Want to copy a picture of this account? Save one from jw.org to this ${DEV}, then use Picture to copy in Free drawing.</p>
      <div class="row end"><button class="btn ghost" data-pic>${icon('picture')}Picture to copy</button><button class="btn primary" data-x>Back to drawing</button></div>`);
    o.onclick = e => { if (e.target.closest('[data-x]')) return closeOverlay(); if (e.target.closest('[data-pic]')) { closeOverlay(); S.dirty = true; persist().then(() => openStudio(null, { pics: true })); } };
  }
  function helpPanel() {
    const o = overlay(`<button class="x" data-x>${icon('close')}</button><h2>How much help would you like?</h2><p class="lede dark">Start with Trace. When a lesson feels easy, repeat it with less help. That is how tracing turns into real drawing.</p>
      <div class="modes">${MODES.map(m => `<button class="mode ${S.mode === m[0] ? 'on' : ''}" data-mode="${m[0]}"><b>${m[1]}</b><span>${m[2]}</span></button>`).join('')}</div>`);
    o.onclick = e => {
      if (e.target.closest('[data-x]')) return closeOverlay();
      const b = e.target.closest('[data-mode]'); if (!b) return;
      S.mode = b.dataset.mode; me().settings.mode = S.mode; save(); eng.guide.mode = S.mode; eng.guide.tol = tolFor(); closeOverlay(); renderBar(); drawRef(); eng.guide.replay(); eng.dirty(); lessonProgress();
    };
  }
  function leaveConfirm() {
    const o = overlay(`<h2>Leave this lesson?</h2><p class="lede dark">Your drawing is kept, so you can carry on from this step next time.</p><div class="row end"><button class="btn ghost" data-stay>Keep drawing</button><button class="btn ghost" data-restart>Start again</button><button class="btn primary" data-leave>Leave</button></div>`);
    o.onclick = async e => {
      if (e.target.closest('[data-stay]')) closeOverlay();
      if (e.target.closest('[data-leave]')) { S.dirty = true; leaveDraw(); }
      if (e.target.closest('[data-restart]')) { const L = S.lesson; await db.del('draft', me().id + ':' + L.id); closeOverlay(); S = null; openLesson(L); }
    };
  }
  function lessonProgress() {
    if (!S || !S.lesson) return;
    const st = S.lesson.steps[S.i], ring = $('#ringv'); if (!ring) return;
    const c = st.kind === 'trace' ? Math.min(1, eng.guide.coverage() / thrFor()) : (eng.strokes.length ? 1 : 0);
    ring.style.strokeDashoffset = 94.25 * (1 - c);
    if (st.kind === 'trace' && c >= 1 && !S.ready) { S.ready = true; eng.guide.done = true; eng.dirty(); tone([784, 1047]); $('#b-next').classList.add('ready'); }
  }
  function afterStroke() {
    if (S.ready && !S.adv && S.i < S.lesson.steps.length - 1) { const at = S.i; S.adv = setTimeout(() => { if (S && S.lesson && S.i === at && !eng.active) nextStep(); else if (S) S.adv = 0; }, 900); }
  }
  function nextStep() {
    const L = S.lesson, st = L.steps[S.i];
    if (st.kind === 'trace') S.cov[S.i] = Math.min(1, eng.guide.coverage() / thrFor());
    if (S.i < L.steps.length - 1) { S.dirty = true; startStep(S.i + 1); queueSave(); }
    else finishLesson();
  }
  async function finishLesson() {
    const L = S.lesson, p = me(), g = eng.guide; hush();
    const tr = S.cov.filter(v => v != null), cov = tr.length ? Math.round(100 * tr.reduce((a, b) => a + b, 0) / tr.length) : 100;
    const acc = g.on + g.off > 8 ? Math.round(100 * g.on / (g.on + g.off)) : cov;
    const steady = S.steady.length ? Math.round(S.steady.reduce((a, b) => a + b, 0) / S.steady.length) : 80;
    const bonus = S.mode === 'copy' ? 8 : S.mode === 'fade' ? 4 : 0;
    const score = Math.min(100, Math.round(0.5 * acc + 0.3 * cov + 0.2 * steady) + bonus), st = cov < 40 ? 1 : score >= 84 ? 3 : score >= 62 ? 2 : 1;
    const old = p.progress[L.id] || { stars: 0, best: 0, times: 0 };
    p.progress[L.id] = { stars: Math.max(old.stars, st), best: Math.max(old.best, score), times: old.times + 1, last: Date.now() };
    const t = today(); if (p.streak.last !== t) { p.streak.count = p.streak.last === yesterday() ? p.streak.count + 1 : 1; p.streak.last = t; }
    save(); await db.del('draft', p.id + ':' + L.id);
    let artId = null;
    if (eng.strokes.length) artId = await saveArt(L.title + (L.steps[L.steps.length - 1].own ? ' (on my own)' : ''), L.id);
    tone([523, 659, 784, 1047], 0.11, 0.08);
    const advice = cov < 60 ? 'Try to finish each step before moving on. The ring around the Next button fills as you go.' : steady < 58 ? 'Try drawing a little faster. Quick lines come out smoother than slow, careful ones.' : acc < 72 ? 'Before each line, hover over the path once without touching. Then draw it.' : S.mode === 'trace' ? 'You are ready for less help. Try this lesson again with the faint guide.' : S.mode === 'fade' ? 'Excellent control. Next time, try Copy and draw it from the small picture alone.' : 'That was drawn by eye, with no guide. That is real drawing.';
    const path = pathFor(p.band), nx = byId[path.find(id => !p.progress[id]) || path[(path.indexOf(L.id) + 1) % path.length]];
    const snap = eng.snapshot(640, S.paper).toDataURL('image/jpeg', 0.88);
    const m = (label, v) => `<div class="mt"><div class="mtl"><span>${label}</span><b>${v}%</b></div><div class="meter"><i style="width:${v}%"></i></div></div>`;
    const o = overlay(`<div class="result"><span class="paper big"><img alt="Your drawing" src="${snap}"></span>
      <div class="rside"><p class="kicker dark">${esc(L.title)}</p><h2>${st === 3 ? 'Beautifully drawn' : st === 2 ? 'Well drawn' : 'Lesson finished'}</h2><div class="bigstars">${stars(st)}</div>
      ${m('On the line', acc)}${m('Steady hand', steady)}${m('Steps finished', cov)}
      <p class="advice">${advice}</p><p class="fine">${artId ? 'Saved to your gallery.' : ''}</p>${L.lfb || L.ref || L.more ? jwLinks(L, true) : ''}
      <div class="col"><button class="btn gold" data-next="${nx.id}">Next: ${esc(nx.title)}</button><button class="btn ghost" data-again>Draw it again</button><button class="btn ghost" data-home>Back to lessons</button></div></div></div>`, 'wide modal');
    const Lr = L; S.lesson = null; S = null;
    o.onclick = e => {
      const n = e.target.closest('[data-next]');
      if (n) { closeOverlay(); openLesson(byId[n.dataset.next]); }
      if (e.target.closest('[data-again]')) { closeOverlay(); openLesson(Lr); }
      if (e.target.closest('[data-home]')) { closeOverlay(); viewHome('learn'); }
    };
  }

  /* ---------- start ---------- */
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) { try { navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (_) { } }
  window.PWApp = { state: () => state, eng: () => eng, session: () => S, openLesson, openStudio, byId, nextStep, PIC, picApply };
  window.PWCore = { DEV, $, $$, esc, icon, stars, overlay, closeOverlay, toast, show, me, save, tone, state: () => state, viewHome: t => viewHome(t) };
  if (me()) viewHome('learn'); else viewProfiles();
})();
