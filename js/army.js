// Army building with a gold budget: costs, affordability and random armies.
// Pure logic (no DOM) so it can be tested in Node.
(function (root) {
  const BH = (root.BH = root.BH || {});
  const Units = BH.Units;

  const MAX_STACKS = 7;
  const BUDGET_PRESETS = [3000, 10000, 25000, 60000, 150000];
  const DEFAULT_BUDGET = 25000;
  const MIN_FILL = 0.97;

  function costOf(type) {
    return Units.BY_ID[type].cost;
  }

  function totalCost(army) {
    return army.reduce((sum, s) => sum + costOf(s.type) * s.count, 0);
  }

  // How many creatures of `type` can still be bought with what is left of the budget.
  function maxAffordable(type, budget, army) {
    const others = army.filter((s) => s.type !== type);
    return Math.max(0, Math.floor((budget - totalCost(others)) / costOf(type)));
  }

  function isValid(army, budget) {
    return army.length > 0 && army.length <= MAX_STACKS && army.every((s) => s.count > 0) &&
      new Set(army.map((s) => s.type)).size === army.length && totalCost(army) <= budget;
  }

  // Default count when adding a stack: an even share of the remaining gold over the free slots.
  function defaultCount(type, budget, army) {
    const left = budget - totalCost(army);
    const slots = Math.max(1, MAX_STACKS - army.length);
    const share = Math.floor(left / slots / costOf(type));
    return Math.min(Math.max(1, share), maxAffordable(type, budget, army));
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // A random army costing at most `budget` and, when possible, at least MIN_FILL of it.
  // opts.pool: unit ids to choose from (default: all).
  function randomArmy(budget, rng = Math.random, opts = {}) {
    const pool = (opts.pool || Units.UNITS.map((u) => u.id)).filter((id) => costOf(id) <= budget);
    if (!pool.length) return [];
    const minFill = opts.minFill != null ? opts.minFill : MIN_FILL;
    let best = null;
    for (let attempt = 0; attempt < 80; attempt++) {
      const maxK = Math.min(MAX_STACKS, pool.length);
      const k = Math.min(maxK, 2 + Math.floor(rng() * (maxK - 1)));
      const types = shuffle(pool, rng).slice(0, k);
      const weights = types.map(() => 0.3 + rng());
      const sumW = weights.reduce((s, w) => s + w, 0);
      let army = types
        .map((type, i) => ({ type, count: Math.floor((budget * weights[i]) / sumW / costOf(type)) }))
        .filter((s) => s.count > 0);
      if (!army.length) army = [{ type: types[0], count: Math.floor(budget / costOf(types[0])) }];
      // Spend what's left one creature at a time on random stacks that still fit.
      let left = budget - totalCost(army);
      for (;;) {
        const fits = army.filter((s) => costOf(s.type) <= left);
        if (!fits.length) break;
        const s = fits[Math.floor(rng() * fits.length)];
        const n = Math.max(1, Math.floor((left / costOf(s.type)) * rng() * 0.5));
        s.count += n;
        left -= n * costOf(s.type);
      }
      const spent = budget - left;
      if (!best || spent > best.spent) best = { army, spent };
      if (spent >= budget * minFill) break;
    }
    return best.army.sort((a, b) => Units.BY_ID[a.type].tier - Units.BY_ID[b.type].tier);
  }

  BH.Army = {
    MAX_STACKS, BUDGET_PRESETS, DEFAULT_BUDGET, MIN_FILL,
    costOf, totalCost, maxAffordable, isValid, defaultCount, randomArmy,
  };
})(typeof window !== 'undefined' ? window : globalThis);
