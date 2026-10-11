// Battle rules: pure logic, no DOM. Mutates the battle object and returns events for animation.
(function (root) {
  const BH = (root.BH = root.BH || {});
  const Hex = BH.Hex;
  const Units = BH.Units;

  const DEFEND_BONUS = 1.3;
  const RANGE_PENALTY_DISTANCE = 10;
  const SIDES = ['player', 'ai'];

  // HoMM3 starting rows by number of stacks.
  const PLACEMENT_ROWS = {
    1: [5], 2: [2, 8], 3: [2, 5, 8], 4: [0, 4, 6, 10], 5: [0, 2, 5, 8, 10],
    6: [0, 2, 4, 6, 8, 10], 7: [0, 2, 4, 5, 6, 8, 10],
  };

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function createEmpty(opts = {}) {
    return {
      rng: opts.rng || Math.random,
      units: [],
      obstacles: new Set(),
      round: 0,
      queue: [],
      waitQueue: [],
      currentId: null,
      winner: null,
      log: [],
      nextId: 1,
    };
  }

  function addStack(battle, { type, side, col, row, count }) {
    const def = Units.BY_ID[type];
    if (!def) throw new Error('Unknown unit type: ' + type);
    const n = count != null ? count : def.stack;
    const unit = {
      id: battle.nextId++, type, def, side, col, row,
      count: n, initialCount: n, topHp: def.hp,
      shots: def.shots, retaliationsLeft: def.retaliations, defending: false,
    };
    battle.units.push(unit);
    return unit;
  }

  function addObstacle(battle, col, row) {
    battle.obstacles.add(Hex.key(col, row));
  }

  function create({ playerArmy, aiArmy, rng, obstacleCount }) {
    const battle = createEmpty({ rng });
    placeArmy(battle, playerArmy, 'player');
    placeArmy(battle, aiArmy, 'ai');
    const n = obstacleCount != null ? obstacleCount : randInt(battle.rng, 4, 7);
    let guard = 0;
    while (battle.obstacles.size < n && guard++ < 500) {
      const col = randInt(battle.rng, 3, Hex.COLS - 4);
      const row = randInt(battle.rng, 0, Hex.ROWS - 1);
      if (!unitAt(battle, col, row)) addObstacle(battle, col, row);
    }
    start(battle);
    return battle;
  }

  function placeArmy(battle, army, side) {
    const rows = PLACEMENT_ROWS[army.length];
    if (!rows) throw new Error('Army must have 1-7 stacks');
    const col = side === 'player' ? 0 : Hex.COLS - 1;
    army.forEach((s, i) => addStack(battle, { type: s.type, count: s.count, side, col, row: rows[i] }));
  }

  function alive(battle) {
    return battle.units.filter((u) => u.count > 0);
  }

  function getUnit(battle, id) {
    return battle.units.find((u) => u.id === id);
  }

  function unitAt(battle, col, row) {
    return battle.units.find((u) => u.count > 0 && u.col === col && u.row === row) || null;
  }

  function isBlocked(battle, col, row, ignoreUnit) {
    if (battle.obstacles.has(Hex.key(col, row))) return true;
    const u = unitAt(battle, col, row);
    return !!u && u !== ignoreUnit;
  }

  function enemiesOf(battle, unit) {
    return alive(battle).filter((u) => u.side !== unit.side);
  }

  function current(battle) {
    return battle.currentId == null ? null : getUnit(battle, battle.currentId);
  }

  function sortByInitiative(units) {
    return units.slice().sort((a, b) =>
      b.def.initiative - a.def.initiative ||
      b.def.speed - a.def.speed ||
      SIDES.indexOf(a.side) - SIDES.indexOf(b.side) ||
      a.id - b.id
    );
  }

  function start(battle) {
    battle.round = 0;
    startRound(battle);
    advance(battle);
  }

  function startRound(battle) {
    battle.round += 1;
    for (const u of alive(battle)) {
      u.retaliationsLeft = u.def.retaliations;
      u.waited = false;
    }
    battle.queue = sortByInitiative(alive(battle)).map((u) => u.id);
    battle.waitQueue = [];
    battle.log.push({ text: `Round ${battle.round} begins.`, kind: 'round' });
  }

  // Moves on to the next living unit; starts a new round when everyone has acted.
  function advance(battle) {
    battle.currentId = null;
    if (checkWinner(battle)) return null;
    for (let guard = 0; guard < 3; guard++) {
      while (battle.queue.length || battle.waitQueue.length) {
        const id = battle.queue.length ? battle.queue.shift() : battle.waitQueue.shift();
        const u = getUnit(battle, id);
        if (u && u.count > 0) {
          battle.currentId = id;
          u.defending = false;
          return u;
        }
      }
      startRound(battle);
    }
    return null;
  }

  // Upcoming turn order for display: rest of this round, then the next round.
  function upcomingOrder(battle, limit = 14) {
    const ids = [];
    if (battle.currentId != null) ids.push(battle.currentId);
    for (const id of battle.queue.concat(battle.waitQueue)) ids.push(id);
    const live = ids.filter((id) => getUnit(battle, id).count > 0);
    const next = sortByInitiative(alive(battle)).map((u) => u.id);
    const out = live.map((id) => ({ id, round: battle.round }));
    while (out.length < limit && next.length) {
      for (const id of next) {
        if (out.length >= limit) break;
        out.push({ id, round: battle.round + 1 + Math.floor((out.length - live.length) / next.length) });
      }
    }
    return out.slice(0, limit);
  }

  function checkWinner(battle) {
    if (battle.winner) return battle.winner;
    const p = alive(battle).some((u) => u.side === 'player');
    const a = alive(battle).some((u) => u.side === 'ai');
    if (!p || !a) battle.winner = p ? 'player' : a ? 'ai' : 'draw';
    return battle.winner;
  }

  // Map of hex key -> path (array of hexes, excluding start, ending at destination).
  function reachable(battle, unit) {
    const result = new Map();
    const speed = unit.def.speed;
    if (unit.def.flying) {
      for (const h of Hex.allHexes()) {
        const d = Hex.distance(unit, h);
        if (d > 0 && d <= speed && !isBlocked(battle, h.col, h.row, unit)) result.set(Hex.key(h.col, h.row), [h]);
      }
      return result;
    }
    const startKey = Hex.key(unit.col, unit.row);
    const prev = new Map([[startKey, null]]);
    let frontier = [{ col: unit.col, row: unit.row }];
    for (let step = 0; step < speed; step++) {
      const next = [];
      for (const h of frontier) {
        for (const n of Hex.neighbors(h.col, h.row)) {
          const k = Hex.key(n.col, n.row);
          if (prev.has(k) || isBlocked(battle, n.col, n.row, unit)) continue;
          prev.set(k, h);
          next.push(n);
        }
      }
      frontier = next;
    }
    for (const k of prev.keys()) {
      if (k === startKey) continue;
      const path = [];
      let cur = Hex.parseKey(k);
      while (cur && Hex.key(cur.col, cur.row) !== startKey) {
        path.unshift(cur);
        cur = prev.get(Hex.key(cur.col, cur.row));
      }
      result.set(k, path);
    }
    return result;
  }

  function hasAdjacentEnemy(battle, unit) {
    return enemiesOf(battle, unit).some((e) => Hex.isAdjacent(unit, e));
  }

  function canShoot(battle, unit) {
    return unit.def.ranged && unit.shots > 0 && !hasAdjacentEnemy(battle, unit);
  }

  // Hexes from which `unit` can melee `target` this turn (current hex or reachable ones).
  function attackHexes(battle, unit, target, reach) {
    reach = reach || reachable(battle, unit);
    const out = [];
    for (const n of Hex.neighbors(target.col, target.row)) {
      if (n.col === unit.col && n.row === unit.row) out.push(n);
      else if (reach.has(Hex.key(n.col, n.row))) out.push(n);
    }
    return out;
  }

  function meleeTargets(battle, unit, reach) {
    reach = reach || reachable(battle, unit);
    const out = [];
    for (const e of enemiesOf(battle, unit)) {
      const froms = attackHexes(battle, unit, e, reach);
      if (froms.length) out.push({ target: e, froms });
    }
    return out;
  }

  function effectiveDefense(unit) {
    return unit.def.defense * (unit.defending ? DEFEND_BONUS : 1);
  }

  function damageMultiplier(attacker, defender) {
    const a = attacker.def.attack;
    const d = effectiveDefense(defender);
    if (a >= d) return Math.min(3, 1 + 0.05 * (a - d));
    return Math.max(0.3, 1 - 0.025 * (d - a));
  }

  function baseDamage(attacker, rng) {
    const { minDmg, maxDmg } = attacker.def;
    if (attacker.count <= 10) {
      let sum = 0;
      for (let i = 0; i < attacker.count; i++) sum += randInt(rng, minDmg, maxDmg);
      return sum;
    }
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += randInt(rng, minDmg, maxDmg);
    return Math.round((sum * attacker.count) / 10);
  }

  function calcDamage(attacker, defender, rng, { half = false } = {}) {
    let dmg = baseDamage(attacker, rng) * damageMultiplier(attacker, defender);
    if (half) dmg *= 0.5;
    return Math.max(1, Math.floor(dmg));
  }

  function expectedDamage(attacker, defender, { half = false } = {}) {
    const avg = ((attacker.def.minDmg + attacker.def.maxDmg) / 2) * attacker.count;
    let dmg = avg * damageMultiplier(attacker, defender);
    if (half) dmg *= 0.5;
    return Math.max(1, Math.floor(dmg));
  }

  function totalHp(unit) {
    return unit.count > 0 ? (unit.count - 1) * unit.def.hp + unit.topHp : 0;
  }

  function applyDamage(unit, dmg) {
    const before = unit.count;
    const remaining = totalHp(unit) - dmg;
    if (remaining <= 0) {
      unit.count = 0;
      unit.topHp = 0;
    } else {
      unit.count = Math.ceil(remaining / unit.def.hp);
      unit.topHp = remaining - (unit.count - 1) * unit.def.hp;
    }
    return before - unit.count;
  }

  function splashVictims(battle, attacker, target) {
    if (attacker.def.attackType !== 'splash') return [];
    return Hex.neighbors(target.col, target.row)
      .map((h) => unitAt(battle, h.col, h.row))
      .filter((u) => u && u.side !== attacker.side);
  }

  function strike(battle, attacker, target, { ranged, retaliation = false }) {
    const meleeByShooter = !ranged && attacker.def.ranged;
    const longShot = ranged && Hex.distance(attacker, target) > RANGE_PENALTY_DISTANCE;
    const half = meleeByShooter || longShot;
    const victims = retaliation ? [target] : [target, ...splashVictims(battle, attacker, target)];
    const hits = victims.map((v) => {
      const damage = calcDamage(attacker, v, battle.rng, { half });
      const kills = applyDamage(v, damage);
      return { unitId: v.id, damage, kills, countAfter: v.count, dead: v.count === 0 };
    });
    const verb = retaliation ? 'retaliates against' : ranged ? 'shoots' : 'attacks';
    const main = hits[0];
    let text = `${label(attacker)} ${verb} ${label(target)} for ${main.damage} damage`;
    text += main.kills ? `, ${main.kills} perish.` : '.';
    for (const h of hits.slice(1)) {
      text += ` Splash hits ${getUnit(battle, h.unitId).def.name}: ${h.damage} dmg, ${h.kills} perish.`;
    }
    battle.log.push({ text, kind: attacker.side });
    return {
      kind: 'attack', attackerId: attacker.id, targetId: target.id,
      ranged, retaliation, splash: hits.length > 1 || attacker.def.attackType === 'splash', hits,
    };
  }

  function label(u) {
    return `${u.count > 0 ? u.count : ''} ${u.def.name}`.trim();
  }

  function moveUnit(battle, unit, to, reach) {
    reach = reach || reachable(battle, unit);
    const path = reach.get(Hex.key(to.col, to.row));
    if (!path) throw new Error('Destination not reachable');
    const from = { col: unit.col, row: unit.row };
    unit.col = to.col;
    unit.row = to.row;
    return { kind: 'move', unitId: unit.id, from, path, flying: unit.def.flying };
  }

  // Performs an action for the current unit. Returns { events } and advances the turn.
  function perform(battle, action) {
    const unit = current(battle);
    if (!unit) throw new Error('No active unit');
    const events = [];
    switch (action.type) {
      case 'move': {
        events.push(moveUnit(battle, unit, action.to));
        battle.log.push({ text: `${label(unit)} moves.`, kind: unit.side });
        break;
      }
      case 'melee': {
        const target = getUnit(battle, action.targetId);
        if (!target || target.count <= 0 || target.side === unit.side) throw new Error('Invalid target');
        const from = action.from || { col: unit.col, row: unit.row };
        if (!Hex.isAdjacent(from, target)) throw new Error('Attack hex not adjacent to target');
        if (from.col !== unit.col || from.row !== unit.row) events.push(moveUnit(battle, unit, from));
        events.push(strike(battle, unit, target, { ranged: false }));
        if (target.count > 0 && target.retaliationsLeft > 0) {
          target.retaliationsLeft -= 1;
          events.push(strike(battle, target, unit, { ranged: false, retaliation: true }));
        }
        break;
      }
      case 'shoot': {
        const target = getUnit(battle, action.targetId);
        if (!canShoot(battle, unit)) throw new Error('Unit cannot shoot');
        if (!target || target.count <= 0 || target.side === unit.side) throw new Error('Invalid target');
        unit.shots -= 1;
        events.push(strike(battle, unit, target, { ranged: true }));
        break;
      }
      case 'wait': {
        if (unit.waited) throw new Error('Unit already waited this round');
        unit.waited = true;
        battle.waitQueue.push(unit.id);
        battle.log.push({ text: `${label(unit)} waits.`, kind: unit.side });
        events.push({ kind: 'wait', unitId: unit.id });
        advance(battle);
        return { events };
      }
      case 'defend': {
        unit.defending = true;
        battle.log.push({ text: `${label(unit)} defends.`, kind: unit.side });
        events.push({ kind: 'defend', unitId: unit.id });
        break;
      }
      default:
        throw new Error('Unknown action ' + action.type);
    }
    for (const ev of events) {
      if (ev.kind !== 'attack') continue;
      for (const h of ev.hits) {
        if (h.dead) battle.log.push({ text: `${getUnit(battle, h.unitId).def.name} stack destroyed!`, kind: 'death' });
      }
    }
    advance(battle);
    return { events };
  }

  BH.Battle = {
    createEmpty, addStack, addObstacle, create, start,
    alive, getUnit, unitAt, isBlocked, enemiesOf, current, upcomingOrder, checkWinner,
    reachable, canShoot, hasAdjacentEnemy, attackHexes, meleeTargets,
    calcDamage, expectedDamage, applyDamage, totalHp, damageMultiplier, splashVictims,
    perform, randInt, label, PLACEMENT_ROWS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
