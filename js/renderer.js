// Canvas renderer: battlefield, units, highlights and event animations.
(function (root) {
  const BH = (root.BH = root.BH || {});
  const Hex = BH.Hex;
  const B = BH.Battle;
  const SQRT3 = Math.sqrt(3);

  // Field size in hex-size units (size = hex radius). Top margin leaves room for the horizon.
  const TOP_MARGIN = 1.6;
  const FIELD_W = SQRT3 * (Hex.COLS + 0.5);
  const FIELD_H = 1.5 * Hex.ROWS + 0.5 + TOP_MARGIN;

  function norm(col, row) {
    return { x: SQRT3 * (col + 0.5 * (row & 1)) + SQRT3 / 2, y: 1.5 * row + 1 };
  }

  function seeded(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const PROJECTILES = { mage: 'fireball', monk: 'bolt', lich: 'cloud', titan: 'lightning', beholder: 'ray', cyclops: 'rock' };
  const ORB_COLORS = {
    fireball: ['rgba(255,255,200,1)', 'rgba(255,170,30,0.95)', 'rgba(220,40,0,0)'],
    bolt: ['rgba(255,255,255,1)', 'rgba(255,240,140,0.9)', 'rgba(255,220,60,0)'],
    cloud: ['rgba(230,255,210,1)', 'rgba(120,210,60,0.9)', 'rgba(40,90,20,0)'],
    lightning: ['rgba(255,255,255,1)', 'rgba(140,200,255,0.95)', 'rgba(60,120,255,0)'],
    ray: ['rgba(255,230,255,1)', 'rgba(200,80,255,0.9)', 'rgba(90,0,140,0)'],
  };
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const now = () => performance.now();

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.display = new Map();
      this.effects = [];
      this.texts = [];
      this.highlight = { reach: null, activeId: null, hover: null, targets: null };
      this.battle = null;
      this.bg = null;
      this.seed = 1;
      this.resize();
      const loop = () => {
        this.draw();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.cssW = Math.max(rect.width, 100);
      this.cssH = Math.max(rect.height, 100);
      this.canvas.width = Math.round(this.cssW * dpr);
      this.canvas.height = Math.round(this.cssH * dpr);
      const size = Math.min(this.cssW / FIELD_W, this.cssH / FIELD_H);
      this.size = size;
      this.originX = (this.cssW - FIELD_W * size) / 2;
      this.originY = (this.cssH - FIELD_H * size) / 2 + TOP_MARGIN * size;
      this.layout = Hex.makeLayout(size, this.originX, this.originY);
      BH.Sprites.clearCache();
      this.bg = null;
    }

    setBattle(battle, seed) {
      this.battle = battle;
      this.seed = seed || Math.floor(Math.random() * 1e9);
      this.bg = null;
      this.display.clear();
      this.effects = [];
      this.texts = [];
      for (const u of battle.units) {
        const p = norm(u.col, u.row);
        this.display.set(u.id, {
          x: p.x, y: p.y, count: u.count, alpha: 1, dead: false, flash: 0,
          facing: u.side === 'player' ? 1 : -1, lift: 0, lunge: { x: 0, y: 0 }, deathT: 0,
        });
      }
    }

    setHighlight(h) {
      this.highlight = Object.assign({ reach: null, activeId: null, hover: null, targets: null }, h);
    }

    toPx(nx, ny) {
      return { x: this.originX + nx * this.size, y: this.originY + ny * this.size };
    }

    // Converts a pointer event position to a hex plus local pixel coordinates.
    pick(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return { hex: Hex.pixelToHex(this.layout, x, y), x, y };
    }

    hexCenter(col, row) {
      return Hex.hexToPixel(this.layout, col, row);
    }

    // ------------------------------------------------------------ background

    buildBackground() {
      const c = document.createElement('canvas');
      c.width = this.canvas.width;
      c.height = this.canvas.height;
      const g = c.getContext('2d');
      g.scale(this.dpr, this.dpr);
      const W = this.cssW;
      const H = this.cssH;
      const rnd = seeded(this.seed);
      const s = this.size;

      const grass = g.createLinearGradient(0, 0, 0, H);
      grass.addColorStop(0, '#47702a');
      grass.addColorStop(0.5, '#5a8530');
      grass.addColorStop(1, '#3f6a22');
      g.fillStyle = grass;
      g.fillRect(0, 0, W, H);

      // mottled grass texture
      for (let i = 0; i < 900; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const r = (0.3 + rnd() * 1.6) * s;
        const tones = ['#6a9638', '#3c6420', '#7a9a3a', '#4e7a28', '#8a8a40'];
        g.fillStyle = tones[Math.floor(rnd() * tones.length)];
        g.globalAlpha = 0.12 + rnd() * 0.12;
        g.beginPath();
        g.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
        g.fill();
      }
      // dirt patches
      for (let i = 0; i < 6; i++) {
        const x = rnd() * W;
        const y = this.originY + rnd() * (H - this.originY);
        const r = (1.5 + rnd() * 2.5) * s;
        const dg = g.createRadialGradient(x, y, 0, x, y, r);
        dg.addColorStop(0, 'rgba(130,100,50,0.35)');
        dg.addColorStop(1, 'rgba(130,100,50,0)');
        g.globalAlpha = 1;
        g.fillStyle = dg;
        g.beginPath();
        g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2);
        g.fill();
      }
      // grass blades
      g.globalAlpha = 0.35;
      g.lineWidth = 1;
      for (let i = 0; i < 1600; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        g.strokeStyle = rnd() < 0.5 ? '#88b048' : '#2e5016';
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rnd() - 0.5) * 3, y - 2 - rnd() * 4);
        g.stroke();
      }
      g.globalAlpha = 1;

      // horizon tree line
      const horizon = this.originY - 0.2 * s;
      const sky = g.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#9cc4e4');
      sky.addColorStop(1, '#d8e8d0');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, Math.max(0, horizon - 0.9 * s));
      for (let layer = 0; layer < 2; layer++) {
        const baseY = horizon - (layer === 0 ? 0.9 : 0.3) * s;
        const col = layer === 0 ? '#2f5a2a' : '#25481e';
        for (let x = -s; x < W + s; x += (0.5 + rnd() * 0.5) * s) {
          const r = (0.6 + rnd() * 0.6) * s;
          const tg = g.createRadialGradient(x - r * 0.3, baseY - r * 0.5, 0, x, baseY - r * 0.2, r * 1.2);
          tg.addColorStop(0, layer === 0 ? '#4f8a3a' : '#3c7030');
          tg.addColorStop(1, col);
          g.fillStyle = tg;
          g.beginPath();
          g.ellipse(x, baseY - r * 0.4, r * 0.8, r, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      const fade = g.createLinearGradient(0, horizon - 0.4 * s, 0, horizon + 0.6 * s);
      fade.addColorStop(0, 'rgba(60,100,36,0)');
      fade.addColorStop(1, 'rgba(70,110,40,1)');
      g.fillStyle = fade;
      g.fillRect(0, horizon - 0.4 * s, W, s);

      // vignette
      const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.35)');
      g.fillStyle = v;
      g.fillRect(0, 0, W, H);
      this.bg = c;
    }

    // ------------------------------------------------------------ drawing

    hexPath(col, row, shrink = 0) {
      const ctx = this.ctx;
      const c = this.hexCenter(col, row);
      const r = this.size - shrink;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        const x = c.x + r * Math.cos(a);
        const y = c.y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (!this.battle) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }
      if (!this.bg) this.buildBackground();
      ctx.drawImage(this.bg, 0, 0);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const t = now();

      this.drawGrid();
      this.drawHighlights(t);

      // depth-sorted drawables: obstacles, corpses first, then living units
      const items = [];
      for (const k of this.battle.obstacles) {
        const h = Hex.parseKey(k);
        const p = norm(h.col, h.row);
        items.push({ y: p.y, z: 0, draw: () => this.drawRock(h.col, h.row) });
      }
      for (const u of this.battle.units) {
        const d = this.display.get(u.id);
        if (!d) continue;
        items.push({ y: d.y, z: d.dead ? -1 : 1, draw: () => this.drawUnit(u, d, t) });
      }
      items.sort((a, b) => (a.z === -1 ? 0 : 1) - (b.z === -1 ? 0 : 1) || a.y - b.y);
      for (const it of items) it.draw();
      for (const u of this.battle.units) {
        const d = this.display.get(u.id);
        if (d && !d.dead && d.count > 0) this.drawCountBox(u, d);
      }
      this.drawEffects(t);
      this.drawTexts(t);
    }

    drawGrid() {
      const ctx = this.ctx;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(20,30,10,0.32)';
      for (const h of Hex.allHexes()) {
        this.hexPath(h.col, h.row);
        ctx.stroke();
      }
    }

    drawHighlights(t) {
      const ctx = this.ctx;
      const hl = this.highlight;
      if (hl.reach) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        for (const k of hl.reach) {
          const h = Hex.parseKey(k);
          this.hexPath(h.col, h.row, 0.5);
          ctx.fill();
        }
      }
      if (hl.targets) {
        for (const id of hl.targets) {
          const u = B.getUnit(this.battle, id);
          if (!u || u.count <= 0) continue;
          this.hexPath(u.col, u.row, 1.5);
          ctx.fillStyle = 'rgba(200,30,20,0.18)';
          ctx.fill();
        }
      }
      if (hl.hover) {
        const hv = hl.hover;
        if (hv.path) {
          ctx.fillStyle = 'rgba(255,240,170,0.22)';
          for (const h of hv.path) {
            this.hexPath(h.col, h.row, 2);
            ctx.fill();
          }
        }
        if (hv.from) {
          this.hexPath(hv.from.col, hv.from.row, 2);
          ctx.fillStyle = 'rgba(255,220,90,0.35)';
          ctx.fill();
        }
        if (hv.splash) {
          ctx.fillStyle = 'rgba(255,110,20,0.28)';
          for (const h of hv.splash) {
            this.hexPath(h.col, h.row, 2);
            ctx.fill();
          }
        }
        if (hv.hex) {
          this.hexPath(hv.hex.col, hv.hex.row, 1.5);
          ctx.lineWidth = 2;
          ctx.strokeStyle = hv.kind === 'none' ? 'rgba(255,255,255,0.35)' : 'rgba(255,236,150,0.95)';
          ctx.stroke();
        }
      }
      if (hl.activeId != null) {
        const u = B.getUnit(this.battle, hl.activeId);
        const d = this.display.get(hl.activeId);
        if (u && d && !d.dead) {
          const p = this.toPx(d.x, d.y);
          const pulse = 0.55 + 0.45 * Math.sin(t / 220);
          ctx.save();
          ctx.translate(p.x - this.hexCenter(u.col, u.row).x, p.y - this.hexCenter(u.col, u.row).y);
          this.hexPath(u.col, u.row, 1.5);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = `rgba(255,215,80,${pulse})`;
          ctx.shadowColor = 'rgba(255,200,60,0.9)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    drawRock(col, row) {
      const ctx = this.ctx;
      const c = this.hexCenter(col, row);
      const s = this.size;
      const rnd = seeded(this.seed + col * 31 + row * 977);
      const n = 2 + Math.floor(rnd() * 2);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + s * 0.35, s * 0.8, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < n; i++) {
        const ox = (rnd() - 0.5) * s * 0.8;
        const oy = (rnd() - 0.3) * s * 0.4;
        const r = s * (0.35 + rnd() * 0.3) * (i === 0 ? 1.3 : 1);
        const x = c.x + ox;
        const y = c.y + oy;
        const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.6, r * 0.1, x, y, r * 1.2);
        g.addColorStop(0, '#c8c0b0');
        g.addColorStop(0.5, '#8a8274');
        g.addColorStop(1, '#4a443a');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#2a251e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const pts = 7;
        for (let k = 0; k < pts; k++) {
          const a = (k / pts) * Math.PI * 2;
          const rr = r * (0.8 + rnd() * 0.3);
          const px = x + Math.cos(a) * rr;
          const py = y + Math.sin(a) * rr * 0.8 - (Math.sin(a) < 0 ? r * 0.25 : 0);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(80,120,40,0.5)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.2, y - r * 0.5, r * 0.3, r * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawUnit(u, d, t) {
      const ctx = this.ctx;
      const p = this.toPx(d.x + d.lunge.x, d.y + d.lunge.y);
      const ppu = (this.size * 2.25) / 100;
      const sprite = BH.Sprites.get(u.type, u.side, ppu);
      const footY = p.y + this.size * 0.55;
      ctx.save();
      ctx.globalAlpha = d.alpha;
      if (d.dead) {
        // corpse: lying sprite, darkened
        const k = Math.min(1, d.deathT);
        ctx.globalAlpha = (1 - 0.5 * k) * d.alpha;
        ctx.translate(p.x + d.facing * this.size * 0.7 * k, footY - this.size * 0.2 * k);
        ctx.scale(d.facing, 1);
        ctx.rotate((-Math.PI / 2) * k);
        ctx.scale(1 - 0.35 * k, 1 - 0.35 * k);
        ctx.drawImage(sprite.canvas, -sprite.footX, -sprite.footY);
        ctx.restore();
        return;
      }
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      const big = u.type === 'dragon' || u.type === 'cavalier' ? 1.25 : 0.8;
      ctx.ellipse(p.x, footY - this.size * 0.05, this.size * big, this.size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      const bob = Math.sin(t / 400 + u.id * 1.7) * 0.012;
      ctx.translate(p.x, footY - d.lift * this.size);
      ctx.scale(d.facing, 1 + bob);
      ctx.drawImage(sprite.canvas, -sprite.footX, -sprite.footY);
      if (d.flash > 0) {
        ctx.globalAlpha = d.flash * d.alpha;
        ctx.drawImage(BH.Sprites.tinted(sprite), -sprite.footX, -sprite.footY);
      }
      ctx.restore();
    }

    drawCountBox(u, d) {
      const ctx = this.ctx;
      const p = this.toPx(d.x + d.lunge.x, d.y + d.lunge.y);
      const s = this.size;
      const text = String(d.count);
      const fs = Math.max(10, Math.round(s * 0.42));
      ctx.font = `bold ${fs}px Georgia, 'Times New Roman', serif`;
      const w = Math.max(s * 0.85, ctx.measureText(text).width + s * 0.3);
      const h = fs * 1.25;
      const x = p.x - w / 2 + (u.side === 'player' ? s * 0.2 : -s * 0.2);
      const y = p.y + s * 0.42 - d.lift * s;
      const team = BH.Sprites.TEAMS[u.side];
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, team.light);
      g.addColorStop(1, team.dark);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#e8c86a';
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 2;
      ctx.fillText(text, x + w / 2, y + h / 2 + 1);
      ctx.shadowBlur = 0;
      const icons = (u.defending ? '🛡' : '') + (u.stunned ? '💫' : '') + (B.isBound(this.battle, u) ? '🌿' : '');
      if (icons) {
        ctx.font = `${Math.round(fs * 0.9)}px serif`;
        ctx.fillText(icons, x + w / 2, y - fs * 0.6);
      }
    }

    drawEffects(t) {
      const ctx = this.ctx;
      this.effects = this.effects.filter((e) => t < e.t0 + e.dur);
      for (const e of this.effects) {
        const k = Math.max(0, Math.min(1, (t - e.t0) / e.dur));
        e.draw(ctx, k, this);
      }
    }

    drawTexts(t) {
      const ctx = this.ctx;
      this.texts = this.texts.filter((x) => t < x.t0 + x.dur);
      for (const x of this.texts) {
        const k = (t - x.t0) / x.dur;
        if (k < 0) continue;
        const p = this.toPx(x.x, x.y - k * 0.9);
        ctx.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
        ctx.font = `bold ${Math.round(this.size * x.scale)}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(x.text, p.x, p.y);
        ctx.fillStyle = x.color;
        ctx.fillText(x.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
    }

    // ------------------------------------------------------------ animation

    tween(ms, fn) {
      return new Promise((resolve) => {
        const t0 = now();
        const step = () => {
          const k = Math.min(1, (now() - t0) / ms);
          fn(k);
          if (k < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    }

    wait(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async playEvents(events, speed = 1) {
      for (const ev of events) {
        if (ev.kind === 'move') await this.animMove(ev, speed);
        else if (ev.kind === 'attack') await this.animAttack(ev, speed);
        else if (ev.kind === 'defend') await this.animDefend(ev, speed);
        else if (ev.kind === 'effect') await this.animEffect(ev, speed);
      }
      for (const u of this.battle.units) {
        const d = this.display.get(u.id);
        if (d && !d.dead) d.facing = u.side === 'player' ? 1 : -1;
      }
    }

    async animMove(ev, speed) {
      const d = this.display.get(ev.unitId);
      if (ev.teleport) {
        const to = norm(ev.path[ev.path.length - 1].col, ev.path[ev.path.length - 1].row);
        d.facing = to.x >= d.x ? 1 : -1;
        this.addBurst(d, 'teleport', 400 / speed);
        await this.tween(220 / speed, (k) => (d.alpha = 1 - k));
        d.x = to.x;
        d.y = to.y;
        this.addBurst(d, 'teleport', 400 / speed);
        await this.tween(220 / speed, (k) => (d.alpha = k));
        return;
      }
      if (ev.flying) {
        const from = { x: d.x, y: d.y };
        const to = norm(ev.path[ev.path.length - 1].col, ev.path[ev.path.length - 1].row);
        d.facing = to.x >= from.x ? 1 : -1;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        await this.tween((250 + dist * 70) / speed, (k) => {
          const e = ease(k);
          d.x = from.x + (to.x - from.x) * e;
          d.y = from.y + (to.y - from.y) * e;
          d.lift = Math.sin(k * Math.PI) * Math.min(1.6, 0.4 + dist * 0.12);
        });
        d.lift = 0;
        return;
      }
      for (const h of ev.path) {
        const from = { x: d.x, y: d.y };
        const to = norm(h.col, h.row);
        if (Math.abs(to.x - from.x) > 0.01) d.facing = to.x > from.x ? 1 : -1;
        await this.tween(150 / speed, (k) => {
          d.x = from.x + (to.x - from.x) * k;
          d.y = from.y + (to.y - from.y) * k;
          d.lift = Math.abs(Math.sin(k * Math.PI)) * 0.08;
        });
      }
      d.lift = 0;
    }

    async animAttack(ev, speed) {
      const att = B.getUnit(this.battle, ev.attackerId);
      const tgt = B.getUnit(this.battle, ev.targetId);
      const da = this.display.get(att.id);
      const dt = this.display.get(tgt.id);
      da.facing = dt.x >= da.x ? 1 : -1;
      if (ev.ranged) {
        await this.tween(140 / speed, (k) => (da.lunge = { x: -da.facing * 0.08 * Math.sin(k * Math.PI), y: 0 }));
        await this.animProjectile(att, da, dt, speed);
      } else {
        const dx = dt.x - da.x;
        const dy = dt.y - da.y;
        await this.tween(140 / speed, (k) => (da.lunge = { x: dx * 0.3 * ease(k), y: dy * 0.3 * ease(k) }));
        if (att.def.attackType === 'splash' || att.def.perks.breath) this.addBurst(dt, 'fire', 450 / speed);
      }
      this.applyHits(ev, speed);
      if (!ev.ranged) await this.tween(160 / speed, (k) => (da.lunge = { x: (dt.x - da.x) * 0.3 * (1 - k), y: (dt.y - da.y) * 0.3 * (1 - k) }));
      da.lunge = { x: 0, y: 0 };
      await this.wait(320 / speed);
    }

    applyHits(ev, speed) {
      for (const h of ev.hits) {
        const d = this.display.get(h.unitId);
        if (h.unitId !== ev.targetId) {
          const att = B.getUnit(this.battle, ev.attackerId);
          const fiery = att.def.attackType === 'splash' || att.def.perks.breath;
          this.addBurst(d, att.type === 'lich' ? 'cloud' : fiery ? 'fire' : 'stare', 450 / speed);
        }
        if (ev.deathBlow && h.unitId === ev.targetId) {
          this.texts.push({ x: d.x, y: d.y - 2.2, text: 'Death blow!', color: '#ff6060', t0: now(), dur: 1200 / speed, scale: 0.5 });
        }
        d.count = h.countAfter;
        this.texts.push({ x: d.x, y: d.y - 1.6, text: `-${h.damage}`, color: '#ffdf6a', t0: now(), dur: 1100 / speed, scale: 0.55 });
        if (h.kills) this.texts.push({ x: d.x, y: d.y - 1.0, text: `${h.kills} perish`, color: '#ff8a7a', t0: now() + 120, dur: 1100 / speed, scale: 0.4 });
        this.tween(380 / speed, (k) => (d.flash = 0.6 * (1 - k)));
        const push = this.display.get(ev.attackerId).facing;
        this.tween(160 / speed, (k) => (d.lunge = { x: push * 0.06 * Math.sin(k * Math.PI), y: 0 }));
        if (h.dead) {
          d.dead = true;
          this.tween(500 / speed, (k) => (d.deathT = k));
        }
      }
    }

    animProjectile(att, da, dt, speed) {
      const kind = PROJECTILES[att.type] || 'arrow';
      const from = { x: da.x + da.facing * 0.5, y: da.y - 1.1 };
      const to = { x: dt.x, y: dt.y - 0.8 };
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const dur = (180 + dist * 25) / speed;
      this.effects.push({
        t0: now(), dur,
        draw(ctx, k, r) {
          const x = from.x + (to.x - from.x) * k;
          const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * (kind === 'arrow' ? dist * 0.08 : 0);
          const p = r.toPx(x, y);
          const s = r.size;
          if (kind === 'arrow') {
            const ang = Math.atan2(to.y - from.y - Math.cos(k * Math.PI) * dist * 0.25, to.x - from.x);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(ang);
            ctx.strokeStyle = '#3a2410';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-s * 0.5, 0);
            ctx.lineTo(s * 0.3, 0);
            ctx.stroke();
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(s * 0.4, 0);
            ctx.lineTo(s * 0.25, -s * 0.08);
            ctx.lineTo(s * 0.25, s * 0.08);
            ctx.fill();
            ctx.restore();
          } else if (kind === 'rock') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(k * 12);
            const rr = s * 0.28;
            const g = ctx.createRadialGradient(-rr * 0.3, -rr * 0.3, 1, 0, 0, rr);
            g.addColorStop(0, '#c8c0b0');
            g.addColorStop(1, '#4a443a');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#2a251e';
            ctx.beginPath();
            for (let i = 0; i < 7; i++) {
              const a = (i / 7) * Math.PI * 2;
              const q = rr * (0.8 + 0.2 * Math.sin(i * 3.7));
              if (i === 0) ctx.moveTo(Math.cos(a) * q, Math.sin(a) * q);
              else ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          } else {
            const rad = s * (kind === 'fireball' || kind === 'cloud' ? 0.45 : 0.32);
            const cols = ORB_COLORS[kind] || ORB_COLORS.bolt;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
            g.addColorStop(0, cols[0]);
            g.addColorStop(0.4, cols[1]);
            g.addColorStop(1, cols[2]);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        },
      });
      return this.wait(dur).then(() => {
        if (kind === 'fireball') this.addBurst(dt, 'fire', 500 / speed);
        else if (kind === 'cloud') this.addBurst(dt, 'cloud', 500 / speed);
        else if (kind === 'ray') this.addBurst(dt, 'stare', 400 / speed);
        else if (kind === 'bolt' || kind === 'lightning') this.addBurst(dt, 'holy', 400 / speed);
      });
    }

    addBurst(d, kind, dur) {
      const cx = d.x;
      const cy = d.y - 0.5;
      this.effects.push({
        t0: now(), dur,
        draw(ctx, k, r) {
          const p = r.toPx(cx, cy);
          const rad = r.size * (0.3 + k * 1.0);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
          const a = 1 - k;
          if (kind === 'fire') {
            g.addColorStop(0, `rgba(255,255,200,${a})`);
            g.addColorStop(0.35, `rgba(255,160,20,${a * 0.9})`);
            g.addColorStop(1, 'rgba(200,30,0,0)');
          } else if (kind === 'heal') {
            g.addColorStop(0, `rgba(220,255,220,${a})`);
            g.addColorStop(0.4, `rgba(90,230,110,${a * 0.8})`);
            g.addColorStop(1, 'rgba(40,160,60,0)');
          } else if (kind === 'stare' || kind === 'teleport') {
            g.addColorStop(0, `rgba(255,230,255,${a})`);
            g.addColorStop(0.4, `rgba(170,60,220,${a * 0.8})`);
            g.addColorStop(1, 'rgba(80,0,120,0)');
          } else if (kind === 'cloud') {
            g.addColorStop(0, `rgba(220,255,200,${a})`);
            g.addColorStop(0.4, `rgba(120,200,60,${a * 0.8})`);
            g.addColorStop(1, 'rgba(40,90,20,0)');
          } else {
            g.addColorStop(0, `rgba(255,255,255,${a})`);
            g.addColorStop(0.4, `rgba(255,240,150,${a * 0.8})`);
            g.addColorStop(1, 'rgba(255,220,80,0)');
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
        },
      });
    }

    async animEffect(ev, speed) {
      for (const h of ev.hits) {
        const d = this.display.get(h.unitId);
        if (!d) continue;
        const t0 = now();
        if (h.reborn) {
          this.addBurst(d, 'fire', 700 / speed);
          d.dead = false;
          d.deathT = 0;
          d.alpha = 1;
          d.count = h.countAfter;
          this.texts.push({ x: d.x, y: d.y - 1.6, text: h.text, color: '#ffb040', t0, dur: 1300 / speed, scale: 0.55 });
          continue;
        }
        if (h.heal) {
          this.addBurst(d, 'heal', 600 / speed);
          this.texts.push({ x: d.x, y: d.y - 1.6, text: `+${h.heal}`, color: '#7dff8a', t0, dur: 1100 / speed, scale: 0.55 });
          if (h.revived) this.texts.push({ x: d.x, y: d.y - 1.0, text: `${h.revived} rise`, color: '#b8ffb0', t0: t0 + 120, dur: 1100 / speed, scale: 0.4 });
        } else if (h.damage || h.kills) {
          if (ev.fire) this.addBurst(d, 'fire', 450 / speed);
          else this.addBurst(d, 'stare', 500 / speed);
          if (h.damage) this.texts.push({ x: d.x, y: d.y - 1.6, text: `-${h.damage}`, color: '#ffdf6a', t0, dur: 1100 / speed, scale: 0.55 });
          if (h.kills) this.texts.push({ x: d.x, y: d.y - 1.0, text: `${h.kills} perish`, color: '#ff8a7a', t0: t0 + 120, dur: 1100 / speed, scale: 0.4 });
          this.tween(380 / speed, (k) => (d.flash = 0.6 * (1 - k)));
          if (h.dead) {
            d.dead = true;
            this.tween(500 / speed, (k) => (d.deathT = k));
          }
        }
        if (h.text && !h.heal && !h.reborn) {
          this.texts.push({ x: d.x, y: d.y - 2.2, text: h.text, color: '#d8c8ff', t0, dur: 1200 / speed, scale: 0.45 });
        }
        d.count = h.countAfter;
      }
      await this.wait(380 / speed);
    }

    async animDefend(ev, speed) {
      const d = this.display.get(ev.unitId);
      this.texts.push({ x: d.x, y: d.y - 1.4, text: 'Defend', color: '#bfe0ff', t0: now(), dur: 900 / speed, scale: 0.45 });
      await this.wait(350 / speed);
    }
  }

  BH.Renderer = Renderer;
})(typeof window !== 'undefined' ? window : globalThis);
