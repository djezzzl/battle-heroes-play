// Unit definitions. attackType: 'melee' (close), 'ranged' (far), 'splash' (area).
(function (root) {
  const BH = (root.BH = root.BH || {});

  const UNITS = [
    {
      id: 'pikeman', name: 'Pikeman', tier: 1, attackType: 'melee',
      hp: 10, attack: 4, defense: 5, minDmg: 1, maxDmg: 3, speed: 4, initiative: 8,
      stack: 24, value: 15, description: 'Sturdy infantry armed with long pikes.',
    },
    {
      id: 'archer', name: 'Archer', tier: 2, attackType: 'ranged', shots: 12,
      hp: 10, attack: 6, defense: 3, minDmg: 2, maxDmg: 3, speed: 4, initiative: 9,
      stack: 16, value: 25, description: 'Shoots from afar. Weak in close combat.',
    },
    {
      id: 'griffin', name: 'Griffin', tier: 3, attackType: 'melee', flying: true, retaliations: 2,
      hp: 25, attack: 8, defense: 8, minDmg: 3, maxDmg: 6, speed: 6, initiative: 12,
      stack: 12, value: 50, description: 'Flies over obstacles. Retaliates twice per round.',
    },
    {
      id: 'swordsman', name: 'Swordsman', tier: 4, attackType: 'melee',
      hp: 35, attack: 10, defense: 12, minDmg: 6, maxDmg: 9, speed: 5, initiative: 10,
      stack: 8, value: 90, description: 'Heavily armored knight on foot.',
    },
    {
      id: 'monk', name: 'Monk', tier: 5, attackType: 'ranged', shots: 12,
      hp: 30, attack: 12, defense: 7, minDmg: 10, maxDmg: 12, speed: 5, initiative: 11,
      stack: 6, value: 140, description: 'Hurls holy bolts of energy.',
    },
    {
      id: 'mage', name: 'Fire Mage', tier: 5, attackType: 'splash', ranged: true, shots: 10,
      hp: 30, attack: 9, defense: 7, minDmg: 6, maxDmg: 10, speed: 5, initiative: 10,
      stack: 6, value: 140, description: 'Fireballs hit the target and all adjacent enemies.',
    },
    {
      id: 'cavalier', name: 'Cavalier', tier: 6, attackType: 'melee',
      hp: 100, attack: 15, defense: 15, minDmg: 15, maxDmg: 25, speed: 7, initiative: 13,
      stack: 4, value: 400, description: 'Charging knight on a warhorse.',
    },
    {
      id: 'dragon', name: 'Dragon', tier: 7, attackType: 'splash', flying: true,
      hp: 200, attack: 25, defense: 25, minDmg: 25, maxDmg: 50, speed: 9, initiative: 15,
      stack: 2, value: 1500, description: 'Flies. Its bite and flames scorch all enemies around the target.',
    },
  ];

  const BY_ID = {};
  for (const u of UNITS) {
    u.ranged = u.attackType === 'ranged' || !!u.ranged;
    u.flying = !!u.flying;
    u.retaliations = u.retaliations || 1;
    u.shots = u.shots || 0;
    BY_ID[u.id] = u;
  }

  const TYPE_LABEL = { melee: 'Close', ranged: 'Far', splash: 'Splash' };

  BH.Units = { UNITS, BY_ID, TYPE_LABEL };
})(typeof window !== 'undefined' ? window : globalThis);
