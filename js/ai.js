// Computer opponent: greedy scoring of all available actions.
(function (root) {
  const BH = (root.BH = root.BH || {});
  const Hex = BH.Hex;
  const B = BH.Battle;

  function stackValue(unit) {
    return unit.def.value * unit.count;
  }

  // Value destroyed by `dmg` damage to `unit`, including partial creatures.
  function damageValue(unit, dmg) {
    const dealt = Math.min(dmg, B.totalHp(unit));
    let value = (dealt / unit.def.hp) * unit.def.value;
    if (dealt >= B.totalHp(unit)) value += unit.def.value * 2; // bonus for wiping a stack
    return value;
  }

  // Expected value of one strike from `pos` (enemy damage minus friendly fire), and damage to the target.
  function strikeValue(battle, unit, target, { ranged, pos, moved = 0 }) {
    const ctx = { ranged, moved, distance: Hex.distance(pos, target) };
    let score = 0;
    let mainDmg = 0;
    for (const v of B.strikeVictims(battle, unit, target, { ranged, pos })) {
      const dmg = B.expectedDamage(unit, v, ctx);
      if (v === target) mainDmg = dmg;
      score += (v.side === unit.side ? -1 : 1) * damageValue(v, dmg);
    }
    return { score, mainDmg };
  }

  function retaliationPenalty(unit, target, dmgToTarget) {
    if (target.retaliationsLeft <= 0 || target.stunned || unit.def.perks.noRetaliation) return 0;
    const remainingHp = B.totalHp(target) - dmgToTarget;
    if (remainingHp <= 0) return 0;
    const survivors = { ...target, count: Math.ceil(remainingHp / target.def.hp) };
    const ret = B.expectedDamage(survivors, unit, { ranged: false });
    return damageValue(unit, ret) * 0.6;
  }

  function shotScore(battle, unit, target) {
    const { score } = strikeValue(battle, unit, target, { ranged: true, pos: unit });
    return score * (unit.def.perks.doubleShot && unit.shots > 1 ? 1.8 : 1);
  }

  function meleeScore(battle, unit, target, from, moved) {
    const P = unit.def.perks;
    const { score: base, mainDmg } = strikeValue(battle, unit, target, { ranged: false, pos: from, moved });
    let score = base;
    if (P.doubleStrike) score *= 1.8;
    if (P.lifeDrain && !target.def.perks.undead) score += Math.min(mainDmg, B.totalHp(target)) / unit.def.hp * unit.def.value * 0.5;
    if (target.def.perks.fireShield) score -= damageValue(unit, mainDmg * target.def.perks.fireShield);
    score -= retaliationPenalty(unit, target, mainDmg);
    // Prefer attack hexes with fewer extra enemies around (less exposure), unless the attack benefits from them.
    const exposure = Hex.neighbors(from.col, from.row)
      .map((h) => B.unitAt(battle, h.col, h.row))
      .filter((u) => u && u.side !== unit.side && u !== target).length;
    return score - exposure * 0.5;
  }

  function chooseAction(battle, unit) {
    const enemies = B.enemiesOf(battle, unit);
    if (!enemies.length) return { type: 'defend' };

    if (B.canShoot(battle, unit)) {
      let best = null;
      for (const e of enemies) {
        const s = shotScore(battle, unit, e);
        if (!best || s > best.score) best = { score: s, target: e };
      }
      return { type: 'shoot', targetId: best.target.id };
    }

    const reach = B.reachable(battle, unit);
    let best = null;
    for (const { target, froms } of B.meleeTargets(battle, unit, reach)) {
      for (const from of froms) {
        const stay = from.col === unit.col && from.row === unit.row;
        const path = stay ? [] : reach.get(Hex.key(from.col, from.row));
        const moved = stay ? 0 : unit.def.flying ? Hex.distance(unit, from) : path.length;
        const s = meleeScore(battle, unit, target, from, moved) + (stay ? 0.1 : 0);
        if (!best || s > best.score) best = { score: s, target, from };
      }
    }
    if (best && best.score > -stackValue(unit) * 0.5) {
      return { type: 'melee', targetId: best.target.id, from: { col: best.from.col, row: best.from.row } };
    }

    // Shooters out of ammo or melee units with nothing in reach: close in on the juiciest target.
    let bestMove = null;
    for (const [k, path] of reach) {
      const h = Hex.parseKey(k);
      let s = 0;
      for (const e of enemies) {
        const d = Hex.distance(h, e);
        s = Math.max(s, stackValue(e) / (1 + d * d));
      }
      s -= path.length * 0.001;
      if (!bestMove || s > bestMove.score) bestMove = { score: s, to: h };
    }
    if (bestMove) {
      const here = enemies.reduce((m, e) => Math.max(m, stackValue(e) / (1 + Hex.distance(unit, e) ** 2)), 0);
      if (bestMove.score > here) return { type: 'move', to: bestMove.to };
    }
    if (best) return { type: 'melee', targetId: best.target.id, from: { col: best.from.col, row: best.from.row } };
    return { type: 'defend' };
  }

  BH.AI = { chooseAction, damageValue };
})(typeof window !== 'undefined' ? window : globalThis);
