// Wild unit sprites.
(function (root) {
  const BH = root.BH;
  const { OUT, SKIN, SKIN_D, lg, rg, shape, poly, ell, limb, stick, head, steel } = BH.SpriteKit;

  function claw(ctx, x, y, s = 1, col = '#eee0ba') {
    shape(ctx, poly([[x, y], [x + 8 * s, y - 1 * s], [x + 2 * s, y - 4 * s]]), col, 0.7);
  }

  function eye(ctx, x, y, r = 2, color = '#ffd34a') {
    shape(ctx, ell(x, y, r, r * 0.72), color, 0.8);
    shape(ctx, ell(x + r * 0.25, y, r * 0.32, r * 0.45), OUT, 0);
  }

  function harpy(ctx, t) {
    const feather = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#6b3f20', '#b67b3a', '#e2b86d');
    // far wing arm
    shape(ctx, (c) => {
      c.moveTo(-6, -58);
      c.quadraticCurveTo(-28, -88, -56, -100);
      c.quadraticCurveTo(-48, -70, -66, -54);
      c.quadraticCurveTo(-36, -58, -14, -42);
      c.closePath();
    }, feather(-60, -100, -6, -42));
    // talon legs
    limb(ctx, [[-9, -32], [-13, -14], [-9, -1]], 5, '#d0a138');
    limb(ctx, [[8, -32], [11, -14], [8, -1]], 5, '#d8ad42');
    for (const x of [-10, 7]) {
      claw(ctx, x - 6, 0, -0.8, '#2b2418');
      claw(ctx, x - 1, 0, 0.8, '#2b2418');
      claw(ctx, x + 4, 0, 0.7, '#2b2418');
    }
    // body and rag
    shape(ctx, (c) => {
      c.moveTo(-12, -62);
      c.quadraticCurveTo(0, -70, 14, -62);
      c.lineTo(11, -32);
      c.quadraticCurveTo(0, -24, -12, -33);
      c.closePath();
    }, rg(ctx, 1, -48, 24, '#f0c09a', SKIN, SKIN_D));
    shape(ctx, poly([[-13, -50], [15, -52], [13, -41], [-13, -39]]), lg(ctx, -13, -52, 15, -39, t.light, t.main, t.dark));
    // near wing arm
    shape(ctx, (c) => {
      c.moveTo(8, -56);
      c.quadraticCurveTo(30, -86, 58, -96);
      c.quadraticCurveTo(52, -72, 68, -58);
      c.quadraticCurveTo(38, -58, 16, -38);
      c.closePath();
    }, feather(8, -96, 68, -38));
    ctx.strokeStyle = 'rgba(55,30,12,0.65)';
    ctx.lineWidth = 1;
    for (const x of [24, 36, 48, 58]) {
      ctx.beginPath();
      ctx.moveTo(10, -54);
      ctx.lineTo(x, -88 + (x - 24) * 0.7);
      ctx.stroke();
    }
    // head, hair, band
    head(ctx, 2, -73, 8);
    shape(ctx, (c) => {
      c.moveTo(-6, -78);
      c.quadraticCurveTo(-18, -84, -13, -66);
      c.quadraticCurveTo(-6, -73, 0, -67);
      c.quadraticCurveTo(9, -80, 16, -65);
      c.quadraticCurveTo(14, -86, -6, -78);
    }, '#3a2012');
    shape(ctx, poly([[-8, -78], [12, -80], [13, -76], [-7, -74]]), t.main, 0.8);
  }

  function beholder(ctx, t) {
    // shadow gap and dangling hover
    shape(ctx, ell(0, -2, 26, 5), 'rgba(0,0,0,0.25)', 0);
    const skin = rg(ctx, 0, -55, 42, '#8f6554', '#5a3749', '#352030');
    // eyestalks behind
    for (const [x, y, ex, ey] of [[-22, -82, -36, -114], [-10, -88, -16, -124], [6, -89, 8, -126], [20, -84, 35, -116], [30, -72, 52, -94]]) {
      limb(ctx, [[x, y], [(x + ex) / 2, y - 14], [ex, ey]], 4, '#604050');
      shape(ctx, ell(ex, ey, 5, 6), skin);
      eye(ctx, ex + 1, ey, 1.8, '#ffda65');
    }
    // floating sphere
    shape(ctx, ell(0, -56, 38, 36), skin, 2.1);
    shape(ctx, ell(0, -63, 17, 15), '#ead7ba', 1.5);
    shape(ctx, ell(2, -63, 9, 10), '#f0cc4a', 0.9);
    shape(ctx, ell(5, -63, 4, 8), '#19130f', 0);
    shape(ctx, ell(0, -66, 2, 2), '#fff8d8', 0);
    // mouth and teeth
    shape(ctx, (c) => {
      c.moveTo(-23, -41);
      c.quadraticCurveTo(0, -22, 25, -42);
      c.quadraticCurveTo(3, -34, -23, -41);
    }, '#190e0d', 1.4);
    for (const x of [-14, -5, 4, 13]) shape(ctx, poly([[x, -39], [x + 5, -39], [x + 2, -31]]), '#f5e6c8', 0.5);
    shape(ctx, ell(-23, -56, 6, 13, 0.5), t.main, 1);
    shape(ctx, ell(-23, -56, 3.2, 9, 0.5), t.light, 0);
  }

  function medusa(ctx, t) {
    const scale = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#6ec06a', '#267646', '#16472e');
    // snake tail
    shape(ctx, (c) => {
      c.moveTo(-5, -34);
      c.quadraticCurveTo(-36, -18, -24, -2);
      c.quadraticCurveTo(-6, -14, 20, -5);
      c.quadraticCurveTo(6, -18, 10, -35);
      c.closePath();
    }, scale(-34, -35, 24, 0));
    for (let i = 0; i < 5; i++) shape(ctx, ell(-18 + i * 8, -15 + (i % 2) * 4, 3, 1.2, 0.25), '#9bd37d', 0);
    shape(ctx, poly([[-13, -60], [13, -60], [11, -35], [-11, -35]]), rg(ctx, 0, -48, 22, SKIN, SKIN_D));
    shape(ctx, poly([[-13, -58], [14, -58], [12, -48], [-12, -47]]), lg(ctx, -13, -58, 14, -47, t.light, t.main, t.dark));
    // bow and arms
    shape(ctx, (c) => {
      c.moveTo(34, -86);
      c.quadraticCurveTo(55, -55, 34, -24);
    }, null, 3, '#6b3a18');
    shape(ctx, (c) => {
      c.moveTo(34, -86);
      c.lineTo(16, -55);
      c.lineTo(34, -24);
    }, null, 0.8, '#efe6c8');
    stick(ctx, 9, -55, 48, -55, 1.3, '#c9a46a');
    shape(ctx, poly([[48, -58], [55, -55], [48, -52]]), steel(ctx, 48, 55), 0.6);
    limb(ctx, [[-7, -55], [8, -53], [16, -55]], 4.5, SKIN);
    limb(ctx, [[9, -55], [23, -54], [38, -55]], 4.5, SKIN);
    head(ctx, 0, -70, 7.5);
    // snakes for hair
    for (const [sx, ex, ey] of [[-7, -22, -84], [-3, -13, -91], [2, 3, -92], [7, 18, -89], [10, 26, -80]]) {
      limb(ctx, [[sx, -76], [(sx + ex) / 2, -84], [ex, ey]], 3, '#1f6a35');
      shape(ctx, ell(ex, ey, 3.2, 2.2, 0.2), '#2f8a45');
    }
  }

  function minotaur(ctx, t) {
    // axe behind
    stick(ctx, -34, -12, 36, -112, 4, '#6b4421');
    shape(ctx, (c) => {
      c.moveTo(24, -116);
      c.quadraticCurveTo(42, -128, 54, -111);
      c.quadraticCurveTo(42, -113, 32, -104);
      c.closePath();
    }, steel(ctx, 24, 54), 1.2);
    shape(ctx, (c) => {
      c.moveTo(18, -118);
      c.quadraticCurveTo(0, -130, -13, -113);
      c.quadraticCurveTo(1, -114, 14, -104);
      c.closePath();
    }, steel(ctx, -13, 18), 1.2);
    // legs and hooves
    limb(ctx, [[-11, -36], [-17, -16], [-14, -2]], 8, '#6a3a1e');
    limb(ctx, [[10, -36], [17, -17], [15, -2]], 8, '#7b4524');
    shape(ctx, poly([[-21, -4], [-8, -4], [-7, 0], [-23, 0]]), '#1e1510');
    shape(ctx, poly([[9, -4], [23, -4], [25, 0], [9, 0]]), '#1e1510');
    // body, loincloth, arms
    shape(ctx, ell(0, -55, 19, 25), rg(ctx, 0, -60, 34, '#a66b3a', '#6b351c', '#3a1b10'));
    shape(ctx, poly([[-17, -39], [18, -39], [12, -18], [0, -30], [-12, -18]]), lg(ctx, 0, -39, 0, -18, t.light, t.main, t.dark));
    limb(ctx, [[-16, -62], [-28, -50], [-32, -36]], 8, '#74411f');
    limb(ctx, [[15, -63], [29, -52], [30, -38]], 8, '#7a4422');
    shape(ctx, ell(29, -50, 4, 2.5, 0.6), t.main, 0.8);
    // bull head
    shape(ctx, ell(0, -83, 15, 13), rg(ctx, 0, -85, 22, '#8b512b', '#56301b'));
    shape(ctx, ell(8, -78, 10, 6, 0.1), '#8f5a38', 1);
    eye(ctx, 6, -86, 1.5, '#ffcf55');
    shape(ctx, ell(11, -78, 1.2, 1), OUT, 0);
    shape(ctx, (c) => {
      c.moveTo(-10, -90);
      c.quadraticCurveTo(-28, -102, -34, -86);
      c.quadraticCurveTo(-24, -92, -12, -86);
      c.closePath();
    }, '#ddd4b0');
    shape(ctx, (c) => {
      c.moveTo(10, -90);
      c.quadraticCurveTo(28, -104, 36, -88);
      c.quadraticCurveTo(24, -94, 12, -86);
      c.closePath();
    }, '#ddd4b0');
    shape(ctx, ell(12, -73, 3, 3), null, 1.3, '#d8bd4a');
  }

  function blackdragon(ctx, t) {
    const scale = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#5b5a66', '#1f2228', '#06070a');
    shape(ctx, (c) => {
      c.moveTo(-4, -56);
      c.lineTo(-20, -120);
      c.quadraticCurveTo(-31, -97, -45, -97);
      c.quadraticCurveTo(-42, -80, -54, -74);
      c.quadraticCurveTo(-30, -68, -20, -48);
      c.closePath();
    }, lg(ctx, 0, -120, 0, -48, '#382849', '#19131f'));
    shape(ctx, (c) => {
      c.moveTo(-28, -38);
      c.quadraticCurveTo(-63, -42, -74, -17);
      c.quadraticCurveTo(-78, -6, -91, -10);
      c.quadraticCurveTo(-71, -2, -63, -18);
      c.quadraticCurveTo(-54, -31, -28, -26);
      c.closePath();
    }, scale(-90, -42, -28, 0));
    shape(ctx, poly([[-91, -10], [-100, -17], [-95, -5]]), '#a9a0c0', 0.8);
    limb(ctx, [[-20, -30], [-26, -14], [-20, -2]], 7, '#17191e');
    limb(ctx, [[14, -32], [20, -16], [16, -2]], 6, '#17191e');
    shape(ctx, ell(-4, -40, 33, 17), scale(-32, -58, 22, -22));
    shape(ctx, ell(4, -30, 22, 8), lg(ctx, 0, -38, 0, -22, '#3b3543', '#111217'), 0.8);
    shape(ctx, (c) => {
      c.moveTo(14, -52);
      c.quadraticCurveTo(28, -70, 26, -87);
      c.quadraticCurveTo(31, -99, 41, -95);
      c.lineTo(45, -84);
      c.quadraticCurveTo(36, -81, 36, -70);
      c.quadraticCurveTo(34, -50, 22, -34);
      c.closePath();
    }, scale(14, -96, 45, -34));
    shape(ctx, (c) => {
      c.moveTo(30, -99);
      c.quadraticCurveTo(45, -106, 63, -95);
      c.lineTo(65, -89);
      c.lineTo(49, -86);
      c.lineTo(61, -80);
      c.lineTo(45, -80);
      c.quadraticCurveTo(34, -82, 30, -91);
      c.closePath();
    }, scale(30, -106, 65, -80));
    eye(ctx, 46, -96, 2.2, '#ff7a18');
    shape(ctx, poly([[34, -101], [26, -116], [39, -103]]), '#8c859f', 0.8);
    shape(ctx, poly([[41, -102], [36, -114], [46, -103]]), '#8c859f', 0.8);
    for (let i = 0; i < 5; i++) {
      const x = -25 + i * 9;
      shape(ctx, poly([[x, -54 + Math.abs(i - 2)], [x + 3, -65 + Math.abs(i - 2)], [x + 6, -54 + Math.abs(i - 2)]]), '#877ba5', 0.8);
    }
    limb(ctx, [[-14, -30], [-14, -14], [-8, -2]], 8, '#262a30');
    limb(ctx, [[18, -34], [26, -18], [24, -2]], 7, '#262a30');
    for (const x of [-8, 24]) claw(ctx, x - 2, 0, 1, '#b4abc6');
    shape(ctx, (c) => {
      c.moveTo(0, -54);
      c.lineTo(-6, -130);
      c.quadraticCurveTo(-22, -110, -41, -114);
      c.quadraticCurveTo(-43, -93, -64, -91);
      c.quadraticCurveTo(-59, -74, -73, -66);
      c.quadraticCurveTo(-36, -64, -16, -44);
      c.closePath();
    }, lg(ctx, -60, -130, 0, -44, 'rgba(86,58,120,0.96)', 'rgba(31,18,46,0.96)'));
    ctx.strokeStyle = '#0e0c12';
    ctx.lineWidth = 2;
    for (const [x, y] of [[-6, -130], [-41, -114], [-64, -91], [-73, -66]]) {
      ctx.beginPath();
      ctx.moveTo(-2, -56);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    shape(ctx, ell(28, -60, 6, 3, -1.1), t.main, 1);
  }

  function wolfrider(ctx, t) {
    const wolf = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#b7bcc0', '#68727a', '#2d3338');
    // wolf
    shape(ctx, (c) => {
      c.moveTo(-36, -38);
      c.quadraticCurveTo(-52, -36, -58, -18);
      c.quadraticCurveTo(-50, -27, -35, -30);
      c.closePath();
    }, '#596068');
    limb(ctx, [[-22, -29], [-28, -13], [-24, -1]], 6, '#555f66');
    limb(ctx, [[18, -29], [26, -14], [23, -1]], 6, '#555f66');
    shape(ctx, ell(-4, -38, 35, 14), wolf(-38, -52, 30, -24));
    shape(ctx, (c) => {
      c.moveTo(24, -45);
      c.lineTo(45, -55);
      c.lineTo(58, -45);
      c.lineTo(50, -36);
      c.lineTo(34, -38);
      c.closePath();
    }, wolf(24, -56, 58, -36));
    shape(ctx, poly([[37, -55], [40, -67], [45, -55]]), '#4e565d');
    eye(ctx, 47, -46, 1.5, '#f0dc62');
    shape(ctx, poly([[52, -40], [63, -38], [52, -35]]), '#e6dfc6', 0.7);
    limb(ctx, [[-12, -29], [-13, -13], [-8, -1]], 6.5, '#798188');
    limb(ctx, [[10, -30], [16, -15], [13, -1]], 6.5, '#798188');
    for (const x of [-24, 23, -8, 13]) claw(ctx, x - 3, 0, 0.65, '#1d1c1b');
    // saddle blanket
    shape(ctx, poly([[-24, -50], [18, -51], [24, -32], [-24, -30]]), lg(ctx, 0, -51, 0, -30, t.light, t.main, t.dark));
    // goblin rider
    limb(ctx, [[-7, -54], [-15, -38], [-18, -31]], 4, '#3f8a35');
    limb(ctx, [[7, -54], [16, -41], [20, -32]], 4, '#3f8a35');
    shape(ctx, poly([[-10, -76], [10, -76], [12, -54], [-12, -54]]), '#6b4b24');
    head(ctx, 0, -84, 6);
    shape(ctx, ell(-8, -84, 5, 2.5, -0.4), '#55a045');
    shape(ctx, ell(8, -84, 5, 2.5, 0.4), '#55a045');
    shape(ctx, ell(0, -84, 7, 6), '#55a045', 1.2);
    eye(ctx, 3, -85, 1.2, '#ffd24a');
    limb(ctx, [[8, -70], [25, -63], [34, -72]], 4, '#3f8a35');
    stick(ctx, 31, -74, 55, -90, 3, '#5a3218');
    shape(ctx, ell(59, -93, 8, 6, -0.4), '#333', 1);
    for (const [x, y] of [[54, -99], [62, -101], [67, -94]]) shape(ctx, poly([[x, y], [x + 5, y - 3], [x + 2, y + 3]]), '#aaa', 0.5);
  }

  function cyclops(ctx, t) {
    // legs
    limb(ctx, [[-13, -42], [-22, -17], [-18, -1]], 11, '#b98960');
    limb(ctx, [[14, -42], [22, -17], [19, -1]], 11, '#c89467');
    shape(ctx, poly([[-27, -4], [-11, -4], [-8, 0], [-30, 0]]), '#4b2b18');
    shape(ctx, poly([[11, -4], [29, -4], [32, 0], [10, 0]]), '#4b2b18');
    // body
    shape(ctx, ell(0, -70, 24, 33), rg(ctx, 0, -72, 42, '#e0ad7f', '#b98258', '#815339'));
    shape(ctx, poly([[-22, -48], [23, -48], [15, -24], [0, -38], [-16, -24]]), lg(ctx, 0, -48, 0, -24, '#6c4b2b', '#3c2415'));
    shape(ctx, poly([[-24, -55], [-12, -57], [-9, -50], [-22, -48]]), t.main, 0.8);
    // arms and boulder
    limb(ctx, [[-18, -84], [-33, -112], [-18, -126]], 10, '#b98258');
    limb(ctx, [[18, -84], [33, -113], [18, -126]], 10, '#c89467');
    shape(ctx, ell(0, -133, 27, 18, 0.08), rg(ctx, -6, -140, 34, '#8f8d84', '#55534e', '#2f2e2c'), 2);
    shape(ctx, ell(-9, -137, 5, 3), 'rgba(255,255,255,0.16)', 0);
    // head
    shape(ctx, ell(0, -104, 17, 16), rg(ctx, 0, -108, 25, '#e4b285', '#a96f4b'));
    shape(ctx, ell(3, -107, 7, 5), '#f1dfbd', 1);
    shape(ctx, ell(4, -107, 3, 4), '#1a130f', 0);
    shape(ctx, (c) => {
      c.moveTo(-8, -98);
      c.quadraticCurveTo(2, -92, 13, -98);
    }, null, 1.4, OUT);
    shape(ctx, (c) => {
      c.moveTo(-12, -118);
      c.quadraticCurveTo(0, -127, 13, -118);
      c.quadraticCurveTo(0, -121, -12, -118);
    }, '#5a3218');
  }

  function behemoth(ctx, t) {
    const fur = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#c09a63', '#745030', '#332116');
    // rear limbs
    limb(ctx, [[-32, -42], [-45, -20], [-42, -2]], 13, '#6b482b');
    limb(ctx, [[4, -38], [0, -16], [7, -2]], 13, '#7d5735');
    // massive hunched body
    shape(ctx, (c) => {
      c.moveTo(-44, -45);
      c.quadraticCurveTo(-30, -86, 5, -82);
      c.quadraticCurveTo(42, -80, 52, -45);
      c.quadraticCurveTo(24, -18, -22, -25);
      c.closePath();
    }, fur(-44, -85, 55, -20), 2.2);
    // head with horns and fangs
    shape(ctx, ell(34, -65, 22, 17, -0.1), rg(ctx, 34, -67, 32, '#9a6d43', '#4a2b19'));
    shape(ctx, poly([[19, -77], [4, -92], [23, -82]]), '#d7c59d', 1);
    shape(ctx, poly([[42, -80], [55, -96], [48, -77]]), '#d7c59d', 1);
    eye(ctx, 41, -67, 2.2, '#ffd049');
    shape(ctx, poly([[45, -55], [51, -55], [48, -45]]), '#f2e0bb', 0.7);
    shape(ctx, poly([[31, -55], [36, -55], [34, -46]]), '#f2e0bb', 0.7);
    // front arms/claws
    limb(ctx, [[25, -40], [45, -19], [42, -2]], 14, '#8b6039');
    limb(ctx, [[-12, -37], [-7, -16], [-14, -2]], 14, '#8d633d');
    for (const x of [-19, -12, 38, 45]) claw(ctx, x, 0, 0.9, '#e6d8b6');
    // war paint / chain collar
    shape(ctx, (c) => {
      c.moveTo(13, -75);
      c.quadraticCurveTo(24, -58, 51, -57);
    }, null, 4, t.main);
    for (const x of [16, 24, 32, 40, 48]) shape(ctx, ell(x, -61 + (x - 32) * 0.2, 2.6, 2.6), t.trim, 0.6);
  }

  function gorgon(ctx, t) {
    const metal = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#78a77a', '#536648', '#aa7c3a', '#2d3d35');
    // legs
    limb(ctx, [[-34, -39], [-41, -17], [-38, -2]], 10, '#4b4b38');
    limb(ctx, [[15, -39], [21, -17], [19, -2]], 10, '#4b4b38');
    limb(ctx, [[-14, -35], [-15, -15], [-10, -2]], 10, '#667050');
    limb(ctx, [[36, -35], [42, -15], [40, -2]], 10, '#667050');
    for (const x of [-38, 19, -10, 40]) shape(ctx, poly([[x - 6, -4], [x + 8, -4], [x + 10, 0], [x - 6, 0]]), '#1e1b16', 0.6);
    // armored body
    shape(ctx, ell(1, -47, 49, 23), metal(-48, -66, 50, -24), 2.4);
    shape(ctx, ell(-7, -53, 37, 16), 'rgba(150,190,130,0.28)', 0);
    for (let i = 0; i < 9; i++) shape(ctx, ell(-36 + i * 9, -50 + (i % 2) * 6, 6, 3.5, 0.2), 'rgba(170,130,62,0.48)', 0.4);
    shape(ctx, poly([[-40, -62], [40, -62], [40, -38], [-42, -36]]), lg(ctx, 0, -62, 0, -36, t.light, t.main, t.dark), 1);
    // bull head and breath
    shape(ctx, (c) => {
      c.moveTo(36, -58);
      c.lineTo(59, -71);
      c.lineTo(80, -58);
      c.lineTo(72, -41);
      c.lineTo(47, -40);
      c.closePath();
    }, metal(36, -72, 80, -40), 2);
    shape(ctx, poly([[50, -70], [38, -88], [59, -73]]), '#b7b08c', 1);
    shape(ctx, poly([[68, -70], [84, -88], [77, -66]]), '#b7b08c', 1);
    eye(ctx, 64, -56, 3, '#8cff80');
    const breath = ctx.createRadialGradient(86, -48, 0, 86, -48, 28);
    breath.addColorStop(0, 'rgba(150,255,120,0.75)');
    breath.addColorStop(0.55, 'rgba(80,220,90,0.35)');
    breath.addColorStop(1, 'rgba(80,220,90,0)');
    shape(ctx, ell(92, -48, 28, 12, -0.05), breath, 0);
  }

  function hydra(ctx, t) {
    const scale = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#65bfa7', '#26746b', '#15433f');
    // tail and legs
    shape(ctx, (c) => {
      c.moveTo(-36, -37);
      c.quadraticCurveTo(-70, -35, -80, -10);
      c.quadraticCurveTo(-60, -19, -35, -23);
      c.closePath();
    }, scale(-80, -38, -35, -10));
    limb(ctx, [[-25, -28], [-31, -13], [-28, -2]], 7, '#1f625b');
    limb(ctx, [[15, -28], [21, -13], [18, -2]], 7, '#1f625b');
    limb(ctx, [[-4, -26], [-3, -12], [2, -2]], 7, '#2c7a70');
    for (const x of [-28, 18, 2]) claw(ctx, x - 4, 0, 0.75, '#d8e0c2');
    // body and collar
    shape(ctx, ell(-6, -38, 42, 18), scale(-48, -56, 38, -20), 2);
    shape(ctx, ell(12, -42, 12, 5, -0.15), t.main, 1);
    // 6 necks fanned
    const necks = [[-22, -50, -48, -100], [-14, -53, -30, -118], [-5, -55, -8, -126], [5, -55, 13, -123], [16, -52, 34, -111], [24, -49, 55, -96]];
    for (const [x, y, hx, hy] of necks) {
      limb(ctx, [[x, y], [(x + hx) / 2, y - 24], [hx, hy]], 8, '#2b8678');
    }
    for (const [x, y, hx, hy] of necks) {
      shape(ctx, (c) => {
        c.moveTo(hx - 9, hy - 4);
        c.quadraticCurveTo(hx + 1, hy - 13, hx + 14, hy - 3);
        c.lineTo(hx + 13, hy + 5);
        c.lineTo(hx - 3, hy + 6);
        c.closePath();
      }, scale(hx - 10, hy - 13, hx + 14, hy + 7), 1.2);
      eye(ctx, hx + 5, hy - 4, 1.5, '#ffd34a');
      shape(ctx, poly([[hx + 8, hy + 4], [hx + 14, hy + 5], [hx + 10, hy + 10]]), '#eee6c8', 0.5);
      shape(ctx, poly([[hx - 4, hy - 9], [hx - 1, hy - 18], [hx + 3, hy - 8]]), '#a8d875', 0.6);
    }
    for (let i = 0; i < 5; i++) shape(ctx, ell(-28 + i * 13, -39 + (i % 2) * 4, 4, 2), '#8ed0a4', 0);
  }

  BH.Sprites.register('harpy', harpy, { scale: 1.02, portraitSize: 135, portraitX: 0.5 });
  BH.Sprites.register('beholder', beholder, { scale: 1.02, portraitSize: 130, portraitX: 0.5 });
  BH.Sprites.register('medusa', medusa, { scale: 1.02, portraitSize: 130, portraitX: 0.48 });
  BH.Sprites.register('minotaur', minotaur, { scale: 1.1, portraitSize: 145, portraitX: 0.48 });
  BH.Sprites.register('blackdragon', blackdragon, { scale: 1.35, portraitSize: 150, portraitX: 0.58 });
  BH.Sprites.register('wolfrider', wolfrider, { scale: 1.08, portraitSize: 145, portraitX: 0.45 });
  BH.Sprites.register('cyclops', cyclops, { scale: 1.2, portraitSize: 155, portraitX: 0.5 });
  BH.Sprites.register('behemoth', behemoth, { scale: 1.3, portraitSize: 160, portraitX: 0.48 });
  BH.Sprites.register('gorgon', gorgon, { scale: 1.3, portraitSize: 150, portraitX: 0.45 });
  BH.Sprites.register('hydra', hydra, { scale: 1.25, portraitSize: 165, portraitX: 0.5 });
})(typeof window !== 'undefined' ? window : globalThis);
