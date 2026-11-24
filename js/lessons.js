/* Pencilwise lesson library. World space is 1000 x 750. Every path is a dense list of [x,y] points. */
(function () {
  'use strict';
  const R = Math.PI / 180;
  const ln = (x1, y1, x2, y2) => [[x1, y1], [x2, y2]];
  const pl = (...c) => { const o = []; for (let i = 0; i < c.length; i += 2) o.push([c[i], c[i + 1]]); return o; };
  const pg = (...c) => { const o = pl(...c); o.push(o[0].slice()); return o; };
  const rect = (x, y, w, h) => pg(x, y, x + w, y, x + w, y + h, x, y + h);
  function ar(cx, cy, rx, ry, a0, a1, rot = 0) {
    const o = [], n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 5)), cr = Math.cos(rot * R), sr = Math.sin(rot * R);
    for (let i = 0; i <= n; i++) {
      const t = (a0 + (a1 - a0) * i / n) * R, x = rx * Math.cos(t), y = ry * Math.sin(t);
      o.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return o;
  }
  const el = (cx, cy, rx, ry, rot = 0) => ar(cx, cy, rx, ry, -90, 270, rot);
  const ci = (cx, cy, r) => el(cx, cy, r, r);
  function spline(pts, closed) {
    const n = pts.length, o = [], g = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      const steps = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 8));
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        o.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    o.push(closed ? o[0].slice() : pts[n - 1].slice());
    return o;
  }
  const sp = (...c) => spline(pl(...c), false);
  const spc = (...c) => spline(pl(...c), true);
  const rr = (x, y, w, h, r) => [].concat(ar(x + w - r, y + r, r, r, -90, 0), ar(x + w - r, y + h - r, r, r, 0, 90), ar(x + r, y + h - r, r, r, 90, 180), ar(x + r, y + r, r, r, 180, 270), [[x + w - r, y]]);
  const mir = p => p.map(q => [1000 - q[0], q[1]]);
  const both = p => [p, mir(p)];
  function spiral(cx, cy, r0, r1, a0, turns) {
    const o = [], n = Math.ceil(turns * 60);
    for (let i = 0; i <= n; i++) { const t = i / n, a = (a0 + t * turns * 360) * R, r = r0 + (r1 - r0) * t; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return o;
  }
  function scallop(cx, cy, rx, ry, n, start = -90) {
    let o = [];
    for (let i = 0; i < n; i++) {
      const a0 = (start + i * 360 / n) * R, a1 = (start + (i + 1) * 360 / n) * R;
      const p0 = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)], p1 = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, r = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2;
      const base = Math.atan2(p0[1] - my, p0[0] - mx) / R;
      o = o.concat(ar(mx, my, r, r, base, base + 180));
    }
    return o;
  }
  function wave(x0, x1, y, amp, n) {
    const c = [];
    for (let i = 0; i <= n * 2; i++) c.push(x0 + (x1 - x0) * i / (n * 2), y + (i % 2 ? -amp : amp));
    return sp(...c);
  }
  const T = (say, paths, o = {}) => Object.assign({ kind: 'trace', say, paths }, o);
  const F = (say, o = {}) => Object.assign({ kind: 'free', say, paths: [] }, o);

  const INK = '#2B3040', GRAPH = '#4A4F5C';
  const colourIn = (say = 'Now make it yours. Colour it in any way you like.') => F(say, { brush: 'marker', tip: 'There is no wrong answer here. Tap the colours on the side to change them.' });

  const L = [];
  const add = (track, id, title, mins, skill, o, steps) => L.push(Object.assign({ track, id, title, mins, skill, steps }, o));

  /* ---------------- Track A: First marks (young children) ---------------- */
  const K = { brush: 'crayon', size: 3 };
  add('first', 'sun', 'Sunny day', 3, 'shape', K, [
    T('Draw a big round circle. This is the sun.', [ci(500, 375, 140)], { color: '#F2A91E', tip: 'Go slowly all the way round until you are back at the start.' }),
    T('Add the rays. Short straight lines, all the way round.', [0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k * 45 * R; return ln(500 + 180 * Math.cos(a), 375 + 180 * Math.sin(a), 500 + 265 * Math.cos(a), 375 + 265 * Math.sin(a)); }), { color: '#F27F1E' }),
    T('Give your sun a happy face.', [ci(450, 345, 14), ci(550, 345, 14), ar(500, 385, 70, 55, 20, 160)], { color: '#7A3E12' }),
    colourIn('Colour your sun in. Any colours you like!')]);
  add('first', 'balloon', 'Balloon', 3, 'shape', K, [
    T('Draw a tall oval for the balloon.', [el(500, 290, 150, 180)], { color: '#E2483F' }),
    T('Add a tiny triangle where you tie it.', [pg(500, 470, 480, 500, 520, 500)], { color: '#E2483F' }),
    T('Draw a wiggly string.', [sp(500, 500, 525, 560, 478, 625, 510, 715)], { color: '#55607A' }),
    T('Add a curved shine so it looks round.', [ar(500, 290, 105, 135, 195, 250)], { color: '#F7B5AF' }),
    colourIn()]);
  add('first', 'house', 'Little house', 4, 'shape', K, [
    T('Draw a big square for the walls.', [rect(330, 330, 340, 280)], { color: '#C2573B' }),
    T('Put a triangle roof on top.', [pg(300, 330, 500, 160, 700, 330)], { color: '#7A4A2E' }),
    T('Add a door and a doorknob.', [rect(460, 470, 80, 140), ci(525, 545, 6)], { color: '#3F6FB0' }),
    T('Draw two windows with a cross in each.', [rect(365, 380, 70, 70), rect(565, 380, 70, 70), ln(400, 380, 400, 450), ln(365, 415, 435, 415), ln(600, 380, 600, 450), ln(565, 415, 635, 415)], { color: '#3F6FB0' }),
    T('Add a chimney.', [pl(600, 245, 600, 190, 645, 190, 645, 283)], { color: '#7A4A2E' }),
    colourIn('Colour your house. Can you add a garden and a sky?')]);
  add('first', 'fish', 'Friendly fish', 4, 'shape', K, [
    T('Draw a big oval for the body.', [el(470, 375, 210, 125)], { color: '#F2811E' }),
    T('Add a triangle tail.', [pg(675, 375, 810, 285, 810, 465)], { color: '#F2811E' }),
    T('Draw an eye and a smile.', [ci(350, 345, 22), ci(346, 345, 8), ar(312, 395, 40, 28, 20, 120)], { color: '#2B3040' }),
    T('Add fins on the top and the side.', [sp(400, 262, 470, 180, 560, 272), sp(450, 380, 505, 420, 450, 445)], { color: '#D9601A' }),
    T('Blow some bubbles.', [ci(220, 300, 14), ci(190, 245, 20), ci(215, 185, 10)], { color: '#3F8FD0' }),
    colourIn('Colour your fish. Stripes? Spots? You choose.')]);
  add('first', 'flower', 'Flower', 4, 'shape', K, [
    T('Draw a small circle for the middle.', [ci(500, 270, 45)], { color: '#F2A91E' }),
    T('Draw six round petals around it.', [0, 1, 2, 3, 4, 5].map(k => ci(500 + 95 * Math.cos(k * 60 * R), 270 + 95 * Math.sin(k * 60 * R), 50)), { color: '#E0528A' }),
    T('Draw a long stem down to the ground.', [sp(500, 415, 490, 520, 505, 700)], { color: '#3E9B4F' }),
    T('Add two leaves.', [spc(498, 575, 560, 518, 640, 505, 590, 568), spc(500, 630, 440, 572, 360, 560, 410, 622)], { color: '#3E9B4F' }),
    colourIn()]);
  add('first', 'catface', 'Cat face', 5, 'shape', K, [
    T('Draw a big circle for the head.', [ci(500, 400, 190)], { color: '#55607A' }),
    T('Add two pointy ears.', both(pl(321, 335, 330, 180, 435, 221)), { color: '#55607A' }),
    T('Draw two oval eyes.', [el(430, 370, 22, 32), el(570, 370, 22, 32)], { color: '#2B3040' }),
    T('Add a little nose and a mouth.', [pg(480, 430, 520, 430, 500, 455), ln(500, 455, 500, 480), ar(470, 480, 30, 25, 0, 180), ar(530, 480, 30, 25, 180, 0)], { color: '#D9547A' }),
    T('Draw the whiskers. Quick, straight lines.', [ln(400, 450, 250, 430), ln(400, 472, 250, 488), ln(600, 450, 750, 430), ln(600, 472, 750, 488)], { color: '#2B3040' }),
    colourIn('Colour your cat. What colour is your cat?')]);
  add('first', 'rocket', 'Rocket', 5, 'shape', K, [
    T('Draw a tall rectangle for the rocket.', [rect(420, 240, 160, 290)], { color: '#3F6FB0' }),
    T('Add a pointy nose on top.', [pg(420, 240, 500, 90, 580, 240)], { color: '#E2483F' }),
    T('Draw a round window.', [ci(500, 340, 45), ci(500, 340, 28)], { color: '#2B3040' }),
    T('Add a fin on each side.', [pg(420, 420, 340, 560, 420, 530), pg(580, 420, 660, 560, 580, 530)], { color: '#E2483F' }),
    T('Zigzag flames at the bottom. Blast off!', [pl(450, 530, 465, 620, 485, 580, 500, 690, 515, 580, 535, 620, 550, 530)], { color: '#F2811E' }),
    colourIn('Colour your rocket and fill the sky with stars.')]);
  add('first', 'snail', 'Snail', 5, 'line', K, [
    T('Start in the middle and spiral out to make the shell.', [spiral(540, 330, 15, 170, 0, 2.5)], { color: '#C2573B', tip: 'Keep the gap between the rings about the same.' }),
    T('Draw the body along the ground, and curl up for the head.', [sp(665, 435, 720, 482, 800, 512), sp(800, 512, 500, 522, 260, 512, 215, 440, 235, 362, 285, 345), sp(285, 345, 335, 365, 365, 420, 415, 435)], { color: '#6FA85A' }),
    T('Add two feelers, an eye and a smile.', [ln(250, 358, 215, 272), ci(212, 258, 10), ln(276, 346, 266, 258), ci(264, 244, 10), ci(250, 400, 5), ar(250, 428, 20, 14, 20, 140)], { color: '#2B3040' }),
    colourIn()]);
  add('first', 'butterfly', 'Butterfly', 5, 'shape', K, [
    T('Draw a small head and a long thin body.', [ci(500, 255, 24), el(500, 400, 22, 120)], { color: '#2B3040' }),
    T('Draw the two big top wings.', both(spc(480, 340, 400, 200, 270, 190, 240, 300, 330, 390, 470, 390)), { color: '#8A55C8' }),
    T('Draw the two bottom wings.', both(spc(480, 400, 370, 410, 300, 480, 330, 560, 420, 560, 480, 470)), { color: '#3F8FD0' }),
    T('Add curly feelers and spots on the wings.', [sp(493, 233, 470, 190, 430, 170), sp(507, 233, 530, 190, 570, 170), ci(360, 285, 28), ci(640, 285, 28), ci(390, 490, 20), ci(610, 490, 20)], { color: '#2B3040', tip: 'Butterflies are the same on both sides. That is called symmetry.' }),
    colourIn('Colour the wings. Try to make both sides match.')]);
  add('first', 'icecream', 'Ice cream', 5, 'shape', K, [
    T('Draw a triangle pointing down. This is the cone.', [pg(400, 400, 600, 400, 500, 690)], { color: '#C98A3C' }),
    T('Draw a big scoop on top, with a wavy edge.', [ar(500, 400, 115, 115, 180, 360), sp(385, 400, 420, 425, 455, 400, 500, 425, 545, 400, 580, 425, 615, 400)], { color: '#E0528A' }),
    T('Add a second scoop.', [ar(500, 300, 90, 90, 150, 390)], { color: '#8A55C8' }),
    T('Pop a cherry on top.', [ci(500, 183, 28), sp(500, 155, 510, 120, 540, 100)], { color: '#E2483F' }),
    T('Draw criss-cross lines on the cone.', [ln(450, 400, 425, 472), ln(500, 400, 450, 545), ln(550, 400, 475, 617), ln(550, 400, 575, 472), ln(500, 400, 550, 545), ln(450, 400, 525, 617)], { color: '#8A5A22' }),
    colourIn('Colour it in. What flavours did you pick?')]);

  /* ---------------- Track B: Drawing school (fundamentals) ---------------- */
  const P = { brush: 'pencil', size: 2 };
  add('school', 'lines', 'Confident lines', 4, 'line', P, [
    T('Join each pair of dots with one straight line.', [170, 270, 370, 470, 570].map(y => ln(250, y, 750, y)), { style: 'ends', tip: 'Hover from dot to dot twice without touching, then draw in one quick move. Move your whole arm, not just your fingers.' }),
    T('Now top to bottom.', [300, 400, 500, 600, 700].map(x => ln(x, 170, x, 580)), { style: 'ends', fresh: true, tip: 'A fast line is a straight line. Slow lines wobble.' }),
    T('Lines in every direction.', [ln(180, 160, 460, 320), ln(820, 150, 590, 400), ln(200, 600, 450, 430), ln(540, 620, 830, 500), ln(330, 100, 700, 120)], { style: 'ends', fresh: true }),
    T('Long lines across the whole page.', [ln(120, 230, 880, 290), ln(120, 520, 880, 450), ln(160, 680, 840, 110)], { style: 'ends', fresh: true, tip: 'It is fine to miss the dot. A confident line that misses is better than a shaky one that hits.' })]);
  add('school', 'hatch', 'Parallel lines and hatching', 4, 'line', P, [
    T('Fill the box with slanted lines. Keep the gaps even.', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ln(310 + i * 46, 200, 270 + i * 46, 550)), { frame: [rect(240, 175, 520, 400)], tip: 'Even gaps make an even grey. This is called hatching, and it is how artists shade with lines.' }),
    T('Closer together now. Closer lines look darker.', Array.from({ length: 17 }, (_, i) => ln(300 + i * 27, 200, 268 + i * 27, 550)), { frame: [rect(240, 175, 520, 400)], fresh: true }),
    T('Cross-hatching: one layer this way, one layer that way.', Array.from({ length: 9 }, (_, i) => ln(310 + i * 50, 200, 270 + i * 50, 550)).concat(Array.from({ length: 9 }, (_, i) => ln(270 + i * 50, 200, 310 + i * 50, 550))), { frame: [rect(240, 175, 520, 400)], fresh: true, tip: 'Each new layer of lines makes the tone darker.' })]);
  add('school', 'curves', 'Curves and waves', 4, 'line', P, [
    T('Draw each curve in one smooth move.', [ar(230, 375, 110, 190, 90, 270), ar(400, 375, 110, 190, 270, 450), ar(680, 375, 110, 190, 90, 270), ar(850, 375, 110, 190, 270, 450)], { tip: 'Turn the iPad if it helps. Artists turn their paper all the time.' }),
    T('S-curves. Let them flow.', [190, 375, 560].map(y => sp(150, y, 280, y - 80, 420, y, 560, y + 80, 700, y, 850, y - 80)), { fresh: true }),
    T('Waves. Keep every bump the same height.', [wave(120, 880, 200, 45, 5), wave(120, 880, 375, 30, 8), wave(120, 880, 550, 60, 4)], { fresh: true }),
    T('Loops. Keep your hand moving.', [(() => { const o = []; for (let i = 0; i <= 300; i++) { const t = i / 300 * 6 * 2 * Math.PI; o.push([150 + 115 * t / (2 * Math.PI) + 70 * Math.sin(t), 375 - 90 * Math.cos(t) + 20]); } return o; })()], { fresh: true })]);
  add('school', 'circles', 'Circles', 4, 'shape', P, [
    T('Draw a circle inside each square. It should touch all four sides.', [ci(220, 375, 110), ci(500, 375, 110), ci(780, 375, 110)], { frame: [rect(110, 265, 220, 220), rect(390, 265, 220, 220), rect(670, 265, 220, 220)], tip: 'Circle in the air first. Then go round twice in one quick move. Artists call this drawing through.' }),
    T('Smaller circles. Same idea.', [150, 383, 617, 850].flatMap(x => [ci(x, 230, 75), ci(x, 520, 75)]), { fresh: true }),
    T('Circles inside circles, from small to huge.', [50, 110, 170, 230, 290].map(r => ci(500, 375, r)), { fresh: true, tip: 'Big circles come from the shoulder. Lock your wrist and swing your arm.' })]);
  add('school', 'ellipses', 'Ellipses', 5, 'shape', P, [
    T('Draw an ellipse inside each box.', [el(190, 375, 120, 68), el(500, 375, 120, 68), el(810, 375, 120, 68)], { frame: [rect(70, 307, 240, 136), rect(380, 307, 240, 136), rect(690, 307, 240, 136)], tip: 'An ellipse is a squashed circle with no corners and no flat sides.' }),
    T('A coin turning away from you. Each one gets thinner.', [el(130, 375, 80, 80), el(315, 375, 80, 58), el(500, 375, 80, 38), el(685, 375, 80, 20), el(870, 375, 80, 7)], { fresh: true, tip: 'A circle seen at an angle is an ellipse. The more it turns away, the thinner it looks. Cups, wheels and plates all work like this.' }),
    T('Ellipses on a centre line, growing as they go.', [el(200, 375, 24, 70), el(330, 375, 32, 92), el(480, 375, 40, 118), el(650, 375, 50, 148), el(830, 375, 62, 182)], { frame: [ln(110, 375, 920, 375)], fresh: true, tip: 'The centre line cuts every ellipse into two equal halves.' })]);
  add('school', 'shapes', 'Squares, triangles and stars', 5, 'shape', P, [
    T('Squares and rectangles. Join the corner dots.', [rect(130, 140, 210, 210), rect(430, 140, 430, 210), rect(130, 430, 330, 190), rect(560, 430, 300, 190)], { style: 'ends', tip: 'Draw each side as its own line. Lift your pencil at every corner.' }),
    T('Triangles of every kind.', [pg(250, 130, 400, 360, 100, 360), pg(520, 360, 520, 130, 860, 360), pg(180, 620, 330, 430, 480, 620), pg(600, 430, 880, 480, 700, 640)], { style: 'ends', fresh: true }),
    T('A diamond and a five-point star.', [pg(250, 180, 400, 375, 250, 570, 100, 375), pg(...[0, 1, 2, 3, 4].flatMap(k => { const a = (-90 + k * 144) * R; return [680 + 210 * Math.cos(a), 390 + 210 * Math.sin(a)]; }))], { style: 'ends', fresh: true, tip: 'Almost everything you will ever draw starts as a few simple shapes.' })]);
  add('school', 'pressure', 'Light and heavy', 5, 'shade', P, [
    T('Five lines. The first as light as a whisper, then press harder each time.', [200, 290, 380, 470, 560].map(y => ln(200, y, 800, y)), { style: 'ends', tip: 'With Apple Pencil, pressing harder makes a darker, wider line. Using a finger? Go over the line again to darken it.' }),
    F('Shade the five boxes from very light to very dark.', { frame: [0, 1, 2, 3, 4].map(i => rect(95 + i * 165, 290, 150, 170)), fresh: true, brush: 'pencil', size: 4, tip: 'Tilt your Apple Pencil to shade with the side of the tip, just like a real pencil. Artists call the range from light to dark value.' }),
    F('One smooth fade from dark to light, with no steps you can see.', { frame: [rect(150, 300, 700, 150)], fresh: true, brush: 'shader', tip: 'Build it up in several light layers. Patience makes smooth shading.' })]);
  add('school', 'cube', 'From square to cube', 5, 'form', P, [
    T('Draw a square.', [rect(330, 300, 260, 260)], { tip: 'Draw lightly. These are building lines.' }),
    T('Draw the same square again, up and to the right.', [rect(440, 190, 260, 260)], { tip: 'Imagine the box is made of glass, so you can see the back.' }),
    T('Join the matching corners.', [ln(330, 300, 440, 190), ln(590, 300, 700, 190), ln(590, 560, 700, 450), ln(330, 560, 440, 450)], { tip: 'These four lines are parallel. That is what makes it look solid.' }),
    T('Press harder on the edges you would really see.', [pg(330, 300, 440, 190, 700, 190, 700, 450, 590, 560, 330, 560), pl(330, 300, 590, 300, 590, 560), ln(590, 300, 700, 190)], { brush: 'pen', size: 3, tip: 'Dark lines come forward, light lines fall back. This is called line weight.' }),
    F('Light comes from the top left. Leave the top white, shade the front lightly and the right side darker.', { brush: 'pencil', size: 4, tip: 'Three sides, three values. That one rule makes any box look three-dimensional.' })]);
  add('school', 'cylinder', 'Cylinder and cone', 6, 'form', P, [
    T('A cylinder starts with an ellipse.', [el(310, 230, 130, 45)]),
    T('Drop two straight sides.', [ln(180, 230, 180, 540), ln(440, 230, 440, 540)]),
    T('The bottom is half an ellipse, with the same curve as the top.', [ar(310, 540, 130, 45, 0, 180)], { tip: 'Beginners often draw the bottom flat. It is always curved.' }),
    T('For the cone, start with an ellipse on the ground.', [el(700, 540, 140, 48)]),
    T('Bring two sides up to a point.', [ln(560, 540, 700, 170), ln(840, 540, 700, 170)]),
    F('Shade both forms. Follow the curve: dark on the right, fading to light on the left.', { brush: 'shader', tip: 'Tree trunks, arms, mugs and towers are all cylinders. Hats and roofs are cones.' })]);
  add('school', 'sphere', 'The sphere and its shadow', 6, 'shade', P, [
    T('Draw a circle.', [ci(470, 330, 190)]),
    T('The light is top left. Draw the edge of the shadow as a curve across the ball.', [ar(470, 330, 190, 66, 0, 180, -45)], { tip: 'This edge is where the surface turns away from the light.' }),
    T('Draw the shadow it casts on the ground.', [el(600, 538, 235, 48)], { tip: 'A cast shadow always falls on the side away from the light.' }),
    F('Shade the crescent. Darkest next to the curve, a little lighter at the outer rim.', { brush: 'shader', tip: 'That lighter rim is light bouncing back up from the table. It is the detail that makes a sphere look real.' }),
    F('Fill the ground shadow dark, and darkest right under the ball. Leave the top left of the ball clean white.', { brush: 'shader' })]);
  const boxes4 = [rect(110, 120, 360, 240), rect(530, 120, 360, 240), rect(110, 400, 360, 240), rect(530, 400, 360, 240)];
  add('school', 'shading', 'Four ways to shade', 6, 'shade', P, [
    T('Hatching: lines side by side.', Array.from({ length: 11 }, (_, i) => ln(170 + i * 30, 140, 130 + i * 30, 340)), { frame: boxes4 }),
    T('Cross-hatching: add a second layer across the first.', Array.from({ length: 6 }, (_, i) => ln(590 + i * 55, 140, 550 + i * 55, 340)).concat(Array.from({ length: 6 }, (_, i) => ln(550 + i * 55, 140, 590 + i * 55, 340))), { frame: boxes4 }),
    F('Scribbling: small, loose, overlapping loops. Fill the third box.', { frame: boxes4, tip: 'Great for hair, fur, trees and clouds.' }),
    F('Smooth shading: fill the last box with soft, even tone.', { frame: boxes4, brush: 'shader', tip: 'Four techniques, one job: showing light and dark. Good drawings often mix them.' })]);
  add('school', 'persp1', 'One-point perspective', 7, 'space', P, [
    T('Draw the horizon, and one dot on it. That dot is the vanishing point.', [ln(60, 300, 940, 300), ci(500, 300, 7)], { tip: 'The horizon is always at your eye level.' }),
    T('Draw a road. Both edges aim at the dot.', [ln(250, 740, 500, 300), ln(750, 740, 500, 300)], { tip: 'Lines that run away from you all meet at the vanishing point.' }),
    T('Road markings get shorter and closer as they go back.', [ln(500, 720, 500, 610), ln(500, 550, 500, 480), ln(500, 445, 500, 405), ln(500, 385, 500, 362)]),
    T('A box beside the road. Start with a square, then aim its corners at the dot.', [rect(120, 400, 150, 150), ln(270, 400, 350, 365), ln(270, 550, 350, 462), ln(120, 400, 253, 365), ln(350, 365, 350, 462), ln(253, 365, 350, 365)]),
    T('A row of posts, shrinking into the distance.', [ln(823, 674, 823, 419), ln(728, 564, 728, 384), ln(652, 476, 652, 356), ln(595, 410, 595, 335)], { frame: [ln(880, 740, 500, 300), ln(880, 440, 500, 300)], tip: 'Things look smaller the further away they are. The guide lines show you exactly how much.' }),
    F('Finish the scene: a sun, some clouds, trees or shading.', {})]);
  add('school', 'persp2', 'Two-point perspective', 7, 'space', P, [
    T('Draw the horizon with a vanishing point at each end.', [ln(40, 250, 960, 250), ci(80, 250, 7), ci(920, 250, 7)]),
    T('Draw the corner of the box nearest to you.', [ln(500, 380, 500, 600)]),
    T('From the top and bottom of that edge, draw light lines to both points.', [ln(500, 380, 80, 250), ln(500, 600, 80, 250), ln(500, 380, 920, 250), ln(500, 600, 920, 250)], { tip: 'Keep these light. They are guides, not the drawing.' }),
    T('Two upright lines decide how wide the box is.', [ln(320, 324, 320, 450), ln(650, 334, 650, 475)], { tip: 'Upright edges stay perfectly vertical.' }),
    T('Close the top: each back corner aims at the opposite point.', [ln(320, 324, 463, 306), ln(650, 334, 463, 306)]),
    T('Go over the real edges of the box with a firm line.', [pg(500, 380, 320, 324, 463, 306, 650, 334), pl(320, 324, 320, 450, 500, 600, 650, 475, 650, 334), ln(500, 380, 500, 600)], { brush: 'pen', size: 3 }),
    F('Shade the two sides differently so the box looks solid.', { brush: 'pencil', size: 4, tip: 'Buildings, books, cars and furniture all begin as boxes like this one.' })]);

  /* ---------------- Track C: Draw it step by step ---------------- */
  const C = { brush: 'pen', size: 2 };
  const light = { brush: 'pencil', size: 2, color: '#8C93A6' };
  add('steps', 'cat', 'Sitting cat', 7, 'shape', C, [
    T('Start with a circle for the head and a tall oval for the body.', [ci(500, 220, 95), el(500, 470, 130, 180)], Object.assign({ tip: 'Draw these lightly. Artists always begin with simple shapes.' }, light)),
    T('Add two triangle ears.', both(pl(427, 159, 425, 70, 483, 126))),
    T('Draw the face: eyes, nose, mouth and whiskers.', [el(462, 212, 13, 18), el(538, 212, 13, 18), pg(490, 245, 510, 245, 500, 258), ar(486, 262, 14, 12, 0, 180), ar(514, 262, 14, 12, 180, 0), ln(445, 250, 365, 238), ln(445, 262, 365, 272), ln(555, 250, 635, 238), ln(555, 262, 635, 272)]),
    T('Draw the front legs and paws.', [ln(500, 500, 500, 640), ln(432, 500, 432, 640), ln(568, 500, 568, 640), ar(466, 640, 34, 18, 0, 180), ar(534, 640, 34, 18, 0, 180)]),
    T('Add a long curling tail.', [sp(605, 625, 700, 665, 800, 640, 840, 560, 815, 500), sp(622, 585, 700, 620, 770, 600, 795, 545, 815, 500)]),
    colourIn('Colour your cat. Stripes, patches or plain?')]);
  add('steps', 'puppy', 'Puppy', 7, 'shape', C, [
    T('A big circle for the head and an oval for the muzzle.', [ci(500, 360, 170), el(500, 445, 85, 62)], light),
    T('Draw two floppy ears.', both(sp(372, 248, 290, 265, 250, 380, 285, 500, 338, 445, 340, 395))),
    T('Add round eyes with a small shine in each.', [ci(435, 325, 22), ci(565, 325, 22), ci(442, 318, 7), ci(572, 318, 7)]),
    T('Draw the nose, the mouth and a tongue.', [el(500, 408, 30, 20), ln(500, 428, 500, 455), ar(470, 455, 30, 24, 0, 180), ar(530, 455, 30, 24, 180, 0), sp(482, 478, 485, 520, 500, 532, 515, 520, 518, 478)]),
    T('Give your puppy eyebrows, a neck and shoulders.', [sp(410, 285, 435, 272, 460, 282), sp(540, 282, 565, 272, 590, 285), sp(420, 512, 400, 600, 330, 680, 290, 745), sp(580, 512, 600, 600, 670, 680, 710, 745)]),
    colourIn()]);
  add('steps', 'bird', 'Little bird', 7, 'shape', C, [
    T('An oval body and a round head.', [el(520, 400, 150, 105, -18), ci(380, 290, 70)], light),
    T('Join the head to the body with two smooth curves.', [sp(322, 330, 345, 400, 400, 462), sp(432, 244, 480, 285, 560, 300)]),
    T('Add a beak and an eye.', [pg(316, 272, 245, 292, 318, 308), ci(365, 275, 10)]),
    T('Draw the wing and the tail.', [spc(455, 365, 550, 345, 650, 405, 590, 445, 495, 432), pl(640, 395, 800, 470, 760, 495, 650, 445)]),
    T('Add legs, and a branch to sit on.', [ln(495, 500, 488, 570), ln(548, 498, 545, 570), sp(220, 585, 500, 568, 820, 588), sp(220, 612, 500, 596, 820, 614)]),
    colourIn('Colour your bird. Real or imaginary colours, both are good.')]);
  add('steps', 'owl', 'Owl', 8, 'shape', C, [
    T('Start with a big egg shape.', [el(500, 400, 180, 230)], light),
    T('Draw two huge round eyes.', [ci(425, 290, 65), ci(575, 290, 65), ci(425, 290, 25), ci(575, 290, 25)]),
    T('Add a beak and two feather tufts.', [pg(480, 345, 520, 345, 500, 392)].concat(both(pl(345, 283, 322, 150, 430, 188)))),
    T('Draw a wing on each side.', both(sp(352, 335, 398, 450, 352, 570))),
    T('Rows of little U shapes make the chest feathers.', [460, 500, 540].map(x => ar(x, 440, 20, 16, 0, 180)).concat([480, 520].map(x => ar(x, 478, 20, 16, 0, 180)), [460, 500, 540].map(x => ar(x, 516, 20, 16, 0, 180)))),
    T('Add feet and a branch.', [440, 465, 490, 510, 535, 560].map(x => ar(x, 640, 13, 20, 180, 360)).concat([sp(220, 648, 500, 640, 780, 652), sp(220, 676, 500, 668, 780, 680)])),
    colourIn()]);
  add('steps', 'elephant', 'Elephant', 8, 'shape', C, [
    T('A big oval body and a circle head.', [el(550, 380, 220, 150), ci(300, 330, 110)], light),
    T('Draw one big ear.', [el(355, 330, 68, 100)]),
    T('Draw the trunk, curling at the end.', [sp(205, 290, 165, 400, 165, 520, 205, 575, 245, 560, 250, 530), sp(272, 432, 238, 475, 222, 520)]),
    T('Add four sturdy legs.', [pl(385, 500, 385, 645, 455, 645, 455, 522), pl(480, 528, 480, 645, 540, 645, 540, 530), pl(655, 522, 655, 645, 725, 645, 725, 485), pl(575, 530, 575, 645, 632, 645, 632, 527)]),
    T('Finish with an eye, a tusk and a tail.', [ci(268, 305, 9), sp(252, 400, 220, 445, 190, 432), sp(762, 340, 805, 410, 795, 470), ln(795, 470, 780, 495), ln(795, 470, 810, 495)]),
    colourIn()]);
  add('steps', 'turtle', 'Turtle', 7, 'shape', C, [
    T('Draw a dome for the shell.', [ar(500, 430, 230, 190, 180, 360), sp(270, 430, 500, 468, 730, 430)]),
    T('Add a head with an eye and a smile.', [ci(805, 395, 55), ci(828, 378, 7), ar(815, 402, 26, 16, 20, 120)]),
    T('Draw two legs and a small tail.', [sp(345, 452, 330, 540, 420, 545, 425, 464), sp(590, 464, 590, 545, 680, 540, 668, 452), pl(278, 438, 215, 470, 290, 458)]),
    T('Draw a six-sided shape in the middle of the shell.', [pg(450, 290, 550, 290, 590, 350, 550, 410, 450, 410, 410, 350)]),
    T('Join its corners to the edge of the shell.', [ln(450, 290, 425, 253), ln(550, 290, 575, 253), ln(590, 350, 712, 362), ln(410, 350, 288, 362), ln(550, 410, 585, 455), ln(450, 410, 415, 455)]),
    colourIn()]);
  add('steps', 'tree', 'Tree', 7, 'shape', C, [
    T('Draw the trunk, a little wider at the bottom.', [sp(445, 690, 465, 560, 472, 440), sp(555, 690, 535, 560, 528, 440), ln(280, 690, 720, 690)]),
    T('Draw a big cloud shape for the leaves.', [scallop(500, 285, 225, 175, 9)], { tip: 'Do not draw every leaf. Draw the shape of the whole crown.' }),
    T('Let a few branches reach up into the leaves.', [sp(478, 440, 458, 370, 400, 325), sp(522, 440, 548, 360, 612, 315), sp(500, 440, 498, 360, 505, 285)]),
    T('Add some leaf curls and tufts of grass.', [ar(400, 230, 28, 22, 180, 360), ar(560, 200, 28, 22, 180, 360), ar(620, 300, 28, 22, 180, 360), ar(350, 320, 28, 22, 180, 360), ar(480, 150, 28, 22, 180, 360), pl(320, 690, 330, 660, 342, 690, 355, 655, 366, 690), pl(630, 690, 642, 660, 654, 690, 668, 655, 680, 690)]),
    colourIn('Colour your tree. Which season is it?')]);
  add('steps', 'tulip', 'Tulip', 6, 'line', C, [
    T('Draw a deep U shape for the flower.', [sp(410, 200, 398, 300, 440, 380, 500, 400, 560, 380, 602, 300, 590, 200)]),
    T('Zigzag across the top to make three petals.', [sp(410, 200, 450, 262, 500, 165, 550, 262, 590, 200), sp(450, 262, 470, 330, 500, 400), sp(550, 262, 530, 330, 500, 400)]),
    T('Draw a long, gently curving stem.', [sp(500, 400, 493, 520, 505, 705)]),
    T('Add two long leaves.', [spc(500, 650, 430, 545, 340, 420, 385, 565, 470, 695), spc(505, 630, 580, 525, 672, 430, 632, 575, 532, 695)]),
    colourIn()]);
  add('steps', 'mug', 'Mug of tea', 7, 'form', C, [
    T('The top of a mug is an ellipse.', [el(460, 280, 150, 45)], { tip: 'This is the cylinder from Drawing school, put to work.' }),
    T('Draw the two sides, leaning in slightly, and a curved bottom.', [ln(310, 280, 330, 560), ln(610, 280, 590, 560), ar(460, 560, 130, 40, 0, 180)]),
    T('Add the handle: a big curve and a smaller one inside it.', [sp(606, 330, 715, 328, 740, 420, 700, 498, 596, 500), sp(604, 372, 678, 372, 694, 425, 668, 462, 598, 462)]),
    T('Show the tea inside with a curve just below the rim.', [ar(460, 288, 136, 34, 8, 172)]),
    T('Let some steam rise.', [sp(420, 222, 398, 172, 440, 132, 420, 80), sp(500, 228, 478, 178, 520, 138, 500, 86)], light),
    F('Shade the mug: darker on one side, fading across to the other.', { brush: 'shader' })]);
  add('steps', 'boat', 'Sailboat', 7, 'shape', C, [
    T('Draw the hull, wider at the top than the bottom.', [pg(250, 500, 750, 500, 680, 600, 320, 600)]),
    T('Stand a tall mast in the middle.', [ln(500, 500, 500, 130)]),
    T('Add two triangle sails.', [pg(515, 160, 515, 470, 730, 470), pg(485, 205, 485, 470, 300, 470)]),
    T('Fly a flag and draw the waves.', [pg(500, 130, 562, 150, 500, 170), wave(110, 890, 632, 12, 9), wave(110, 890, 680, 12, 9)]),
    T('Add a sun and two birds.', [ci(830, 150, 50), sp(140, 205, 168, 180, 195, 205), sp(195, 205, 222, 180, 250, 205)]),
    colourIn()]);
  add('steps', 'car', 'Car', 7, 'shape', C, [
    T('Draw a long, low box with rounded ends for the body.', [rr(170, 400, 660, 130, 34)]),
    T('Add the cabin on top.', [pl(300, 400, 370, 290, 620, 290, 700, 400)]),
    T('Two wheels, each with a smaller circle inside.', [ci(320, 535, 65), ci(680, 535, 65), ci(320, 535, 28), ci(680, 535, 28)]),
    T('Draw the windows.', [pg(335, 392, 385, 310, 485, 310, 485, 392), pg(505, 310, 605, 310, 663, 392, 505, 392)]),
    T('Add a door line, a handle, a headlight and the road.', [ln(495, 400, 495, 520), ln(520, 432, 560, 432), el(812, 445, 12, 22), ln(90, 602, 910, 602)]),
    colourIn()]);
  add('steps', 'mountains', 'Mountain view', 8, 'space', C, [
    T('Draw one big mountain, and a second one tucked behind it.', [pl(100, 520, 380, 170, 660, 520), pl(540, 370, 700, 230, 930, 520)], { tip: 'When one thing overlaps another, we read it as closer. It is the simplest way to show depth.' }),
    T('Zigzag a snow cap on each peak.', [pl(316, 250, 350, 282, 380, 252, 412, 286, 444, 250), pl(655, 270, 682, 292, 702, 272, 722, 294, 732, 270)]),
    T('Draw the ground line.', [ln(40, 520, 960, 520)]),
    T('Add pine trees in front. Make the nearer one bigger.', [pg(180, 395, 140, 468, 220, 468), pg(180, 448, 125, 540, 235, 540), rect(170, 540, 20, 40), pg(830, 370, 778, 470, 882, 470), pg(830, 440, 762, 565, 898, 565), rect(817, 565, 26, 55)]),
    T('Finish with a sun and a winding path.', [ci(840, 120, 52), sp(480, 520, 430, 600, 520, 660, 450, 745), sp(545, 520, 530, 595, 650, 655, 610, 745)]),
    colourIn()]);
  add('steps', 'penguin', 'Penguin', 6, 'shape', C, [
    T('Draw a tall egg for the body.', [el(500, 390, 150, 225)]),
    T('Draw a smaller egg inside for the white tummy.', [el(500, 435, 105, 165)]),
    T('Add two eyes and a beak.', [ci(455, 285, 12), ci(545, 285, 12), pg(475, 315, 525, 315, 500, 352)]),
    T('Draw a flipper on each side.', both(spc(362, 330, 298, 430, 305, 525, 352, 470))),
    T('Add two flat feet.', [el(445, 622, 48, 18), el(555, 622, 48, 18)]),
    colourIn('Colour your penguin. A scarf or a hat would look good.')]);
  add('steps', 'whale', 'Whale', 7, 'line', C, [
    T('Draw the back as one long curve.', [sp(170, 420, 230, 290, 430, 240, 640, 300, 790, 400)]),
    T('Draw the belly underneath.', [sp(170, 420, 300, 530, 520, 540, 700, 470, 790, 400)]),
    T('Add the tail.', [sp(790, 400, 830, 330, 815, 255, 875, 315, 935, 260, 915, 345, 790, 400)]),
    T('Draw an eye, a smile and a fin.', [ci(262, 398, 10), sp(175, 428, 240, 452, 312, 432), spc(430, 525, 470, 605, 540, 595, 500, 538)]),
    T('Add a spout of water and some waves.', [sp(380, 238, 380, 160, 340, 120, 308, 142), sp(380, 160, 420, 120, 452, 142), wave(80, 920, 650, 14, 9)]),
    colourIn()]);

  /* ---------------- Track D: Artist's studio ---------------- */
  add('studio', 'face', 'Proportions of the face', 10, 'form', P, [
    T('Draw an egg shape, narrower at the chin.', [spc(500, 135, 610, 170, 668, 300, 650, 440, 580, 570, 500, 608, 420, 570, 350, 440, 332, 300, 390, 170)]),
    T('Draw a centre line, then mark the eye line, nose line and mouth line.', [ln(500, 135, 500, 608), ln(335, 372, 665, 372), ln(360, 488, 640, 488), ln(395, 528, 605, 528)], Object.assign({ tip: 'The eyes sit halfway down the head. Nearly every beginner draws them too high.' }, light)),
    T('Draw the eyes on the eye line, one eye-width apart.', [sp(398, 372, 432, 352, 466, 372), sp(398, 372, 432, 386, 466, 372), ci(432, 369, 14), sp(534, 372, 568, 352, 602, 372), sp(534, 372, 568, 386, 602, 372), ci(568, 369, 14)], { tip: 'The head is about five eyes wide.' }),
    T('Add the eyebrows.', [sp(390, 336, 432, 320, 472, 334), sp(528, 334, 568, 320, 610, 336)]),
    T('Draw the nose. It is as wide as the gap between the eyes.', [sp(470, 478, 482, 492, 500, 487, 518, 492, 530, 478), sp(476, 462, 464, 476, 472, 490), sp(524, 462, 536, 476, 528, 490)]),
    T('Draw the mouth. Its corners line up under the pupils.', [sp(440, 528, 478, 523, 500, 529, 522, 523, 560, 528), sp(440, 528, 476, 510, 500, 516, 524, 510, 560, 528), sp(452, 532, 500, 556, 548, 532)]),
    T('The ears fit between the eye line and the nose line.', both(sp(334, 362, 306, 372, 310, 450, 350, 492))),
    T('Add the hair and the neck.', [sp(350, 290, 420, 225, 500, 215, 580, 225, 650, 290), sp(330, 385, 305, 220, 420, 102, 500, 96, 580, 102, 695, 220, 670, 385), ln(440, 592, 432, 715), ln(560, 592, 568, 715)], { tip: 'Hair sits above the skull, so it rises higher than the egg you drew.' }),
    F('Shade lightly under the brows, beside the nose and under the lower lip.', { brush: 'shader', tip: 'These proportions are an average. Every real face bends the rules a little, and that is what makes a likeness.' })]);
  add('studio', 'eye', 'Drawing an eye', 9, 'form', P, [
    T('Draw the upper lid, then the lower lid.', [sp(250, 400, 380, 292, 520, 270, 680, 328, 760, 400), sp(250, 400, 400, 468, 560, 480, 700, 442, 760, 400)], { tip: 'An eye is not a pointed oval. The highest and lowest points are not in the middle.' }),
    T('Draw the iris and the pupil. The top lid covers part of the iris.', [ar(510, 382, 104, 104, -62, 244), ci(510, 382, 42)]),
    T('Add a highlight and the fold above the eye.', [ci(548, 345, 20), sp(262, 352, 400, 242, 540, 226, 700, 288, 772, 362)]),
    T('Lashes curve outwards from the lid.', [sp(300, 362, 280, 345, 268, 318), sp(350, 320, 334, 298, 326, 270), sp(410, 291, 400, 266, 396, 238), sp(470, 275, 466, 250, 466, 222), sp(530, 271, 532, 246, 538, 218), sp(590, 284, 598, 260, 610, 234), sp(650, 311, 664, 290, 680, 268), sp(705, 350, 722, 334, 742, 318)]),
    T('Draw the eyebrow.', [sp(230, 250, 380, 152, 560, 140, 780, 228), sp(230, 250, 390, 190, 560, 180, 780, 228)]),
    F('Shade the iris with fine lines running from the pupil outwards, and fill the pupil solid dark.', { brush: 'pencil', size: 3, tip: 'Keep the highlight clean white. It is what makes an eye look alive.' })]);
  add('studio', 'figure', 'The figure in eight heads', 10, 'form', P, [
    T('Draw the head at the very top.', [el(500, 90, 32, 40)], { frame: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => ln(340, 50 + k * 80, 380, 50 + k * 80)), tip: 'The marks on the left divide the page into eight head-heights. An adult is about seven and a half to eight heads tall.' }),
    T('Draw the rib cage and the hips.', [el(500, 222, 68, 80), el(500, 350, 62, 40)], { frame: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => ln(340, 50 + k * 80, 380, 50 + k * 80)) }),
    T('Add the spine and the line of the shoulders.', [ln(500, 130, 500, 312), ln(420, 165, 580, 165)]),
    T('Draw the arms. Elbows reach the waist, wrists reach the hips.', [ln(420, 165, 398, 300), ln(398, 300, 388, 410), el(385, 436, 14, 25), ln(580, 165, 602, 300), ln(602, 300, 612, 410), el(615, 436, 14, 25)]),
    T('Draw the legs. The knees sit two heads above the ground.', [ln(468, 372, 458, 530), ln(458, 530, 462, 672), pg(462, 672, 430, 690, 472, 690), ln(532, 372, 542, 530), ln(542, 530, 538, 672), pg(538, 672, 570, 690, 528, 690)], { tip: 'Half of the body is legs. The halfway point is at the hips, not the waist.' }),
    T('Mark the joints with small circles.', [ci(420, 165, 11), ci(580, 165, 11), ci(398, 300, 9), ci(602, 300, 9), ci(458, 530, 11), ci(542, 530, 11)]),
    F('Now wrap each line in a simple cylinder to give the figure some body.', { tip: 'Every figure drawing, however detailed, sits on a frame like this one.' })]);
  add('studio', 'apple', 'Still life: an apple', 9, 'shade', P, [
    T('Draw the apple. It is wider at the shoulders than at the base.', [spc(500, 272, 420, 235, 335, 280, 302, 400, 352, 530, 450, 585, 500, 572, 550, 585, 648, 530, 698, 400, 665, 280, 580, 235)]),
    T('Add the dip, the stalk and a leaf.', [ar(500, 272, 52, 20, 10, 170), sp(498, 288, 503, 232, 528, 192), sp(511, 290, 517, 238, 540, 200), spc(532, 215, 590, 170, 662, 180, 600, 226)]),
    T('The light is top left. Mark the edge of the shadow and the shadow on the table.', [sp(648, 268, 590, 400, 470, 578), el(610, 592, 225, 36)], light),
    F('Shade the right side. Follow the round surface with curved strokes.', { brush: 'shader', tip: 'Squint at your drawing. Squinting hides detail and shows you whether the lights and darks are working.' }),
    F('Darken the shadow on the table, and leave one small white highlight on the upper left.', { brush: 'shader' })]);
  add('studio', 'room', 'A room in perspective', 9, 'space', P, [
    T('Draw the back wall, and a vanishing point in its centre.', [rect(350, 250, 300, 220), ci(500, 360, 6)]),
    T('From the vanishing point, draw out through each corner to the edge of the page.', [ln(350, 250, 20, 8), ln(650, 250, 980, 8), ln(350, 470, 20, 712), ln(650, 470, 980, 712)], { tip: 'You now have a floor, a ceiling and two side walls.' }),
    T('A window on the left wall. Its top and bottom aim at the vanishing point.', [pg(130, 182, 250, 240, 250, 400, 130, 419)]),
    T('A door and a picture on the back wall. These stay square.', [rect(540, 330, 70, 140), ci(552, 405, 4), rect(400, 300, 90, 60)], { tip: 'Shapes that face you directly are not distorted.' }),
    T('A rug on the floor. Its sides aim at the vanishing point.', [pg(300, 660, 700, 660, 620, 540, 380, 540)]),
    F('Furnish the room. Try a table or a bed built from a box.', {})]);
  add('studio', 'rose', 'Rose', 9, 'line', P, [
    T('Start with a small spiral in the centre.', [spiral(500, 300, 6, 52, 180, 1.6)]),
    T('Wrap two petals around the spiral.', [sp(440, 312, 432, 242, 500, 212, 568, 242, 562, 316), sp(412, 290, 382, 360, 440, 420, 520, 430, 600, 392, 612, 300)]),
    T('Add two petals behind them.', [sp(384, 330, 342, 250, 400, 182, 482, 162), sp(520, 162, 610, 182, 660, 262, 622, 340)]),
    T('Finish with one wide outer petal cupping the flower.', [sp(350, 300, 320, 400, 400, 480, 500, 500, 600, 480, 680, 400, 650, 292)]),
    T('Draw the stem and a leaf.', [sp(500, 500, 494, 600, 510, 725), spc(506, 612, 580, 562, 680, 572, 600, 632), sp(506, 612, 590, 598, 680, 572)]),
    F('Shade deep inside the petals, where they overlap. Leave the outer edges light.', { brush: 'shader', tip: 'Shadows gather where one petal tucks behind another.' })]);

  const TRACKS = [
    { id: 'first', title: 'First marks', blurb: 'Big shapes and bright colours. Best for ages 4 to 7.', band: 'little' },
    { id: 'school', title: 'Drawing school', blurb: 'The real fundamentals, in the order art teachers use: line, shape, form, shading, perspective.', band: 'all' },
    { id: 'steps', title: 'Draw it step by step', blurb: 'Animals, plants and things, built from simple shapes.', band: 'junior' },
    { id: 'studio', title: "Artist's studio", blurb: 'Faces, figures, still life and rooms. For teens and adults.', band: 'studio' }
  ];
  const SKILLS = { line: 'Line control', shape: 'Shapes', form: 'Form', shade: 'Light and shade', space: 'Depth and perspective' };
  TRACKS.unshift({ id: 'bible', title: 'Draw Bible characters', blurb: 'People and moments from Bible accounts, built from simple shapes. Each links to its story on jw.org.', band: 'bible' });
  window.PW_LESSONS = { lessons: L, tracks: TRACKS, skills: SKILLS, INK, GRAPH, h: { ln, pl, pg, rect, ar, el, ci, sp, spc, both, mir, wave, scallop, spiral, rr, T, F } };
})();
