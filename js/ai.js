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

  function shotScore(battle, unit, target) {
    const longShot = Hex.distance(unit, target) > 10;
    let score = damageValue(target, B.expectedDamage(unit, target, { half: longShot }));
    if (unit.def.attackType === 'splash') {
      for (const v of B.splashVictims(battle, unit, target)) {
        score += damageValue(v, B.expectedDamage(unit, v, { half: longShot }));
      }
    }
    return score;
  }

  function meleeScore(battle, unit, target, from) {
    const half = unit.def.ranged;
    const dmg = B.expectedDamage(unit, target, { half });
    let score = damageValue(target, dmg);
    if (unit.def.attackType === 'splash') {
      for (const n of Hex.neighbors(target.col, target.row)) {
        const v = B.unitAt(battle, n.col, n.row);
        if (v && v.side !== unit.side && v !== target) score += damageValue(v, B.expectedDamage(unit, v));
      }
    }
    // Expected retaliation from the survivors.
    const remainingHp = B.totalHp(target) - dmg;
    if (remainingHp > 0 && target.retaliationsLeft > 0) {
      const survivors = { ...target, count: Math.ceil(remainingHp / target.def.hp) };
      const ret = B.expectedDamage(survivors, unit, { half: target.def.ranged });
      score -= damageValue(unit, ret) * 0.6;
    }
    // Prefer attack hexes with fewer extra enemies around (less exposure).
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
        const s = meleeScore(battle, unit, target, from) + (stay ? 0.1 : 0);
        if (!best || s > best.score) best = { score: s, target, from };
      }
    }
    if (best) return { type: 'melee', targetId: best.target.id, from: { col: best.from.col, row: best.from.row } };

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
    return { type: 'defend' };
  }

  BH.AI = { chooseAction, damageValue };
})(typeof window !== 'undefined' ? window : globalThis);
