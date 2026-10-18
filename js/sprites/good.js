// Good faction unit sprites.
(function (root) {
  const BH = root.BH;
  const { OUT, SKIN, SKIN_D, lg, rg, shape, poly, ell, limb, stick, head, steel, legs } = BH.SpriteKit;

  function flame(ctx, x, y, s = 1) {
    const g = rg(ctx, x, y, 16 * s, 'rgba(255,255,210,0.95)', 'rgba(255,170,20,0.8)', 'rgba(210,30,0,0)');
    shape(ctx, ell(x, y, 16 * s, 16 * s), g, 0);
    shape(ctx, (c) => {
      c.moveTo(x - 5 * s, y + 5 * s);
      c.quadraticCurveTo(x - 11 * s, y - 8 * s, x - 2 * s, y - 21 * s);
      c.quadraticCurveTo(x + 1 * s, y - 10 * s, x + 10 * s, y - 18 * s);
      c.quadraticCurveTo(x + 8 * s, y - 4 * s, x + 3 * s, y + 6 * s);
      c.closePath();
    }, lg(ctx, x, y - 22 * s, x, y + 6 * s, '#fff6a0', '#ff9a18', '#c82600'), 1);
  }

  function featherWing(ctx, baseX, baseY, flip, tints) {
    const dir = flip ? -1 : 1;
    shape(ctx, (c) => {
      c.moveTo(baseX, baseY);
      c.quadraticCurveTo(baseX - 16 * dir, baseY - 55, baseX - 50 * dir, baseY - 86);
      c.quadraticCurveTo(baseX - 45 * dir, baseY - 48, baseX - 76 * dir, baseY - 24);
      c.quadraticCurveTo(baseX - 46 * dir, baseY - 20, baseX - 24 * dir, baseY + 6);
      c.closePath();
    }, lg(ctx, baseX - 75 * dir, baseY - 85, baseX, baseY + 8, tints[0], tints[1], tints[2]), 2);
    for (let i = 0; i < 5; i++) {
      const sx = baseX - (18 + i * 10) * dir;
      const sy = baseY - 8 - i * 12;
      shape(ctx, (c) => {
        c.moveTo(baseX - 4 * dir, baseY - 2);
        c.quadraticCurveTo(sx + 14 * dir, sy + 8, sx, sy);
        c.quadraticCurveTo(sx + 8 * dir, sy + 22, baseX - 12 * dir, baseY + 8);
      }, null, 1, 'rgba(80,80,80,0.35)');
    }
  }

  function axe(ctx, x0, y0, x1, y1) {
    stick(ctx, x0, y0, x1, y1, 3.2, '#7a4a22');
    shape(ctx, (c) => {
      c.moveTo(x1 - 4, y1 - 6);
      c.quadraticCurveTo(x1 + 14, y1 - 12, x1 + 18, y1 + 4);
      c.quadraticCurveTo(x1 + 5, y1 + 2, x1 - 4, y1 + 9);
      c.closePath();
    }, steel(ctx, x1 - 4, x1 + 18));
  }

  function rune(ctx, x, y, col = '#60d8ff') {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 3, y);
    ctx.closePath();
    ctx.stroke();
  }

  function curvedSword(ctx, x0, y0, x1, y1) {
    shape(ctx, (c) => {
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2 + 9, (y0 + y1) / 2 - 8, x1, y1);
    }, null, 3.8, OUT);
    shape(ctx, (c) => {
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2 + 9, (y0 + y1) / 2 - 8, x1, y1);
    }, null, 2.2, '#e8edf2');
    shape(ctx, poly([[x0 - 4, y0 + 1], [x0 + 4, y0 - 1], [x0 + 6, y0 + 2], [x0 - 2, y0 + 4]]), '#d0a030', 0.8);
  }

  function angel(ctx, t) {
    featherWing(ctx, -2, -58, true, ['#ffffff', '#dde6ec', '#aeb8c0']);
    featherWing(ctx, 4, -56, false, ['#ffffff', '#eef4f7', '#b8c0c8']);
    const halo = rg(ctx, 0, -112, 18, 'rgba(255,235,120,0.9)', 'rgba(255,210,70,0.35)', 'rgba(255,210,70,0)');
    shape(ctx, ell(0, -112, 22, 10), halo, 0);
    shape(ctx, ell(0, -112, 14, 4), null, 2.2, '#f4cf55');
    legs(ctx, '#d9dde4', '#8b7138', 0.85);
    shape(ctx, (c) => {
      c.moveTo(-11, -70);
      c.lineTo(12, -70);
      c.lineTo(18, -28);
      c.lineTo(-18, -28);
      c.closePath();
    }, lg(ctx, 0, -70, 0, -28, t.light, t.main, t.dark));
    shape(ctx, poly([[-18, -45], [20, -45], [18, -38], [-20, -38]]), t.trim, 0.8);
    shape(ctx, (c) => {
      c.moveTo(-13, -78);
      c.quadraticCurveTo(0, -85, 14, -78);
      c.lineTo(12, -52);
      c.quadraticCurveTo(0, -47, -13, -52);
      c.closePath();
    }, steel(ctx, -13, 14), 1.7);
    limb(ctx, [[-11, -70], [-22, -60], [-18, -48]], 5, '#d9dde4');
    limb(ctx, [[10, -70], [21, -59], [26, -47]], 5, '#d9dde4');
    stick(ctx, 30, -40, 59, -95, 3.2, '#d6b05a');
    shape(ctx, poly([[55, -98], [67, -124], [66, -92]]), '#eef6ff', 1);
    flame(ctx, 64, -112, 0.8);
    head(ctx, 0, -91, 7.5);
    shape(ctx, (c) => {
      c.moveTo(-10, -92);
      c.quadraticCurveTo(-6, -108, 7, -105);
      c.quadraticCurveTo(17, -99, 9, -83);
      c.quadraticCurveTo(2, -89, -8, -84);
      c.closePath();
    }, lg(ctx, -8, -106, 10, -82, '#ffe58d', '#c58d24'));
  }

  function dwarf(ctx, t) {
    legs(ctx, '#5e6469', '#392414', 0.65);
    axe(ctx, -28, -16, 33, -72);
    shape(ctx, ell(-16, -37, 14, 16, -0.2), lg(ctx, -30, -52, -4, -20, '#8b949c', '#dfe6eb', '#69727a'));
    shape(ctx, (c) => {
      c.moveTo(-18, -56);
      c.lineTo(14, -56);
      c.lineTo(18, -28);
      c.lineTo(-18, -28);
      c.closePath();
    }, lg(ctx, 0, -56, 0, -28, t.light, t.main, t.dark));
    shape(ctx, (c) => {
      c.moveTo(-12, -63);
      c.quadraticCurveTo(2, -68, 15, -63);
      c.lineTo(13, -43);
      c.quadraticCurveTo(1, -38, -12, -43);
      c.closePath();
    }, steel(ctx, -12, 15));
    limb(ctx, [[-14, -51], [-24, -43], [-28, -33]], 6, '#8b949c');
    limb(ctx, [[12, -51], [20, -43], [20, -34]], 6, '#8b949c');
    head(ctx, 1, -69, 7.2);
    shape(ctx, (c) => {
      c.moveTo(-8, -66);
      c.quadraticCurveTo(1, -55, 12, -66);
      c.lineTo(8, -34);
      c.quadraticCurveTo(0, -27, -9, -34);
      c.closePath();
    }, lg(ctx, 0, -66, 0, -30, '#c47a2c', '#7a3f15'));
    for (const x of [-5, 5]) limb(ctx, [[x, -59], [x * 0.6, -46], [x * 0.9, -33]], 2.2, '#5a2d10');
    shape(ctx, (c) => {
      c.moveTo(-13, -73);
      c.quadraticCurveTo(0, -88, 14, -73);
      c.lineTo(12, -68);
      c.quadraticCurveTo(0, -72, -13, -68);
      c.closePath();
    }, steel(ctx, -13, 14));
    shape(ctx, poly([[-10, -78], [-28, -87], [-18, -70]]), '#d4c09a', 1);
    shape(ctx, poly([[10, -78], [30, -86], [18, -70]]), '#d4c09a', 1);
    shape(ctx, ell(24, -42, 11, 13), lg(ctx, 14, -55, 34, -30, t.light, t.dark), 2, '#c9a24a');
  }

  function woodelf(ctx, t) {
    legs(ctx, '#3f5d2a', '#2b1b0e', 0.9);
    shape(ctx, poly([[-18, -73], [-9, -78], [-2, -36], [-12, -33]]), lg(ctx, -18, -78, -2, -33, '#7b4a22', '#3d210b'));
    for (let i = 0; i < 5; i++) shape(ctx, poly([[-16 + i * 2, -77 - i], [-15 + i * 2, -89 - i], [-12 + i * 2, -78 - i]]), '#e6dfc8', 0.7);
    shape(ctx, (c) => {
      c.moveTo(-13, -67);
      c.quadraticCurveTo(-30, -38, -18, -3);
      c.lineTo(8, -30);
      c.quadraticCurveTo(4, -52, 11, -67);
      c.closePath();
    }, lg(ctx, -20, -68, 2, -2, '#6f9c46', '#254a1b'), 1.5);
    shape(ctx, (c) => {
      c.moveTo(-11, -66);
      c.lineTo(12, -66);
      c.lineTo(13, -31);
      c.lineTo(-14, -31);
      c.closePath();
    }, lg(ctx, 0, -66, 0, -31, '#5d8b38', '#27491b'));
    shape(ctx, poly([[-14, -47], [14, -47], [15, -40], [-15, -40]]), t.main, 0.9);
    shape(ctx, ell(-5, -77, 5, 2, -0.35), SKIN, 1);
    shape(ctx, ell(11, -77, 5, 2, 0.35), SKIN, 1);
    head(ctx, 3, -75, 7);
    shape(ctx, (c) => {
      c.moveTo(-7, -78);
      c.quadraticCurveTo(-2, -94, 14, -89);
      c.quadraticCurveTo(23, -79, 9, -60);
      c.quadraticCurveTo(6, -72, -6, -67);
      c.closePath();
    }, lg(ctx, -6, -92, 16, -60, '#ffe08a', '#b87422'));
    limb(ctx, [[-7, -60], [3, -53], [7, -56]], 4.2, '#5d8b38');
    shape(ctx, (c) => {
      c.moveTo(28, -88);
      c.quadraticCurveTo(50, -56, 29, -20);
    }, null, 3, '#5b3112');
    shape(ctx, (c) => {
      c.moveTo(28, -88);
      c.lineTo(7, -56);
      c.lineTo(29, -20);
    }, null, 0.8, '#f5efe0');
    stick(ctx, 7, -56, 49, -57, 1.2, '#c69a50');
    shape(ctx, poly([[49, -60], [56, -57], [49, -54]]), '#d8d8d8', 0.8);
    limb(ctx, [[8, -62], [22, -58], [36, -57]], 4.2, '#5d8b38');
  }

  function dendroid(ctx, t) {
    limb(ctx, [[-14, -38], [-25, -15], [-33, 0]], 12, '#5a3519');
    limb(ctx, [[11, -38], [18, -15], [27, 0]], 12, '#6a421f');
    shape(ctx, (c) => {
      c.moveTo(-24, -96);
      c.quadraticCurveTo(-30, -62, -20, -22);
      c.lineTo(20, -22);
      c.quadraticCurveTo(29, -64, 19, -103);
      c.quadraticCurveTo(2, -92, -24, -96);
      c.closePath();
    }, lg(ctx, -25, -100, 25, -20, '#8b5628', '#4a2712', '#7a421d'), 2);
    ctx.strokeStyle = 'rgba(40,20,8,0.5)';
    ctx.lineWidth = 1.2;
    for (const x of [-14, -5, 5, 14]) {
      ctx.beginPath();
      ctx.moveTo(x, -91);
      ctx.quadraticCurveTo(x - 8, -63, x + 2, -26);
      ctx.stroke();
    }
    shape(ctx, ell(-7, -79, 2.2, 2.8), '#b9ff74', 0.7);
    shape(ctx, ell(8, -80, 2.2, 2.8), '#b9ff74', 0.7);
    limb(ctx, [[-18, -79], [-45, -71], [-62, -50]], 9, '#5a3519');
    limb(ctx, [[18, -82], [44, -93], [66, -76]], 9, '#6a421f');
    for (const [x, y] of [[-68, -50], [-58, -64], [64, -81], [53, -100], [43, -88]]) {
      shape(ctx, ell(x, y, 8, 6, 0.3), '#4f8a2d', 1);
    }
    shape(ctx, (c) => {
      c.moveTo(-34, -104);
      c.quadraticCurveTo(-25, -135, 4, -125);
      c.quadraticCurveTo(31, -139, 45, -107);
      c.quadraticCurveTo(34, -82, -4, -90);
      c.quadraticCurveTo(-29, -82, -34, -104);
      c.closePath();
    }, lg(ctx, -30, -136, 40, -88, '#79b84b', '#2f6a24'), 2);
    shape(ctx, poly([[35, -87], [55, -84], [54, -70], [35, -74]]), lg(ctx, 35, -88, 55, -70, t.light, t.dark), 1);
    shape(ctx, poly([[40, -86], [43, -85], [42, -72], [39, -73]]), t.trim, 0);
  }

  function unicorn(ctx, t) {
    const white = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#ffffff', '#dedee3', '#a9a9b2');
    limb(ctx, [[-26, -32], [-33, -15], [-31, -2]], 5.8, '#cfd0d5');
    limb(ctx, [[22, -32], [31, -15], [29, -2]], 5.8, '#cfd0d5');
    shape(ctx, (c) => {
      c.moveTo(-36, -45);
      c.quadraticCurveTo(-61, -40, -55, -9);
      c.quadraticCurveTo(-45, -34, -32, -38);
      c.closePath();
    }, lg(ctx, -55, -44, -30, -10, '#fff', '#d8d8e0'), 1.5);
    shape(ctx, ell(-3, -42, 37, 15), white(-40, -57, 33, -24));
    shape(ctx, (c) => {
      c.moveTo(19, -50);
      c.quadraticCurveTo(29, -78, 43, -84);
      c.quadraticCurveTo(55, -82, 58, -70);
      c.quadraticCurveTo(61, -62, 52, -59);
      c.lineTo(41, -64);
      c.quadraticCurveTo(30, -52, 29, -34);
      c.closePath();
    }, white(17, -84, 59, -32));
    shape(ctx, poly([[43, -86], [52, -116], [55, -85]]), lg(ctx, 44, -116, 56, -85, '#fff8c8', '#d7a920'), 1);
    ctx.strokeStyle = '#b68512';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(47 + i * 1.6, -109 + i * 5);
      ctx.lineTo(52 + i * 0.9, -106 + i * 5);
      ctx.stroke();
    }
    shape(ctx, ell(46, -74, 1.5, 1.5), OUT, 0);
    shape(ctx, (c) => {
      c.moveTo(28, -67);
      c.quadraticCurveTo(13, -92, -11, -60);
      c.quadraticCurveTo(8, -76, 28, -49);
      c.quadraticCurveTo(18, -59, 5, -45);
      c.quadraticCurveTo(20, -48, 31, -36);
      c.closePath();
    }, lg(ctx, -11, -92, 31, -36, '#fff6d0', '#d69b35'), 0.8);
    limb(ctx, [[-17, -32], [-20, -14], [-16, -2]], 6.1, '#f4f4f4');
    limb(ctx, [[13, -32], [18, -14], [16, -2]], 6.1, '#f4f4f4');
    for (const x of [-31, 29, -16, 16]) shape(ctx, poly([[x - 4, -3], [x + 4, -3], [x + 5, 0], [x - 4, 0]]), '#333', 0.6);
    shape(ctx, poly([[-29, -53], [25, -53], [27, -28], [-31, -28]]), lg(ctx, 0, -53, 0, -28, t.light, t.main, t.dark), 1);
    shape(ctx, poly([[-29, -53], [25, -53], [25, -50], [-29, -50]]), t.trim, 0);
    shape(ctx, ell(37, -63, 9, 2.8, -1), t.main, 1);
  }

  function golem(ctx, t) {
    limb(ctx, [[-18, -39], [-25, -18], [-22, -2]], 13, '#777b7d');
    limb(ctx, [[16, -39], [24, -18], [22, -2]], 13, '#686c70');
    shape(ctx, poly([[-28, -86], [21, -92], [31, -45], [14, -24], [-22, -28], [-37, -55]]), lg(ctx, -37, -92, 31, -24, '#92999d', '#4b5054'), 2.2);
    shape(ctx, poly([[-18, -105], [17, -106], [27, -89], [20, -73], [-18, -75], [-28, -91]]), lg(ctx, -28, -106, 27, -73, '#9ea5a9', '#5b6064'), 2);
    shape(ctx, ell(-7, -91, 2.4, 2.4), '#62e8ff', 0.7);
    shape(ctx, ell(10, -92, 2.4, 2.4), '#62e8ff', 0.7);
    limb(ctx, [[-30, -74], [-56, -57], [-62, -33]], 16, '#707579');
    limb(ctx, [[27, -75], [50, -59], [61, -39]], 16, '#7f8589');
    shape(ctx, ell(-65, -29, 11, 10, -0.4), '#676c70', 1.5);
    shape(ctx, ell(64, -35, 12, 10, 0.4), '#8d9397', 1.5);
    shape(ctx, poly([[-34, -61], [28, -66], [29, -55], [-33, -50]]), lg(ctx, 0, -66, 0, -50, t.light, t.main, t.dark), 1);
    for (const [x, y] of [[-6, -61], [12, -82], [-22, -42], [4, -34]]) rune(ctx, x, y);
    ctx.strokeStyle = '#303336';
    ctx.lineWidth = 1.2;
    for (const pts of [[[-20, -80], [-9, -71], [-14, -61]], [[16, -49], [5, -45], [2, -34]], [[-6, -101], [-2, -92], [-10, -84]]]) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.stroke();
    }
  }

  function naga(ctx, t) {
    shape(ctx, (c) => {
      c.moveTo(-70, -2);
      c.quadraticCurveTo(-34, -33, 18, -27);
      c.quadraticCurveTo(70, -22, 70, -4);
      c.quadraticCurveTo(58, 13, 19, 7);
      c.quadraticCurveTo(-22, 2, -70, -2);
      c.closePath();
    }, lg(ctx, -70, -34, 70, 8, '#35a384', '#145347', '#0b302b'), 2.2);
    shape(ctx, (c) => {
      c.moveTo(-33, -5);
      c.quadraticCurveTo(-1, -23, 39, -13);
      c.quadraticCurveTo(57, -8, 39, 0);
      c.quadraticCurveTo(0, 5, -33, -5);
      c.closePath();
    }, lg(ctx, -35, -22, 45, 2, '#3ab493', '#176150'), 1.3);
    shape(ctx, (c) => {
      c.moveTo(-7, -23);
      c.quadraticCurveTo(13, -44, 10, -77);
      c.lineTo(31, -77);
      c.quadraticCurveTo(35, -42, 22, -21);
      c.closePath();
    }, lg(ctx, -7, -77, 31, -21, '#2b9b7b', '#115044'), 1.8);
    shape(ctx, (c) => {
      c.moveTo(1, -80);
      c.quadraticCurveTo(16, -91, 33, -80);
      c.lineTo(36, -45);
      c.quadraticCurveTo(18, -35, 0, -45);
      c.closePath();
    }, lg(ctx, 0, -84, 36, -42, SKIN, SKIN_D), 1.7);
    shape(ctx, poly([[-1, -62], [37, -62], [35, -47], [2, -47]]), lg(ctx, 0, -62, 37, -47, t.light, t.main, t.dark), 1);
    for (const [a, b, c] of [
      [[4, -74], [-22, -92], [-42, -111]],
      [[4, -64], [-24, -65], [-50, -73]],
      [[5, -52], [-19, -37], [-39, -22]],
      [[33, -74], [58, -94], [73, -116]],
      [[35, -64], [64, -64], [88, -74]],
      [[33, -52], [55, -37], [77, -22]],
    ]) {
      limb(ctx, [a, b], 5.6, SKIN);
      curvedSword(ctx, b[0], b[1], c[0], c[1]);
    }
    head(ctx, 18, -95, 8);
    shape(ctx, (c) => {
      c.moveTo(7, -96);
      c.quadraticCurveTo(18, -115, 33, -97);
      c.quadraticCurveTo(28, -105, 24, -86);
      c.lineTo(9, -86);
      c.closePath();
    }, '#151010');
    shape(ctx, poly([[8, -101], [13, -111], [18, -101], [24, -113], [28, -101]]), '#d9b24b', 1);
    shape(ctx, ell(18, -84, 15, 2.5), '#d9b24b', 1);
    shape(ctx, ell(20, -68, 18, 2.8), '#d9b24b', 1);
    shape(ctx, ell(21, -45, 13, 3.3, -0.2), t.trim, 0.8);
  }

  function titan(ctx, t) {
    const lightning = rg(ctx, 54, -112, 32, 'rgba(255,255,230,0.9)', 'rgba(125,190,255,0.35)', 'rgba(80,130,255,0)');
    shape(ctx, ell(54, -112, 35, 35), lightning, 0);
    shape(ctx, poly([[45, -137], [64, -113], [55, -114], [69, -88], [40, -119], [51, -117]]), '#fff4a0', 1.1, '#e7b930');
    limb(ctx, [[-14, -48], [-23, -16], [-20, -1]], 11, SKIN_D);
    limb(ctx, [[13, -48], [22, -17], [20, -1]], 11, SKIN);
    shape(ctx, (c) => {
      c.moveTo(-35, -90);
      c.quadraticCurveTo(-8, -108, 28, -91);
      c.lineTo(31, -51);
      c.quadraticCurveTo(2, -35, -28, -50);
      c.closePath();
    }, lg(ctx, -35, -108, 31, -35, '#f0b989', SKIN_D), 2.2);
    shape(ctx, ell(-16, -82, 9, 6, -0.4), 'rgba(120,70,40,0.35)', 0);
    shape(ctx, ell(14, -82, 9, 6, 0.4), 'rgba(255,210,160,0.28)', 0);
    ctx.strokeStyle = 'rgba(90,45,20,0.55)';
    ctx.lineWidth = 1.4;
    for (const x of [-16, -6, 7, 18]) {
      ctx.beginPath();
      ctx.moveTo(x, -82);
      ctx.quadraticCurveTo(x - 2, -67, x, -52);
      ctx.stroke();
    }
    shape(ctx, poly([[-27, -78], [22, -91], [27, -75], [-12, -63], [-12, -21], [-32, -21]]), lg(ctx, -30, -91, 27, -21, '#f7f2e2', '#c9b37e'), 1.5);
    shape(ctx, poly([[-29, -78], [25, -93], [27, -88], [-26, -72]]), '#d6a337', 0.8);
    shape(ctx, (c) => {
      c.moveTo(-25, -88);
      c.quadraticCurveTo(-44, -54, -39, -9);
      c.lineTo(-17, -25);
      c.quadraticCurveTo(-9, -60, -4, -95);
      c.closePath();
    }, lg(ctx, -43, -95, -4, -9, t.light, t.main, t.dark), 1.5);
    limb(ctx, [[-28, -85], [-50, -71], [-59, -47]], 10, SKIN_D);
    limb(ctx, [[24, -86], [39, -104], [52, -118]], 10, SKIN);
    shape(ctx, ell(-38, -72, 8, 5, -0.45), 'rgba(120,70,40,0.3)', 0);
    shape(ctx, ell(37, -101, 8, 5, -0.8), 'rgba(255,210,160,0.25)', 0);
    shape(ctx, ell(0, -115, 10, 11), rg(ctx, 0, -115, 13, '#f8c89d', SKIN, SKIN_D), 1.5);
    shape(ctx, ell(4, -115, 1.4, 1.3), OUT, 0);
    shape(ctx, (c) => {
      c.moveTo(6, -112);
      c.lineTo(12, -109);
      c.lineTo(6, -107);
    }, null, 1.1, '#6a3b20');
    shape(ctx, (c) => {
      c.moveTo(-9, -109);
      c.quadraticCurveTo(1, -94, 12, -109);
      c.quadraticCurveTo(9, -96, 1, -91);
      c.quadraticCurveTo(-8, -96, -9, -109);
      c.closePath();
    }, lg(ctx, 0, -110, 0, -91, '#d5a25b', '#7a411b'), 1);
    ctx.strokeStyle = '#5a2e14';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-4 + i * 3.2, -103, 4.5, 0.1, Math.PI * 1.05);
      ctx.stroke();
    }
    shape(ctx, (c) => {
      c.moveTo(-12, -119);
      c.quadraticCurveTo(-7, -131, 10, -129);
      c.quadraticCurveTo(18, -124, 14, -115);
      c.lineTo(8, -121);
      c.lineTo(-8, -120);
      c.closePath();
    }, lg(ctx, -12, -131, 14, -115, '#f0c050', '#9a6328'), 1.2);
    shape(ctx, poly([[-13, -119], [15, -119], [16, -114], [-14, -114]]), '#d6a337', 1);
    shape(ctx, ell(-9, -123, 3, 5, -0.8), '#69a94b', 1);
    shape(ctx, ell(13, -123, 3, 5, 0.8), '#69a94b', 1);
    shape(ctx, poly([[-20, -96], [20, -99], [22, -88], [-22, -85]]), '#d6a337', 1);
  }

  function phoenix(ctx, t) {
    const aura = rg(ctx, 4, -62, 92, 'rgba(255,245,120,0.35)', 'rgba(255,100,0,0.18)', 'rgba(170,0,0,0)');
    shape(ctx, ell(4, -62, 92, 72), aura, 0);
    shape(ctx, (c) => {
      c.moveTo(-2, -54);
      c.quadraticCurveTo(-28, -118, -75, -126);
      c.quadraticCurveTo(-58, -86, -90, -72);
      c.quadraticCurveTo(-49, -70, -21, -42);
      c.closePath();
    }, lg(ctx, -90, -126, -2, -42, '#fff078', '#ff7a14', '#a51500'), 2);
    shape(ctx, (c) => {
      c.moveTo(2, -55);
      c.quadraticCurveTo(37, -126, 87, -118);
      c.quadraticCurveTo(63, -84, 91, -62);
      c.quadraticCurveTo(49, -68, 21, -39);
      c.closePath();
    }, lg(ctx, 2, -126, 91, -39, '#fff078', '#ff8a18', '#b51c00'), 2);
    for (let i = 0; i < 5; i++) {
      const x = -66 + i * 18;
      shape(ctx, (c) => {
        c.moveTo(-5, -49);
        c.quadraticCurveTo(x, -93 - i * 3, x - 20, -119 + i * 9);
      }, null, 1.4, 'rgba(100,20,0,0.45)');
      shape(ctx, (c) => {
        c.moveTo(7, -49);
        c.quadraticCurveTo(-x, -91 - i * 3, -x + 20, -111 + i * 9);
      }, null, 1.4, 'rgba(100,20,0,0.45)');
    }
    shape(ctx, (c) => {
      c.moveTo(-11, -30);
      c.quadraticCurveTo(-39, -3, -24, 12);
      c.quadraticCurveTo(-6, -9, 1, -32);
      c.quadraticCurveTo(10, -9, 36, 11);
      c.quadraticCurveTo(37, -12, 14, -33);
      c.closePath();
    }, lg(ctx, -35, -35, 36, 12, '#ffe45d', '#ff6b12', '#bc1800'), 1.5);
    shape(ctx, ell(2, -52, 18, 29), lg(ctx, 0, -82, 0, -24, '#fff18a', '#ff7a14', '#c41e00'), 2);
    shape(ctx, (c) => {
      c.moveTo(2, -77);
      c.quadraticCurveTo(16, -89, 31, -76);
      c.lineTo(41, -66);
      c.lineTo(24, -66);
      c.quadraticCurveTo(14, -58, 3, -62);
      c.closePath();
    }, lg(ctx, 0, -90, 41, -62, '#ffe85c', '#e34200'), 1.7);
    shape(ctx, poly([[34, -73], [49, -70], [35, -64]]), '#f6c62c', 1);
    shape(ctx, ell(22, -73, 1.8, 1.8), OUT, 0);
    shape(ctx, (c) => {
      c.moveTo(-6, -81);
      c.quadraticCurveTo(-5, -105, 11, -87);
      c.quadraticCurveTo(3, -89, 5, -78);
      c.closePath();
    }, '#ffcf32', 1);
    limb(ctx, [[-7, -28], [-10, -12], [-14, -3]], 3, '#8a2800');
    limb(ctx, [[9, -28], [10, -12], [15, -3]], 3, '#8a2800');
    shape(ctx, ell(2, -51, 15, 4, 0.1), t.main, 1.1);
    shape(ctx, ell(2, -51, 4, 4), t.trim, 0.8);
  }

  BH.Sprites.register('angel', angel, { scale: 1.15, portraitSize: 150, portraitX: 0.48 });
  BH.Sprites.register('dwarf', dwarf, { scale: 1.15, portraitSize: 105, portraitX: 0.47 });
  BH.Sprites.register('woodelf', woodelf, { portraitSize: 125, portraitX: 0.45 });
  BH.Sprites.register('dendroid', dendroid, { scale: 1.2, portraitSize: 165, portraitX: 0.5 });
  BH.Sprites.register('unicorn', unicorn, { scale: 1.2, portraitSize: 150, portraitX: 0.42 });
  BH.Sprites.register('golem', golem, { scale: 1.15, portraitSize: 145, portraitX: 0.5 });
  BH.Sprites.register('naga', naga, { scale: 1.2, portraitSize: 150, portraitX: 0.55 });
  BH.Sprites.register('titan', titan, { scale: 1.3, portraitSize: 175, portraitX: 0.48 });
  BH.Sprites.register('phoenix', phoenix, { scale: 1.25, portraitSize: 170, portraitX: 0.52 });
})(typeof window !== 'undefined' ? window : globalThis);
