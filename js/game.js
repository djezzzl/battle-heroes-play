// Game controller: setup screen, battle flow, input and HUD.
(function () {
  const BH = window.BH;
  const { Hex, Units, Battle: B, AI, Sprites, Renderer, Audio, Army } = BH;
  const sfx = (name, opts) => Audio && Audio.play(name, opts);

  const $ = (sel) => document.querySelector(sel);
  const MAX_STACKS = Army.MAX_STACKS;
  const SETUP_KEY = 'bh.setup';
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  const state = {
    army: [],
    budget: Army.DEFAULT_BUDGET,
    faction: 'all',
    enemyMode: 'mirror',
    armies: null,
    battle: null,
    renderer: null,
    busy: false,
    auto: false,
    opts: null,
    pending: null,
    logShown: 0,
    longPress: null,
  };

  // ------------------------------------------------------------ helpers

  const portraitCache = new Map();
  function portraitCanvas(type, side, px = 96) {
    const k = `${type}|${side}|${px}`;
    if (!portraitCache.has(k)) {
      const c = document.createElement('canvas');
      c.width = px;
      c.height = px;
      Sprites.portrait(c, type, side);
      portraitCache.set(k, c);
    }
    const out = document.createElement('canvas');
    out.width = px;
    out.height = px;
    out.getContext('2d').drawImage(portraitCache.get(k), 0, 0);
    return out;
  }

  function badge(def) {
    return `<span class="badge ${def.attackType}">${Units.TYPE_LABEL[def.attackType]}</span>`;
  }

  function statsHtml(def, unit) {
    const rows = [
      ['Attack', def.attack],
      ['Defense', def.defense + (unit && unit.defending ? ' (+30%)' : '')],
      ['Damage', `${def.minDmg}–${def.maxDmg}`],
      ['Health', unit ? `${unit.topHp}/${def.hp}` : def.hp],
      ['Speed', def.speed + (def.flying ? ' ✈' : '')],
      ['Initiative', def.initiative],
    ];
    if (def.shots) rows.push(['Shots', unit ? `${unit.shots}/${def.shots}` : def.shots]);
    rows.push(unit ? ['Count', unit.count] : ['Cost', `💰 ${fmt(def.cost)}`]);
    return `<div class="stats">${rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('')}</div>`;
  }

  function svgCursor(svg, x, y, fallback) {
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`;
  }

  const CURSORS = {
    melee: svgCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g stroke="#000" stroke-width="1.5">' +
        '<path d="M3 3 L19 19 L22 16 L6 1 Z" fill="#e8eef4"/><path d="M15 22 L22 15 L25 18 L18 25 Z" fill="#d7b04a"/>' +
        '<path d="M21 21 L29 29" stroke="#5a3418" stroke-width="4"/></g></svg>', 3, 3, 'crosshair'),
    shoot: svgCursor(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g stroke="#000" stroke-width="1.2">' +
        '<path d="M2 2 L12 5 L5 12 Z" fill="#ddd"/><path d="M7 7 L27 27" stroke="#5a3418" stroke-width="3"/>' +
        '<path d="M24 22 L30 24 L28 30 L22 28 Z" fill="#c33"/></g></svg>', 2, 2, 'crosshair'),
    move: 'pointer',
    none: 'not-allowed',
    info: 'help',
  };

  // ------------------------------------------------------------ setup screen

  function factionName(id) {
    return Units.FACTIONS.find((f) => f.id === id).name;
  }

  function perksHtml(def, withDesc) {
    const list = Units.perkList(def);
    if (!list.length) return '';
    if (withDesc) {
      return `<ul class="perks">${list.map((p) => `<li><b>${p.label}</b> — ${p.desc}</li>`).join('')}</ul>`;
    }
    return `<div class="perk-chips">${list.map((p) => `<span class="perk" title="${p.desc}">${p.label}</span>`).join('')}</div>`;
  }

  function loadSetup() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETUP_KEY) || 'null');
      if (!saved) return false;
      if (saved.budget > 0) state.budget = Math.round(saved.budget);
      if (saved.enemyMode === 'random' || saved.enemyMode === 'mirror') state.enemyMode = saved.enemyMode;
      state.army = (saved.army || [])
        .filter((s) => Units.BY_ID[s.type] && s.count > 0)
        .slice(0, MAX_STACKS)
        .map((s) => ({ type: s.type, count: Math.floor(s.count) }));
      fitArmyToBudget();
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveSetup() {
    try {
      localStorage.setItem(SETUP_KEY, JSON.stringify({ budget: state.budget, army: state.army, enemyMode: state.enemyMode }));
    } catch (e) {
      // storage unavailable: nothing to persist
    }
  }

  // Shrinks the army proportionally when the budget is lowered below its cost.
  function fitArmyToBudget() {
    const total = Army.totalCost(state.army);
    if (total <= state.budget) return;
    const f = state.budget / total;
    for (const s of state.army) s.count = Math.floor(s.count * f);
    state.army = state.army.filter((s) => s.count > 0);
    while (Army.totalCost(state.army) > state.budget && state.army.length) {
      const s = state.army.reduce((a, b) => (Army.costOf(a.type) >= Army.costOf(b.type) ? a : b));
      s.count -= 1;
      state.army = state.army.filter((x) => x.count > 0);
    }
  }

  function buildSetup() {
    const tabs = $('#faction-tabs');
    tabs.innerHTML = '';
    for (const f of [{ id: 'all', name: 'All' }, ...Units.FACTIONS]) {
      const b = document.createElement('button');
      b.className = 'tab' + (f.id === state.faction ? ' active' : '');
      b.dataset.faction = f.id;
      b.textContent = f.name;
      b.addEventListener('click', () => {
        state.faction = f.id;
        refreshSetup();
      });
      tabs.appendChild(b);
    }
    const grid = $('#unit-grid');
    grid.innerHTML = '';
    for (const def of Units.UNITS) {
      const card = document.createElement('div');
      card.className = 'unit-card';
      card.dataset.id = def.id;
      card.dataset.faction = def.faction;
      const pc = document.createElement('canvas');
      pc.className = 'portrait';
      pc.width = 240;
      pc.height = 150;
      Sprites.portrait(pc, def.id, 'player');
      card.appendChild(pc);
      const price = document.createElement('div');
      price.className = 'price-tag';
      price.textContent = `💰 ${fmt(def.cost)}`;
      card.appendChild(price);
      const body = document.createElement('div');
      body.innerHTML = `<h3>${def.name}${badge(def)}</h3>
        <div class="faction-tag">${factionName(def.faction)} · Tier ${def.tier}</div>
        <div class="desc">${def.description}</div>${statsHtml(def)}${perksHtml(def, true)}
        <div class="afford"></div>`;
      card.appendChild(body);
      card.addEventListener('click', () => toggleUnit(def.id));
      grid.appendChild(card);
    }

    const presets = $('#budget-presets');
    for (const b of Army.BUDGET_PRESETS) {
      const btn = document.createElement('button');
      btn.className = 'toggle preset';
      btn.dataset.budget = b;
      btn.textContent = b >= 1000 ? `${b / 1000}k` : String(b);
      btn.addEventListener('click', () => setBudget(b));
      presets.appendChild(btn);
    }
    $('#budget-input').addEventListener('change', (e) => setBudget(+e.target.value));

    document.querySelectorAll('[data-enemy]').forEach((b) =>
      b.addEventListener('click', () => {
        state.enemyMode = b.dataset.enemy;
        saveSetup();
        refreshSetup();
      })
    );
    $('#btn-random-army').addEventListener('click', () => {
      const pool = Units.UNITS.filter((u) => state.faction === 'all' || u.faction === state.faction).map((u) => u.id);
      state.army = Army.randomArmy(state.budget, Math.random, { pool });
      changed(true);
    });
    $('#btn-clear-army').addEventListener('click', () => {
      state.army = [];
      changed(true);
    });
    $('#btn-start').addEventListener('click', () => {
      if (Army.isValid(state.army, state.budget)) startBattle(makeArmies());
    });

    if (!loadSetup()) state.army = Army.randomArmy(state.budget, Math.random, { pool: ['pikeman', 'archer', 'griffin', 'swordsman', 'monk', 'cavalier'] });
    changed(true);
  }

  function setBudget(b) {
    if (!Number.isFinite(b) || b <= 0) b = Army.DEFAULT_BUDGET;
    state.budget = Math.min(10000000, Math.max(100, Math.round(b)));
    fitArmyToBudget();
    changed(true);
  }

  function toggleUnit(id) {
    const i = state.army.findIndex((s) => s.type === id);
    if (i >= 0) state.army.splice(i, 1);
    else if (state.army.length < MAX_STACKS && Army.maxAffordable(id, state.budget, state.army) > 0) {
      state.army.push({ type: id, count: Army.defaultCount(id, state.budget, state.army) });
    } else return;
    changed(true);
  }

  // Re-renders after an army change. rebuild=false keeps existing rows (used while dragging a slider).
  function changed(rebuild) {
    saveSetup();
    if (rebuild) buildArmyList();
    refreshSetup();
  }

  function setCount(type, n) {
    const s = state.army.find((x) => x.type === type);
    if (!s) return;
    const max = Army.maxAffordable(type, state.budget, state.army);
    s.count = Math.max(1, Math.min(max, Math.floor(n) || 1));
  }

  function buildArmyList() {
    const list = $('#army-list');
    list.innerHTML = '';
    if (!state.army.length) {
      list.innerHTML = '<div class="army-empty">Tap creatures on the left to hire them.</div>';
      return;
    }
    for (const s of state.army) {
      const def = Units.BY_ID[s.type];
      const row = document.createElement('div');
      row.className = 'army-row';
      row.dataset.type = s.type;
      const pc = portraitCanvas(def.id, 'player', 96);
      pc.className = 'row-portrait';
      row.appendChild(pc);
      const main = document.createElement('div');
      main.className = 'row-main';
      main.innerHTML = `
        <div class="row-head"><b>${def.name}</b><span class="row-each">💰 ${fmt(def.cost)} each</span>
          <button class="row-remove" title="Remove">✕</button></div>
        <div class="row-controls">
          <button class="toggle step" data-d="-1">−</button>
          <input class="count" type="number" min="1" inputmode="numeric">
          <button class="toggle step" data-d="1">+</button>
          <button class="toggle max">Max</button>
          <span class="subtotal"></span>
        </div>
        <input class="slider" type="range" min="1">`;
      row.appendChild(main);
      main.querySelector('.row-remove').addEventListener('click', () => toggleUnit(s.type));
      main.querySelectorAll('.step').forEach((b) =>
        b.addEventListener('click', () => {
          setCount(s.type, s.count + +b.dataset.d);
          changed(false);
        })
      );
      main.querySelector('.max').addEventListener('click', () => {
        setCount(s.type, Army.maxAffordable(s.type, state.budget, state.army));
        changed(false);
      });
      main.querySelector('.count').addEventListener('change', (e) => {
        setCount(s.type, +e.target.value);
        changed(false);
      });
      main.querySelector('.slider').addEventListener('input', (e) => {
        setCount(s.type, +e.target.value);
        changed(false);
      });
      list.appendChild(row);
    }
  }

  function refreshSetup() {
    const spent = Army.totalCost(state.army);
    const left = state.budget - spent;
    document.querySelectorAll('#faction-tabs .tab').forEach((t) => t.classList.toggle('active', t.dataset.faction === state.faction));
    document.querySelectorAll('#budget-presets .preset').forEach((b) => b.classList.toggle('active', +b.dataset.budget === state.budget));
    if (document.activeElement !== $('#budget-input')) $('#budget-input').value = state.budget;
    document.querySelectorAll('[data-enemy]').forEach((x) => x.classList.toggle('active', x.dataset.enemy === state.enemyMode));

    const inArmy = new Set(state.army.map((s) => s.type));
    document.querySelectorAll('.unit-card').forEach((c) => {
      const id = c.dataset.id;
      const max = Army.maxAffordable(id, state.budget, state.army);
      const selected = inArmy.has(id);
      c.classList.toggle('selected', selected);
      c.classList.toggle('full', !selected && state.army.length >= MAX_STACKS);
      c.classList.toggle('unaffordable', !selected && max < 1);
      c.classList.toggle('hidden', state.faction !== 'all' && c.dataset.faction !== state.faction);
      c.querySelector('.afford').textContent = selected
        ? `In army: ${state.army.find((s) => s.type === id).count}`
        : max < 1 ? 'Not enough gold' : `You can afford ${fmt(max)}`;
    });

    for (const row of document.querySelectorAll('.army-row')) {
      const s = state.army.find((x) => x.type === row.dataset.type);
      if (!s) continue;
      const max = Army.maxAffordable(s.type, state.budget, state.army);
      const input = row.querySelector('.count');
      if (document.activeElement !== input) input.value = s.count;
      input.max = max;
      const slider = row.querySelector('.slider');
      slider.max = Math.max(1, max);
      if (document.activeElement !== slider) slider.value = s.count;
      row.querySelector('.subtotal').textContent = `= 💰 ${fmt(s.count * Army.costOf(s.type))}`;
    }

    $('#gold-fill').style.width = `${Math.min(100, (spent / state.budget) * 100)}%`;
    $('#gold-text').innerHTML = `Spent <b>${fmt(spent)}</b> of ${fmt(state.budget)} · <b>${fmt(left)}</b> left · ${state.army.length}/${MAX_STACKS} stacks`;
    $('#btn-start').disabled = !Army.isValid(state.army, state.budget);
  }

  function makeArmies() {
    const player = state.army.map((s) => ({ type: s.type, count: s.count }));
    const ai = state.enemyMode === 'random' ? Army.randomArmy(state.budget) : player.map((s) => ({ ...s }));
    return { player, ai, budget: state.budget };
  }

  // ------------------------------------------------------------ battle flow

  function startBattle(armies) {
    state.armies = armies;
    $('#setup').classList.add('hidden');
    $('#battle').classList.remove('hidden');
    hideModal();
    if (!state.renderer) {
      state.renderer = new Renderer($('#field'));
      bindFieldInput();
    }
    state.renderer.resize();
    const battle = B.create({ playerArmy: armies.player, aiArmy: armies.ai });
    state.battle = battle;
    state.busy = false;
    state.pending = null;
    state.logShown = 0;
    state.auto = false;
    $('#btn-auto').classList.remove('on');
    $('#log').innerHTML = '';
    state.renderer.setBattle(battle);
    nextTurn();
  }

  function speed() {
    return state.auto ? 1.6 : 1;
  }

  async function nextTurn() {
    const battle = state.battle;
    renderQueue();
    renderLog();
    if (battle.winner) {
      setControls(false);
      state.renderer.setHighlight({});
      setTimeout(showResult, 600);
      return;
    }
    const u = B.current(battle);
    showInfo(u);
    if (u.side === 'ai' || state.auto) {
      setControls(false);
      state.renderer.setHighlight({ activeId: u.id });
      await state.renderer.wait(u.side === 'ai' ? 420 : 200);
      if (state.battle !== battle || state.busy) return;
      if (u.side === 'player' && !state.auto) return preparePlayerTurn(u);
      await execute(AI.chooseAction(battle, u));
    } else {
      preparePlayerTurn(u);
    }
  }

  async function execute(action) {
    const battle = state.battle;
    if (state.busy || battle.winner) return;
    state.busy = true;
    state.pending = null;
    setControls(false);
    const actor = B.current(battle);
    state.renderer.setHighlight({ activeId: actor.id });
    $('#field').style.cursor = 'wait';
    let result;
    try {
      result = B.perform(battle, action);
    } catch (e) {
      console.warn(e);
      state.busy = false;
      return nextTurn();
    }
    renderLog();
    await state.renderer.playEvents(result.events, speed());
    state.busy = false;
    $('#field').style.cursor = 'default';
    if (state.battle !== battle) return;
    nextTurn();
  }

  function preparePlayerTurn(u) {
    const battle = state.battle;
    const reach = B.reachable(battle, u);
    const melee = new Map(B.meleeTargets(battle, u, reach).map((m) => [m.target.id, m.froms]));
    const shoot = B.canShoot(battle, u);
    state.opts = { unit: u, reach, melee, shoot };
    const targets = shoot ? B.enemiesOf(battle, u).map((e) => e.id) : [...melee.keys()];
    state.baseHighlight = { reach: new Set(reach.keys()), activeId: u.id, targets };
    state.renderer.setHighlight(state.baseHighlight);
    setControls(true);
    $('#btn-wait').disabled = !!u.waited;
  }

  function isPlayerTurn() {
    const b = state.battle;
    if (!b || b.winner || state.busy || state.auto) return false;
    const u = B.current(b);
    return !!u && u.side === 'player' && state.opts && state.opts.unit === u;
  }

  // Picks which adjacent hex to attack from, based on where in the target hex the pointer is.
  function chooseFrom(froms, target, px, py) {
    if (froms.length === 1) return froms[0];
    const u = state.opts.unit;
    const c = state.renderer.hexCenter(target.col, target.row);
    const dx = px - c.x;
    const dy = py - c.y;
    if (Math.hypot(dx, dy) < state.renderer.size * 0.2) {
      const here = froms.find((f) => f.col === u.col && f.row === u.row);
      if (here) return here;
      return froms.slice().sort((a, b) => pathLen(a) - pathLen(b))[0];
    }
    const ang = Math.atan2(dy, dx);
    let best = null;
    for (const f of froms) {
      const fc = state.renderer.hexCenter(f.col, f.row);
      let diff = Math.abs(Math.atan2(fc.y - c.y, fc.x - c.x) - ang);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (!best || diff < best.diff) best = { f, diff };
    }
    return best.f;
  }

  function pathLen(h) {
    const u = state.opts.unit;
    if (h.col === u.col && h.row === u.row) return 0;
    const p = state.opts.reach.get(Hex.key(h.col, h.row));
    return p ? p.length : 99;
  }

  function resolve(pick) {
    const { hex, x, y } = pick;
    if (!hex) return null;
    const battle = state.battle;
    const o = state.opts;
    const unit = B.unitAt(battle, hex.col, hex.row);
    if (unit && unit.side !== o.unit.side) {
      if (o.shoot) {
        const res = { kind: 'shoot', hex, action: { type: 'shoot', targetId: unit.id } };
        if (o.unit.def.attackType === 'splash') res.splash = Hex.neighbors(hex.col, hex.row);
        return res;
      }
      const froms = o.melee.get(unit.id);
      if (froms) {
        const from = chooseFrom(froms, unit, x, y);
        const stay = from.col === o.unit.col && from.row === o.unit.row;
        const res = {
          kind: 'melee', hex, from,
          path: stay ? [] : o.reach.get(Hex.key(from.col, from.row)),
          action: { type: 'melee', targetId: unit.id, from: { col: from.col, row: from.row } },
        };
        if (o.unit.def.attackType === 'splash') res.splash = Hex.neighbors(hex.col, hex.row);
        return res;
      }
      return { kind: 'none', hex, unit };
    }
    if (unit) return { kind: 'info', hex, unit };
    const path = o.reach.get(Hex.key(hex.col, hex.row));
    if (path) return { kind: 'move', hex, path, action: { type: 'move', to: hex } };
    return { kind: 'none', hex };
  }

  function sameAction(a, b) {
    return a && b && a.kind === b.kind && JSON.stringify(a.action) === JSON.stringify(b.action);
  }

  function previewHover(res) {
    const hover = res ? { hex: res.hex, kind: res.kind, path: res.path, from: res.from, splash: res.splash } : null;
    state.renderer.setHighlight({ ...state.baseHighlight, hover });
  }

  // ------------------------------------------------------------ input

  function bindFieldInput() {
    const canvas = $('#field');
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const pick = state.renderer.pick(e.clientX, e.clientY);
      const hovered = pick.hex && state.battle && B.unitAt(state.battle, pick.hex.col, pick.hex.row);
      if (hovered) showInfo(hovered);
      else if (state.battle && B.current(state.battle)) showInfo(B.current(state.battle));
      if (!isPlayerTurn()) return;
      const res = resolve(pick);
      previewHover(res);
      canvas.style.cursor = res ? CURSORS[res.kind] : 'default';
    });

    canvas.addEventListener('pointerleave', () => {
      if (isPlayerTurn()) previewHover(null);
    });

    canvas.addEventListener('pointerdown', (e) => {
      const pick = state.renderer.pick(e.clientX, e.clientY);
      const unit = pick.hex && state.battle && B.unitAt(state.battle, pick.hex.col, pick.hex.row);
      clearTimeout(state.longPress && state.longPress.timer);
      state.longPress = { fired: false, timer: null };
      if (!unit) return;
      if (e.button === 2) {
        state.longPress.fired = true;
        showUnitCard(unit, e.clientX, e.clientY);
        return;
      }
      if (e.pointerType !== 'mouse') {
        state.longPress.timer = setTimeout(() => {
          state.longPress.fired = true;
          showUnitCard(unit, e.clientX, e.clientY);
        }, 450);
      }
    });

    const endPress = () => {
      if (state.longPress) clearTimeout(state.longPress.timer);
      hideUnitCard();
    };
    canvas.addEventListener('pointercancel', endPress);

    canvas.addEventListener('pointerup', (e) => {
      const lp = state.longPress;
      endPress();
      if (lp && lp.fired) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const pick = state.renderer.pick(e.clientX, e.clientY);
      if (pick.hex && state.battle) {
        const u = B.unitAt(state.battle, pick.hex.col, pick.hex.row);
        if (u) showInfo(u);
      }
      if (!isPlayerTurn()) return;
      const res = resolve(pick);
      if (!res || !res.action) {
        state.pending = null;
        previewHover(res);
        return;
      }
      // Touch: first tap previews, second tap on the same action confirms.
      if (e.pointerType !== 'mouse' && !sameAction(res, state.pending)) {
        state.pending = res;
        previewHover(res);
        return;
      }
      execute(res.action);
    });

    window.addEventListener('resize', () => {
      if (!$('#battle').classList.contains('hidden')) state.renderer.resize();
    });

    window.addEventListener('keydown', (e) => {
      if ($('#battle').classList.contains('hidden') || !$('#modal').classList.contains('hidden')) return;
      const k = e.key.toLowerCase();
      if (k === 'w') $('#btn-wait').click();
      else if (k === 'd') $('#btn-defend').click();
      else if (k === 'a') $('#btn-auto').click();
      else if (k === 'escape') $('#btn-retreat').click();
    });
  }

  function bindButtons() {
    $('#btn-wait').addEventListener('click', () => {
      if (isPlayerTurn() && !state.opts.unit.waited) execute({ type: 'wait' });
    });
    $('#btn-defend').addEventListener('click', () => {
      if (isPlayerTurn()) execute({ type: 'defend' });
    });
    $('#btn-auto').addEventListener('click', () => {
      state.auto = !state.auto;
      $('#btn-auto').classList.toggle('on', state.auto);
      const b = state.battle;
      if (!b || b.winner || state.busy) return;
      const u = B.current(b);
      if (u && u.side === 'player') {
        if (state.auto) nextTurn();
        else preparePlayerTurn(u);
      }
    });
    $('#btn-retreat').addEventListener('click', () => {
      showModal(`<h2>Retreat?</h2><p>Your army will flee the battlefield.</p>
        <div class="modal-buttons"><button class="btn-gold" id="m-yes">Retreat</button>
        <button class="btn-gold" id="m-no">Keep fighting</button></div>`);
      $('#m-yes').onclick = () => goToSetup();
      $('#m-no').onclick = hideModal;
    });
  }

  function setControls(on) {
    for (const id of ['#btn-wait', '#btn-defend']) $(id).disabled = !on;
  }

  // ------------------------------------------------------------ HUD

  function renderQueue() {
    const q = $('#queue');
    q.innerHTML = '';
    const battle = state.battle;
    let lastRound = battle.round;
    B.upcomingOrder(battle, 18).forEach((item, i) => {
      const u = B.getUnit(battle, item.id);
      if (item.round !== lastRound) {
        const sep = document.createElement('div');
        sep.className = 'q-sep';
        sep.title = `Round ${item.round}`;
        q.appendChild(sep);
        lastRound = item.round;
      }
      const el = document.createElement('div');
      el.className = `q-item ${u.side}${i === 0 && !battle.winner ? ' active' : ''}${item.round > battle.round ? ' next-round' : ''}`;
      el.title = `${u.def.name} (${u.count})`;
      el.appendChild(portraitCanvas(u.type, u.side, 96));
      const n = document.createElement('span');
      n.className = 'n';
      n.textContent = u.count;
      el.appendChild(n);
      el.addEventListener('mouseenter', () => showInfo(u));
      q.appendChild(el);
    });
  }

  function renderLog() {
    const log = $('#log');
    const entries = state.battle.log;
    for (; state.logShown < entries.length; state.logShown++) {
      const div = document.createElement('div');
      div.className = entries[state.logShown].kind;
      div.textContent = entries[state.logShown].text;
      log.appendChild(div);
    }
    log.scrollTop = log.scrollHeight;
  }

  function statusHtml(u) {
    const st = [];
    if (u.stunned) st.push(`💫 ${u.stunned}: skips next turn`);
    if (state.battle && B.isBound(state.battle, u)) st.push('🌿 Bound: cannot move');
    if (u.reborn) st.push('🔥 Already reborn');
    return st.length ? `<div class="status">${st.join('<br>')}</div>` : '';
  }

  function showInfo(u) {
    if (!u) return;
    const side = u.side === 'player' ? 'Your' : 'Enemy';
    $('#info').innerHTML = `<h4>${side} ${u.def.name}${badge(u.def)}</h4>${statsHtml(u.def, u)}${statusHtml(u)}${perksHtml(u.def, false)}`;
  }

  function showUnitCard(u, x, y) {
    const card = $('#unit-card');
    card.innerHTML = `<h3>${u.side === 'player' ? 'Your' : 'Enemy'} ${u.def.name}${badge(u.def)}</h3>`;
    const pc = document.createElement('canvas');
    pc.width = 240;
    pc.height = 180;
    Sprites.portrait(pc, u.type, u.side);
    card.appendChild(pc);
    const body = document.createElement('div');
    body.innerHTML = `<div class="desc">${u.def.description}</div>${statsHtml(u.def, u)}${statusHtml(u)}${perksHtml(u.def, true)}`;
    card.appendChild(body);
    card.classList.remove('hidden');
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    card.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, x + 16))}px`;
    card.style.top = `${Math.max(8, Math.min(window.innerHeight - h - 8, y - h / 2))}px`;
  }

  function hideUnitCard() {
    $('#unit-card').classList.add('hidden');
  }

  function showModal(html) {
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }

  function hideModal() {
    $('#modal').classList.add('hidden');
  }

  function casualtiesHtml(side) {
    const rows = state.battle.units
      .filter((u) => u.side === side)
      .map((u) => {
        const c = portraitCanvas(u.type, u.side, 68);
        return `<div class="cas-row">${c.outerHTML.replace('<canvas', `<canvas data-type="${u.type}" data-side="${u.side}"`)}
          <span>${u.def.name}: lost <b>${u.initialCount - u.count}</b> of ${u.initialCount}</span></div>`;
      })
      .join('');
    return `<div><h3>${side === 'player' ? 'Your losses' : 'Enemy losses'}</h3>${rows}</div>`;
  }

  function showResult() {
    const win = state.battle.winner === 'player';
    sfx(win ? 'victory' : 'defeat');
    showModal(`<h2>${win ? 'Victory!' : 'Defeat'}</h2>
      <p>${win ? 'The enemy army has been destroyed.' : 'Your army has fallen.'} Battle lasted ${state.battle.round} rounds.</p>
      <p class="gold-compare">Your army: 💰 ${fmt(Army.totalCost(state.armies.player))} · Enemy army: 💰 ${fmt(Army.totalCost(state.armies.ai))}</p>
      <div class="casualties">${casualtiesHtml('player')}${casualtiesHtml('ai')}</div>
      <div class="modal-buttons"><button class="btn-gold" id="m-again">Fight again</button>
      <button class="btn-gold" id="m-setup">Change army</button></div>`);
    // canvases serialized via outerHTML lose their pixels; repaint them
    document.querySelectorAll('#modal-body canvas[data-type]').forEach((c) => Sprites.portrait(c, c.dataset.type, c.dataset.side));
    $('#m-again').onclick = () => {
      const { player, ai, budget } = state.armies;
      startBattle({ player, ai: state.enemyMode === 'random' ? Army.randomArmy(budget) : ai, budget });
    };
    $('#m-setup').onclick = goToSetup;
  }

  function goToSetup() {
    hideModal();
    state.battle = null;
    state.busy = false;
    $('#battle').classList.add('hidden');
    $('#setup').classList.remove('hidden');
  }

  function refreshAudioToggles() {
    document.querySelectorAll('.audio-music').forEach((b) => b.classList.toggle('off', !Audio.musicOn));
    document.querySelectorAll('.audio-sfx').forEach((b) => b.classList.toggle('off', !Audio.sfxOn));
  }

  function bindAudio() {
    if (!Audio || !Audio.available) {
      document.querySelectorAll('.audio-toggles').forEach((el) => el.classList.add('hidden'));
      return;
    }
    const unlock = () => Audio.unlock();
    for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, unlock, { capture: true });
    const toggleMusic = () => {
      Audio.setMusic(!Audio.musicOn);
      refreshAudioToggles();
    };
    const toggleSfx = () => {
      Audio.setSfx(!Audio.sfxOn);
      refreshAudioToggles();
      sfx('click');
    };
    document.querySelectorAll('.audio-music').forEach((b) => b.addEventListener('click', toggleMusic));
    document.querySelectorAll('.audio-sfx').forEach((b) => b.addEventListener('click', toggleSfx));
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (k === 'm') toggleMusic();
      else if (k === 's') toggleSfx();
    });
    // UI click feedback for every button and unit card
    document.addEventListener('click', (e) => {
      if (e.target.closest('button, .unit-card, .army-slot') && !e.target.closest('.audio-sfx')) sfx('click');
    });
    refreshAudioToggles();
  }

  buildSetup();
  bindButtons();
  bindAudio();
})();
