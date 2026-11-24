/* Pencilwise drawing engine: brushes, Apple Pencil input, undo, guides and scoring. */
(function () {
  'use strict';
  const W = 1000, H = 750;
  const SIZES = [2, 3.5, 6, 10, 16];
  const BRUSH = {
    pencil: { name: 'Pencil', stamp: true, hard: 0.55, grain: 0.3, w: (b, p, t) => b * (0.7 + 0.5 * p) * (1 + 2.6 * t), a: (p, t) => (0.07 + 0.5 * Math.pow(p, 1.6)) * (1 - 0.6 * t) },
    pen: { name: 'Ink pen', w: (b, p) => b * (0.45 + 0.9 * p), layer: 1 },
    marker: { name: 'Marker', w: b => b * 3.2, layer: 0.6 },
    crayon: { name: 'Crayon', stamp: true, hard: 0.85, grain: 0.41, w: (b, p) => b * 2.3 * (0.85 + 0.3 * p), a: () => 0.42 },
    shader: { name: 'Soft shade', stamp: true, hard: 0, grain: 0.14, w: (b, p) => b * 7 * (0.8 + 0.4 * p), a: p => 0.02 + 0.07 * p },
    eraser: { name: 'Eraser', w: b => b * 4, erase: true }
  };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  const stampCache = new Map();
  function stampFor(color, hard) {
    const k = color + '|' + hard;
    let c = stampCache.get(k);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 32 * hard * 0.95, 32, 32, 32);
      g.addColorStop(0, color); g.addColorStop(1, hexA(color, 0));
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      stampCache.set(k, c);
      if (stampCache.size > 80) stampCache.delete(stampCache.keys().next().value);
    }
    return c;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }
  const grainCache = new Map();
  function grainFor(ctx, density, dpr) {
    const k = density + '|' + dpr;
    if (grainCache.has(k)) return grainCache.get(k);
    const cell = Math.max(1, Math.round(dpr * (density > 0.4 ? 1.5 : 1))), n = 96, c = document.createElement('canvas'); c.width = c.height = n * cell;
    const x = c.getContext('2d'); x.fillStyle = '#000';
    let seed = 1234567;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (rnd() < density) x.fillRect(i * cell, j * cell, cell, cell);
    const p = ctx.createPattern(c, 'repeat'); grainCache.set(k, p); return p;
  }

  function resample(path, step) {
    const out = [path[0].slice()]; let carry = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!d) continue;
      let t = step - carry;
      while (t <= d) { out.push([a[0] + (b[0] - a[0]) * t / d, a[1] + (b[1] - a[1]) * t / d]); t += step; }
      carry = d - (t - step);
    }
    const l = path[path.length - 1], q = out[out.length - 1];
    if (Math.hypot(l[0] - q[0], l[1] - q[1]) > 1) out.push(l.slice());
    return out;
  }
  const pathLen = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; };
  function tracePath(ctx, p, upto) {
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
    const n = upto == null ? p.length : Math.min(p.length, upto);
    for (let i = 1; i < n; i++) ctx.lineTo(p[i][0], p[i][1]);
  }

  /* ---------- Guide: what to draw, the demo animation, and scoring ---------- */
  class Guide {
    constructor() { this.reset(); }
    reset() {
      this.step = null; this.pts = []; this.hit = null; this.hits = 0; this.acc = new Map(); this.cur = new Map();
      this.on = 0; this.off = 0; this.mode = 'trace'; this.tol = 20; this.anim = null; this.peek = false; this.done = false;
      this.frame = []; this.prev = []; this.paths = [];
    }
    static key(x, y) { return ((x / 40) | 0) + ',' + ((y / 40) | 0); }
    setStep(step, opts) {
      this.step = step; this.mode = opts.mode; this.tol = opts.tol; this.done = false; this.peek = false;
      if (opts.fresh) { this.acc = new Map(); this.prev = []; } else if (this.paths.length) this.prev = this.prev.concat(this.paths);
      this.paths = (step.paths || []).map(p => resample(p, 6));
      this.raw = step.paths || [];
      this.frame = step.frame || [];
      this.pts = []; this.cur = new Map();
      this.paths.forEach(p => p.forEach(q => {
        const i = this.pts.length; this.pts.push(q);
        const k = Guide.key(q[0], q[1]);
        (this.cur.get(k) || this.cur.set(k, []).get(k)).push(i);
        (this.acc.get(k) || this.acc.set(k, []).get(k)).push(q);
      }));
      this.hit = new Uint8Array(this.pts.length); this.hits = 0;
      this.total = this.paths.reduce((s, p) => s + pathLen(p), 0);
      this.anim = this.pts.length ? { t0: performance.now(), dur: clamp(this.total * 1.6, 700, 3800) } : null;
    }
    replay() { if (this.pts.length) this.anim = { t0: performance.now(), dur: clamp(this.total * 1.6, 700, 3800) }; }
    skipAnim() { this.anim = null; }
    feed(x, y) {
      const tol = this.tol, cx = (x / 40) | 0, cy = (y / 40) | 0, r = Math.ceil(tol / 40);
      let near = false, changed = false;
      for (let i = cx - r; i <= cx + r; i++) for (let j = cy - r; j <= cy + r; j++) {
        const k = i + ',' + j, c = this.cur.get(k);
        if (c) for (const idx of c) {
          if (!this.hit[idx]) { const q = this.pts[idx]; if (Math.hypot(q[0] - x, q[1] - y) <= tol) { this.hit[idx] = 1; this.hits++; changed = true; } }
        }
        if (!near) { const a = this.acc.get(k); if (a) for (const q of a) if (Math.hypot(q[0] - x, q[1] - y) <= tol) { near = true; break; } }
      }
      if (this.pts.length || this.acc.size) { if (near) this.on++; else this.off++; }
      return changed;
    }
    coverage() { return this.pts.length ? this.hits / this.pts.length : 1; }
    draw(ctx, now, theme) {
      const s = this.step; if (!s) return false;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (this.frame.length) {
        ctx.strokeStyle = theme.frame; ctx.lineWidth = 1.6; ctx.setLineDash([]);
        for (const p of this.frame) { tracePath(ctx, p); ctx.stroke(); }
      }
      if (this.prev.length && this.mode !== 'copy') {
        ctx.strokeStyle = theme.frame; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.6;
        for (const p of this.prev) { tracePath(ctx, p); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      if (!this.pts.length) return false;
      let animating = false, prog = 1;
      if (this.anim) { prog = (now - this.anim.t0) / this.anim.dur; if (prog >= 1) { this.anim = null; prog = 1; } else animating = true; }
      const ends = s.style === 'ends';
      let show = this.mode === 'trace' ? 1 : this.mode === 'fade' ? 0.3 : 0;
      if (this.peek || animating) show = 1;
      if (this.done && ends) show = Math.max(show, 0.8);
      if (ends && !this.done && !animating && !this.peek) {
        ctx.fillStyle = theme.dot;
        for (const p of this.raw) {
          const list = p.length <= 12 ? p : [p[0], p[p.length - 1]];
          for (const q of list) { ctx.beginPath(); ctx.arc(q[0], q[1], 6.5, 0, 6.3); ctx.fill(); }
        }
      } else if (show > 0) {
        ctx.globalAlpha = show;
        for (let i = 0; i < this.pts.length; i++) {
          const q = this.pts[i];
          ctx.fillStyle = this.hit[i] ? theme.ok : theme.guide;
          ctx.beginPath(); ctx.arc(q[0], q[1], this.hit[i] ? 2.4 : 2, 0, 6.3); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (animating) {
        let left = this.total * (1 - Math.pow(1 - prog, 1.6)), head = null;
        ctx.strokeStyle = theme.demo; ctx.lineWidth = 5; ctx.setLineDash([]);
        for (const p of this.paths) {
          if (left <= 0) break;
          const n = Math.min(p.length, Math.ceil(left / 6) + 1);
          tracePath(ctx, p, n); ctx.stroke(); head = p[n - 1]; left -= (p.length - 1) * 6;
        }
        if (head) { ctx.fillStyle = theme.demo; ctx.beginPath(); ctx.arc(head[0], head[1], 9, 0, 6.3); ctx.fill(); }
      }
      return animating;
    }
  }

  /* ---------- Engine ---------- */
  class Engine {
    constructor(sheet) {
      this.sheet = sheet;
      const mk = cls => { const c = document.createElement('canvas'); c.className = cls; sheet.appendChild(c); return c; };
      this.gc = mk('layer guide'); this.ic = mk('layer ink'); this.lc = mk('layer live');
      this.gx = this.gc.getContext('2d'); this.ix = this.ic.getContext('2d'); this.lx = this.lc.getContext('2d');
      this.base = document.createElement('canvas'); this.bx = this.base.getContext('2d'); this.baseCount = 0;
      this.strokes = []; this.redoStack = [];
      this.tool = 'pencil'; this.color = '#2B3040'; this.size = 2;
      this.guide = new Guide(); this.theme = { guide: '#5B7BC0', ok: '#2E9E7A', demo: '#C9982E', frame: '#B9C0CF', dot: '#1F3A6E' };
      this.penSeen = false; this.fingerDraw = 'auto'; this.active = null; this.touches = new Map(); this.gesture = null;
      this.onStroke = null; this.onProgress = null; this.onUndoState = null; this.onPen = null;
      this.k = 1; this.dpr = 1; this._raf = 0; this._dirtyGuide = true;
      this._bind();
      this._loop = this._loop.bind(this);
    }
    /* layout */
    resize() {
      const r = this.sheet.getBoundingClientRect(); if (!r.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), pw = Math.round(r.width * dpr), ph = Math.round(pw * H / W);
      if (pw === this.ic.width && dpr === this.dpr) return;
      this.dpr = dpr; this.k = pw / W;
      for (const c of [this.gc, this.ic, this.lc, this.base]) { c.width = pw; c.height = ph; }
      this.baseCount = 0; this.rerender(); this.dirty();
    }
    dirty() { this._dirtyGuide = true; if (!this._raf) this._raf = requestAnimationFrame(this._loop); }
    _loop(now) {
      this._raf = 0;
      if (this._dirtyGuide) {
        const g = this.gx; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.gc.width, this.gc.height);
        g.setTransform(this.k, 0, 0, this.k, 0, 0);
        this._dirtyGuide = this.guide.draw(g, now, this.theme);
      }
      if (this._dirtyGuide) this._raf = requestAnimationFrame(this._loop);
    }
    /* stroke rendering */
    _bbox(st, i0, i1) {
      const p = st.pts; let a = 1e9, b = 1e9, c = -1e9, d = -1e9, m = 0;
      const B = BRUSH[st.tool], base = SIZES[st.size - 1];
      for (let i = Math.max(0, i0 - 1); i < i1; i++) {
        const x = p[i * 4], y = p[i * 4 + 1]; if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y;
        const w = B.w(base, p[i * 4 + 2], p[i * 4 + 3]); if (w > m) m = w;
      }
      const k = this.k, pad = m * k / 2 + 3;
      const x0 = Math.max(0, Math.floor(a * k - pad)), y0 = Math.max(0, Math.floor(b * k - pad));
      const x1 = Math.min(this.ic.width, Math.ceil(c * k + pad)), y1 = Math.min(this.ic.height, Math.ceil(d * k + pad));
      return [x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0)];
    }
    _range(ctx, st, i0, i1, state) {
      const B = BRUSH[st.tool], base = SIZES[st.size - 1], p = st.pts, k = this.k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      if (B.stamp) {
        const img = stampFor(st.color, B.hard);
        if (i0 === 0 && i1 > 0) { const w = B.w(base, p[2], p[3]); ctx.globalAlpha = clamp(B.a(p[2], p[3]), 0, 1); ctx.drawImage(img, p[0] - w / 2, p[1] - w / 2, w, w); }
        for (let i = Math.max(1, i0); i < i1; i++) {
          const ax = p[i * 4 - 4], ay = p[i * 4 - 3], ap = p[i * 4 - 2], at = p[i * 4 - 1], bx = p[i * 4], by = p[i * 4 + 1], bp = p[i * 4 + 2], bt = p[i * 4 + 3];
          const d = Math.hypot(bx - ax, by - ay); if (!d) continue;
          let t = state.carry;
          for (;;) {
            const f = t / d; if (f > 1) break;
            const pr = ap + (bp - ap) * f, tl = at + (bt - at) * f, w = B.w(base, pr, tl);
            ctx.globalAlpha = clamp(B.a(pr, tl), 0, 1);
            ctx.drawImage(img, ax + (bx - ax) * f - w / 2, ay + (by - ay) * f - w / 2, w, w);
            t += Math.max(0.6, w * 0.16);
          }
          state.carry = t - d;
        }
        ctx.globalAlpha = 1;
        if (B.grain && ctx !== this.ix) {
          const bb = this._bbox(st, i0, i1);
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = grainFor(ctx, B.grain, this.dpr); ctx.fillRect(bb[0], bb[1], bb[2], bb[3]);
          ctx.globalCompositeOperation = 'source-over';
        }
      } else {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = B.erase ? '#000' : st.color; ctx.fillStyle = ctx.strokeStyle;
        if (B.erase) ctx.globalCompositeOperation = 'destination-out';
        if (i0 === 0 && i1 > 0) { ctx.beginPath(); ctx.arc(p[0], p[1], B.w(base, p[2], p[3]) / 2, 0, 6.3); ctx.fill(); }
        for (let i = Math.max(1, i0); i < i1; i++) {
          ctx.lineWidth = (B.w(base, p[i * 4 - 2], 0) + B.w(base, p[i * 4 + 2], 0)) / 2;
          ctx.beginPath(); ctx.moveTo(p[i * 4 - 4], p[i * 4 - 3]); ctx.lineTo(p[i * 4], p[i * 4 + 1]); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    _commit(st) {
      const B = BRUSH[st.tool], bb = this._bbox(st, 0, st.pts.length / 4);
      if (!bb[2] || !bb[3]) return;
      const x = this.ix; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = B.layer || 1;
      x.drawImage(this.lc, bb[0], bb[1], bb[2], bb[3], bb[0], bb[1], bb[2], bb[3]); x.globalAlpha = 1;
      this.lx.setTransform(1, 0, 0, 1, 0, 0); this.lx.clearRect(bb[0], bb[1], bb[2], bb[3]);
    }
    _full(st) {
      const n = st.pts.length / 4;
      if (BRUSH[st.tool].erase) this._range(this.ix, st, 0, n, { carry: 0 });
      else { this._range(this.lx, st, 0, n, { carry: 0 }); this._commit(st); }
    }
    rerender() {
      const x = this.ix; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.ic.width, this.ic.height);
      this.lx.setTransform(1, 0, 0, 1, 0, 0); this.lx.clearRect(0, 0, this.lc.width, this.lc.height);
      if (this.baseCount) x.drawImage(this.base, 0, 0);
      for (let i = this.baseCount; i < this.strokes.length; i++) {
        this._full(this.strokes[i]);
        if (i + 1 - this.baseCount === 40 && this.strokes.length - this.baseCount > 80) {
          this.bx.setTransform(1, 0, 0, 1, 0, 0); this.bx.clearRect(0, 0, this.base.width, this.base.height); this.bx.drawImage(this.ic, 0, 0);
          this.baseCount = i + 1;
        }
      }
      this.lc.style.opacity = 1;
    }
    _bake() {
      if (this.strokes.length - this.baseCount <= 80) return;
      this.rerender();
    }
    /* public editing */
    setStrokes(list) { this.strokes = list || []; this.redoStack = []; this.baseCount = 0; this.rerender(); this._undoState(); }
    clear() { this.setStrokes([]); }
    canUndo() { return this.strokes.length > this.baseCount; }
    undo() { if (!this.canUndo()) return false; this.redoStack.push(this.strokes.pop()); this.rerender(); this._undoState(); return true; }
    redo() { if (!this.redoStack.length) return false; const s = this.redoStack.pop(); this.strokes.push(s); this._full(s); this._undoState(); return true; }
    _undoState() { if (this.onUndoState) this.onUndoState(this.canUndo(), this.redoStack.length > 0); }
    /* input */
    _pos(e) { const r = this._rect; return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
    _bind() {
      const s = this.sheet;
      s.addEventListener('pointerdown', e => this._down(e));
      s.addEventListener('pointermove', e => this._move(e));
      const up = e => this._up(e);
      s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up); s.addEventListener('lostpointercapture', up);
      for (const ev of ['touchstart', 'touchmove', 'gesturestart', 'contextmenu', 'selectstart', 'dblclick']) s.addEventListener(ev, e => e.preventDefault(), { passive: false });
    }
    _canDraw(e) {
      if (e.pointerType === 'pen') return true;
      if (e.pointerType === 'touch') return this.fingerDraw === 'on' || (this.fingerDraw === 'auto' && !this.penSeen);
      return e.button === 0;
    }
    _down(e) {
      this._rect = this.sheet.getBoundingClientRect();
      if (e.pointerType === 'pen' && !this.penSeen) { this.penSeen = true; if (this.onPen) this.onPen(); }
      if (e.pointerType === 'touch') {
        this.touches.set(e.pointerId, [e.clientX, e.clientY]);
        if (this.touches.size === 1) this.gesture = { t0: performance.now(), max: 1, moved: 0 };
        else if (this.gesture) this.gesture.max = Math.max(this.gesture.max, this.touches.size);
        if (this.touches.size > 1 && this.active && this.active.type === 'touch') this._cancel();
      }
      if (this.active) { if (e.pointerType === 'pen' && this.active.type === 'touch') this._cancel(); else return; }
      if (!this._canDraw(e) || (e.pointerType === 'touch' && this.touches.size > 1)) return;
      try { this.sheet.setPointerCapture(e.pointerId); } catch (_) { }
      this.guide.skipAnim(); this.dirty();
      const [x, y] = this._pos(e);
      const st = { tool: this.tool, color: this.color, size: this.size, pts: [] };
      this.active = { id: e.pointerId, type: e.pointerType, st, sx: x, sy: y, sp: e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.6, lt: e.timeStamp, drawn: 0, state: { carry: 0 }, fx: x, fy: y, raw: [], t0: performance.now() };
      this.lc.style.opacity = BRUSH[st.tool].layer || 1; this.sheet.classList.add('inking');
      this._add(e, true); this._paint();
    }
    _tilt(e) {
      if (e.pointerType !== 'pen') return 0;
      let alt = e.altitudeAngle;
      if (alt == null) { const tx = (e.tiltX || 0) * Math.PI / 180, ty = (e.tiltY || 0) * Math.PI / 180; alt = Math.PI / 2 - Math.min(Math.PI / 2, Math.hypot(tx, ty)); }
      return clamp((1 - alt / (Math.PI / 2) - 0.38) / 0.4, 0, 1);
    }
    _add(e, first) {
      const a = this.active, [x, y] = this._pos(e);
      let p;
      if (e.pointerType === 'pen') p = e.pressure > 0 ? clamp(e.pressure, 0.02, 1) : 0.5;
      else { const dt = Math.max(1, e.timeStamp - a.lt), v = Math.hypot(x - a.sx, y - a.sy) / dt; p = clamp(0.78 - v * 0.14, 0.38, 0.78); }
      a.lt = e.timeStamp;
      if (first) { a.sx = x; a.sy = y; a.sp = p; } else { a.sx += (x - a.sx) * 0.62; a.sy += (y - a.sy) * 0.62; a.sp += (p - a.sp) * 0.35; }
      a.raw.push(x, y);
      const n = a.st.pts.length;
      if (n && Math.hypot(a.sx - a.st.pts[n - 4], a.sy - a.st.pts[n - 3]) < 0.35) return;
      a.st.pts.push(Math.round(a.sx * 10) / 10, Math.round(a.sy * 10) / 10, Math.round(a.sp * 100) / 100, Math.round(this._tilt(e) * 100) / 100);
      if (a.st.tool !== 'eraser' && (first || Math.hypot(a.sx - a.fx, a.sy - a.fy) >= 4)) {
        a.fx = a.sx; a.fy = a.sy;
        if (this.guide.feed(a.sx, a.sy)) this._dirtyGuide = true;
        a.fed = true;
      }
    }
    _paint() {
      const a = this.active; if (!a) return;
      const n = a.st.pts.length / 4; if (n <= a.drawn) return;
      this._range(BRUSH[a.st.tool].erase ? this.ix : this.lx, a.st, a.drawn, n, a.state); a.drawn = n;
      if (a.fed) { a.fed = false; if (this.onProgress) this.onProgress(); if (this._dirtyGuide && !this._raf) this._raf = requestAnimationFrame(this._loop); }
    }
    _move(e) {
      if (e.pointerType === 'touch' && this.touches.has(e.pointerId) && this.gesture) {
        const o = this.touches.get(e.pointerId); this.gesture.moved = Math.max(this.gesture.moved, Math.hypot(e.clientX - o[0], e.clientY - o[1]));
      }
      const a = this.active; if (!a || a.id !== e.pointerId) return;
      let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!evs || !evs.length) evs = [e];
      for (const ev of evs) this._add(ev, false);
      this._paint();
    }
    _cancel() {
      const a = this.active; if (!a) return; this.active = null; this.sheet.classList.remove('inking');
      if (BRUSH[a.st.tool].erase) this.rerender(); else { this.lx.setTransform(1, 0, 0, 1, 0, 0); this.lx.clearRect(0, 0, this.lc.width, this.lc.height); }
    }
    _up(e) {
      if (e.pointerType === 'touch' && this.touches.has(e.pointerId)) {
        this.touches.delete(e.pointerId);
        const g = this.gesture;
        if (!this.touches.size && g) {
          this.gesture = null;
          if (g.max >= 2 && performance.now() - g.t0 < 380 && g.moved < 22) { if (g.max === 2) this.undo(); else this.redo(); if (this.onGesture) this.onGesture(g.max === 2 ? 'Undo' : 'Redo'); }
        }
      }
      const a = this.active; if (!a || a.id !== e.pointerId) return;
      this.active = null; this.sheet.classList.remove('inking');
      const st = a.st;
      if (!BRUSH[st.tool].erase) this._commit(st);
      this.lc.style.opacity = 1;
      st.steady = steadiness(a.raw);
      this.strokes.push(st); this.redoStack = [];
      this._bake(); this._undoState();
      if (this.onStroke) this.onStroke(st);
    }
    /* export */
    snapshot(w, paper) {
      const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * H / W);
      const x = c.getContext('2d'); x.fillStyle = paper || '#FBF8F1'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(this.ic, 0, 0, c.width, c.height); return c;
    }
  }

  /* how smooth a stroke is, 0..100: compare raw input with a moving average of itself */
  function steadiness(raw) {
    const n = raw.length / 2; if (n < 14) return null;
    const d = [];
    for (let i = 2; i < n - 2; i++) d.push(Math.hypot(raw[i * 2] - (raw[i * 2 - 4] + raw[i * 2 + 4]) / 2, raw[i * 2 + 1] - (raw[i * 2 - 3] + raw[i * 2 + 5]) / 2));
    d.sort((x, y) => x - y);
    const med = d[d.length >> 1];
    return clamp(100 - (med - 0.2) * 33, 0, 100);
  }

  /* line-art rendering of a lesson, for thumbnails, the home hero and the reference card */
  function lessonPaths(lesson, upto) {
    let start = 0; const steps = lesson.steps, end = upto == null ? steps.length : upto + 1;
    if (upto == null) { const f = steps.findIndex((s, i) => i > 0 && s.fresh); if (f > 0) return collect(0, f); }
    for (let i = 0; i < end; i++) if (steps[i].fresh) start = i;
    return collect(start, end);
    function collect(a, b) { const o = []; for (let i = a; i < b; i++) { for (const p of steps[i].frame || []) o.push({ p, c: '#C3C9D6', f: 1 }); for (const p of steps[i].paths) o.push({ p, c: steps[i].color || lesson.ink || '#2B3040' }); } return o; }
  }
  function drawArt(ctx, lesson, w, opts = {}) {
    const k = w / W, items = opts.items || lessonPaths(lesson, opts.upto);
    ctx.save(); ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let budget = opts.progress == null ? Infinity : opts.progress * items.reduce((s, it) => s + (it.f ? 0 : pathLen(it.p)), 0);
    for (const it of items) {
      ctx.strokeStyle = opts.mono && !it.f ? opts.mono : it.c; ctx.lineWidth = (it.f ? 1 : (opts.lw || 2)) / k;
      if (it.f) { tracePath(ctx, it.p); ctx.stroke(); continue; }
      if (budget <= 0) break;
      const len = pathLen(it.p);
      if (len <= budget) { tracePath(ctx, it.p); ctx.stroke(); budget -= len; }
      else {
        ctx.beginPath(); ctx.moveTo(it.p[0][0], it.p[0][1]); let left = budget, last = it.p[0];
        for (let i = 1; i < it.p.length && left > 0; i++) {
          const d = Math.hypot(it.p[i][0] - it.p[i - 1][0], it.p[i][1] - it.p[i - 1][1]);
          if (d <= left) { ctx.lineTo(it.p[i][0], it.p[i][1]); last = it.p[i]; }
          else { const f = left / d; last = [it.p[i - 1][0] + (it.p[i][0] - it.p[i - 1][0]) * f, it.p[i - 1][1] + (it.p[i][1] - it.p[i - 1][1]) * f]; ctx.lineTo(last[0], last[1]); }
          left -= d;
        }
        ctx.stroke(); budget = 0;
        if (opts.head) { ctx.fillStyle = opts.head; ctx.beginPath(); ctx.arc(last[0], last[1], 9, 0, 6.3); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  window.PW = { Engine, BRUSH, SIZES, W, H, drawArt, lessonPaths };
})();
