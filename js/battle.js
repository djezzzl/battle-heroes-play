// Battle rules: pure logic, no DOM. Mutates the battle object and returns events for animation.
(function (root) {
  const BH = (root.BH = root.BH || {});
  const Hex = BH.Hex;
  const Units = BH.Units;

  const DEFEND_BONUS = 1.3;
  const RANGE_PENALTY_DISTANCE = 10;
  const SIDES = ['player', 'ai'];
  const STUN_VERB = { Petrify: 'is petrified', Blind: 'is blinded', Terrify: 'is frozen in terror' };

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
      stunned: null, boundBy: null, reborn: false, waited: false,
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
          u.defending = false;
          if (u.stunned) {
            battle.log.push({ text: `${label(u)} ${STUN_VERB[u.stunned] || 'is stunned'} and loses its turn.`, kind: 'status' });
            u.stunned = null;
            continue;
          }
          if (u.def.perks.regenerate && u.topHp < u.def.hp) {
            u.topHp = u.def.hp;
            battle.log.push({ text: `${label(u)} regenerates.`, kind: u.side });
          }
          battle.currentId = id;
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
  function isBound(battle, unit) {
    if (unit.boundBy == null) return false;
    const binder = getUnit(battle, unit.boundBy);
    return !!binder && binder.count > 0 && Hex.isAdjacent(binder, unit);
  }

  function reachable(battle, unit) {
    const result = new Map();
    if (isBound(battle, unit)) return result;
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

  // Attack vs defense multiplier (HoMM3 formula), including defense-ignoring perks.
  function damageMultiplier(attacker, defender) {
    const a = attacker.def.attack;
    let d = effectiveDefense(defender);
    if (attacker.def.perks.ignoreDefense) d *= 1 - attacker.def.perks.ignoreDefense;
    if (a >= d) return Math.min(3, 1 + 0.05 * (a - d));
    return Math.max(0.3, 1 - 0.025 * (d - a));
  }

  // All damage modifiers. ctx: { ranged, moved, half, distance }.
  function damageFactor(attacker, defender, ctx = {}) {
    const P = attacker.def.perks;
    const D = defender.def.perks;
    let m = damageMultiplier(attacker, defender);
    if (ctx.half) m *= 0.5;
    if (ctx.ranged && ctx.distance > RANGE_PENALTY_DISTANCE) m *= 0.5;
    if (!ctx.ranged && attacker.def.ranged && !P.noMeleePenalty) m *= 0.5;
    if (P.hates && P.hates.includes(defender.type)) m *= 1.5;
    if (P.jousting && ctx.moved) m *= 1 + P.jousting * ctx.moved;
    if (ctx.ranged && D.rangedArmor) m *= 1 - D.rangedArmor;
    if (D.stoneSkin) m *= 1 - D.stoneSkin;
    return m;
  }

  function baseDamage(attacker, rng) {
    const { minDmg, maxDmg } = attacker.def;
    const n = Math.min(attacker.count, 10);
    let sum = 0;
    for (let i = 0; i < n; i++) sum += randInt(rng, minDmg, maxDmg);
    return attacker.count <= 10 ? sum : Math.round((sum * attacker.count) / 10);
  }

  function calcDamage(attacker, defender, rng, ctx = {}) {
    return Math.max(1, Math.floor(baseDamage(attacker, rng) * damageFactor(attacker, defender, ctx)));
  }

  // Average damage, including the expected bonus from death blow.
  function expectedDamage(attacker, defender, ctx = {}) {
    const avg = ((attacker.def.minDmg + attacker.def.maxDmg) / 2) * attacker.count;
    const blow = 1 + (attacker.def.perks.deathBlow || 0);
    return Math.max(1, Math.floor(avg * damageFactor(attacker, defender, ctx) * blow));
  }

  function totalHp(unit) {
    return unit.count > 0 ? (unit.count - 1) * unit.def.hp + unit.topHp : 0;
  }

  function setTotalHp(unit, hp) {
    if (hp <= 0) {
      unit.count = 0;
      unit.topHp = 0;
    } else {
      unit.count = Math.ceil(hp / unit.def.hp);
      unit.topHp = hp - (unit.count - 1) * unit.def.hp;
    }
  }

  function applyDamage(unit, dmg) {
    const before = unit.count;
    setTotalHp(unit, totalHp(unit) - dmg);
    return before - unit.count;
  }

  // Heals up to the stack's starting size; returns creatures revived.
  function heal(unit, amount) {
    const before = unit.count;
    setTotalHp(unit, Math.min(totalHp(unit) + amount, unit.initialCount * unit.def.hp));
    return unit.count - before;
  }

  function enemyAt(battle, attacker, h) {
    const u = h && unitAt(battle, h.col, h.row);
    return u && u.side !== attacker.side ? u : null;
  }

  // Everyone hit by one strike; the main target is first. `pos` is where the attacker stands.
  function strikeVictims(battle, attacker, target, { ranged = false, retaliation = false, pos = attacker } = {}) {
    const out = [target];
    if (retaliation) return out;
    const add = (u) => {
      if (u && u.count > 0 && u !== attacker && !out.includes(u)) out.push(u);
    };
    const P = attacker.def.perks;
    if (attacker.def.attackType === 'splash') {
      for (const h of Hex.neighbors(target.col, target.row)) add(enemyAt(battle, attacker, h));
    }
    if (!ranged) {
      if (P.allAround) for (const h of Hex.neighbors(pos.col, pos.row)) add(enemyAt(battle, attacker, h));
      if (P.threeHeaded) {
        for (const h of Hex.neighbors(pos.col, pos.row)) {
          if (Hex.isAdjacent(h, target)) add(enemyAt(battle, attacker, h));
        }
      }
      if (P.breath) {
        const b = Hex.behind(pos, target);
        if (b) add(unitAt(battle, b.col, b.row));
      }
    }
    return out;
  }

  // Backwards-compatible helper: enemies around the target hit by splash attacks.
  function splashVictims(battle, attacker, target) {
    return strikeVictims(battle, attacker, target, { ranged: attacker.def.ranged }).slice(1);
  }

  function logDeath(battle, unit) {
    battle.log.push({ text: `${unit.def.name} stack destroyed!`, kind: 'death' });
  }

  // Phoenix-style rebirth for any unit that just died. Returns an effect event or null.
  function tryRebirth(battle, unit) {
    const r = unit.def.perks.rebirth;
    if (!r || unit.reborn || unit.count > 0) return null;
    unit.reborn = true;
    unit.count = Math.max(1, Math.ceil(unit.initialCount * r));
    unit.topHp = unit.def.hp;
    unit.stunned = null;
    unit.boundBy = null;
    battle.log.push({ text: `${unit.def.name} rises from its ashes! (${unit.count})`, kind: unit.side });
    return { kind: 'effect', hits: [{ unitId: unit.id, countAfter: unit.count, reborn: true, text: 'Rebirth!' }] };
  }

  // Resolves one strike and its after-effects; returns a list of events.
  function strike(battle, attacker, target, { ranged, retaliation = false, moved = 0 }) {
    const rng = battle.rng;
    const P = attacker.def.perks;
    const events = [];
    const ctx = { ranged, moved, distance: Hex.distance(attacker, target) };
    const victims = strikeVictims(battle, attacker, target, { ranged, retaliation });
    const blow = !!P.deathBlow && rng() < P.deathBlow;
    const hits = victims.map((v) => {
      const damage = calcDamage(attacker, v, rng, ctx) * (blow ? 2 : 1);
      const hpBefore = totalHp(v);
      const kills = applyDamage(v, damage);
      return { unitId: v.id, damage, kills, countAfter: v.count, dead: v.count === 0, dealt: hpBefore - totalHp(v) };
    });
    const verb = retaliation ? 'retaliates against' : ranged ? 'shoots' : 'attacks';
    const main = hits[0];
    let text = `${blow ? 'Death blow! ' : ''}${label(attacker)} ${verb} ${target.def.name} for ${main.damage} damage`;
    text += main.kills ? `, ${main.kills} perish.` : '.';
    for (const h of hits.slice(1)) {
      text += ` Also hits ${getUnit(battle, h.unitId).def.name}: ${h.damage} dmg, ${h.kills} perish.`;
    }
    battle.log.push({ text, kind: attacker.side });
    events.push({
      kind: 'attack', attackerId: attacker.id, targetId: target.id, ranged, retaliation, deathBlow: blow,
      splash: hits.length > 1 || attacker.def.attackType === 'splash', hits,
    });
    for (const v of victims) if (v.count === 0) logDeath(battle, v);

    if (!ranged) {
      if (P.lifeDrain && attacker.count > 0) {
        const drained = hits.reduce((s, h) => s + (getUnit(battle, h.unitId).def.perks.undead ? 0 : h.dealt), 0);
        if (drained > 0) {
          const revived = heal(attacker, drained);
          battle.log.push({ text: `${attacker.def.name} drains ${drained} life${revived ? `, ${revived} rise again` : ''}.`, kind: attacker.side });
          events.push({ kind: 'effect', hits: [{ unitId: attacker.id, heal: drained, revived, countAfter: attacker.count, text: `+${drained}` }] });
        }
      }
      if (P.deathStare && target.count > 0) {
        let n = 0;
        for (let i = 0; i < attacker.count; i++) if (rng() < P.deathStare) n++;
        n = Math.min(n, target.count);
        if (n > 0) {
          target.count -= n;
          if (target.count === 0) target.topHp = 0;
          battle.log.push({ text: `Death stare slays ${n} ${target.def.name}.`, kind: attacker.side });
          events.push({ kind: 'effect', hits: [{ unitId: target.id, kills: n, countAfter: target.count, dead: target.count === 0, text: 'Death stare' }] });
          if (target.count === 0) logDeath(battle, target);
        }
      }
      if (P.stun && target.count > 0 && rng() < P.stun.chance) {
        target.stunned = P.stun.name;
        battle.log.push({ text: `${target.def.name} ${STUN_VERB[P.stun.name] || 'is stunned'}!`, kind: 'status' });
        events.push({ kind: 'effect', hits: [{ unitId: target.id, countAfter: target.count, text: P.stun.name + '!' }] });
      }
      if (P.bind && target.count > 0 && attacker.count > 0 && target.boundBy !== attacker.id) {
        target.boundBy = attacker.id;
        battle.log.push({ text: `${target.def.name} is bound by roots.`, kind: 'status' });
        events.push({ kind: 'effect', hits: [{ unitId: target.id, countAfter: target.count, text: 'Bound!' }] });
      }
      for (const h of hits) {
        const v = getUnit(battle, h.unitId);
        const fs = v.def.perks.fireShield;
        if (fs && h.dealt > 0 && attacker.count > 0 && v.side !== attacker.side) {
          const burn = Math.max(1, Math.floor(h.dealt * fs));
          const kills = applyDamage(attacker, burn);
          battle.log.push({ text: `Fire shield burns ${attacker.def.name} for ${burn}${kills ? `, ${kills} perish` : ''}.`, kind: v.side });
          events.push({ kind: 'effect', fire: true, hits: [{ unitId: attacker.id, damage: burn, kills, countAfter: attacker.count, dead: attacker.count === 0 }] });
          if (attacker.count === 0) logDeath(battle, attacker);
        }
      }
    }
    for (const u of [...victims, attacker]) {
      const ev = tryRebirth(battle, u);
      if (ev) events.push(ev);
    }
    return events;
  }

  function canRetaliate(target, attacker) {
    return target.count > 0 && attacker.count > 0 && !target.stunned && target.retaliationsLeft > 0 &&
      !attacker.def.perks.noRetaliation;
  }

  function retaliate(battle, target, attacker, events) {
    if (!canRetaliate(target, attacker)) return;
    target.retaliationsLeft -= 1;
    events.push(...strike(battle, target, attacker, { ranged: false, retaliation: true }));
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
    return { kind: 'move', unitId: unit.id, from, path, flying: unit.def.flying, teleport: !!unit.def.perks.teleport };
  }

  // Performs an action for the current unit. Returns { events } and advances the turn.
  function perform(battle, action) {
    const unit = current(battle);
    if (!unit) throw new Error('No active unit');
    const P = unit.def.perks;
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
        const start = { col: unit.col, row: unit.row };
        let moved = 0;
        if (from.col !== unit.col || from.row !== unit.row) {
          const mv = moveUnit(battle, unit, from);
          moved = mv.flying ? Hex.distance(start, from) : mv.path.length;
          events.push(mv);
        }
        events.push(...strike(battle, unit, target, { ranged: false, moved }));
        retaliate(battle, target, unit, events);
        if (P.doubleStrike && unit.count > 0 && target.count > 0) {
          events.push(...strike(battle, unit, target, { ranged: false }));
          retaliate(battle, target, unit, events);
        }
        if (P.strikeAndReturn && unit.count > 0 && moved && !isBlocked(battle, start.col, start.row, unit)) {
          const back = { col: unit.col, row: unit.row };
          unit.col = start.col;
          unit.row = start.row;
          events.push({ kind: 'move', unitId: unit.id, from: back, path: [start], flying: true });
        }
        break;
      }
      case 'shoot': {
        const target = getUnit(battle, action.targetId);
        if (!canShoot(battle, unit)) throw new Error('Unit cannot shoot');
        if (!target || target.count <= 0 || target.side === unit.side) throw new Error('Invalid target');
        unit.shots -= 1;
        events.push(...strike(battle, unit, target, { ranged: true }));
        if (P.doubleShot && target.count > 0 && unit.shots > 0 && unit.count > 0) {
          unit.shots -= 1;
          events.push(...strike(battle, unit, target, { ranged: true }));
        }
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
    advance(battle);
    return { events };
  }

  BH.Battle = {
    createEmpty, addStack, addObstacle, create, start,
    alive, getUnit, unitAt, isBlocked, enemiesOf, current, upcomingOrder, checkWinner,
    reachable, canShoot, hasAdjacentEnemy, attackHexes, meleeTargets,
    calcDamage, expectedDamage, applyDamage, heal, totalHp, damageMultiplier, damageFactor, splashVictims,
    strikeVictims, canRetaliate, isBound,
    perform, randInt, label, PLACEMENT_ROWS,
  };
})(typeof window !== 'undefined' ? window : globalThis);
