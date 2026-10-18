// Evil unit sprites.
(function (root) {
  const BH = root.BH;
  const { OUT, SKIN, SKIN_D, lg, rg, shape, poly, ell, limb, stick, head, steel, legs } = BH.SpriteKit;

  const BONE = '#d8d0b8';
  const BONE_D = '#8e826a';
  const DARK = '#171016';
  const RED = '#8f1d16';
  const FIRE = ['#fff3a0', '#ffb12a', '#e34a10', '#7a1208'];

  function glow(ctx, x, y, r, color = '#8cff5a') {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(0.35, color.replace(')', ',0.75)').replace('rgb', 'rgba'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    shape(ctx, ell(x, y, r, r), g, 0);
  }

  function eye(ctx, x, y, color = '#ffd630') {
    shape(ctx, ell(x, y, 1.8, 1.4), color, 0.5);
  }

  function tooth(ctx, x, y, flip = 1) {
    shape(ctx, poly([[x, y], [x + 3 * flip, y + 2], [x + 1 * flip, y + 7]]), '#f2ead2', 0.7);
  }

  function flame(ctx, pts, colors = FIRE) {
    shape(ctx, (c) => {
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i += 2) {
        const p = pts[i], n = pts[i + 1] || pts[0];
        c.quadraticCurveTo(p[0], p[1], n[0], n[1]);
      }
      c.closePath();
    }, lg(ctx, 0, Math.min(...pts.map((p) => p[1])), 0, Math.max(...pts.map((p) => p[1])), ...colors));
  }

  function bone(ctx, pts, width = 4) {
    limb(ctx, pts, width, BONE);
    for (const p of [pts[0], pts[pts.length - 1]]) shape(ctx, ell(p[0], p[1], width * 0.55, width * 0.45), BONE, 0.6);
  }

  function cerberus(ctx, t) {
    const fur = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#39100d', RED, '#090706');
    // tails and far legs
    limb(ctx, [[-34, -38], [-58, -54], [-64, -76]], 6, '#220b09');
    shape(ctx, poly([[-69, -80], [-57, -78], [-64, -68]]), '#151010');
    limb(ctx, [[-30, -27], [-38, -12], [-34, -1]], 7, '#2b0d0a');
    limb(ctx, [[6, -28], [2, -11], [7, -1]], 7, '#2b0d0a');
    // body
    shape(ctx, ell(-8, -37, 36, 16), fur(-42, -54, 28, -18));
    shape(ctx, ell(15, -43, 18, 14, -0.15), fur(0, -58, 34, -28));
    // near legs
    limb(ctx, [[-20, -28], [-20, -10], [-13, -1]], 8, '#641912');
    limb(ctx, [[20, -32], [27, -15], [24, -1]], 8, '#641912');
    for (const x of [-13, 24, -34, 7]) shape(ctx, poly([[x - 6, 0], [x + 8, 0], [x + 2, -4]]), '#080707', 0.6);
    // three necks
    limb(ctx, [[10, -50], [2, -65], [-10, -72]], 9, '#55150f');
    limb(ctx, [[18, -53], [24, -70], [23, -82]], 10, '#6b1912');
    limb(ctx, [[26, -48], [42, -60], [52, -69]], 9, '#4b120f');
    const heads = [[-18, -74, -0.15], [22, -88, 0], [58, -70, 0.18]];
    for (const [x, y, r] of heads) {
      shape(ctx, ell(x, y, 13, 10, r), fur(x - 13, y - 10, x + 12, y + 8));
      shape(ctx, poly([[x - 5, y - 8], [x - 10, y - 20], [x + 1, y - 10]]), '#0b0808');
      shape(ctx, poly([[x + 6, y - 8], [x + 10, y - 19], [x + 12, y - 6]]), '#0b0808');
      shape(ctx, (c) => {
        c.moveTo(x + 8, y - 1);
        c.quadraticCurveTo(x + 22, y + 1, x + 25, y + 8);
        c.lineTo(x + 8, y + 8);
        c.closePath();
      }, fur(x + 8, y - 2, x + 25, y + 8));
      eye(ctx, x + 3, y - 3);
      eye(ctx, x + 12, y - 2);
      tooth(ctx, x + 14, y + 5);
      tooth(ctx, x + 20, y + 5);
    }
    // team spiked collar on the front neck
    shape(ctx, ell(33, -56, 10, 3, -0.55), t.main, 1.2);
    for (const [x, y] of [[26, -60], [34, -58], [41, -53]]) shape(ctx, poly([[x, y], [x + 3, y - 8], [x + 6, y]]), t.trim, 0.5);
  }

  function efreet(ctx, t) {
    // hovering flame tail touching ground
    flame(ctx, [[-12, 0], [-30, -20], [-16, -46], [-28, -66], [0, -72], [24, -64], [13, -42], [30, -19], [12, 0]]);
    flame(ctx, [[-5, -2], [-15, -22], [-6, -42], [-12, -57], [2, -62], [14, -54], [8, -34], [18, -18], [5, -2]], ['#fff7b6', '#ffcf38', '#f36b17']);
    // torso
    shape(ctx, (c) => {
      c.moveTo(-14, -76);
      c.quadraticCurveTo(1, -86, 18, -78);
      c.lineTo(13, -45);
      c.quadraticCurveTo(0, -36, -13, -45);
      c.closePath();
    }, lg(ctx, -14, -84, 18, -42, '#ff9a38', '#a92a16', '#5a0f0b'));
    shape(ctx, ell(2, -79, 11, 10), rg(ctx, 2, -80, 15, '#ffb05c', '#c23a1c', '#5c100c'));
    // sash and bracers
    shape(ctx, poly([[-16, -52], [15, -62], [18, -56], [-13, -45]]), lg(ctx, -16, -62, 18, -45, t.light, t.main, t.dark), 0.8);
    shape(ctx, poly([[9, -48], [23, -53], [21, -45], [12, -39]]), t.main, 0.8);
    // arms and scimitar
    limb(ctx, [[-12, -70], [-30, -59], [-35, -43]], 7, '#c23a1c');
    shape(ctx, ell(-35, -43, 4, 3), '#d8b45a');
    limb(ctx, [[14, -70], [30, -62], [39, -55]], 7, '#d85120');
    shape(ctx, ell(30, -61, 5, 3, 0.6), '#d8b45a');
    shape(ctx, (c) => {
      c.moveTo(38, -58);
      c.quadraticCurveTo(67, -74, 69, -103);
      c.quadraticCurveTo(58, -84, 35, -63);
      c.closePath();
    }, steel(ctx, 35, 70));
    shape(ctx, poly([[34, -60], [44, -54], [41, -49], [31, -55]]), '#d7a83a');
    // head, hair
    head(ctx, 4, -91, 8);
    flame(ctx, [[-4, -98], [-11, -114], [0, -107], [5, -126], [10, -106], [19, -116], [13, -97]], ['#fff0a0', '#ff9a1a', '#c92810']);
    shape(ctx, ell(2, -91, 1.5, 1.2), '#ffe65a', 0);
    shape(ctx, ell(9, -91, 1.5, 1.2), '#ffe65a', 0);
  }

  function devil(ctx, t) {
    // wings behind
    shape(ctx, (c) => {
      c.moveTo(-8, -66); c.lineTo(-36, -114); c.quadraticCurveTo(-42, -87, -62, -82); c.quadraticCurveTo(-44, -70, -42, -44); c.quadraticCurveTo(-24, -58, -8, -52); c.closePath();
    }, lg(ctx, -60, -114, -8, -44, '#3b0c10', '#0b0708'));
    shape(ctx, (c) => {
      c.moveTo(8, -66); c.lineTo(42, -108); c.quadraticCurveTo(48, -84, 66, -78); c.quadraticCurveTo(45, -68, 45, -40); c.quadraticCurveTo(27, -56, 8, -52); c.closePath();
    }, lg(ctx, 8, -108, 66, -40, '#4b1012', '#0b0708'));
    // tail and legs
    limb(ctx, [[-10, -32], [-34, -22], [-43, -44], [-52, -39]], 4.5, '#7d1713');
    shape(ctx, poly([[-57, -44], [-45, -46], [-50, -34]]), '#7d1713');
    limb(ctx, [[-8, -39], [-19, -16], [-15, 0]], 8, '#681610');
    limb(ctx, [[8, -39], [18, -18], [23, 0]], 8, '#681610');
    shape(ctx, poly([[-21, 0], [-9, 0], [-15, -6]]), '#111', 0.6);
    shape(ctx, poly([[17, 0], [30, 0], [22, -6]]), '#111', 0.6);
    shape(ctx, poly([[-15, -42], [17, -42], [14, -20], [-13, -20]]), lg(ctx, 0, -42, 0, -20, t.light, t.dark));
    shape(ctx, poly([[-9, -78], [11, -78], [18, -42], [-16, -42]]), lg(ctx, -12, -80, 18, -40, '#b92b1c', '#65120e'));
    shape(ctx, ell(2, -82, 11, 10), '#9f2018');
    // head, horns
    shape(ctx, ell(2, -96, 10, 12), lg(ctx, 0, -108, 0, -84, '#c73622', '#74140f'));
    shape(ctx, poly([[-5, -106], [-20, -126], [-10, -103]]), '#d9caa0');
    shape(ctx, poly([[8, -106], [24, -126], [13, -102]]), '#d9caa0');
    eye(ctx, -2, -97, '#ffe05a'); eye(ctx, 7, -97, '#ffe05a');
    // trident and arms
    stick(ctx, 31, -4, 31, -125, 3, '#55341c');
    stick(ctx, 21, -119, 31, -133, 2, steel(ctx, 20, 32));
    stick(ctx, 31, -119, 31, -136, 2, steel(ctx, 30, 32));
    stick(ctx, 41, -119, 31, -133, 2, steel(ctx, 31, 42));
    limb(ctx, [[-12, -70], [-24, -56], [-31, -46]], 6, '#8f1d16');
    limb(ctx, [[13, -70], [25, -62], [31, -70]], 6, '#9f2018');
  }

  function skeleton(ctx, t) {
    bone(ctx, [[-9, -30], [-14, -10], [-11, -1]], 4);
    bone(ctx, [[8, -30], [14, -11], [12, -1]], 4);
    for (const x of [-11, 12]) shape(ctx, poly([[x - 5, 0], [x + 7, 0], [x + 1, -3]]), BONE_D, 0.5);
    shape(ctx, poly([[-10, -62], [11, -62], [8, -32], [-7, -32]]), 'rgba(216,208,184,0.18)', 1);
    stick(ctx, 0, -62, 0, -31, 3, BONE);
    for (let i = 0; i < 4; i++) stick(ctx, -1, -58 + i * 6, -13 + i, -48 + i * 5, 1.6, BONE);
    for (let i = 0; i < 4; i++) stick(ctx, 2, -58 + i * 6, 13 - i, -48 + i * 5, 1.6, BONE);
    bone(ctx, [[-9, -58], [-21, -48], [-30, -37]], 3.5);
    bone(ctx, [[10, -58], [25, -50], [34, -44]], 3.5);
    shape(ctx, ell(0, -74, 10, 12), lg(ctx, -10, -86, 10, -62, '#f1ead5', BONE, BONE_D));
    shape(ctx, ell(-4, -76, 3, 3), '#171717', 0);
    shape(ctx, ell(5, -76, 3, 3), '#171717', 0);
    shape(ctx, poly([[-4, -67], [5, -67], [2, -64], [-2, -64]]), '#171717', 0);
    // sword
    shape(ctx, poly([[33, -46], [39, -48], [57, -88], [53, -93], [35, -52]]), lg(ctx, 33, -93, 57, -46, '#5b5046', '#b5a88a', '#6a2a1c'));
    shape(ctx, poly([[28, -47], [42, -42], [40, -37], [26, -43]]), '#8b5a24');
    // round team shield
    shape(ctx, ell(-30, -43, 13, 15), lg(ctx, -43, -58, -17, -28, t.light, t.main, t.dark), 2, '#9d7b36');
    shape(ctx, ell(-30, -43, 5, 5), t.trim, 1);
  }

  function wight(ctx, t) {
    ctx.save();
    ctx.globalAlpha = 0.82;
    shape(ctx, (c) => {
      c.moveTo(-11, -82);
      c.quadraticCurveTo(2, -95, 16, -82);
      c.quadraticCurveTo(24, -48, 16, -8);
      c.quadraticCurveTo(9, -24, 3, -3);
      c.quadraticCurveTo(-4, -25, -14, -4);
      c.quadraticCurveTo(-22, -48, -11, -82);
      c.closePath();
    }, lg(ctx, -22, -94, 24, -2, 'rgba(215,245,255,0.88)', 'rgba(88,145,180,0.55)', 'rgba(20,35,58,0.2)'));
    shape(ctx, (c) => {
      c.moveTo(-13, -76);
      c.quadraticCurveTo(2, -105, 18, -76);
      c.quadraticCurveTo(6, -84, -3, -76);
      c.closePath();
    }, '#1e2638');
    ctx.globalAlpha = 1;
    eye(ctx, 1, -78, '#b8f6ff'); eye(ctx, 8, -78, '#b8f6ff');
    shape(ctx, poly([[-17, -49], [18, -57], [19, -50], [-16, -41]]), lg(ctx, -17, -57, 18, -41, t.light, t.main, t.dark), 0.8);
    limb(ctx, [[-14, -62], [-31, -49], [-38, -36]], 5, BONE);
    limb(ctx, [[16, -61], [33, -48], [42, -35]], 5, BONE);
    for (const [x, y, s] of [[-38, -36, -1], [42, -35, 1]]) {
      for (let i = 0; i < 3; i++) stick(ctx, x, y, x + s * (5 + i * 2), y + 7 + i * 2, 1, BONE);
    }
    ctx.restore();
  }

  function vampire(ctx, t) {
    legs(ctx, '#1c1c22', '#0a0909');
    // cape is the team marker: black outside, team lining
    shape(ctx, (c) => {
      c.moveTo(-13, -66);
      c.quadraticCurveTo(-46, -38, -33, 0);
      c.quadraticCurveTo(-7, -12, 6, -42);
      c.quadraticCurveTo(25, -10, 39, 0);
      c.quadraticCurveTo(38, -40, 15, -66);
      c.closePath();
    }, lg(ctx, -42, -66, 40, 0, '#050505', t.dark, t.main, '#050505'), 2);
    shape(ctx, poly([[-12, -66], [13, -66], [13, -28], [-12, -28]]), lg(ctx, 0, -66, 0, -28, '#1b1b22', '#050506'));
    shape(ctx, poly([[-14, -64], [0, -53], [14, -64], [10, -58], [0, -61], [-10, -58]]), '#f0eadc', 0.8);
    shape(ctx, poly([[-3, -62], [3, -62], [4, -30], [-4, -30]]), '#5e0707', 0);
    head(ctx, 2, -76, 8);
    shape(ctx, (c) => {
      c.moveTo(-8, -79);
      c.quadraticCurveTo(0, -92, 12, -81);
      c.quadraticCurveTo(3, -84, -8, -79);
    }, '#070707');
    eye(ctx, -1, -76, '#f03030'); eye(ctx, 7, -76, '#f03030');
    // rapier
    limb(ctx, [[10, -57], [25, -51], [35, -45]], 4, '#1b1b22');
    shape(ctx, ell(31, -47, 5, 3, 0.4), '#d2a83c', 0.7);
    stick(ctx, 35, -45, 76, -74, 1.8, steel(ctx, 35, 76));
    shape(ctx, poly([[75, -75], [84, -79], [79, -71]]), '#e7edf4', 0.6);
    limb(ctx, [[-11, -56], [-23, -48], [-28, -41]], 4.5, '#1b1b22');
  }

  function lich(ctx, t) {
    shape(ctx, (c) => {
      c.moveTo(-15, -68);
      c.lineTo(12, -68);
      c.quadraticCurveTo(18, -34, 22, 0);
      c.lineTo(-23, 0);
      c.quadraticCurveTo(-18, -34, -15, -68);
      c.closePath();
    }, lg(ctx, -23, -70, 22, 0, '#211625', '#08070a'));
    shape(ctx, poly([[-17, -64], [-11, -64], [-17, -2], [-23, 0]]), t.main, 0.7);
    shape(ctx, poly([[9, -64], [15, -64], [22, 0], [16, -2]]), t.main, 0.7);
    shape(ctx, poly([[-19, -5], [19, -5], [21, 0], [-22, 0]]), t.trim, 0.6);
    // staff behind
    stick(ctx, 29, -2, 27, -104, 3, '#5b3a20');
    shape(ctx, ell(27, -111, 7, 8), BONE, 1);
    glow(ctx, 27, -111, 18, 'rgb(90,255,80)');
    eye(ctx, 24, -112, '#62ff55'); eye(ctx, 30, -112, '#62ff55');
    // skull and crown
    shape(ctx, ell(0, -77, 10, 12), lg(ctx, -10, -90, 10, -64, '#f1ead5', BONE_D));
    shape(ctx, ell(-4, -78, 3, 3), '#111', 0); shape(ctx, ell(5, -78, 3, 3), '#111', 0);
    eye(ctx, -4, -78, '#62ff55'); eye(ctx, 5, -78, '#62ff55');
    shape(ctx, poly([[-10, -88], [-7, -99], [-3, -88], [2, -100], [7, -88], [10, -97], [11, -84], [-10, -84]]), '#c7a43a', 0.8);
    limb(ctx, [[-12, -58], [-27, -48], [-33, -37]], 5, '#211625');
    bone(ctx, [[12, -58], [24, -50], [28, -58]], 3.5);
  }

  function dreadknight(ctx, t) {
    const horse = (x0, y0, x1, y1) => lg(ctx, x0, y0, x1, y1, '#1c1c20', '#050505', '#3b3330');
    // horse far legs and tail
    limb(ctx, [[-24, -29], [-29, -14], [-27, -2]], 5, '#151515');
    limb(ctx, [[18, -30], [24, -15], [23, -2]], 5, '#151515');
    shape(ctx, (c) => { c.moveTo(-34, -43); c.quadraticCurveTo(-54, -37, -49, -12); c.quadraticCurveTo(-43, -31, -31, -38); c.closePath(); }, '#090909');
    shape(ctx, ell(-4, -40, 35, 14), horse(-38, -56, 31, -22));
    shape(ctx, (c) => {
      c.moveTo(17, -49); c.quadraticCurveTo(25, -71, 35, -76); c.lineTo(51, -65); c.quadraticCurveTo(53, -58, 45, -58); c.lineTo(35, -62); c.quadraticCurveTo(30, -46, 27, -34); c.closePath();
    }, horse(17, -76, 51, -34));
    eye(ctx, 41, -69, '#7cff55');
    limb(ctx, [[-15, -30], [-18, -13], [-13, -2]], 5.5, '#232323');
    limb(ctx, [[12, -30], [17, -14], [15, -2]], 5.5, '#232323');
    for (const x of [-13, 15]) shape(ctx, poly([[x - 4, -3], [x + 5, -3], [x + 5, 0], [x - 4, 0]]), '#0a0a0a', 0.5);
    // team caparison
    shape(ctx, (c) => {
      c.moveTo(-32, -50); c.lineTo(25, -50); c.lineTo(23, -25);
      for (let i = 0; i < 6; i++) c.quadraticCurveTo(18 - i * 9, -18, 13 - i * 9, -25);
      c.lineTo(-33, -25); c.closePath();
    }, lg(ctx, 0, -51, 0, -18, t.light, t.main, t.dark), 1.4);
    // knight
    shape(ctx, poly([[-12, -78], [9, -78], [12, -51], [-14, -51]]), lg(ctx, -14, -80, 12, -50, '#44444c', '#050505'));
    shape(ctx, (c) => { c.moveTo(-9, -81); c.lineTo(-8, -96); c.quadraticCurveTo(1, -103, 10, -96); c.lineTo(10, -81); c.closePath(); }, lg(ctx, -9, -102, 10, -80, '#555', '#090909'));
    shape(ctx, poly([[-1, -91], [10, -91], [10, -88], [-1, -88]]), '#111', 0);
    eye(ctx, 3, -90, '#7cff55'); eye(ctx, 8, -90, '#7cff55');
    for (const [x, y] of [[-12, -78], [10, -78], [-3, -101]]) shape(ctx, poly([[x, y], [x + 4, y - 10], [x + 8, y]]), '#0c0c0d', 0.5);
    limb(ctx, [[8, -72], [19, -64], [24, -67]], 5, '#1b1b1d');
    // scythe/lance
    stick(ctx, -22, -57, 66, -89, 3, '#3a2618');
    shape(ctx, (c) => { c.moveTo(62, -90); c.quadraticCurveTo(86, -107, 92, -132); c.quadraticCurveTo(81, -111, 57, -94); c.closePath(); }, steel(ctx, 58, 94));
  }

  function bonedragon(ctx, t) {
    // far bony wing
    bone(ctx, [[-2, -56], [-20, -120]], 3.5);
    bone(ctx, [[-20, -120], [-42, -98]], 3);
    bone(ctx, [[-20, -120], [-58, -76]], 3);
    // tail
    bone(ctx, [[-30, -35], [-58, -33], [-74, -17], [-90, -11]], 6);
    shape(ctx, poly([[-93, -13], [-101, -19], [-98, -7]]), BONE, 0.8);
    // legs
    bone(ctx, [[-19, -30], [-26, -14], [-20, -2]], 6);
    bone(ctx, [[14, -31], [22, -15], [18, -2]], 5.5);
    // spine and ribs
    bone(ctx, [[-31, -43], [-4, -48], [24, -42]], 5);
    for (const x of [-22, -12, -2, 8, 18]) {
      shape(ctx, (c) => { c.moveTo(x, -45); c.quadraticCurveTo(x - 8, -32, x - 1, -22); }, null, 2.2, BONE);
      shape(ctx, (c) => { c.moveTo(x + 2, -45); c.quadraticCurveTo(x + 11, -32, x + 3, -22); }, null, 2.2, BONE);
    }
    // neck and skull
    bone(ctx, [[18, -50], [29, -67], [30, -86], [42, -93]], 5.5);
    shape(ctx, (c) => {
      c.moveTo(32, -99); c.quadraticCurveTo(47, -107, 63, -96); c.lineTo(64, -89); c.lineTo(50, -87); c.lineTo(61, -81); c.lineTo(45, -80); c.quadraticCurveTo(34, -83, 32, -92); c.closePath();
    }, lg(ctx, 32, -107, 64, -80, '#efe8d2', BONE, BONE_D));
    eye(ctx, 45, -96, '#65ff54');
    shape(ctx, poly([[36, -100], [27, -114], [41, -102]]), BONE, 0.8);
    shape(ctx, poly([[47, -101], [45, -113], [53, -101]]), BONE, 0.8);
    tooth(ctx, 53, -85); tooth(ctx, 59, -86);
    // near wing: ragged bones, no membrane
    bone(ctx, [[1, -55], [-7, -130]], 4);
    const joints = [[-38, -113], [-59, -91], [-75, -66]];
    for (const j of joints) bone(ctx, [[-7, -130], j], 3);
    for (const [x, y] of joints) shape(ctx, poly([[x, y], [x - 6, y + 12], [x + 3, y + 8]]), 'rgba(216,208,184,0.35)', 0.6);
    // near legs and claws
    bone(ctx, [[-12, -30], [-14, -13], [-7, -2]], 6.5);
    bone(ctx, [[20, -33], [29, -18], [26, -2]], 6);
    for (const x of [-7, 26]) shape(ctx, poly([[x - 6, 0], [x + 8, 0], [x + 1, -4]]), BONE, 0.6);
    // team tattered banner at neck
    shape(ctx, (c) => {
      c.moveTo(23, -61); c.lineTo(37, -66); c.lineTo(35, -48); c.lineTo(29, -54); c.lineTo(23, -45); c.closePath();
    }, lg(ctx, 23, -66, 37, -45, t.light, t.main, t.dark), 0.8);
  }

  BH.Sprites.register('cerberus', cerberus, { scale: 1.1, portraitSize: 140, portraitX: 0.5 });
  BH.Sprites.register('efreet', efreet, { scale: 1.08, portraitSize: 145, portraitX: 0.48 });
  BH.Sprites.register('devil', devil, { scale: 1.15, portraitSize: 150, portraitX: 0.48 });
  BH.Sprites.register('skeleton', skeleton, { portraitSize: 120, portraitX: 0.45 });
  BH.Sprites.register('wight', wight, { scale: 1.02, portraitSize: 130, portraitX: 0.47 });
  BH.Sprites.register('vampire', vampire, { portraitSize: 120, portraitX: 0.45 });
  BH.Sprites.register('lich', lich, { portraitSize: 130, portraitX: 0.46 });
  BH.Sprites.register('dreadknight', dreadknight, { scale: 1.12, portraitSize: 150, portraitX: 0.42 });
  BH.Sprites.register('bonedragon', bonedragon, { scale: 1.3, portraitSize: 175, portraitX: 0.58 });
})(typeof window !== 'undefined' ? window : globalThis);
