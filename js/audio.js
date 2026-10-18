// Procedural audio: background music and sound effects synthesized with the Web Audio API (no audio files).
(function (root) {
  const BH = (root.BH = root.BH || {});
  const AC = root.AudioContext || root.webkitAudioContext;

  const PREFS_KEY = 'bh.audio';
  const prefs = (() => {
    try {
      return Object.assign({ music: true, sfx: true }, JSON.parse(root.localStorage.getItem(PREFS_KEY) || '{}'));
    } catch (e) {
      return { music: true, sfx: true };
    }
  })();
  function savePrefs() {
    try {
      root.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      // storage unavailable (private mode): settings just won't persist
    }
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rand = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------ graph helpers
  // All helpers take the context explicitly so they work with OfflineAudioContext too.

  const noiseCache = new WeakMap();
  function noiseBuffer(c) {
    if (!noiseCache.has(c)) {
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      noiseCache.set(c, buf);
    }
    return noiseCache.get(c);
  }

  function impulse(c, seconds, decay) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function osc(c, type, freq, t, end) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.start(t);
    o.stop(end);
    return o;
  }

  function noise(c, t, end) {
    const s = c.createBufferSource();
    s.buffer = noiseBuffer(c);
    s.loop = true;
    s.start(t, Math.random() * 1.5);
    s.stop(end);
    return s;
  }

  function filter(c, type, freq, q = 1) {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  function gain(c, v = 1) {
    const g = c.createGain();
    g.gain.value = v;
    return g;
  }

  function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[nodes.length - 1];
  }

  // Percussive envelope: quick attack to `peak`, exponential decay over `d` seconds.
  function perc(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  // Sustained envelope: attack, hold until t+dur, then release.
  function sustain(g, t, a, peak, dur, r) {
    const hold = Math.max(t + a + 0.01, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, hold);
    g.gain.exponentialRampToValueAtTime(0.0001, hold + r);
  }

  function sweep(param, t, from, to, d) {
    param.setValueAtTime(from, t);
    param.exponentialRampToValueAtTime(to, t + d);
  }

  // Noise burst through a filter. Returns the filter so callers can sweep it.
  function noiseHit(c, out, t, type, freq, q, a, peak, d) {
    const n = noise(c, t, t + a + d + 0.05);
    const f = filter(c, type, freq, q);
    const g = gain(c, 0);
    perc(g, t, a, peak, d);
    chain(n, f, g, out);
    return f;
  }

  // Pitched blip with a frequency sweep.
  function tone(c, out, t, type, f0, f1, a, peak, d) {
    const o = osc(c, type, f0, t, t + a + d + 0.05);
    if (f1 !== f0) sweep(o.frequency, t, f0, f1, a + d);
    const g = gain(c, 0);
    perc(g, t, a, peak, d);
    chain(o, g, out);
    return o;
  }

  // ------------------------------------------------------------ instruments

  const INSTR = {
    pluck(c, out, t, m, dur, v = 1) {
      const end = t + dur + 0.7;
      const f = filter(c, 'lowpass', 3200, 2);
      sweep(f.frequency, t, 3200, 450, 0.45);
      const o1 = osc(c, 'sawtooth', mtof(m), t, end);
      const o2 = osc(c, 'triangle', mtof(m) * 2.002, t, end);
      const g2 = gain(c, 0.35);
      const g = gain(c, 0);
      perc(g, t, 0.004, 0.12 * v, dur + 0.55);
      o1.connect(f);
      chain(o2, g2, f);
      chain(f, g, out);
    },
    lead(c, out, t, m, dur, v = 1) {
      const end = t + dur + 0.35;
      const o = osc(c, 'triangle', mtof(m), t, end);
      const vib = osc(c, 'sine', 5.2, t, end);
      const vd = gain(c, mtof(m) * 0.006);
      chain(vib, vd, o.frequency);
      const o2 = osc(c, 'sine', mtof(m) * 2, t, end);
      const g2 = gain(c, 0.12);
      const g = gain(c, 0);
      sustain(g, t, 0.05, 0.15 * v, dur - 0.05, 0.25);
      o.connect(g);
      chain(o2, g2, g);
      chain(g, filter(c, 'lowpass', 2600), out);
    },
    horn(c, out, t, m, dur, v = 1) {
      const end = t + dur + 0.4;
      const f = filter(c, 'lowpass', 900, 1.5);
      sweep(f.frequency, t, 600, 1500, 0.12);
      const g = gain(c, 0);
      sustain(g, t, 0.08, 0.09 * v, dur - 0.08, 0.3);
      for (const det of [-6, 6]) {
        const o = osc(c, 'sawtooth', mtof(m), t, end);
        o.detune.value = det;
        o.connect(f);
      }
      chain(f, g, out);
    },
    pad(c, out, t, notes, dur, v = 1) {
      const end = t + dur + 0.8;
      const f = filter(c, 'lowpass', 900, 0.7);
      const g = gain(c, 0);
      sustain(g, t, 0.45, 0.03 * v, dur - 0.2, 0.7);
      for (const m of notes) {
        for (const det of [-8, 7]) {
          const o = osc(c, 'sawtooth', mtof(m), t, end);
          o.detune.value = det;
          o.connect(f);
        }
      }
      chain(f, g, out);
    },
    bass(c, out, t, m, dur, v = 1) {
      const end = t + dur + 0.3;
      const o = osc(c, 'triangle', mtof(m), t, end);
      const s = osc(c, 'sine', mtof(m) / 2, t, end);
      const g = gain(c, 0);
      sustain(g, t, 0.01, 0.22 * v, dur - 0.05, 0.2);
      const f = filter(c, 'lowpass', 700);
      o.connect(f);
      s.connect(f);
      chain(f, g, out);
    },
    drum(c, out, t, v = 1) {
      tone(c, out, t, 'sine', 120, 42, 0.004, 0.55 * v, 0.45);
      noiseHit(c, out, t, 'lowpass', 500, 1, 0.002, 0.18 * v, 0.12);
    },
    snare(c, out, t, v = 1) {
      noiseHit(c, out, t, 'bandpass', 1800, 0.8, 0.002, 0.16 * v, 0.14);
      tone(c, out, t, 'triangle', 200, 160, 0.002, 0.08 * v, 0.06);
    },
    shaker(c, out, t, v = 1) {
      noiseHit(c, out, t, 'highpass', 6500, 0.7, 0.003, 0.035 * v, 0.05);
    },
  };

  // ------------------------------------------------------------ the song

  const BPM = 100;
  const BEAT = 60 / BPM;
  const BAR = 4 * BEAT;
  const CHORDS = {
    Dm: { b: 38, t: [62, 65, 69] },
    C: { b: 36, t: [60, 64, 67] },
    Bb: { b: 34, t: [58, 62, 65] },
    A: { b: 33, t: [57, 61, 64] },
    F: { b: 41, t: [60, 65, 69] },
    Gm: { b: 43, t: [58, 62, 67] },
  };
  // Melody entries are [midi note, beats].
  const SONG = [
    { ch: ['Dm'], mel: [[69, 1], [74, 1], [72, 0.5], [70, 0.5], [69, 1]] },
    { ch: ['C'], mel: [[67, 1.5], [69, 0.5], [67, 1], [64, 1]] },
    { ch: ['Bb'], mel: [[65, 1], [67, 1], [69, 1], [70, 1]] },
    { ch: ['A'], mel: [[69, 1], [73, 1], [76, 2]] },
    { ch: ['Dm'], mel: [[74, 1.5], [76, 0.5], [77, 1], [74, 1]] },
    { ch: ['F'], mel: [[72, 2], [69, 1], [72, 1]] },
    { ch: ['Gm', 'A'], mel: [[70, 1], [67, 1], [69, 1], [73, 1]] },
    { ch: ['Dm'], mel: [[74, 4]] },
    { ch: ['Bb'], mel: [[65, 2], [62, 1], [65, 1]], inst: 'horn' },
    { ch: ['F'], mel: [[69, 2], [65, 2]], inst: 'horn' },
    { ch: ['C'], mel: [[67, 1], [69, 1], [70, 1], [72, 1]], inst: 'horn' },
    { ch: ['Dm'], mel: [[69, 4]], inst: 'horn' },
    { ch: ['Bb'], mel: [[70, 2], [69, 1], [67, 1]], inst: 'horn' },
    { ch: ['C'], mel: [[67, 2], [64, 1], [67, 1]], inst: 'horn' },
    { ch: ['A'], mel: [[69, 2], [67, 1], [64, 1]], inst: 'horn' },
    { ch: ['A'], mel: [[73, 2], [76, 1], [73, 1]], inst: 'horn' },
  ];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 1];

  function scheduleBar(c, out, index, t) {
    const bar = SONG[index % SONG.length];
    const seg = BAR / bar.ch.length;
    bar.ch.forEach((name, k) => {
      const ch = CHORDS[name];
      const t0 = t + k * seg;
      INSTR.pad(c, out, t0, ch.t.map((m) => m - 12), seg);
      const halves = Math.round(seg / (2 * BEAT));
      for (let h = 0; h < halves; h++) INSTR.bass(c, out, t0 + h * 2 * BEAT, h === 0 ? ch.b : ch.b + 7, 2 * BEAT * 0.9);
      const steps = Math.round(seg / (BEAT / 2));
      for (let s = 0; s < steps; s++) {
        const idx = ARP[s % ARP.length];
        const m = (idx === 3 ? ch.t[0] + 12 : ch.t[idx]) - 12;
        INSTR.pluck(c, out, t0 + (s * BEAT) / 2, m, BEAT / 2, s % 2 ? 0.65 : 1);
      }
    });
    INSTR.drum(c, out, t, 1);
    INSTR.drum(c, out, t + 2 * BEAT, 0.75);
    if (index % 4 === 3) {
      for (const b of [3, 3.5, 3.75]) INSTR.snare(c, out, t + b * BEAT, 0.9);
    } else {
      INSTR.snare(c, out, t + BEAT, 0.45);
      INSTR.snare(c, out, t + 3 * BEAT, 0.45);
    }
    for (let e = 0; e < 8; e++) INSTR.shaker(c, out, t + (e + 0.5) * (BEAT / 2) - BEAT / 4, e % 2 ? 1 : 0.6);
    let mt = t;
    for (const [m, beats] of bar.mel) {
      INSTR[bar.inst || 'lead'](c, out, mt, m, beats * BEAT * 0.95);
      mt += beats * BEAT;
    }
  }

  // ------------------------------------------------------------ sound effects
  // Signature: (ctx, out, time, volume, pitch)

  const SFX = {
    slash(c, o, t, v, p) {
      noiseHit(c, o, t, 'bandpass', 3500 * p, 0.8, 0.002, 0.45 * v, 0.12);
      for (const f of [1870, 2790, 4120]) tone(c, o, t, 'sine', f * p, f * p, 0.001, 0.07 * v, 0.35);
      tone(c, o, t, 'sine', 170 * p, 60, 0.003, 0.35 * v, 0.15);
    },
    claw(c, o, t, v, p) {
      noiseHit(c, o, t, 'lowpass', 1400 * p, 1, 0.003, 0.5 * v, 0.13);
      tone(c, o, t, 'sine', 230 * p, 70, 0.004, 0.45 * v, 0.2);
      noiseHit(c, o, t + 0.03, 'bandpass', 2400 * p, 2, 0.002, 0.15 * v, 0.06);
    },
    heavy(c, o, t, v, p) {
      tone(c, o, t, 'sine', 95 * p, 32, 0.004, 0.8 * v, 0.5);
      noiseHit(c, o, t, 'lowpass', 650 * p, 1, 0.003, 0.55 * v, 0.35);
    },
    roar(c, o, t, v, p) {
      const end = t + 0.9;
      const s = osc(c, 'sawtooth', 105 * p, t, end);
      sweep(s.frequency, t, 105 * p, 70 * p, 0.85);
      const wob = osc(c, 'sine', 28, t, end);
      const wd = gain(c, 18);
      chain(wob, wd, s.frequency);
      const g = gain(c, 0);
      sustain(g, t, 0.08, 0.2 * v, 0.45, 0.35);
      chain(s, filter(c, 'lowpass', 800, 2), g, o);
      noiseHit(c, o, t, 'bandpass', 500, 1.2, 0.1, 0.18 * v, 0.6);
    },
    bow(c, o, t, v, p) {
      tone(c, o, t, 'triangle', 900 * p, 300, 0.002, 0.3 * v, 0.08);
      const f = noiseHit(c, o, t + 0.02, 'bandpass', 1200, 1.5, 0.04, 0.3 * v, 0.22);
      sweep(f.frequency, t + 0.02, 1200, 4500, 0.25);
    },
    arrowHit(c, o, t, v, p) {
      noiseHit(c, o, t, 'lowpass', 1600 * p, 1, 0.002, 0.45 * v, 0.06);
      tone(c, o, t, 'sine', 280 * p, 110, 0.002, 0.35 * v, 0.1);
    },
    fireLaunch(c, o, t, v, p) {
      const f = noiseHit(c, o, t, 'lowpass', 300, 1, 0.1, 0.6 * v, 0.4);
      sweep(f.frequency, t, 300, 2600 * p, 0.45);
    },
    explosion(c, o, t, v, p) {
      const f = noiseHit(c, o, t, 'lowpass', 1300 * p, 0.8, 0.005, 0.7 * v, 0.75);
      sweep(f.frequency, t, 1300 * p, 140, 0.7);
      tone(c, o, t, 'sine', 75 * p, 30, 0.005, 0.7 * v, 0.5);
    },
    zap(c, o, t, v, p) {
      tone(c, o, t, 'sawtooth', 1600 * p, 180, 0.003, 0.2 * v, 0.25);
      tone(c, o, t, 'square', 2400 * p, 300, 0.003, 0.05 * v, 0.2);
      noiseHit(c, o, t, 'highpass', 4000, 0.7, 0.002, 0.14 * v, 0.15);
    },
    zapHit(c, o, t, v, p) {
      noiseHit(c, o, t, 'highpass', 2500 * p, 0.7, 0.001, 0.35 * v, 0.12);
      tone(c, o, t, 'sine', 1300 * p, 400, 0.002, 0.15 * v, 0.2);
    },
    thunder(c, o, t, v, p) {
      for (let i = 0; i < 3; i++) noiseHit(c, o, t + i * 0.04, 'highpass', 3000, 0.7, 0.001, 0.3 * v, 0.05);
      const f = noiseHit(c, o, t + 0.05, 'lowpass', 900 * p, 0.8, 0.01, 0.6 * v, 0.9);
      sweep(f.frequency, t + 0.05, 900 * p, 100, 0.9);
    },
    cloud(c, o, t, v, p) {
      const n = noise(c, t, t + 0.9);
      const f = filter(c, 'bandpass', 380 * p, 4);
      const lfo = osc(c, 'sine', 7, t, t + 0.9);
      const ld = gain(c, 160);
      chain(lfo, ld, f.frequency);
      const g = gain(c, 0);
      perc(g, t, 0.05, 0.55 * v, 0.75);
      chain(n, f, g, o);
      tone(c, o, t, 'sine', 95 * p, 70, 0.02, 0.25 * v, 0.5);
    },
    throwRock(c, o, t, v, p) {
      const f = noiseHit(c, o, t, 'bandpass', 500, 1.5, 0.05, 0.45 * v, 0.3);
      sweep(f.frequency, t, 500, 1400 * p, 0.3);
    },
    rockHit(c, o, t, v, p) {
      noiseHit(c, o, t, 'lowpass', 900 * p, 1, 0.003, 0.65 * v, 0.28);
      tone(c, o, t, 'sine', 125 * p, 40, 0.003, 0.65 * v, 0.3);
      noiseHit(c, o, t, 'bandpass', 2500, 1.5, 0.001, 0.25 * v, 0.05);
    },
    death(c, o, t, v, p) {
      const s = osc(c, 'sawtooth', 230 * p, t, t + 1);
      sweep(s.frequency, t, 230 * p, 70 * p, 0.8);
      const g = gain(c, 0);
      perc(g, t, 0.03, 0.25 * v, 0.8);
      chain(s, filter(c, 'lowpass', 900), g, o);
      noiseHit(c, o, t, 'lowpass', 500, 1, 0.01, 0.2 * v, 0.4);
    },
    crit(c, o, t, v, p) {
      SFX.heavy(c, o, t, 1.1 * v, p * 0.8);
      SFX.slash(c, o, t + 0.02, 0.8 * v, p * 0.9);
    },
    heal(c, o, t, v, p) {
      [84, 88, 91, 96].forEach((m, i) => tone(c, o, t + i * 0.07, 'sine', mtof(m) * p, mtof(m) * p, 0.005, 0.11 * v, 0.5));
    },
    stun(c, o, t, v, p) {
      const s = osc(c, 'sine', 900 * p, t, t + 0.75);
      sweep(s.frequency, t, 900 * p, 260 * p, 0.65);
      const lfo = osc(c, 'sine', 12, t, t + 0.75);
      const ld = gain(c, 70);
      chain(lfo, ld, s.frequency);
      const g = gain(c, 0);
      perc(g, t, 0.02, 0.22 * v, 0.65);
      chain(s, g, o);
    },
    bind(c, o, t, v, p) {
      const s = osc(c, 'sawtooth', 75 * p, t, t + 0.7);
      const lfo = osc(c, 'sine', 9, t, t + 0.7);
      const ld = gain(c, 25);
      chain(lfo, ld, s.frequency);
      const g = gain(c, 0);
      perc(g, t, 0.05, 0.22 * v, 0.55);
      chain(s, filter(c, 'bandpass', 320, 2), g, o);
    },
    stare(c, o, t, v, p) {
      tone(c, o, t, 'sine', 440 * p, 440 * p, 0.05, 0.1 * v, 0.6);
      tone(c, o, t, 'sine', 466 * p, 440 * p, 0.05, 0.1 * v, 0.6);
      noiseHit(c, o, t, 'bandpass', 900, 3, 0.05, 0.08 * v, 0.5);
    },
    teleport(c, o, t, v, p) {
      const s = osc(c, 'sine', 300 * p, t, t + 0.5);
      sweep(s.frequency, t, 300 * p, 1900 * p, 0.38);
      const trem = osc(c, 'square', 22, t, t + 0.5);
      const g = gain(c, 0);
      perc(g, t, 0.03, 0.22 * v, 0.4);
      const tg = gain(c, 0.5);
      chain(trem, gain(c, 0.5), tg.gain);
      chain(s, tg, g, o);
    },
    rebirth(c, o, t, v, p) {
      SFX.fireLaunch(c, o, t, v, p);
      for (const m of [62, 66, 69, 74]) INSTR.horn(c, o, t + 0.15, m, 0.9, 0.8 * v);
    },
    defend(c, o, t, v, p) {
      for (const f of [620, 1380]) tone(c, o, t, 'sine', f * p, f * p, 0.001, 0.18 * v, 0.22);
      noiseHit(c, o, t, 'bandpass', 2000, 1.5, 0.001, 0.35 * v, 0.05);
    },
    flap(c, o, t, v, p) {
      for (const dt of [0, 0.18]) noiseHit(c, o, t + dt, 'bandpass', 480 * p, 1.2, 0.05, 0.4 * v, 0.14);
    },
    step(c, o, t, v, p) {
      noiseHit(c, o, t, 'lowpass', 320 * p, 1, 0.003, 0.22 * v, 0.06);
    },
    click(c, o, t, v, p) {
      tone(c, o, t, 'sine', 1150 * p, 900 * p, 0.001, 0.07 * v, 0.05);
    },
    victory(c, o, t, v) {
      [[62, 0, 0.2], [66, 0.2, 0.2], [69, 0.4, 0.2], [74, 0.6, 1.1]].forEach(([m, dt, d]) => {
        INSTR.horn(c, o, t + dt, m, d, 1.8 * v);
        INSTR.horn(c, o, t + dt, m - 12, d, 1.0 * v);
      });
      INSTR.drum(c, o, t, v);
      INSTR.drum(c, o, t + 0.6, v);
      for (const m of [62, 66, 69]) INSTR.pad(c, o, t + 0.6, [m], 1.4, 2 * v);
    },
    defeat(c, o, t, v) {
      [[69, 0, 0.4], [65, 0.45, 0.4], [62, 0.9, 0.4], [57, 1.35, 1.3]].forEach(([m, dt, d]) => {
        INSTR.horn(c, o, t + dt, m, d, 1.5 * v);
      });
      INSTR.drum(c, o, t + 1.35, 0.9 * v);
    },
  };

  const BEASTS = new Set([
    'griffin', 'unicorn', 'dendroid', 'golem', 'cerberus', 'harpy', 'behemoth', 'gorgon', 'hydra',
    'wight', 'dragon', 'blackdragon', 'bonedragon', 'phoenix', 'beholder', 'wolfrider',
  ]);

  function meleeSound(def) {
    if (!BEASTS.has(def.id)) return 'slash';
    return def.tier >= 6 ? 'heavy' : 'claw';
  }

  const PROJECTILE_SOUNDS = {
    arrow: ['bow', 'arrowHit'],
    fireball: ['fireLaunch', 'explosion'],
    bolt: ['zap', 'zapHit'],
    lightning: ['zap', 'thunder'],
    ray: ['zap', 'stare'],
    cloud: ['cloud', 'cloud'],
    rock: ['throwRock', 'rockHit'],
  };

  function projectileSounds(kind) {
    return PROJECTILE_SOUNDS[kind] || PROJECTILE_SOUNDS.arrow;
  }

  // ------------------------------------------------------------ live engine

  let ctx = null;
  let musicBus = null;
  let sfxBus = null;
  let song = null; // { gain, timer, nextBar, index }
  const lastPlayed = {};

  function buildGraph(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(c.destination);
    const reverb = c.createConvolver();
    reverb.buffer = impulse(c, 2.2, 2.5);
    const wet = gain(c, 0.28);
    chain(reverb, wet, comp);
    const music = gain(c, 0.26);
    music.connect(comp);
    music.connect(reverb);
    const sfx = gain(c, 1.5);
    sfx.connect(comp);
    const sfxSend = gain(c, 0.25);
    chain(sfx, sfxSend, reverb);
    return { music, sfx };
  }

  function ensureContext() {
    if (ctx || !AC) return ctx;
    try {
      if (root.navigator && root.navigator.audioSession) root.navigator.audioSession.type = 'playback';
    } catch (e) {
      // not supported
    }
    ctx = new AC({ latencyHint: 'interactive' });
    const g = buildGraph(ctx);
    musicBus = g.music;
    sfxBus = g.sfx;
    if (root.document) {
      root.document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (root.document.hidden) ctx.suspend();
        else ctx.resume().then(() => {
          if (song) song.nextBar = Math.max(song.nextBar, ctx.currentTime + 0.1);
        });
      });
    }
    return ctx;
  }

  // Must be called from a user gesture (tap/click/key) to satisfy autoplay rules.
  function unlock() {
    if (!ensureContext()) return;
    if (ctx.state !== 'running') ctx.resume();
    // iOS: play a silent buffer within the gesture
    const b = ctx.createBufferSource();
    b.buffer = ctx.createBuffer(1, 1, 22050);
    b.connect(ctx.destination);
    b.start(0);
    if (prefs.music) startMusic();
  }

  function tick() {
    if (!song || !ctx) return;
    while (song.nextBar < ctx.currentTime + 1.2) {
      scheduleBar(ctx, song.gain, song.index++, song.nextBar);
      song.nextBar += BAR;
    }
  }

  function startMusic() {
    if (!ctx || song) return;
    const g = gain(ctx, 0.0001);
    g.connect(musicBus);
    g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.5);
    song = { gain: g, index: 0, nextBar: ctx.currentTime + 0.15, timer: setInterval(tick, 200) };
    tick();
  }

  function stopMusic() {
    if (!song) return;
    const s = song;
    song = null;
    clearInterval(s.timer);
    const now = ctx.currentTime;
    s.gain.gain.cancelScheduledValues(now);
    s.gain.gain.setValueAtTime(s.gain.gain.value, now);
    s.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => s.gain.disconnect(), 2500);
  }

  function play(name, opts = {}) {
    if (!prefs.sfx || !ctx || ctx.state !== 'running' || !SFX[name]) return false;
    const now = ctx.currentTime;
    if (lastPlayed[name] != null && now - lastPlayed[name] < 0.04) return false;
    lastPlayed[name] = now;
    const pitch = opts.pitch != null ? opts.pitch : rand(0.94, 1.06);
    SFX[name](ctx, sfxBus, now + 0.01 + (opts.delay || 0), opts.volume != null ? opts.volume : 1, pitch);
    return true;
  }

  function setMusic(on) {
    prefs.music = !!on;
    savePrefs();
    if (on) {
      ensureContext();
      if (ctx && ctx.state !== 'running') ctx.resume();
      startMusic();
    } else stopMusic();
  }

  function setSfx(on) {
    prefs.sfx = !!on;
    savePrefs();
  }

  // Renders music or one effect offline (for tests). Returns a Promise<AudioBuffer>.
  function renderOffline(seconds, name) {
    const OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    const c = new OAC(2, Math.ceil(44100 * seconds), 44100);
    const g = buildGraph(c);
    if (name) SFX[name](c, g.sfx, 0.01, 1, 1);
    else for (let i = 0, t = 0.01; t < seconds; i++, t += BAR) scheduleBar(c, g.music, i, t);
    return c.startRendering();
  }

  BH.Audio = {
    unlock, play, setMusic, setSfx, meleeSound, projectileSounds, renderOffline,
    SFX_NAMES: Object.keys(SFX),
    LOOP_SECONDS: SONG.length * BAR,
    get available() { return !!AC; },
    get musicOn() { return prefs.music; },
    get sfxOn() { return prefs.sfx; },
    get state() { return ctx ? ctx.state : 'none'; },
    get playing() { return !!song; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
