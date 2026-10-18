// Procedurally drawn unit sprites in a painterly, HoMM3-inspired style.
// Each draw function uses a local coordinate system: origin at the unit's feet, facing right,
// roughly 100 units tall for a human. Negative y is up.
(function (root) {
  const BH = (root.BH = root.BH || {});

  const OUT = '#1b120a';
  const TEAMS = {
    player: { main: '#b8282a', light: '#e85a4a', dark: '#5e0e10', trim: '#f2d27a' },
    ai: { main: '#2a52c0', light: '#5c8cf0', dark: '#11265e', trim: '#f2d27a' },
  };
  const SKIN = '#e2b089';
  const SKIN_D = '#a8714c';

  function lg(ctx, x0, y0, x1, y1, ...colors) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((c, i) => g.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));
    return g;
  }

  function rg(ctx, x, y, r, ...colors) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    return g;
  }

  function shape(ctx, build, fill, lw = 1.4, stroke = OUT) {
    ctx.beginPath();
    build(ctx);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (lw) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  const poly = (pts) => (c) => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  };

  const ell = (x, y, rx, ry, rot = 0) => (c) => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);

  // Thick stroked limb with dark outline.
  function limb(ctx, pts, width, color) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [w, col] of [[width + 2.6, OUT], [width, color]]) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.lineWidth = w;
      ctx.strokeStyle = col;
      ctx.stroke();
    }
  }

  function stick(ctx, x0, y0, x1, y1, width, color) {
    limb(ctx, [[x0, y0], [x1, y1]], width, color);
  }

  function head(ctx, x, y, r = 7.5) {
    shape(ctx, ell(x, y, r, r * 1.05), rg(ctx, x, y, r * 1.3, '#f6caa4', SKIN, SKIN_D));
    shape(ctx, ell(x + r * 0.45, y - r * 0.15, 1, 1.2), OUT, 0);
  }

  function steel(ctx, x0, x1) {
    return lg(ctx, x0, 0, x1, 0, '#6f7782', '#eef2f6', '#9aa3ad', '#5a616b');
  }

  function legs(ctx, color, boot, spread = 1) {
    shape(ctx, poly([[-9, -30], [-3, -30], [-4 * spread, -4], [-11 * spread, -4]]), lg(ctx, -10, 0, -3, 0, color, '#2a2a2a'));
    shape(ctx, poly([[-13 * spread, -5], [-3 * spread, -5], [-2 * spread, 0], [-14 * spread, 0]]), boot);
    shape(ctx, poly([[2, -30], [8, -30], [11 * spread, -4], [4 * spread, -4]]), lg(ctx, 2, 0, 9, 0, color, '#3a3a3a'));
    shape(ctx, poly([[3 * spread, -5], [13 * spread, -5], [16 * spread, 0], [3 * spread, 0]]), boot);
  }

  // ---------------------------------------------------------------- units

  function pikeman(ctx, t) {
    legs(ctx, '#7a7f88', '#4a2e18');
    stick(ctx, -26, -20, -1, -44, 3, '#6b4a2a'); // rear pike shaft behind body
    shape(ctx, poly([[-13, -42], [13, -42], [16, -22], [-16, -22]]), lg(ctx, 0, -42, 0, -22, t.light, t.dark));
    shape(ctx, poly([[-2, -42], [2, -42], [2, -22], [-2, -22]]), t.trim, 0);
    shape(ctx, (c) => {
      c.moveTo(-12, -61);
      c.quadraticCurveTo(0, -65, 12, -61);
      c.lineTo(14, -40);
      c.quadraticCurveTo(0, -35, -13, -40);
      c.closePath();
    }, steel(ctx, -12, 14));
    limb(ctx, [[-8, -56], [-6, -46], [-1, -44]], 5, '#7a7f88');
    head(ctx, 3, -69);
    // morion helmet
    shape(ctx, (c) => {
      c.moveTo(-10, -71);
      c.quadraticCurveTo(3, -90, 16, -71);
      c.quadraticCurveTo(3, -75, -10, -71);
    }, steel(ctx, -10, 16));
    shape(ctx, (c) => {
      c.moveTo(-12, -70);
      c.quadraticCurveTo(3, -76, 18, -70);
      c.quadraticCurveTo(20, -73, 16, -73);
      c.quadraticCurveTo(3, -77, -10, -73);
      c.closePath();
    }, '#c9d0d8');
    stick(ctx, -1, -44, 64, -98, 3.2, '#7a5530');
    shape(ctx, poly([[60, -91], [76, -108], [66, -88]]), steel(ctx, 60, 76));
    limb(ctx, [[8, -57], [14, -46], [13, -55]], 5, '#7a7f88');
    shape(ctx, ell(13, -55, 2.8, 2.8), SKIN);
  }

  function archer(ctx, t) {
    legs(ctx, '#5b4630', '#3b2414');
    // quiver
    shape(ctx, poly([[-16, -72], [-9, -76], [-2, -44], [-9, -41]]), lg(ctx, -16, 0, -2, 0, '#7b4a22', '#4a2a10'));
    for (let i = 0; i < 3; i++) shape(ctx, poly([[-15 + i * 2.5, -73 - i], [-12 + i * 2.5, -82 - i], [-10 + i * 2.5, -74 - i]]), '#f0ead8', 0.8);
    // cloak
    shape(ctx, poly([[-11, -62], [-20, -24], [-6, -28]]), lg(ctx, 0, -62, 0, -24, t.main, t.dark));
    // tunic
    shape(ctx, (c) => {
      c.moveTo(-11, -62);
      c.lineTo(11, -62);
      c.lineTo(14, -26);
      c.lineTo(-14, -26);
      c.closePath();
    }, lg(ctx, -11, 0, 14, 0, '#3e6a2a', '#6fa048', '#2e5020'));
    shape(ctx, poly([[-13, -40], [13, -40], [13, -36], [-13, -36]]), '#5a3418');
    shape(ctx, poly([[-1, -40], [3, -40], [3, -36], [-1, -36]]), t.trim, 0.8);
    head(ctx, 3, -70);
    // hood
    shape(ctx, (c) => {
      c.moveTo(-8, -64);
      c.quadraticCurveTo(-10, -84, 4, -82);
      c.quadraticCurveTo(14, -80, 11, -72);
      c.quadraticCurveTo(4, -76, -2, -70);
      c.lineTo(-4, -62);
      c.closePath();
    }, lg(ctx, 0, -84, 0, -62, t.light, t.main));
    // draw arm
    limb(ctx, [[-6, -58], [2, -52], [6, -55]], 4.5, '#3e6a2a');
    // bow
    shape(ctx, (c) => {
      c.moveTo(26, -84);
      c.quadraticCurveTo(44, -55, 26, -24);
    }, null, 3.2, '#5a3010');
    shape(ctx, (c) => {
      c.moveTo(26, -84);
      c.quadraticCurveTo(44, -55, 26, -24);
    }, null, 1.8, '#a8743c');
    shape(ctx, (c) => {
      c.moveTo(26, -84);
      c.lineTo(6, -55);
      c.lineTo(26, -24);
    }, null, 0.7, '#eee');
    stick(ctx, 6, -55, 44, -55, 1.2, '#c9a46a');
    shape(ctx, poly([[44, -58], [50, -55], [44, -52]]), '#bbb', 0.8);
    limb(ctx, [[8, -58], [20, -56], [34, -55]], 4.5, '#3e6a2a');
    shape(ctx, ell(34, -55, 2.6, 2.6), SKIN);
  }

  function swordsman(ctx, t) {
    legs(ctx, '#9aa3ad', '#5a616b');
    // raised sword arm (behind)
    limb(ctx, [[-9, -58], [-14, -70], [-10, -80]], 5.5, '#9aa3ad');
    shape(ctx, poly([[-12, -82], [-7, -82], [-4, -118], [-9, -124], [-13, -118]]), lg(ctx, -13, 0, -4, 0, '#8b939c', '#ffffff', '#9aa3ad'));
    shape(ctx, poly([[-17, -82], [-2, -82], [-2, -79], [-17, -79]]), '#d7b04a');
    shape(ctx, poly([[-11, -79], [-8, -79], [-8, -73], [-11, -73]]), '#5a3418');
    // body
    shape(ctx, (c) => {
      c.moveTo(-13, -62);
      c.quadraticCurveTo(0, -67, 13, -62);
      c.lineTo(15, -36);
      c.lineTo(-15, -36);
      c.closePath();
    }, steel(ctx, -13, 15));
    shape(ctx, poly([[-12, -50], [12, -50], [16, -22], [-16, -22]]), lg(ctx, 0, -50, 0, -22, t.light, t.dark));
    shape(ctx, poly([[-1.5, -50], [1.5, -50], [1.5, -22], [-1.5, -22]]), '#fff', 0);
    shape(ctx, poly([[-8, -38], [8, -38], [8, -35], [-8, -35]]), '#fff', 0);
    // great helm
    shape(ctx, (c) => {
      c.moveTo(-8, -64);
      c.lineTo(-8, -80);
      c.quadraticCurveTo(2, -88, 12, -80);
      c.lineTo(12, -64);
      c.closePath();
    }, steel(ctx, -8, 12));
    shape(ctx, poly([[2, -75], [12, -75], [12, -72.5], [2, -72.5]]), '#222', 0);
    shape(ctx, poly([[5, -71], [7, -71], [7, -66], [5, -66]]), '#333', 0);
    shape(ctx, (c) => {
      c.moveTo(0, -84);
      c.quadraticCurveTo(-10, -100, -24, -88);
      c.quadraticCurveTo(-14, -90, -4, -80);
      c.closePath();
    }, lg(ctx, 0, -100, 0, -80, t.light, t.main));
    // kite shield
    shape(ctx, (c) => {
      c.moveTo(8, -64);
      c.lineTo(30, -64);
      c.quadraticCurveTo(31, -38, 19, -20);
      c.quadraticCurveTo(7, -38, 8, -64);
      c.closePath();
    }, lg(ctx, 8, 0, 30, 0, t.dark, t.light, t.main), 2.2, '#c9a24a');
    shape(ctx, poly([[17.5, -61], [20.5, -61], [20.5, -26], [17.5, -26]]), '#f6e7b0', 0);
    shape(ctx, poly([[11, -50], [28, -50], [28, -47], [11, -47]]), '#f6e7b0', 0);
  }

  function monk(ctx, t) {
    // staff behind
    stick(ctx, 22, 0, 22, -96, 3, '#8a5a2a');
    shape(ctx, ell(22, -101, 6, 6), null, 2, '#d7b04a');
    // robe
    shape(ctx, (c) => {
      c.moveTo(-10, -62);
      c.lineTo(10, -62);
      c.quadraticCurveTo(16, -30, 18, 0);
      c.lineTo(-18, 0);
      c.quadraticCurveTo(-16, -30, -10, -62);
      c.closePath();
    }, lg(ctx, -18, 0, 18, 0, '#a89a7a', '#f2ead4', '#b8ab8a'));
    shape(ctx, poly([[-3, -62], [3, -62], [5, 0], [-5, 0]]), lg(ctx, 0, -62, 0, 0, t.light, t.dark), 0.8);
    shape(ctx, poly([[-13, -38], [13, -38], [13, -35], [-13, -35]]), '#c9a24a', 0.8);
    // hood / head
    shape(ctx, ell(2, -70, 11, 12), lg(ctx, 0, -82, 0, -60, '#e8dfc6', '#9c8e6e'));
    head(ctx, 5, -69, 6.5);
    // sleeve arm to staff
    limb(ctx, [[6, -58], [14, -50], [21, -54]], 7, '#e2d9c0');
    shape(ctx, ell(21, -54, 2.8, 2.8), SKIN);
    // glowing orb
    const glow = ctx.createRadialGradient(22, -101, 0, 22, -101, 14);
    glow.addColorStop(0, 'rgba(255,255,220,0.95)');
    glow.addColorStop(0.35, 'rgba(255,230,120,0.7)');
    glow.addColorStop(1, 'rgba(255,200,60,0)');
    shape(ctx, ell(22, -101, 14, 14), glow, 0);
    shape(ctx, ell(22, -101, 4, 4), '#fffbe8', 0);
  }

  function mage(ctx, t) {
    // robe
    shape(ctx, (c) => {
      c.moveTo(-10, -62);
      c.lineTo(10, -62);
      c.quadraticCurveTo(15, -30, 19, 0);
      c.lineTo(-19, 0);
      c.quadraticCurveTo(-15, -30, -10, -62);
      c.closePath();
    }, lg(ctx, -19, 0, 19, 0, t.dark, t.main, t.dark));
    ctx.fillStyle = t.trim;
    for (const [x, y] of [[-8, -20], [6, -12], [-2, -40], [9, -32], [-11, -6]]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    shape(ctx, poly([[-19, 0], [19, 0], [18.5, -4], [-18.5, -4]]), t.trim, 0.8);
    head(ctx, 3, -69);
    // beard
    shape(ctx, poly([[-3, -66], [10, -66], [5, -48]]), lg(ctx, 0, -66, 0, -48, '#ffffff', '#c8c8c8'));
    // hat
    shape(ctx, ell(3, -75, 15, 3.5), t.dark);
    shape(ctx, (c) => {
      c.moveTo(-8, -75);
      c.quadraticCurveTo(-2, -95, -14, -108);
      c.quadraticCurveTo(6, -98, 14, -75);
      c.closePath();
    }, lg(ctx, -8, 0, 14, 0, t.dark, t.main));
    shape(ctx, poly([[-7, -78], [13, -78], [13.5, -75.5], [-7.5, -75.5]]), t.trim, 0);
    // casting arm and fireball
    limb(ctx, [[6, -58], [16, -54], [25, -60]], 6, t.main);
    shape(ctx, ell(25, -60, 2.8, 2.8), SKIN);
    const fire = ctx.createRadialGradient(32, -66, 0, 32, -66, 12);
    fire.addColorStop(0, 'rgba(255,255,210,1)');
    fire.addColorStop(0.3, 'rgba(255,190,40,0.95)');
    fire.addColorStop(0.7, 'rgba(230,60,0,0.7)');
    fire.addColorStop(1, 'rgba(200,30,0,0)');
    shape(ctx, ell(32, -66, 12, 12), fire, 0);
  }

  function griffin(ctx, t) {
    const fur = (x0, x1) => lg(ctx, x0, -50, x1, -10, '#e0b468', '#b07a38', '#6e4518');
    // far wing
    shape(ctx, (c) => {
      c.moveTo(4, -44);
      c.quadraticCurveTo(-4, -92, -18, -108);
      c.quadraticCurveTo(-22, -84, -34, -76);
      c.quadraticCurveTo(-14, -60, -6, -40);
      c.closePath();
    }, lg(ctx, 0, -108, 0, -40, '#8a5a2a', '#4a2c10'));
    // tail
    shape(ctx, (c) => {
      c.moveTo(-28, -32);
      c.quadraticCurveTo(-48, -36, -50, -58);
    }, null, 3.5, OUT);
    shape(ctx, (c) => {
      c.moveTo(-28, -32);
      c.quadraticCurveTo(-48, -36, -50, -58);
    }, null, 2, '#b07a38');
    shape(ctx, ell(-50, -60, 3.5, 5, 0.3), '#5a3410');
    // back legs (lion)
    limb(ctx, [[-22, -30], [-28, -14], [-22, -2]], 6, '#a0702e');
    limb(ctx, [[-14, -28], [-12, -12], [-18, -2]], 6, '#b07a38');
    // body
    shape(ctx, ell(-6, -34, 26, 13), fur(-30, 20));
    // front legs (eagle)
    limb(ctx, [[10, -30], [14, -14], [12, -2]], 4.5, '#d8b040');
    limb(ctx, [[2, -28], [4, -12], [0, -2]], 4.5, '#c8a030');
    for (const x of [12, 0]) {
      shape(ctx, poly([[x - 4, 0], [x + 6, 0], [x + 1, -3]]), '#2a2a2a', 0.6);
    }
    // chest feathers
    shape(ctx, ell(14, -42, 12, 13, -0.4), lg(ctx, 0, -55, 0, -30, '#ffffff', '#d6cfc0'));
    // head
    shape(ctx, ell(24, -60, 10, 9, -0.3), lg(ctx, 14, -70, 30, -50, '#ffffff', '#cfc6b4'));
    shape(ctx, (c) => {
      c.moveTo(31, -64);
      c.quadraticCurveTo(42, -63, 40, -54);
      c.quadraticCurveTo(37, -58, 31, -57);
      c.closePath();
    }, '#f0b020');
    shape(ctx, ell(27, -62, 1.6, 1.6), OUT, 0);
    shape(ctx, poly([[16, -66], [10, -72], [18, -68]]), '#eee', 0.8);
    // near wing
    shape(ctx, (c) => {
      c.moveTo(6, -46);
      c.quadraticCurveTo(-8, -86, -6, -114);
      c.quadraticCurveTo(-20, -96, -40, -88);
      c.quadraticCurveTo(-26, -78, -38, -66);
      c.quadraticCurveTo(-20, -62, -12, -44);
      c.closePath();
    }, lg(ctx, -40, -110, 6, -44, '#e8c07a', '#b27c3a', '#7a4c1c'));
    ctx.strokeStyle = 'rgba(60,30,8,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-2 - i * 2, -52 - i * 2);
      ctx.lineTo(-10 - i * 8, -100 + i * 9);
      ctx.stroke();
    }
    // team collar
    shape(ctx, ell(12, -48, 6, 2.5, -0.6), t.main, 1);
  }

  function cavalier(ctx, t) {
    const horse = (x0, x1) => lg(ctx, x0, -60, x1, -20, '#ffffff', '#d8d8d8', '#9a9a9a');
    // far legs
    limb(ctx, [[-22, -30], [-26, -14], [-24, -2]], 5, '#aaa');
    limb(ctx, [[20, -30], [26, -16], [24, -2]], 5, '#aaa');
    // tail
    shape(ctx, (c) => {
      c.moveTo(-34, -44);
      c.quadraticCurveTo(-48, -36, -44, -14);
      c.quadraticCurveTo(-40, -30, -32, -38);
      c.closePath();
    }, '#e8e4dc');
    // body
    shape(ctx, ell(-2, -40, 34, 14), horse(-36, 30));
    // neck & head
    shape(ctx, (c) => {
      c.moveTo(18, -48);
      c.quadraticCurveTo(26, -70, 34, -76);
      c.lineTo(48, -64);
      c.quadraticCurveTo(50, -58, 44, -58);
      c.lineTo(34, -62);
      c.quadraticCurveTo(30, -46, 28, -34);
      c.closePath();
    }, horse(18, 50));
    shape(ctx, ell(38, -70, 1.4, 1.4), OUT, 0);
    shape(ctx, poly([[30, -76], [32, -84], [35, -76]]), '#ddd');
    // near legs
    limb(ctx, [[-14, -30], [-16, -14], [-12, -2]], 5.5, '#e8e8e8');
    limb(ctx, [[12, -30], [16, -14], [14, -2]], 5.5, '#e8e8e8');
    for (const x of [-12, 14]) shape(ctx, poly([[x - 3, -3], [x + 4, -3], [x + 4, 0], [x - 3, 0]]), '#333', 0.6);
    // caparison
    shape(ctx, (c) => {
      c.moveTo(-30, -50);
      c.lineTo(22, -50);
      c.lineTo(24, -26);
      for (let i = 0; i < 6; i++) c.quadraticCurveTo(20 - i * 9, -18, 15 - i * 9, -26);
      c.lineTo(-32, -26);
      c.closePath();
    }, lg(ctx, 0, -50, 0, -18, t.light, t.main, t.dark));
    shape(ctx, poly([[-30, -50], [22, -50], [22, -47], [-30, -47]]), t.trim, 0.6);
    // rider
    limb(ctx, [[-4, -50], [2, -40], [6, -32]], 6, '#9aa3ad');
    shape(ctx, (c) => {
      c.moveTo(-12, -78);
      c.quadraticCurveTo(-2, -82, 8, -78);
      c.lineTo(8, -52);
      c.lineTo(-12, -52);
      c.closePath();
    }, steel(ctx, -12, 8));
    shape(ctx, poly([[-11, -66], [7, -66], [8, -52], [-12, -52]]), lg(ctx, 0, -66, 0, -52, t.light, t.dark), 0.8);
    shape(ctx, (c) => {
      c.moveTo(-8, -80);
      c.lineTo(-8, -94);
      c.quadraticCurveTo(0, -100, 8, -94);
      c.lineTo(8, -80);
      c.closePath();
    }, steel(ctx, -8, 8));
    shape(ctx, poly([[0, -90], [8, -90], [8, -88], [0, -88]]), '#222', 0);
    shape(ctx, (c) => {
      c.moveTo(-2, -98);
      c.quadraticCurveTo(-14, -112, -26, -98);
      c.quadraticCurveTo(-14, -102, -4, -94);
      c.closePath();
    }, t.light);
    // lance
    stick(ctx, -24, -60, 78, -76, 3, '#c9a46a');
    shape(ctx, poly([[74, -79], [92, -78], [74, -73]]), steel(ctx, 74, 92));
    shape(ctx, poly([[58, -74], [70, -76], [64, -68], [70, -64], [58, -66]]), t.main, 0.8);
    limb(ctx, [[2, -72], [8, -64], [10, -68]], 5, '#9aa3ad');
  }

  function dragon(ctx, t) {
    const scale = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#9ad050', '#4c8a26', '#1e4a10');
    // far wing
    shape(ctx, (c) => {
      c.moveTo(-4, -56);
      c.lineTo(-20, -118);
      c.quadraticCurveTo(-30, -96, -44, -96);
      c.quadraticCurveTo(-40, -80, -52, -74);
      c.quadraticCurveTo(-30, -66, -20, -48);
      c.closePath();
    }, lg(ctx, 0, -118, 0, -48, '#5a7a2a', '#2a4010'));
    // tail
    shape(ctx, (c) => {
      c.moveTo(-28, -38);
      c.quadraticCurveTo(-60, -40, -70, -16);
      c.quadraticCurveTo(-74, -6, -86, -10);
      c.quadraticCurveTo(-70, -2, -62, -18);
      c.quadraticCurveTo(-54, -30, -28, -26);
      c.closePath();
    }, scale(-80, -40, -30, 0));
    shape(ctx, poly([[-86, -10], [-94, -16], [-90, -6]]), '#d8c070', 0.8);
    // far legs
    limb(ctx, [[-20, -30], [-26, -14], [-20, -2]], 7, '#2e6216');
    limb(ctx, [[14, -32], [20, -16], [16, -2]], 6, '#2e6216');
    // body
    shape(ctx, ell(-4, -40, 32, 17), scale(-30, -58, 20, -22));
    shape(ctx, ell(4, -30, 22, 8), lg(ctx, 0, -38, 0, -22, '#f0e0a0', '#c8a860'), 0.8);
    // neck
    shape(ctx, (c) => {
      c.moveTo(14, -52);
      c.quadraticCurveTo(28, -70, 26, -86);
      c.quadraticCurveTo(30, -96, 40, -94);
      c.lineTo(44, -84);
      c.quadraticCurveTo(36, -80, 36, -70);
      c.quadraticCurveTo(34, -50, 22, -34);
      c.closePath();
    }, scale(14, -94, 44, -34));
    // head
    shape(ctx, (c) => {
      c.moveTo(30, -98);
      c.quadraticCurveTo(44, -104, 60, -94);
      c.lineTo(62, -88);
      c.lineTo(48, -86);
      c.lineTo(58, -80);
      c.lineTo(44, -80);
      c.quadraticCurveTo(34, -82, 30, -90);
      c.closePath();
    }, scale(30, -104, 62, -80));
    shape(ctx, ell(44, -95, 2.2, 1.6), '#ffd020', 0.8);
    shape(ctx, poly([[34, -100], [26, -114], [38, -102]]), '#e8d8a0', 0.8);
    shape(ctx, poly([[40, -101], [36, -112], [44, -102]]), '#e8d8a0', 0.8);
    // back spikes
    ctx.fillStyle = '#d8c070';
    for (let i = 0; i < 5; i++) {
      const x = -24 + i * 9;
      shape(ctx, poly([[x, -54 + Math.abs(i - 2)], [x + 3, -63 + Math.abs(i - 2)], [x + 6, -54 + Math.abs(i - 2)]]), '#d8c070', 0.8);
    }
    // near legs
    limb(ctx, [[-14, -30], [-14, -14], [-8, -2]], 8, '#4c8a26');
    limb(ctx, [[18, -34], [26, -18], [24, -2]], 7, '#4c8a26');
    for (const x of [-8, 24]) shape(ctx, poly([[x - 5, 0], [x + 8, 0], [x + 2, -4]]), '#e8e0c0', 0.6);
    // near wing (membrane with bones)
    shape(ctx, (c) => {
      c.moveTo(0, -54);
      c.lineTo(-6, -128);
      c.quadraticCurveTo(-22, -108, -40, -112);
      c.quadraticCurveTo(-42, -92, -62, -90);
      c.quadraticCurveTo(-58, -74, -72, -66);
      c.quadraticCurveTo(-36, -64, -16, -44);
      c.closePath();
    }, lg(ctx, -60, -128, 0, -44, 'rgba(150,190,80,0.95)', 'rgba(70,120,30,0.95)'));
    ctx.strokeStyle = '#1e3a0c';
    ctx.lineWidth = 2;
    for (const [x, y] of [[-6, -128], [-40, -112], [-62, -90], [-72, -66]]) {
      ctx.beginPath();
      ctx.moveTo(-2, -56);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    // team banner band on neck
    shape(ctx, ell(28, -60, 6, 3, -1.1), t.main, 1);
  }

  // Registry: id -> { draw, scale, portraitSize, portraitX }.
  // scale: battlefield size multiplier (1 = human-sized).
  // portraitSize: local units visible in a portrait's height (120 human, 175 dragon).
  // portraitX: horizontal anchor of the feet in the portrait, 0..1.
  const REGISTRY = {};

  function register(id, draw, opts = {}) {
    REGISTRY[id] = {
      draw,
      scale: opts.scale || 1,
      portraitSize: opts.portraitSize || 120,
      portraitX: opts.portraitX != null ? opts.portraitX : 0.45,
    };
  }

  function has(id) {
    return !!REGISTRY[id];
  }

  register('pikeman', pikeman);
  register('archer', archer);
  register('griffin', griffin, { scale: 1.08, portraitSize: 135, portraitX: 0.55 });
  register('swordsman', swordsman);
  register('monk', monk);
  register('mage', mage);
  register('cavalier', cavalier, { scale: 1.12, portraitSize: 150, portraitX: 0.42 });
  register('dragon', dragon, { scale: 1.3, portraitSize: 175, portraitX: 0.58 });

  // Sprite box in local units: width 240, height 170, feet at (120, 150).
  const BOX_W = 240;
  const BOX_H = 170;
  const FOOT_X = 120;
  const FOOT_Y = 150;

  const cache = new Map();

  function entryFor(type) {
    return REGISTRY[type] || REGISTRY.pikeman;
  }

  // Returns a cached canvas of the sprite at the given pixels-per-unit scale.
  function get(type, side, ppu) {
    const k = `${type}|${side}|${ppu.toFixed(3)}`;
    if (cache.has(k)) return cache.get(k);
    const e = entryFor(type);
    const s = ppu * e.scale;
    const c = document.createElement('canvas');
    c.width = Math.ceil(BOX_W * s);
    c.height = Math.ceil(BOX_H * s);
    const ctx = c.getContext('2d');
    ctx.translate(FOOT_X * s, FOOT_Y * s);
    ctx.scale(s, s);
    e.draw(ctx, TEAMS[side]);
    const entry = { canvas: c, footX: FOOT_X * s, footY: FOOT_Y * s };
    cache.set(k, entry);
    return entry;
  }

  // Red silhouette of a sprite used for hit flashes.
  function tinted(entry) {
    if (entry.tint) return entry.tint;
    const c = document.createElement('canvas');
    c.width = entry.canvas.width;
    c.height = entry.canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(entry.canvas, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#ff3020';
    ctx.fillRect(0, 0, c.width, c.height);
    entry.tint = c;
    return c;
  }

  function clearCache() {
    cache.clear();
  }

  // Draws a sprite into a portrait canvas.
  function portrait(canvas, type, side) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w / 2, h * 0.45, 2, w / 2, h / 2, w * 0.75);
    bg.addColorStop(0, '#6a8a4a');
    bg.addColorStop(1, '#22301a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const e = entryFor(type);
    const s = h / e.portraitSize;
    ctx.save();
    ctx.translate(w * e.portraitX, h * 0.97);
    ctx.scale(s, s);
    e.draw(ctx, TEAMS[side]);
    ctx.restore();
  }

  BH.SpriteKit = { OUT, SKIN, SKIN_D, lg, rg, shape, poly, ell, limb, stick, head, steel, legs };
  BH.Sprites = { get, tinted, portrait, clearCache, register, has, TEAMS };
})(typeof window !== 'undefined' ? window : globalThis);
