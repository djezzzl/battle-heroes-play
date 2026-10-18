// Unit definitions. attackType: 'melee' (close), 'ranged' (far), 'splash' (area).
// perks: see PERK_INFO below; implemented in battle.js.
(function (root) {
  const BH = (root.BH = root.BH || {});

  const FACTIONS = [
    { id: 'castle', name: 'Castle' },
    { id: 'rampart', name: 'Rampart' },
    { id: 'tower', name: 'Tower' },
    { id: 'inferno', name: 'Inferno' },
    { id: 'necropolis', name: 'Necropolis' },
    { id: 'dungeon', name: 'Dungeon' },
    { id: 'stronghold', name: 'Stronghold' },
    { id: 'fortress', name: 'Fortress' },
    { id: 'conflux', name: 'Conflux' },
  ];

  const U = (faction, id, name, tier, attackType, s, extra = {}) => ({
    faction, id, name, tier, attackType,
    hp: s[0], attack: s[1], defense: s[2], minDmg: s[3], maxDmg: s[4], speed: s[5], initiative: s[6], stack: s[7], value: s[8],
    ...extra,
  });

  // stats: [hp, attack, defense, minDmg, maxDmg, speed, initiative, stack, value]
  const UNITS = [
    // Castle
    U('castle', 'pikeman', 'Pikeman', 1, 'melee', [10, 4, 5, 1, 3, 4, 8, 24, 15], {
      description: 'Sturdy infantry armed with long pikes.' }),
    U('castle', 'archer', 'Archer', 2, 'ranged', [10, 6, 3, 2, 3, 4, 9, 16, 25], {
      shots: 12, description: 'Shoots from afar. Weak in close combat.' }),
    U('castle', 'griffin', 'Griffin', 3, 'melee', [25, 8, 8, 3, 6, 6, 12, 12, 50], {
      flying: true, retaliations: 2, description: 'Flies over obstacles. Retaliates twice per round.' }),
    U('castle', 'swordsman', 'Swordsman', 4, 'melee', [35, 10, 12, 6, 9, 5, 10, 8, 90], {
      description: 'Heavily armored knight on foot.' }),
    U('castle', 'monk', 'Monk', 5, 'ranged', [30, 12, 7, 10, 12, 5, 11, 6, 140], {
      shots: 12, description: 'Hurls holy bolts of energy.' }),
    U('castle', 'cavalier', 'Cavalier', 6, 'melee', [100, 15, 15, 15, 25, 7, 13, 4, 400], {
      perks: { jousting: 0.05 }, description: 'Charging knight; the longer the charge, the harder the hit.' }),
    U('castle', 'angel', 'Angel', 7, 'melee', [200, 20, 20, 50, 50, 12, 18, 2, 1600], {
      flying: true, perks: { hates: ['devil'] }, description: 'Holy warrior with a flaming sword. Loathes devils.' }),

    // Rampart
    U('rampart', 'dwarf', 'Dwarf', 2, 'melee', [20, 7, 7, 2, 4, 3, 7, 16, 35], {
      perks: { rangedArmor: 0.5 }, description: 'Slow but stubborn; shrugs off arrows behind its shield.' }),
    U('rampart', 'woodelf', 'Wood Elf', 3, 'ranged', [15, 9, 5, 3, 5, 6, 10, 12, 60], {
      shots: 24, perks: { doubleShot: true }, description: 'Master archer who looses two arrows each turn.' }),
    U('rampart', 'dendroid', 'Dendroid', 5, 'melee', [55, 9, 12, 10, 14, 3, 6, 6, 150], {
      perks: { bind: true }, description: 'Living tree whose roots pin its victims in place.' }),
    U('rampart', 'unicorn', 'Unicorn', 6, 'melee', [90, 15, 14, 18, 22, 7, 12, 4, 380], {
      perks: { stun: { chance: 0.25, name: 'Blind' } }, description: 'Its radiant horn can blind foes.' }),
    U('rampart', 'dragon', 'Green Dragon', 7, 'splash', [200, 25, 25, 25, 50, 9, 15, 2, 1500], {
      flying: true, description: 'Flies. Its bite and flames scorch all enemies around the target.' }),

    // Tower
    U('tower', 'golem', 'Stone Golem', 3, 'melee', [50, 7, 10, 4, 5, 3, 6, 10, 60], {
      perks: { stoneSkin: 0.25 }, description: 'Animated stone. Slow, but very hard to break.' }),
    U('tower', 'mage', 'Fire Mage', 5, 'splash', [30, 9, 7, 6, 10, 5, 10, 6, 140], {
      ranged: true, shots: 10, perks: { noMeleePenalty: true },
      description: 'Fireballs hit the target and all adjacent enemies.' }),
    U('tower', 'naga', 'Naga', 6, 'melee', [110, 16, 13, 20, 25, 5, 11, 4, 420], {
      perks: { noRetaliation: true }, description: 'Six-armed serpent queen; strikes too fast to answer.' }),
    U('tower', 'titan', 'Titan', 7, 'ranged', [250, 24, 24, 35, 50, 11, 14, 2, 1900], {
      shots: 24, perks: { noMeleePenalty: true, hates: ['blackdragon'] },
      description: 'Giant who hurls lightning. Sworn enemy of black dragons.' }),

    // Inferno
    U('inferno', 'cerberus', 'Cerberus', 4, 'melee', [25, 10, 8, 2, 7, 8, 12, 8, 100], {
      perks: { threeHeaded: true, noRetaliation: true }, description: 'Three heads bite up to three foes at once.' }),
    U('inferno', 'efreet', 'Efreet', 6, 'melee', [90, 16, 14, 16, 24, 9, 13, 4, 420], {
      flying: true, perks: { fireShield: 0.2 }, description: 'Fire genie; attackers are burned by its flames.' }),
    U('inferno', 'devil', 'Devil', 7, 'melee', [180, 23, 22, 30, 40, 11, 17, 2, 1500], {
      flying: true, perks: { teleport: true, noRetaliation: true, hates: ['angel'] },
      description: 'Teleports anywhere in reach. Enemies cannot strike back. Hates angels.' }),

    // Necropolis
    U('necropolis', 'skeleton', 'Skeleton', 1, 'melee', [6, 6, 6, 1, 3, 5, 8, 30, 15], {
      perks: { undead: true }, description: 'Risen bones in endless numbers.' }),
    U('necropolis', 'wight', 'Wight', 3, 'melee', [18, 7, 7, 3, 5, 7, 11, 12, 55], {
      flying: true, perks: { undead: true, regenerate: true }, description: 'Ghostly wraith that regenerates its wounds.' }),
    U('necropolis', 'vampire', 'Vampire Lord', 4, 'melee', [40, 10, 10, 5, 8, 7, 12, 8, 130], {
      flying: true, perks: { undead: true, lifeDrain: true, noRetaliation: true },
      description: 'Drains life to heal and raise its fallen. Victims cannot strike back.' }),
    U('necropolis', 'lich', 'Lich', 5, 'splash', [30, 13, 10, 11, 15, 6, 10, 6, 170], {
      ranged: true, shots: 12, perks: { undead: true }, description: 'Death cloud harms the target and nearby enemies.' }),
    U('necropolis', 'dreadknight', 'Dread Knight', 6, 'melee', [120, 18, 18, 15, 30, 7, 12, 4, 480], {
      perks: { undead: true, deathBlow: 0.2 }, description: 'Cursed rider; sometimes lands a doubly deadly blow.' }),
    U('necropolis', 'bonedragon', 'Bone Dragon', 7, 'melee', [150, 17, 15, 25, 50, 9, 13, 3, 1000], {
      flying: true, perks: { undead: true, stun: { chance: 0.15, name: 'Terrify' } },
      description: 'Its dreadful presence can make foes freeze in terror.' }),

    // Dungeon
    U('dungeon', 'harpy', 'Harpy', 2, 'melee', [14, 6, 5, 1, 4, 9, 11, 14, 40], {
      flying: true, perks: { strikeAndReturn: true, noRetaliation: true },
      description: 'Swoops in, strikes, and flies back before the foe reacts.' }),
    U('dungeon', 'beholder', 'Beholder', 3, 'ranged', [22, 9, 7, 3, 5, 5, 9, 12, 60], {
      shots: 16, perks: { noMeleePenalty: true }, description: 'Floating eye that blasts with rays, even up close.' }),
    U('dungeon', 'medusa', 'Medusa', 4, 'ranged', [25, 9, 9, 6, 8, 5, 10, 8, 90], {
      shots: 8, perks: { stun: { chance: 0.2, name: 'Petrify' } }, description: 'Archer whose gaze turns foes to stone in melee.' }),
    U('dungeon', 'minotaur', 'Minotaur', 5, 'melee', [50, 14, 12, 12, 20, 6, 11, 6, 190], {
      description: 'Bull-headed brute with a massive axe.' }),
    U('dungeon', 'blackdragon', 'Black Dragon', 7, 'melee', [260, 27, 27, 35, 50, 12, 16, 2, 2200], {
      flying: true, perks: { breath: true, hates: ['titan'] },
      description: 'Breath burns the target and whoever stands behind it. Hates titans.' }),

    // Stronghold
    U('stronghold', 'wolfrider', 'Wolf Rider', 3, 'melee', [12, 8, 5, 3, 5, 8, 12, 12, 50], {
      perks: { doubleStrike: true }, description: 'Goblin on a wolf; strikes twice per attack.' }),
    U('stronghold', 'cyclops', 'Cyclops', 6, 'ranged', [70, 17, 13, 16, 20, 6, 10, 4, 350], {
      shots: 16, description: 'One-eyed giant that hurls boulders.' }),
    U('stronghold', 'behemoth', 'Behemoth', 7, 'melee', [250, 19, 17, 30, 50, 7, 10, 2, 1300], {
      perks: { ignoreDefense: 0.4 }, description: 'Huge claws tear through 40% of the target\'s defense.' }),

    // Fortress
    U('fortress', 'gorgon', 'Gorgon', 5, 'melee', [70, 11, 16, 12, 16, 6, 9, 5, 220], {
      perks: { deathStare: 0.1 }, description: 'Its deadly gaze may slay extra creatures outright.' }),
    U('fortress', 'hydra', 'Hydra', 7, 'melee', [175, 16, 18, 25, 45, 5, 9, 2, 1100], {
      perks: { allAround: true, noRetaliation: true }, description: 'Many heads bite every adjacent enemy; none can retaliate.' }),

    // Conflux
    U('conflux', 'phoenix', 'Phoenix', 7, 'melee', [200, 21, 18, 30, 40, 13, 17, 2, 1500], {
      flying: true, perks: { breath: true, rebirth: 0.3 }, description: 'Firebird with breath attack that rises again from its ashes.' }),
  ];

  const pct = (x) => `${Math.round(x * 100)}%`;
  const PERK_INFO = {
    jousting: { label: 'Jousting', desc: (v) => `+${pct(v)} damage per hex moved before attacking` },
    hates: { label: 'Hatred', desc: (v) => `+50% damage vs ${v.map((id) => BY_ID[id].name).join(', ')}` },
    rangedArmor: { label: 'Shield wall', desc: (v) => `-${pct(v)} damage from ranged attacks` },
    doubleShot: { label: 'Double shot', desc: () => 'Shoots twice per turn' },
    bind: { label: 'Bind', desc: () => 'Target cannot move while the Dendroid is adjacent' },
    stun: { label: 'Stun', desc: (v) => `${v.name}: ${pct(v.chance)} chance on melee hit; target skips its next turn` },
    stoneSkin: { label: 'Stone skin', desc: (v) => `-${pct(v)} damage from all attacks` },
    noMeleePenalty: { label: 'No melee penalty', desc: () => 'Full damage in close combat' },
    noRetaliation: { label: 'No retaliation', desc: () => 'Enemies cannot retaliate' },
    threeHeaded: { label: 'Three heads', desc: () => 'Also bites enemies next to both it and the target' },
    fireShield: { label: 'Fire shield', desc: (v) => `Melee attackers take ${pct(v)} of the damage they deal` },
    teleport: { label: 'Teleport', desc: () => 'Ignores obstacles when moving' },
    undead: { label: 'Undead', desc: () => 'Immune to life drain' },
    regenerate: { label: 'Regeneration', desc: () => 'Top creature heals fully each turn' },
    lifeDrain: { label: 'Life drain', desc: () => 'Melee damage heals and revives the stack' },
    deathBlow: { label: 'Death blow', desc: (v) => `${pct(v)} chance to deal double damage` },
    strikeAndReturn: { label: 'Strike & return', desc: () => 'Returns to its starting hex after attacking' },
    breath: { label: 'Breath', desc: () => 'Also hits the unit behind the target (friend or foe)' },
    doubleStrike: { label: 'Double strike', desc: () => 'Strikes twice in melee' },
    ignoreDefense: { label: 'Rend armor', desc: (v) => `Ignores ${pct(v)} of target defense` },
    deathStare: { label: 'Death stare', desc: (v) => `Each creature has ${pct(v)} chance to slay one extra foe` },
    allAround: { label: 'Multi-head', desc: () => 'Attacks all adjacent enemies' },
    rebirth: { label: 'Rebirth', desc: (v) => `Once per battle, rises with ${pct(v)} of its stack` },
    flying: { label: 'Flying', desc: () => 'Flies over obstacles and units' },
    splash: { label: 'Splash', desc: () => 'Hits the target and all adjacent enemies' },
    retaliations: { label: 'Vigilant', desc: (v) => `Retaliates ${v} times per round` },
  };

  const BY_ID = {};
  for (const u of UNITS) {
    u.ranged = u.attackType === 'ranged' || !!u.ranged;
    u.flying = !!u.flying;
    u.retaliations = u.retaliations || 1;
    u.shots = u.shots || 0;
    u.perks = u.perks || {};
    BY_ID[u.id] = u;
  }

  // Perks to display for a unit, including implicit ones (flying, splash, extra retaliations).
  function perkList(def) {
    const out = [];
    if (def.flying && !def.perks.teleport) out.push(['flying', true]);
    if (def.attackType === 'splash') out.push(['splash', true]);
    if (def.retaliations > 1) out.push(['retaliations', def.retaliations]);
    for (const [k, v] of Object.entries(def.perks)) out.push([k, v]);
    return out.map(([k, v]) => ({
      key: k,
      label: k === 'stun' ? v.name : PERK_INFO[k].label,
      desc: PERK_INFO[k].desc(v),
    }));
  }

  const TYPE_LABEL = { melee: 'Close', ranged: 'Far', splash: 'Splash' };

  BH.Units = { UNITS, BY_ID, TYPE_LABEL, FACTIONS, PERK_INFO, perkList };
})(typeof window !== 'undefined' ? window : globalThis);
