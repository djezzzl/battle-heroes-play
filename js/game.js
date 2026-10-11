// Game controller: setup screen, battle flow, input and HUD.
(function () {
  const BH = window.BH;
  const { Hex, Units, Battle: B, AI, Sprites, Renderer } = BH;

  const $ = (sel) => document.querySelector(sel);
  const DEFAULT_ARMY = ['pikeman', 'archer', 'griffin', 'swordsman', 'monk', 'mage', 'cavalier'];
  const MAX_STACKS = 7;

  const state = {
    selected: new Set(DEFAULT_ARMY),
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
    rows.push(unit ? ['Count', unit.count] : ['Stack', def.stack]);
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

  function buildSetup() {
    const grid = $('#unit-grid');
    grid.innerHTML = '';
    for (const def of Units.UNITS) {
      const card = document.createElement('div');
      card.className = 'unit-card';
      card.dataset.id = def.id;
      const pc = document.createElement('canvas');
      pc.className = 'portrait';
      pc.width = 240;
      pc.height = 180;
      Sprites.portrait(pc, def.id, 'player');
      card.appendChild(pc);
      const body = document.createElement('div');
      body.innerHTML = `<h3>${def.name}${badge(def)}</h3><div class="desc">${def.description}</div>${statsHtml(def)}`;
      card.appendChild(body);
      card.addEventListener('click', () => toggleUnit(def.id));
      grid.appendChild(card);
    }
    document.querySelectorAll('[data-enemy]').forEach((b) =>
      b.addEventListener('click', () => {
        state.enemyMode = b.dataset.enemy;
        document.querySelectorAll('[data-enemy]').forEach((x) => x.classList.toggle('active', x === b));
      })
    );
    $('#btn-start').addEventListener('click', () => startBattle(makeArmies()));
    refreshSetup();
  }

  function toggleUnit(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else if (state.selected.size < MAX_STACKS) state.selected.add(id);
    refreshSetup();
  }

  function refreshSetup() {
    document.querySelectorAll('.unit-card').forEach((c) => c.classList.toggle('selected', state.selected.has(c.dataset.id)));
    $('#selected-count').textContent = `Selected ${state.selected.size} / ${MAX_STACKS}`;
    $('#btn-start').disabled = state.selected.size === 0;
  }

  function makeArmies() {
    const player = Units.UNITS.filter((u) => state.selected.has(u.id)).map((u) => ({ type: u.id }));
    let ai = player.map((s) => ({ ...s }));
    if (state.enemyMode === 'random') {
      const pool = Units.UNITS.map((u) => u.id).sort(() => Math.random() - 0.5).slice(0, player.length);
      ai = Units.UNITS.filter((u) => pool.includes(u.id)).map((u) => ({ type: u.id }));
    }
    return { player, ai };
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

  function showInfo(u) {
    if (!u) return;
    const side = u.side === 'player' ? 'Your' : 'Enemy';
    $('#info').innerHTML = `<h4>${side} ${u.def.name}${badge(u.def)}</h4>${statsHtml(u.def, u)}`;
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
    body.innerHTML = `<div class="desc">${u.def.description}</div>${statsHtml(u.def, u)}`;
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
    showModal(`<h2>${win ? 'Victory!' : 'Defeat'}</h2>
      <p>${win ? 'The enemy army has been destroyed.' : 'Your army has fallen.'} Battle lasted ${state.battle.round} rounds.</p>
      <div class="casualties">${casualtiesHtml('player')}${casualtiesHtml('ai')}</div>
      <div class="modal-buttons"><button class="btn-gold" id="m-again">Fight again</button>
      <button class="btn-gold" id="m-setup">Change army</button></div>`);
    // canvases serialized via outerHTML lose their pixels; repaint them
    document.querySelectorAll('#modal-body canvas[data-type]').forEach((c) => Sprites.portrait(c, c.dataset.type, c.dataset.side));
    $('#m-again').onclick = () => startBattle(state.armies);
    $('#m-setup').onclick = goToSetup;
  }

  function goToSetup() {
    hideModal();
    state.battle = null;
    state.busy = false;
    $('#battle').classList.add('hidden');
    $('#setup').classList.remove('hidden');
  }

  buildSetup();
  bindButtons();
})();
