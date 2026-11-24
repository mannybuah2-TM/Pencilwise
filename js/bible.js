/* Pencilwise: Bible character drawing lessons. Original artwork built from simple shapes.
   Each lesson links to its account in "Lessons You Can Learn From the Bible" on jw.org (lfb) and to the Bible chapter. */
(function () {
  'use strict';
  const P = window.PW_LESSONS, { ln, pl, pg, ar, el, ci, sp, spc, scallop, rect, T, F } = P.h;
  const R = Math.PI / 180;

  /* ---------- a Bible-times person, built the same way every time ---------- */
  function person(o) {
    const cx = o.cx, gy = o.gy, h = o.h, r = h * 0.11;
    const hy = gy - h + r, neckY = hy + r * 0.92, shY = neckY + r * 0.5, hemY = gy - r * (o.long ? 0.12 : 0.38);
    const sw = r * 1.45, hw = r * (o.long ? 2.35 : 2.1);
    const half = y => sw + (hw - sw) * (y - shY) / (hemY - shY);
    const g = { r, hy, shY, hemY };
    g.head = [ci(cx, hy, r)];
    g.robe = [pl(cx - 0.42 * r, neckY, cx - sw, shY, cx - hw, hemY, cx + hw, hemY, cx + sw, shY, cx + 0.42 * r, neckY)];
    g.feet = o.long ? [ar(cx - 0.7 * r, hemY, 0.55 * r, 0.28 * r, 0, 180), ar(cx + 0.7 * r, hemY, 0.55 * r, 0.28 * r, 0, 180)]
      : [el(cx - 0.78 * r, gy - 0.1 * r, 0.56 * r, 0.25 * r), el(cx + 0.78 * r, gy - 0.1 * r, 0.56 * r, 0.25 * r)];
    const arm = (side, dx, dy) => {
      const sx = cx + side * (sw - 0.2 * r), sy = shY + 0.15 * r, ex = sx + side * dx * r, ey = sy + dy * r;
      const len = Math.hypot(ex - sx, ey - sy), ux = (ex - sx) / len, uy = (ey - sy) / len, nx = -uy, ny = ux;
      const w0 = 0.36 * r, w1 = 0.27 * r;
      return { path: pl(sx + nx * w0, sy + ny * w0, ex + nx * w1, ey + ny * w1, ex - nx * w1, ey - ny * w1, sx - nx * w0, sy - ny * w0), hand: [ex + ux * 0.28 * r, ey + uy * 0.28 * r] };
    };
    const L = arm(-1, o.armL ? o.armL[0] : 0.55, o.armL ? o.armL[1] : 2.3), Rr = arm(1, o.armR ? o.armR[0] : 0.55, o.armR ? o.armR[1] : 2.3);
    g.handL = L.hand; g.handR = Rr.hand;
    g.arms = [L.path, ci(L.hand[0], L.hand[1], 0.3 * r), Rr.path, ci(Rr.hand[0], Rr.hand[1], 0.3 * r)];
    const wy = shY + 1.9 * r, ww = half(wy);
    g.belt = [ln(cx - ww, wy, cx + ww, wy), ln(cx - half(wy + 0.3 * r), wy + 0.3 * r, cx + half(wy + 0.3 * r), wy + 0.3 * r)];
    g.neck = [pl(cx - 0.42 * r, neckY, cx, neckY + 0.6 * r, cx + 0.42 * r, neckY)];
    const eyes = [ci(cx - 0.36 * r, hy - 0.05 * r, 0.085 * r), ci(cx + 0.36 * r, hy - 0.05 * r, 0.085 * r)];
    g.face = eyes.concat([ar(cx, hy + 0.22 * r, 0.3 * r, 0.2 * r, 25, 155)]);
    if (o.beard) g.face = eyes.concat([sp(cx - 0.93 * r, hy + 0.15 * r, cx - 0.78 * r, hy + 0.85 * r, cx, hy + 1.45 * r, cx + 0.78 * r, hy + 0.85 * r, cx + 0.93 * r, hy + 0.15 * r), ar(cx, hy + 0.42 * r, 0.22 * r, 0.12 * r, 30, 150)]);
    const hair = {
      boy: [sp(cx - 1.0 * r, hy - 0.05 * r, cx - 0.85 * r, hy - 0.75 * r, cx, hy - 1.1 * r, cx + 0.85 * r, hy - 0.75 * r, cx + 1.0 * r, hy - 0.05 * r),
        sp(cx - 0.98 * r, hy - 0.3 * r, cx - 0.6 * r, hy - 0.45 * r, cx - 0.3 * r, hy - 0.3 * r, cx, hy - 0.48 * r, cx + 0.3 * r, hy - 0.3 * r, cx + 0.6 * r, hy - 0.45 * r, cx + 0.98 * r, hy - 0.3 * r)],
      band: [sp(cx - 0.98 * r, hy - 0.42 * r, cx, hy - 0.3 * r, cx + 0.98 * r, hy - 0.42 * r), sp(cx - 0.9 * r, hy - 0.62 * r, cx, hy - 0.5 * r, cx + 0.9 * r, hy - 0.62 * r)],
      scarf: [sp(cx - 1.45 * r, shY + 0.1 * r, cx - 1.3 * r, hy, cx - 0.9 * r, hy - 1.05 * r, cx, hy - 1.35 * r, cx + 0.9 * r, hy - 1.05 * r, cx + 1.3 * r, hy, cx + 1.45 * r, shY + 0.1 * r),
        sp(cx - 1.02 * r, hy - 0.38 * r, cx, hy - 0.62 * r, cx + 1.02 * r, hy - 0.38 * r)],
      veil: [sp(cx - 1.7 * r, shY + 1.1 * r, cx - 1.35 * r, hy + 0.2 * r, cx - 0.95 * r, hy - 1.0 * r, cx, hy - 1.3 * r, cx + 0.95 * r, hy - 1.0 * r, cx + 1.35 * r, hy + 0.2 * r, cx + 1.7 * r, shY + 1.1 * r)],
      girl: [sp(cx - 1.0 * r, hy + 0.6 * r, cx - 1.05 * r, hy - 0.4 * r, cx - 0.6 * r, hy - 1.0 * r, cx, hy - 1.1 * r, cx + 0.6 * r, hy - 1.0 * r, cx + 1.05 * r, hy - 0.4 * r, cx + 1.0 * r, hy + 0.6 * r),
        sp(cx - 0.95 * r, hy - 0.35 * r, cx - 0.3 * r, hy - 0.7 * r, cx + 0.2 * r, hy - 0.45 * r, cx + 0.95 * r, hy - 0.35 * r)]
    };
    g.top = (o.top || []).flatMap(k => hair[k] || []);
    if (o.crown) {
      const cy = hy - (o.top && o.top.includes('veil') ? 1.25 : 0.75) * r;
      g.top.push(pl(cx - 0.62 * r, cy + 0.1 * r, cx - 0.62 * r, cy - 0.5 * r, cx - 0.31 * r, cy - 0.2 * r, cx, cy - 0.62 * r, cx + 0.31 * r, cy - 0.2 * r, cx + 0.62 * r, cy - 0.5 * r, cx + 0.62 * r, cy + 0.1 * r), ln(cx - 0.62 * r, cy + 0.1 * r, cx + 0.62 * r, cy + 0.1 * r));
    }
    if (o.stripes) {
      g.stripes = [];
      for (let k = 1; k <= 4; k++) {
        const y = shY + (hemY - shY) * k / 5, w = half(y);
        g.stripes.push(sp(cx - w, y, cx, y + 0.18 * r, cx + w, y));
      }
    }
    return g;
  }

  /* ---------- props and scenery ---------- */
  const ground = (y, x0 = 60, x1 = 940) => ln(x0, y, x1, y);
  const hills = y => [sp(40, y, 180, y - 70, 330, y - 20, 470, y - 90, 640, y - 30, 800, y - 85, 960, y - 20)];
  function sheep(x, y, s = 1, face = -1) {
    return [scallop(x, y, 85 * s, 55 * s, 9), el(x + face * 95 * s, y - 18 * s, 30 * s, 38 * s), el(x + face * 120 * s, y - 34 * s, 16 * s, 8 * s, face * 30),
      ci(x + face * 100 * s, y - 25 * s, 4 * s), ln(x - 45 * s, y + 50 * s, x - 45 * s, y + 90 * s), ln(x - 15 * s, y + 52 * s, x - 15 * s, y + 92 * s), ln(x + 20 * s, y + 52 * s, x + 20 * s, y + 92 * s), ln(x + 50 * s, y + 50 * s, x + 50 * s, y + 90 * s)];
  }
  function lionFace(x, y, s = 1) {
    return {
      mane: [scallop(x, y, 150 * s, 150 * s, 14)],
      face: [ci(x, y, 95 * s), ci(x - 70 * s, y - 72 * s, 26 * s), ci(x + 70 * s, y - 72 * s, 26 * s)],
      feat: [ci(x - 35 * s, y - 20 * s, 10 * s), ci(x + 35 * s, y - 20 * s, 10 * s), pg(x - 20 * s, y + 18 * s, x + 20 * s, y + 18 * s, x, y + 38 * s), ar(x - 18 * s, y + 42 * s, 18 * s, 16 * s, 0, 160), ar(x + 18 * s, y + 42 * s, 18 * s, 16 * s, 20, 180)]
    };
  }
  function fish(x, y, s = 1, dir = 1) {
    return [spc(x - dir * 90 * s, y, x - dir * 20 * s, y - 45 * s, x + dir * 60 * s, y - 25 * s, x + dir * 85 * s, y, x + dir * 60 * s, y + 25 * s, x - dir * 20 * s, y + 45 * s),
      pg(x + dir * 80 * s, y, x + dir * 130 * s, y - 35 * s, x + dir * 130 * s, y + 35 * s), ci(x - dir * 55 * s, y - 10 * s, 6 * s)];
  }
  const loaf = (x, y, s = 1) => [el(x, y, 58 * s, 20 * s), ar(x, y - 4 * s, 40 * s, 9 * s, 200, 340)];
  const tablet = (x, y, w, h) => [sp(x, y + h, x, y + w / 2), ar(x + w / 2, y + w / 2, w / 2, w / 2, 180, 360), sp(x + w, y + w / 2, x + w, y + h), ln(x, y + h, x + w, y + h)];
  const tabletLines = (x, y, w, h) => [0, 1, 2, 3].map(k => ln(x + w * 0.2, y + w * 0.62 + k * (h - w * 0.75) / 4, x + w * 0.8, y + w * 0.62 + k * (h - w * 0.75) / 4));
  function sheaf(x, y, s = 1) {
    const o = [];
    for (let k = -3; k <= 3; k++) o.push(sp(x + k * 6 * s, y + 70 * s, x + k * 4 * s, y, x + k * 14 * s, y - 70 * s));
    for (let k = -3; k <= 3; k++) o.push(el(x + k * 14 * s, y - 82 * s, 6 * s, 16 * s, k * 8));
    o.push(el(x, y + 5 * s, 34 * s, 9 * s));
    return o;
  }
  const star = (x, y, s) => pg(...[0, 1, 2, 3, 4].flatMap(k => { const a = (-90 + k * 144) * R; return [x + s * Math.cos(a), y + s * Math.sin(a)]; }));

  const LIGHT = { brush: 'pencil', size: 2, color: '#8C93A6' };
  const INK = '#2B3040';
  const GRID = [1, 2, 3].map(k => ln(250 * k, 20, 250 * k, 730)).concat([1, 2].map(k => ln(20, 250 * k, 980, 250 * k)));
  const own = (who, tip) => F(`Now draw ${who} on your own. Look at the small picture and copy it, one shape at a time.`, { own: true, fresh: true, frame: GRID, brush: 'pen', size: 2, color: INK, tip: tip || 'The grid helps. Find which square each part is in on the small picture, and draw it in the same square here.' });
  const colour = say => F(say || 'Colour it in. Use the colours on the side, or tap the rainbow button for more.', { brush: 'marker', tip: 'Colour inside the lines slowly. Go round the edge first, then fill the middle.' });

  const B = [];
  const add = (id, title, level, mins, lfb, ref, steps, o = {}) => B.push(Object.assign({ track: 'bible', id, title, level, mins, lfb, ref, skill: 'shape', brush: 'pen', size: 2, steps }, o));

  /* ================= Young artists (ages 4 to 7) ================= */
  const KID = { brush: 'crayon', size: 3 };
  add('b-ark', "Noah's ark", 'little', 5, 6, 'Genesis 6:16', [
    T('Draw a long box. The ark was shaped like a huge chest.', [pl(130, 300, 870, 300, 870, 520, 130, 520, 130, 300)], { color: '#8A5A22', tip: 'The ark was not shaped like a boat. It was a giant wooden box that floated.' }),
    T('Put a roof on top. It is low, with a gentle slope.', [pl(110, 300, 500, 215, 890, 300)], { color: '#7A4A2E' }),
    T('Draw the window along the top and the door in the side.', [ln(170, 330, 830, 330), ln(170, 355, 830, 355), pl(560, 520, 560, 400, 660, 400, 660, 520)], { color: '#7A4A2E', tip: 'Jehovah told Noah to put the door in the side of the ark.' }),
    T('Draw a rainbow over the ark.', [ar(500, 300, 430, 260, 195, 345), ar(500, 300, 400, 235, 195, 345), ar(500, 300, 370, 210, 195, 345)], { color: '#E2483F', tip: 'After the Flood, God put the rainbow in the sky as a promise.' }),
    T('Add water under the ark.', [sp(60, 580, 140, 555, 220, 580, 300, 555, 380, 580, 460, 555, 540, 580, 620, 555, 700, 580, 780, 555, 860, 580, 940, 560)], { color: '#3F8FD0' }),
    colour('Colour the ark brown and the rainbow red, orange, yellow, green, blue and purple.'),
    own("Noah's ark")], Object.assign({ more: [['The ark, in Insight on the Scriptures', 'https://www.jw.org/en/library/books/Insight-on-the-Scriptures/Ark/']] }, KID));
  add('b-moses', 'Baby Moses in a basket', 'little', 5, 17, 'Exodus 2:3', [
    T('Draw a long oval. This is the basket.', [el(500, 430, 230, 95)], { color: '#C98A3C' }),
    T('Draw the baby: a round head and a blanket.', [ci(400, 380, 55), sp(450, 395, 520, 350, 620, 345, 700, 395)], { color: '#E0528A' }),
    T('Give baby Moses a sleepy face.', [ar(380, 378, 12, 8, 0, 180), ar(420, 378, 12, 8, 0, 180), ar(400, 400, 14, 10, 20, 160)], { color: '#2B3040' }),
    T('Draw criss-cross lines so the basket looks woven.', [ln(330, 470, 360, 420), ln(400, 515, 440, 440), ln(480, 525, 520, 450), ln(560, 520, 600, 445), ln(640, 495, 670, 440)], { color: '#8A5A22' }),
    T('Add tall reeds by the river and some water.', [sp(140, 560, 150, 420, 130, 280), sp(180, 560, 195, 430, 210, 300), sp(820, 560, 810, 420, 830, 290), sp(860, 560, 870, 440, 860, 320), sp(100, 560, 300, 540, 500, 560, 700, 540, 900, 560)], { color: '#3E9B4F' }),
    colour(), own('baby Moses in his basket')], KID);
  add('b-sheep', "David's sheep", 'little', 4, 40, '1 Samuel 16:11', [
    T('Draw a fluffy cloud. This is the sheep.', [scallop(520, 380, 210, 140, 11)], { color: '#9AA3B8', tip: 'David looked after his father\'s sheep.' }),
    T('Draw the head and an ear.', [el(290, 330, 62, 80), el(245, 290, 32, 15, 30)], { color: '#55607A' }),
    T('Give the sheep eyes and a little mouth.', [ci(275, 320, 8), ci(310, 320, 8), ar(292, 360, 14, 10, 20, 160)], { color: '#2B3040' }),
    T('Draw four legs.', [ln(420, 515, 420, 610), ln(480, 520, 480, 615), ln(580, 520, 580, 615), ln(640, 515, 640, 610)], { color: '#55607A' }),
    T('Add grass and a sun.', [pl(100, 640, 120, 600, 140, 640, 160, 595, 180, 640), pl(780, 640, 800, 600, 820, 640, 840, 595, 860, 640), ln(60, 640, 940, 640), ci(840, 130, 55)], { color: '#3E9B4F' }),
    colour(), own('the sheep')], KID);
  add('b-lion', "Daniel's lion", 'little', 4, 64, 'Daniel 6:22', [
    T('Draw a big circle for the face.', lionFace(500, 380).face.slice(0, 1), { color: '#C98A3C' }),
    T('Draw the mane all the way round, like a flower.', lionFace(500, 380).mane, { color: '#C2573B', tip: 'Jehovah sent his angel to shut the lions\' mouths, so they did not hurt Daniel.' }),
    T('Add two round ears.', lionFace(500, 380).face.slice(1), { color: '#C98A3C' }),
    T('Give the lion eyes, a nose and a friendly mouth.', lionFace(500, 380).feat, { color: '#2B3040' }),
    colour('Colour the lion. Lions are golden, with a darker mane.'), own("Daniel's friendly lion")], KID);
  add('b-loaves', 'Five loaves and two fish', 'little', 5, 83, 'John 6:9', [
    T('Draw a basket: a wide bowl shape.', [sp(250, 380, 300, 560, 500, 600, 700, 560, 750, 380), el(500, 380, 250, 45)], { color: '#C98A3C' }),
    T('Put five round, flat loaves of barley bread in the basket.', [loaf(370, 350), loaf(500, 345), loaf(630, 350), loaf(435, 310, 0.9), loaf(565, 310, 0.9)].flat(), { color: '#B67B50', tip: 'A boy had five barley loaves and two small fish. Jesus fed thousands of people with them.' }),
    T('Draw two fish next to the basket.', fish(820, 520, 0.8, -1).concat(fish(820, 640, 0.8, -1)), { color: '#3F8FD0' }),
    T('Draw criss-cross lines on the basket.', [ln(330, 450, 380, 560), ln(440, 430, 470, 590), ln(560, 430, 530, 590), ln(670, 450, 620, 560)], { color: '#8A5A22' }),
    colour(), own('the loaves and fish')], KID);
  add('b-dove', "Noah's dove", 'little', 4, 6, 'Genesis 8:11', [
    T('Draw the dove\'s body, like a fat teardrop.', [spc(330, 380, 420, 310, 560, 320, 680, 380, 560, 450, 420, 440)], { color: '#7D8494' }),
    T('Add a round head and a beak.', [ci(300, 340, 55), pg(250, 335, 205, 350, 252, 362)], { color: '#7D8494' }),
    T('Draw a big wing and the tail.', [sp(420, 350, 470, 220, 560, 170, 600, 250, 560, 360), pg(670, 375, 790, 330, 780, 420)], { color: '#7D8494' }),
    T('Give the dove an eye and an olive leaf in its beak.', [ci(290, 330, 8), spc(200, 360, 160, 395, 120, 430, 170, 420), ln(200, 360, 140, 425)], { color: '#3E9B4F', tip: 'The dove came back with an olive leaf, so Noah knew the water was going down.' }),
    colour(), own('the dove')], KID);
  add('b-jonah', 'Jonah and the big fish', 'little', 5, 54, 'Jonah 2:10', [
    T('Draw a very big fish in the sea.', [spc(150, 380, 280, 260, 520, 270, 640, 380, 520, 480, 280, 490), pg(630, 380, 760, 290, 760, 470)], { color: '#3F8FD0' }),
    T('Give the fish an eye, a mouth and a fin.', [ci(250, 350, 16), sp(150, 395, 200, 410, 240, 400), sp(380, 290, 430, 230, 480, 280)], { color: '#2B3040' }),
    T('Draw the waves.', [sp(60, 560, 140, 530, 220, 560, 300, 530, 380, 560, 460, 530, 540, 560, 620, 530, 700, 560, 780, 530, 860, 560, 940, 530)], { color: '#3F8FD0' }),
    T('Draw Jonah on the beach: a head and a robe.', [ci(860, 380, 30), pl(845, 410, 820, 430, 805, 520, 915, 520, 900, 430, 875, 410), ln(822, 440, 790, 400), ln(898, 440, 930, 400)], { color: '#C2573B', tip: 'Jonah was inside the fish for three days. Then it put him out on dry land.' }),
    colour(), own('Jonah and the big fish')], KID);

  /* ================= Explorers (ages 8 and up): realistic Bible-times people ================= */
  /* Proportions: an adult is about 7 and a half heads tall, a child about 5 and a half.
     Clothing follows jw.org's Insight on the Scriptures, "Dress": an inner garment (tunic), an outer garment (mantle),
     a sash or belt, sandals, and a head covering. */
  function figure(o) {
    const cx = o.cx, gy = o.gy, H = o.h, child = o.age === 'child', youth = o.age === 'youth', woman = o.sex === 'f';
    const hh = H / (child ? 5.6 : youth ? 6.6 : 7.4), top = gy - H, hw = hh * 0.39, hc = top + hh * 0.5;
    const chinY = top + hh, shY = top + hh * 1.38, waistY = top + hh * (child ? 2.7 : 3.05), hemY = gy - hh * 0.24;
    const shW = hh * (woman ? 0.84 : 0.97) * (child ? 0.92 : 1), hemW = hh * (woman ? 1.3 : 1.14);
    const covered = o.head === 'cloth' || o.head === 'veil' || o.head === 'scarf';
    const tw = y => y <= waistY ? shW * 0.98 : shW * 0.98 + (hemW - shW * 0.98) * (y - waistY) / (hemY - waistY);
    const g = { hh, hc, shY, waistY, hemY, chinY, top };
    // guide: proportion lines
    g.guide = [el(cx, hc, hw, hh * 0.5), ln(cx, chinY, cx, gy), ln(cx - shW, shY, cx + shW, shY), ln(cx - shW, waistY, cx + shW, waistY), ln(cx - hemW, hemY, cx + hemW, hemY)];
    // head: whole oval, or just the face when the head is covered
    g.head = covered ? [ar(cx, hc, hw, hh * 0.5, -12, 192)] : [el(cx, hc, hw, hh * 0.5)];
    g.neck = [sp(cx - hw * 0.5, chinY - hh * 0.1, cx - hw * 0.52, chinY + hh * 0.22), sp(cx + hw * 0.5, chinY - hh * 0.1, cx + hw * 0.52, chinY + hh * 0.22)];
    // inner garment (tunic) and the outer garment (mantle)
    const mHem = gy - hh * (child ? 1.2 : 1.35), front = hh * 0.34;
    const sideL = [[cx - hw * 0.6, chinY + hh * 0.2], [cx - shW * 0.78, shY - hh * 0.06], [cx - shW, shY + hh * 0.3], [cx - tw(waistY), waistY], [cx - hemW, hemY]];
    if (o.mantle) {
      g.tunic = [ln(cx - tw(mHem) * 0.9, mHem, cx - hemW, hemY), ln(cx + tw(mHem) * 0.9, mHem, cx + hemW, hemY), sp(cx - hemW, hemY, cx, hemY + hh * 0.1, cx + hemW, hemY), sp(cx - front * 0.9, chinY + hh * 0.28, cx, chinY + hh * 0.5, cx + front * 0.9, chinY + hh * 0.28)];
      const mo = 1.07;
      g.mantle = [-1, 1].flatMap(s => [
        sp(cx + s * hw * 0.62, chinY + hh * 0.16, cx + s * shW * 0.8 * mo, shY - hh * 0.08, cx + s * shW * mo, shY + hh * 0.32, cx + s * tw(waistY) * mo, waistY, cx + s * tw(mHem) * mo, mHem),
        sp(cx + s * hw * 0.62, chinY + hh * 0.16, cx + s * front, shY + hh * 0.6, cx + s * front * 1.05, waistY, cx + s * front * 1.25, mHem),
        sp(cx + s * front * 1.25, mHem, cx + s * (front * 1.25 + tw(mHem) * mo) / 2, mHem + hh * 0.1, cx + s * tw(mHem) * mo, mHem)]);
      g.folds = [-1, 1].flatMap(s => [sp(cx + s * shW * 0.62, shY + hh * 0.9, cx + s * shW * 0.68, waistY + hh * 0.4, cx + s * shW * 0.78, mHem - hh * 0.05)]).concat([sp(cx - hh * 0.08, waistY + hh * 0.4, cx - hh * 0.1, mHem - hh * 0.2), sp(cx - hh * 0.15, mHem + hh * 0.2, cx - hh * 0.2, hemY - hh * 0.1), sp(cx + hh * 0.25, mHem + hh * 0.25, cx + hh * 0.3, hemY - hh * 0.1)]);
    } else {
      g.tunic = [sp(...sideL.flat()), sp(...sideL.map(([x, y]) => [2 * cx - x, y]).flat()), sp(cx - hemW, hemY, cx, hemY + hh * 0.1, cx + hemW, hemY), sp(cx - hw * 0.6, chinY + hh * 0.2, cx, chinY + hh * 0.48, cx + hw * 0.6, chinY + hh * 0.2)];
      g.mantle = [];
      g.folds = [sp(cx - hh * 0.25, waistY + hh * 0.35, cx - hh * 0.38, hemY - hh * 0.15), sp(cx + hh * 0.3, waistY + hh * 0.35, cx + hh * 0.45, hemY - hh * 0.15), sp(cx + hh * 0.02, waistY + hh * 0.5, cx + hh * 0.04, hemY - hh * 0.3)];
    }
    if (o.sleeveless) { g.mantle = [-1, 1].flatMap(s => [sp(cx + s * hw * 0.62, chinY + hh * 0.18, cx + s * shW * 0.9, shY + hh * 0.05, cx + s * tw(waistY) * 1.06, waistY + hh * 0.2, cx + s * tw(mHem) * 1.06, mHem), sp(cx + s * tw(mHem) * 1.06, mHem, cx + s * front * 1.3, mHem + hh * 0.06), sp(cx + s * hw * 0.62, chinY + hh * 0.18, cx + s * front, waistY, cx + s * front * 1.3, mHem + hh * 0.06)]); }
    // sash
    const bw = o.mantle ? front * 1.02 : tw(waistY) * 1.01;
    g.belt = [sp(cx - bw, waistY - hh * 0.1, cx, waistY - hh * 0.04, cx + bw, waistY - hh * 0.1), sp(cx - bw, waistY + hh * 0.1, cx, waistY + hh * 0.16, cx + bw, waistY + hh * 0.1)];
    if (!o.mantle) g.belt.push(sp(cx - bw * 0.35, waistY + hh * 0.12, cx - bw * 0.42, waistY + hh * 0.7), sp(cx - bw * 0.2, waistY + hh * 0.14, cx - bw * 0.22, waistY + hh * 0.62));
    // sandals
    g.feet = [-1, 1].flatMap(s => [el(cx + s * hh * 0.36, gy - hh * 0.08, hh * 0.3, hh * 0.1, s * 8), ln(cx + s * hh * 0.24, gy - hh * 0.16, cx + s * hh * 0.42, gy - hh * 0.15)]);
    // arms: angles in degrees from straight down; positive swings outward, negative across the body
    const arm = (s, a1, a2) => {
      const S = [cx + s * (shW - hh * 0.24), shY + hh * 0.22], d = a => [s * Math.sin(a * R), Math.cos(a * R)];
      const u = d(a1), f = d(a1 + a2), E = [S[0] + u[0] * hh * 1.38, S[1] + u[1] * hh * 1.38], W = [E[0] + f[0] * hh * 1.22, E[1] + f[1] * hh * 1.22];
      const nrm = v => [-v[1], v[0]], ne = [(nrm(u)[0] + nrm(f)[0]) / 2, (nrm(u)[1] + nrm(f)[1]) / 2], ns = nrm(u), nw = nrm(f);
      const w0 = hh * 0.25, w1 = hh * 0.23, w2 = hh * (o.wide ? 0.26 : 0.19);
      const side = k => sp(S[0] + ns[0] * w0 * k, S[1] + ns[1] * w0 * k, E[0] + ne[0] * w1 * k, E[1] + ne[1] * w1 * k, W[0] + nw[0] * w2 * k, W[1] + nw[1] * w2 * k);
      const Hc = [W[0] + f[0] * hh * 0.24, W[1] + f[1] * hh * 0.24], ang = Math.atan2(f[1], f[0]) / R;
      return { path: [side(1), side(-1), ln(W[0] + nw[0] * w2, W[1] + nw[1] * w2, W[0] - nw[0] * w2, W[1] - nw[1] * w2), el(Hc[0], Hc[1], hh * 0.24, hh * 0.15, ang), ar(Hc[0] - s * nw[0] * hh * 0.08, Hc[1] - nw[1] * hh * 0.08, hh * 0.1, hh * 0.07, ang - 120, ang + 30)], hand: Hc, wrist: W, elbow: E };
    };
    const L = arm(-1, ...(o.armL || [12, 6])), Rr = arm(1, ...(o.armR || [12, 6]));
    g.arms = L.path.concat(Rr.path); g.handL = L.hand; g.handR = Rr.hand;
    // face
    const ey = hc - hh * 0.02;
    g.face = [el(cx - hw * 0.42, ey, hh * 0.065, hh * 0.035), el(cx + hw * 0.42, ey, hh * 0.065, hh * 0.035), ci(cx - hw * 0.42, ey, hh * 0.02), ci(cx + hw * 0.42, ey, hh * 0.02),
      ar(cx - hw * 0.42, ey - hh * 0.04, hh * 0.09, hh * 0.05, 200, 330), ar(cx + hw * 0.42, ey - hh * 0.04, hh * 0.09, hh * 0.05, 210, 340),
      sp(cx + hh * 0.01, ey + hh * 0.04, cx - hh * 0.05, ey + hh * 0.17, cx + hh * 0.04, ey + hh * 0.2)];
    if (!o.beard) g.face.push(ar(cx, ey + hh * 0.24, hh * 0.11, hh * 0.05, 25, 155));
    if (!covered) g.face.push(ar(cx - hw, hc + hh * 0.02, hh * 0.07, hh * 0.12, 90, 270), ar(cx + hw, hc + hh * 0.02, hh * 0.07, hh * 0.12, -90, 90));
    if (o.beard) g.face.push(sp(cx - hw * 0.98, hc + hh * 0.02, cx - hw * 0.85, hc + hh * 0.5, cx - hw * 0.4, hc + hh * 0.78, cx, hc + hh * (o.longBeard ? 1.05 : 0.82), cx + hw * 0.4, hc + hh * 0.78, cx + hw * 0.85, hc + hh * 0.5, cx + hw * 0.98, hc + hh * 0.02),
      sp(cx - hh * 0.16, ey + hh * 0.28, cx - hh * 0.06, ey + hh * 0.23, cx, ey + hh * 0.25), sp(cx + hh * 0.16, ey + hh * 0.28, cx + hh * 0.06, ey + hh * 0.23, cx, ey + hh * 0.25), ar(cx, ey + hh * 0.33, hh * 0.08, hh * 0.03, 20, 160));
    // hair and head coverings
    const T0 = top - hh * 0.04;
    g.top = {
      curly: [sp(cx - hw * 1.02, hc + hh * 0.05, cx - hw * 1.1, hc - hh * 0.3, cx - hw * 0.7, T0, cx, T0 - hh * 0.04, cx + hw * 0.7, T0, cx + hw * 1.1, hc - hh * 0.3, cx + hw * 1.02, hc + hh * 0.05)].concat([-0.75, -0.38, 0, 0.38, 0.75].map(k => ar(cx + k * hw, hc - hh * 0.27, hw * 0.21, hh * 0.08, 0, 180))),
      short: [sp(cx - hw * 1.0, hc + hh * 0.02, cx - hw * 1.04, hc - hh * 0.3, cx - hw * 0.6, T0 + hh * 0.02, cx, T0, cx + hw * 0.6, T0 + hh * 0.02, cx + hw * 1.04, hc - hh * 0.3, cx + hw * 1.0, hc + hh * 0.02), sp(cx - hw * 0.95, hc - hh * 0.2, cx - hw * 0.3, hc - hh * 0.32, cx + hw * 0.3, hc - hh * 0.28, cx + hw * 0.95, hc - hh * 0.2)],
      cloth: [sp(cx - hw * 1.3, shY + hh * 0.3, cx - hw * 1.38, hc + hh * 0.1, cx - hw * 1.2, hc - hh * 0.4, cx, T0 - hh * 0.1, cx + hw * 1.2, hc - hh * 0.4, cx + hw * 1.38, hc + hh * 0.1, cx + hw * 1.3, shY + hh * 0.3),
        sp(cx - hw * 1.02, hc + hh * 0.05, cx - hw * 0.98, hc - hh * 0.25, cx, hc - hh * 0.34, cx + hw * 0.98, hc - hh * 0.25, cx + hw * 1.02, hc + hh * 0.05),
        sp(cx - hw * 1.2, hc - hh * 0.38, cx, hc - hh * 0.5, cx + hw * 1.2, hc - hh * 0.38), sp(cx - hw * 1.18, hc - hh * 0.27, cx, hc - hh * 0.39, cx + hw * 1.18, hc - hh * 0.27)],
      veil: [sp(cx - shW * 1.08, waistY - hh * 0.3, cx - hw * 1.45, shY, cx - hw * 1.32, hc - hh * 0.3, cx, T0 - hh * 0.1, cx + hw * 1.32, hc - hh * 0.3, cx + hw * 1.45, shY, cx + shW * 1.08, waistY - hh * 0.3),
        sp(cx - hw * 1.04, chinY + hh * 0.05, cx - hw * 1.05, hc - hh * 0.2, cx - hw * 0.5, hc - hh * 0.42, cx, hc - hh * 0.45, cx + hw * 0.5, hc - hh * 0.42, cx + hw * 1.05, hc - hh * 0.2, cx + hw * 1.04, chinY + hh * 0.05),
        sp(cx - hw * 0.9, hc - hh * 0.25, cx - hw * 0.3, hc - hh * 0.35, cx + hw * 0.2, hc - hh * 0.32, cx + hw * 0.9, hc - hh * 0.25)],
      scarf: [sp(cx - hw * 1.15, chinY + hh * 0.2, cx - hw * 1.25, hc - hh * 0.2, cx - hw * 0.8, T0 + hh * 0.02, cx, T0 - hh * 0.05, cx + hw * 0.8, T0 + hh * 0.02, cx + hw * 1.25, hc - hh * 0.2, cx + hw * 1.15, chinY + hh * 0.2),
        sp(cx - hw * 0.98, hc + hh * 0.05, cx - hw * 0.95, hc - hh * 0.25, cx, hc - hh * 0.36, cx + hw * 0.95, hc - hh * 0.25, cx + hw * 0.98, hc + hh * 0.05),
        sp(cx + hw * 1.15, chinY + hh * 0.2, cx + hw * 1.3, shY + hh * 0.2, cx + hw * 1.6, shY + hh * 0.8)],
      band: [sp(cx - hw * 1.0, hc + hh * 0.02, cx - hw * 1.04, hc - hh * 0.3, cx - hw * 0.6, T0 + hh * 0.02, cx, T0, cx + hw * 0.6, T0 + hh * 0.02, cx + hw * 1.04, hc - hh * 0.3, cx + hw * 1.0, hc + hh * 0.02), sp(cx - hw * 1.02, hc - hh * 0.2, cx, hc - hh * 0.3, cx + hw * 1.02, hc - hh * 0.2), sp(cx - hw * 1.0, hc - hh * 0.08, cx, hc - hh * 0.18, cx + hw * 1.0, hc - hh * 0.08)],
      long: [sp(cx - hw * 1.0, chinY + hh * 0.5, cx - hw * 1.12, hc, cx - hw * 0.8, T0 + hh * 0.02, cx, T0, cx + hw * 0.8, T0 + hh * 0.02, cx + hw * 1.12, hc, cx + hw * 1.0, chinY + hh * 0.5), sp(cx - hw * 0.95, hc - hh * 0.18, cx - hw * 0.2, hc - hh * 0.38, cx + hw * 0.3, hc - hh * 0.3, cx + hw * 0.95, hc - hh * 0.15)]
    }[o.head] || [];
    if (o.crown) { const cy = T0 - hh * 0.02; g.crown = [pl(cx - hw * 0.75, cy + hh * 0.08, cx - hw * 0.78, cy - hh * 0.22, cx - hw * 0.4, cy - hh * 0.08, cx, cy - hh * 0.3, cx + hw * 0.4, cy - hh * 0.08, cx + hw * 0.78, cy - hh * 0.22, cx + hw * 0.75, cy + hh * 0.08), sp(cx - hw * 0.75, cy + hh * 0.08, cx, cy + hh * 0.13, cx + hw * 0.75, cy + hh * 0.08), ci(cx, cy - hh * 0.05, hh * 0.04)]; }
    if (o.border) g.border = [sp(cx - hemW * 0.98, hemY - hh * 0.2, cx, hemY - hh * 0.1, cx + hemW * 0.98, hemY - hh * 0.2)];
    return g;
  }
  /* cut lines off below a given height (for someone standing in a boat) */
  const clipBelow = (paths, y) => paths.flatMap(p => { const o = []; let cur = []; for (const q of p) { if (q[1] <= y) cur.push(q); else if (cur.length) { o.push(cur); cur = []; } } if (cur.length) o.push(cur); return o.filter(c => c.length > 1); });
  function lionLying(x, y, s = 1, d = 1) {
    return {
      body: [spc(x - d * 150 * s, y - 10 * s, x - d * 60 * s, y - 75 * s, x + d * 60 * s, y - 70 * s, x + d * 120 * s, y - 20 * s, x + d * 110 * s, y + 35 * s, x - d * 140 * s, y + 40 * s),
        sp(x + d * 60 * s, y + 35 * s, x + d * 200 * s, y + 30 * s, x + d * 215 * s, y + 45 * s, x + d * 80 * s, y + 52 * s), sp(x - d * 100 * s, y - 5 * s, x - d * 70 * s, y + 40 * s, x - d * 20 * s, y + 52 * s, x - d * 120 * s, y + 52 * s),
        sp(x - d * 150 * s, y - 10 * s, x - d * 210 * s, y - 30 * s, x - d * 230 * s, y - 75 * s), el(x - d * 232 * s, y - 88 * s, 9 * s, 16 * s)],
      mane: [scallop(x + d * 140 * s, y - 70 * s, 72 * s, 78 * s, 12)],
      face: [ci(x + d * 145 * s, y - 68 * s, 44 * s), ci(x + d * 115 * s, y - 112 * s, 12 * s), ci(x + d * 175 * s, y - 112 * s, 12 * s), ci(x + d * 130 * s, y - 75 * s, 4 * s), ci(x + d * 160 * s, y - 75 * s, 4 * s), pg(x + d * 136 * s, y - 55 * s, x + d * 154 * s, y - 55 * s, x + d * 145 * s, y - 45 * s), ar(x + d * 137 * s, y - 40 * s, 9 * s, 7 * s, 0, 170), ar(x + d * 153 * s, y - 40 * s, 9 * s, 7 * s, 10, 180)]
    };
  }
  const staff = (x, y1, y2, crook) => crook ? [ln(x, y2, x, y1 + 30), ar(x + 22, y1 + 30, 22, 26, 180, 360)] : [ln(x, y1, x, y2)];
  const tabletsR = (x, y, w, h) => [pl(x, y, x + w, y, x + w, y + h, x, y + h, x, y), pl(x + w + 10, y, x + 2 * w + 10, y, x + 2 * w + 10, y + h, x + w + 10, y + h, x + w + 10, y)];
  const tabletText = (x, y, w, h) => [0, 1, 2, 3, 4].flatMap(k => [ln(x + w * 0.18, y + h * (0.2 + k * 0.15), x + w * 0.82, y + h * (0.2 + k * 0.15)), ln(x + w + 10 + w * 0.18, y + h * (0.2 + k * 0.15), x + 2 * w + 10 - w * 0.18, y + h * (0.2 + k * 0.15))]);
  const DRESS = ['Clothing in Bible times, in Insight on the Scriptures', 'https://www.jw.org/en/library/books/Insight-on-the-Scriptures/Dress/'];
  const guideStep = (g, who) => T(`Measure first. Draw ${who}'s head, then light lines for the shoulders, waist and the bottom of the robe.`, g.guide, Object.assign({ tip: 'Artists measure people in heads. A grown-up is about seven and a half heads tall. A child is about five and a half.' }, LIGHT));
  const clothes = (g, say, tip) => T(say || 'Draw the clothes. People wore a long inner garment, and often an outer garment over it.', g.tunic.concat(g.mantle, g.neck), { color: INK, tip: tip || 'Robes are narrow at the shoulders and wider at the bottom, so they hang naturally.' });
  const armsStep = (g, say) => T(say || 'Draw the arms. Each sleeve bends at the elbow, and ends with a hand.', g.arms, { color: INK, tip: 'An arm reaches down to about the middle of the thigh. Long arms look more real than short ones.' });
  const headStep = (g, say, tip) => T(say, g.head.concat(g.face, g.top, g.crown || []), { color: INK, tip: tip || 'The eyes sit halfway down the head. Most beginners put them too high.' });
  const details = (g, say, extra = []) => T(say || 'Add the sash at the waist, folds in the cloth and the sandals.', g.belt.concat(g.folds, g.feet, g.border || [], extra), { color: INK, tip: 'Folds are long, gentle curves. They show how the cloth hangs.' });

  // 1. the method
  { const g = figure({ cx: 500, gy: 715, h: 640, sex: 'm', head: 'cloth', beard: true, mantle: true, armL: [8, 4], armR: [8, 4] });
    add('bfig', 'How to draw a Bible-times person', 'junior', 8, null, null, [
      T('Draw an oval for the head, and a light line straight down to the feet.', g.guide.slice(0, 2), Object.assign({ tip: 'Artists measure people in heads. A grown-up is about seven and a half heads tall.' }, LIGHT)),
      T('Add light lines for the shoulders, the waist and the bottom of the robe.', g.guide.slice(2), LIGHT),
      clothes(g, 'Draw the long inner garment, then the outer garment over it, open at the front.', 'In Bible times people wore a long inner garment, often with an outer garment over it.'),
      armsStep(g),
      headStep(g, 'Draw the face, the head covering and a beard.'),
      details(g),
      colour('Colour the clothes in the colours you choose.'),
      own('a Bible-times person', 'Head, guide lines, clothes, arms, face, details. Say the order to yourself as you draw.')], { more: [DRESS] }); }
  // 2. David
  { const g = figure({ cx: 360, gy: 700, h: 520, age: 'youth', sex: 'm', head: 'curly', armL: [14, 4], armR: [135, 25] });
    const [hx, hy] = g.handR, sx = g.handL[0];
    add('david', 'David with his sling', 'junior', 10, 40, '1 Samuel 17:40', [
      guideStep(g, 'David'),
      clothes(g, 'David was a young shepherd. Draw his tunic, which reaches to his ankles.'),
      armsStep(g, 'Draw his arms. One is raised high to swing the sling, the other holds his staff.'),
      headStep(g, 'Draw his face and his curly hair.'),
      details(g, 'Add his belt, his sandals, and the shepherd\'s bag for his stones.', [sp(330, g.shY + 10, 380, g.waistY - 10, 420, g.waistY + 30), pl(390, g.waistY + 30, 390, g.waistY + 105, 470, g.waistY + 105, 470, g.waistY + 30, 390, g.waistY + 30), ar(430, g.waistY + 30, 40, 18, 0, 180)]),
      T('Draw his staff and the sling. The sling has two cords and a pouch with a stone.', staff(sx, g.handL[1] - 240, 700, true).concat([sp(hx, hy, hx + 45, hy - 25, hx + 95, hy - 20), sp(hx, hy, hx + 55, hy + 10, hx + 100, hy - 5), el(hx + 108, hy - 12, 22, 13, -10), ci(hx + 110, hy - 14, 9)]), { color: INK, tip: 'He took his shepherd\'s staff, five smooth stones and his sling. Jehovah helped him.' }),
      T('Add the ground, a hill, and one of his father\'s sheep.', [ln(40, 700, 960, 700), sp(560, 420, 680, 350, 820, 370, 960, 320)].concat(sheep(800, 600, 0.75, -1)), { color: INK }),
      colour(), own('David')], { more: [['David: He Stood Up to a Giant, on jw.org', 'https://www.jw.org/en/library/books/walk-courageously-with-god/kings-to-rebuilding-of-jerusalem/david-stood-up-to-a-giant/'], ['Life in Bible Times—The Shepherd, on jw.org', 'https://www.jw.org/en/library/magazines/wp20121101/the-shepherd/']] }); }
  // 3. Noah
  { const g = figure({ cx: 790, gy: 715, h: 560, sex: 'm', head: 'cloth', beard: true, longBeard: true, mantle: true, armL: [10, 4], armR: [24, -40] });
    add('noah', 'Noah and the ark', 'junior', 10, 5, 'Genesis 6:16', [
      guideStep(g, 'Noah'),
      clothes(g, 'Draw Noah\'s long inner garment and his outer garment.'),
      armsStep(g, 'Draw his arms. One hand holds a staff.'),
      headStep(g, 'Noah was very old. Draw his face, his head covering and a long beard.', 'A long beard hangs down below the chin, like a U shape.'),
      details(g, 'Add the sash, the folds and his sandals. Then draw his staff.', staff(g.handR[0], g.handR[1] - 160, 715)),
      T('Draw the ark behind him: a huge rectangular box with a gently sloping roof.', [pl(40, 330, 620, 330, 620, 560, 40, 560, 40, 330), pl(25, 330, 330, 285, 635, 330)], { color: INK, tip: 'The ark was a huge rectangular chest, with three decks, a door in its side and windows along the top.' }),
      T('Add the window along the top, the door in the side, and lines for the three decks.', [ln(60, 350, 600, 350), ln(60, 368, 600, 368), pl(430, 560, 430, 450, 510, 450, 510, 560), ln(40, 440, 420, 440), ln(40, 500, 420, 500), ln(520, 440, 620, 440), ln(520, 500, 620, 500), ln(40, 715, 960, 715)].concat(sheep(300, 640, 0.5, 1)), { color: INK }),
      colour(), own('Noah and the ark')], { more: [['The ark, in Insight on the Scriptures', 'https://www.jw.org/en/library/books/Insight-on-the-Scriptures/Ark/']] }); }
  // 4. Moses
  { const g = figure({ cx: 500, gy: 715, h: 620, sex: 'm', head: 'cloth', beard: true, longBeard: true, mantle: true, armL: [30, -75], armR: [30, -75] });
    const tw = Math.round(g.hh * 0.62), th = Math.round(g.hh * 1.3), tx = 500 - tw - 5, ty = Math.round(g.handL[1] - g.hh * 1.05);
    add('moses', 'Moses with the stone tablets', 'junior', 10, 24, 'Exodus 34:29', [
      guideStep(g, 'Moses'), clothes(g, 'Draw Moses\' long inner garment and his outer garment.'),
      armsStep(g, 'Draw his arms bent in front of him. He is carrying something heavy.'),
      headStep(g, 'Moses was 80 years old when he led Israel. Draw his face, head covering and long beard.'),
      T('Draw the two flat tablets of stone. His hands hold them at the sides.', tabletsR(tx, ty, tw, th), { color: INK, tip: 'Jehovah wrote the Ten Commandments on two tablets of stone.' }),
      T('Add lines of writing on the tablets, and his sandals.', tabletText(tx, ty, tw, th).concat(g.feet, g.folds.slice(-2)), { color: INK }),
      T('Draw Mount Sinai behind him.', [pl(40, 560, 170, 330, 240, 380, 330, 220, 390, 300), pl(610, 300, 680, 230, 790, 330, 960, 560)], { color: INK }),
      colour(), own('Moses')]); }
  // 5. Esther
  { const g = figure({ cx: 470, gy: 715, h: 600, sex: 'f', head: 'veil', crown: true, border: true, wide: true, armL: [10, 6], armR: [62, 12] });
    const [hx, hy] = g.handR;
    add('esther', 'Queen Esther', 'junior', 10, 65, 'Esther 5:2', [
      guideStep(g, 'Esther'),
      clothes(g, 'Draw Esther\'s long royal robe. It reaches the ground and is wider at the bottom.', 'Queen Esther wore royal clothing when she went to see the king.'),
      armsStep(g, 'Draw her arms. One reaches out to touch the top of the king\'s golden scepter.'),
      headStep(g, 'Draw her face, her veil and the royal headdress.'),
      details(g, 'Add her sash, a decorated border near the hem, and the folds of the robe.'),
      T('Draw the golden scepter the king is holding out to her.', [ln(960, hy + 70, hx + 30, hy + 8), ci(hx + 18, hy + 4, 14)], { color: '#C9982E', tip: 'The king held out his golden scepter, so Esther could come near. She touched the top of it.' }),
      T('Draw palace pillars behind her.', [pl(60, 715, 60, 140, 140, 140, 140, 715), pl(45, 140, 45, 115, 155, 115, 155, 140), pl(230, 715, 230, 140, 310, 140, 310, 715), pl(215, 140, 215, 115, 325, 115, 325, 140), ln(40, 715, 960, 715)], { color: INK }),
      colour(), own('Queen Esther')], { more: [['Queen Esther Acted Wisely, on jw.org', 'https://www.jw.org/en/library/books/true-faith/queen-esther-acted-wisely/']] }); }
  // 6. Joseph
  { const g = figure({ cx: 500, gy: 715, h: 600, age: 'youth', sex: 'm', head: 'short', border: true, wide: true, armL: [30, 14], armR: [30, 14] });
    add('joseph', 'Joseph in his special robe', 'junior', 9, 14, 'Genesis 37:3', [
      guideStep(g, 'Joseph'),
      clothes(g, 'Joseph was 17. Draw his special robe: long, reaching to his ankles.', 'The Bible calls it a special robe. It was probably a long, elegant robe, rather than a striped coat.'),
      armsStep(g, 'Draw his long, wide sleeves. His arms are held out a little.'),
      headStep(g, 'Draw his face and short hair.'),
      details(g, 'Add a fine border at the hem, his sash and the folds of the robe.'),
      T('Add the sun, the moon and eleven stars from his dream.', [ci(150, 130, 55), ar(860, 140, 55, 55, 60, 300), ar(880, 140, 45, 45, 65, 295)].concat([[120, 290], [230, 250], [300, 120], [310, 360], [700, 330], [690, 110], [790, 260], [880, 330], [150, 430], [840, 450], [610, 60]].map(([x, y]) => star(x, y, 18))), { color: '#C9982E', tip: 'In his dream, the sun, the moon and eleven stars bowed down to him.' }),
      colour('Colour his robe. Choose rich colours, because it was a special gift from his father.'), own('Joseph')], { more: [['Joseph: "Please Listen to This Dream", on jw.org', 'https://wol.jw.org/en/wol/d/r1/lp-e/2014568']] }); }
  // 7. Ruth
  { const g = figure({ cx: 420, gy: 715, h: 600, sex: 'f', head: 'veil', armL: [22, -142], armR: [22, -142] });
    add('ruth', 'Ruth gathering barley', 'junior', 10, 33, 'Ruth 2:2', [
      guideStep(g, 'Ruth'),
      clothes(g, 'Draw Ruth\'s long garment, reaching to the ground.'),
      armsStep(g, 'Draw her arms bent in front of her, holding a bundle.'),
      headStep(g, 'Draw her face and the head covering that falls over her shoulders.'),
      T('Draw the bundle of barley in her arms.', sheaf(420, g.handL[1] - 10, 0.95), { color: '#C98A3C', tip: 'Ruth gathered the barley left behind by the harvesters, to feed Naomi and herself.' }),
      details(g, 'Add her sash, the folds of her clothes and her sandals.'),
      T('Draw barley growing in the field around her.', [700, 760, 820, 880].flatMap(x => [sp(x, 715, x - 6, 580, x + 8, 470), el(x + 8, 450, 9, 24, 10)]).concat([sp(110, 715, 104, 600, 116, 500), el(116, 480, 9, 24, 10), sp(170, 715, 165, 610, 175, 520), el(176, 500, 9, 24, -8), ln(40, 715, 960, 715)]), { color: '#C98A3C' }),
      colour(), own('Ruth')]); }
  // 8. Daniel
  { const g = figure({ cx: 300, gy: 715, h: 600, sex: 'm', head: 'cloth', beard: true, longBeard: true, mantle: true, armL: [12, -154], armR: [12, -154] });
    const li = lionLying(680, 640, 0.85, -1);
    add('daniel', 'Daniel and the lions', 'junior', 11, 64, 'Daniel 6:22', [
      guideStep(g, 'Daniel'), clothes(g, 'Draw Daniel\'s long inner garment and his outer garment.'),
      armsStep(g, 'Draw his arms with his hands together, because he is praying.'),
      headStep(g, 'Daniel was an old man by now. Draw his face, head covering and beard.', 'Daniel kept praying to Jehovah three times a day, even when it was against the law.'),
      details(g),
      T('Draw a lion lying down: first its body, legs and tail.', li.body, { color: '#C98A3C' }),
      T('Now its mane and a calm face.', li.mane.concat(li.face), { color: '#C98A3C', tip: 'God sent his angel to shut the lions\' mouths, so they did not hurt Daniel.' }),
      T('Draw the walls of the pit, and the stone over the opening at the top.', [ln(40, 715, 960, 715), sp(40, 715, 60, 400, 140, 160), sp(960, 715, 940, 400, 860, 160), sp(140, 160, 500, 110, 860, 160), el(500, 95, 170, 28)], { color: INK }),
      colour(), own('Daniel')]); }
  // 9. Peter
  { const g = figure({ cx: 450, gy: 820, h: 640, sex: 'm', head: 'band', beard: true, armL: [-40, -30], armR: [70, 10] });
    const boatY = 520, keep = p => clipBelow(p, boatY);
    add('peter', 'Peter the fisherman', 'junior', 10, 92, 'John 21:6', [
      T('Draw the fishing boat: a long curved hull with a flat top edge.', [sp(110, 500, 230, 650, 500, 690, 770, 650, 890, 500), ln(110, 500, 890, 500), sp(150, 540, 500, 610, 850, 540)], Object.assign({ tip: 'Peter was a fisherman on the Sea of Galilee before he followed Jesus.' }, LIGHT)),
      T('Draw Peter standing in the boat: his head and the top of his tunic.', keep(g.head.concat(g.tunic, g.neck)), { color: INK }),
      armsStep(g, 'Draw his strong arms pulling the net.'),
      T('Draw his face, beard and headband.', g.face.concat(g.top), { color: INK }),
      T('Draw the net, heavy with fish, hanging over the side.', [sp(g.handR[0], g.handR[1], 790, 470, 860, 505), sp(g.handL[0], g.handL[1], 700, 450, 845, 500), spc(850, 500, 930, 530, 960, 620, 910, 710, 820, 700, 800, 600)].concat([[815, 545, 945, 575], [805, 620, 955, 640], [815, 675, 925, 700], [840, 515, 825, 700], [885, 520, 875, 708], [925, 545, 935, 680]].map(([a, b, c, d]) => ln(a, b, c, d))).concat(fish(870, 600, 0.28), fish(880, 668, 0.28, -1)), { color: INK, tip: 'Jesus told them to throw the net on the right side, and it was so full they could hardly pull it in.' }),
      T('Add the mast, the sail and the water.', [ln(220, 500, 220, 110), pg(210, 130, 210, 430, 60, 430), sp(40, 700, 110, 680, 180, 700, 250, 680, 320, 700, 390, 680, 460, 700, 530, 680, 600, 700, 670, 680, 740, 700)], { color: INK }),
      colour(), own('Peter in his boat')]); }
  // 10. The girl who helped Naaman
  { const g = figure({ cx: 400, gy: 715, h: 470, age: 'child', sex: 'f', head: 'scarf', armL: [12, 6], armR: [118, 12] });
    add('girl', 'The little girl who helped Naaman', 'junior', 9, 51, '2 Kings 5:3', [
      guideStep(g, 'the girl'),
      clothes(g, 'Draw her long dress. She is a young girl, so her head is bigger compared with her body.'),
      armsStep(g, 'Draw her arms. One hand points up as she speaks.'),
      headStep(g, 'Draw her face and her head scarf.', 'She told Naaman\'s wife that Jehovah\'s prophet in Israel could cure him.'),
      details(g, 'Add her sash, the folds of her dress and her sandals.'),
      T('Draw a water jar beside her.', [spc(700, 540, 640, 620, 650, 700, 750, 700, 760, 620), el(700, 540, 34, 12), ar(700, 520, 34, 22, 180, 360), sp(668, 580, 630, 565, 640, 620)], { color: '#B67B50' }),
      T('Draw an archway behind her.', [pl(110, 715, 110, 300), ar(240, 300, 130, 130, 180, 360), pl(370, 300, 370, 330), ln(40, 715, 960, 715)], { color: INK }),
      colour(), own('the girl')]); }
  // 11. Young Samuel
  { const g = figure({ cx: 500, gy: 715, h: 480, age: 'child', sex: 'm', head: 'short', sleeveless: true, armL: [18, -145], armR: [18, -145] });
    const lx = 500, ly = g.handL[1] - 22;
    add('samuel', 'Young Samuel', 'junior', 9, 37, '1 Samuel 3:10', [
      guideStep(g, 'Samuel'),
      clothes(g, 'Draw Samuel\'s tunic, and the little sleeveless coat his mother made him.', 'Every year Hannah made Samuel a little sleeveless coat and brought it to him.'),
      armsStep(g, 'Draw his arms bent in front of him, holding a lamp.'),
      headStep(g, 'Draw his face and short hair.'),
      T('Draw the small oil lamp and its flame.', [spc(lx - 60, ly, lx, ly - 24, lx + 60, ly, lx, ly + 22), spc(lx + 58, ly - 4, lx + 78, ly - 34, lx + 70, ly - 70, lx + 96, ly - 34)], { color: '#C98A3C', tip: 'Samuel served at the tabernacle. One night Jehovah called him by name.' }),
      details(g, 'Add his sash, the folds and his sandals.'),
      T('Draw a doorway and the night sky with stars.', [pl(110, 715, 110, 220, 320, 220, 320, 715), ar(830, 140, 50, 50, 60, 300), ar(850, 140, 40, 40, 65, 295), star(700, 120, 16), star(910, 290, 14), star(640, 260, 12), ln(40, 715, 960, 715)], { color: INK }),
      colour(), own('young Samuel')]); }

  P.lessons.push(...B);
  window.PW_BIBLE = { person };
})();
