(() => {
  const shuffle = (arr) => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const pick = (arr) => arr?.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  const GOLD_SP_CODES = new Set(['P-084', 'ST27-005', 'OP13-028', 'ST31-004']);

  class BoosterEngine {
    constructor(cards, rates = {}) {
      this.cards = cards;
      this.rates = rates || {};
      this.display = [];
      this.casePremiumCounts = [];
      this.casePremiumPlans = [];
      this.casePandaCounts = [];
      this.caseSpecialDonCounts = [];
      this.caseDisplayIndex = -1;
      this.currentDisplayPremiumTarget = 0;
      this.buildPools();
      this.newCase();
      this.newDisplay();
    }

    buildPools() {
      const standard = c => c.variant === 'STANDARD';
      const rarity = r => this.cards.filter(c => standard(c) && c.rarity === r);
      const isDon = c => ['DON', 'DON!!'].includes(String(c.rarity || '').toUpperCase()) || /^DON-/i.test(String(c.code || '')) || c.variant === 'DON';
      const isSuperParallel = c => String(c.originalVariant || '').toUpperCase().includes('SUPER_PARALLEL');
      const isSuperLeader = c => String(c.originalVariant || '').toUpperCase().includes('SUPER_LEADER');

      this.pools = {
        C: rarity('C'), UC: rarity('UC'), R: rarity('R'), L: rarity('L'), SR: rarity('SR'), SEC: rarity('SEC'),
        DON_STANDARD: this.cards.filter(c => isDon(c) && c.variant === 'STANDARD'),
        DON_SPECIAL: this.cards.filter(c => isDon(c) && c.variant !== 'STANDARD'),
        DON: this.cards.filter(isDon),
        AA_LEADER: this.cards.filter(c => c.variant === 'ALT' && c.rarity === 'L'),
        AA_OTHER: this.cards.filter(c => c.variant === 'ALT' && c.rarity !== 'L'),
        AA: this.cards.filter(c => c.variant === 'ALT'),
        MANGA: this.cards.filter(c => c.variant === 'MANGA'),
        PIRATE_CREW: this.cards.filter(isSuperParallel),
        SUPER_LEADER: this.cards.filter(isSuperLeader),
        SUPER: this.cards.filter(c => c.variant === 'SUPER ALT' && !isSuperParallel(c) && !isSuperLeader(c)),
        SUPER_RED: this.cards.filter(c => c.variant === 'SUPER ALT RED'),
        TR: this.cards.filter(c => c.variant === 'TREASURE RARE' || c.rarity === 'TR'),
        SP_GOLD: this.cards.filter(c => c.variant === 'SP' && GOLD_SP_CODES.has(String(c.code || '').toUpperCase())),
        SP_HAKI: this.cards.filter(c => c.variant === 'SP' && !GOLD_SP_CODES.has(String(c.code || '').toUpperCase())),
        SP: this.cards.filter(c => c.variant === 'SP'),
        PANDA: this.cards.filter(c => c.variant === 'PANDA'),
        GOLD: this.cards.filter(c => c.variant === 'GOLD'),
      };
      this.standardCards = this.cards.filter(c => standard(c) && !isDon(c));
    }

    unique(pool, used = []) {
      if (!pool?.length) return null;
      const keys = new Set(used.map(c => c.key));
      const options = pool.filter(c => !keys.has(c.key));
      return pick(options.length ? options : pool);
    }

    makeBasePack() {
      const out = [];
      for (let i = 0; i < 8; i++) {
        const c = this.unique(this.pools.C, out) || this.unique(this.standardCards, out);
        if (c) out.push(c);
      }
      for (let i = 0; i < 2; i++) {
        const c = this.unique(this.pools.UC, out) || this.unique(this.standardCards, out);
        if (c) out.push(c);
      }
      const rare = this.unique(this.pools.R, out) || this.unique(this.pools.L, out) || this.unique(this.standardCards, out);
      if (rare) out.push(rare);
      const wild = this.unique(this.pools.R, out) || this.unique(this.pools.L, out) || this.unique(this.standardCards, out);
      if (wild) out.push(wild);
      while (out.length < 12) {
        const c = this.unique(this.standardCards, out) || pick(this.cards);
        if (!c) break;
        out.push(c);
      }
      return out.slice(0, 12);
    }

    casePremiumTotal() {
      const candidates = [
        this.rates?.premium_hits_above_SR_per_case?.approx,
        this.rates?.premium_hits_per_case?.approx,
        this.rates?.hits_per_case?.approx,
        this.rates?.total_hits_per_case?.approx,
      ].map(Number).find(Number.isFinite);
      return Math.max(12, Math.min(48, Math.round(candidates || 22)));
    }

    distributeCount(total, displays = 12, maxPerDisplay = 2) {
      const counts = Array(displays).fill(0);
      let remaining = Math.max(0, Math.round(total));
      while (remaining > 0) {
        const eligible = counts.map((v, i) => v < maxPerDisplay ? i : -1).filter(i => i >= 0);
        if (!eligible.length) break;
        counts[pick(eligible)] += 1;
        remaining -= 1;
      }
      return counts;
    }

    makeCasePremiumCounts(target) {
      // V13.4 — Répartition plus naturelle des hits premium par display.
      // On conserve EXACTEMENT le total du carton (22 par défaut) et la plage 1–4,
      // mais on évite l'ancien système qui laissait trop souvent des displays à 1 hit.
      //
      // Pour un carton de 12 displays / 22 hits, le profil marginal obtenu est ~ :
      //   1 hit  : 25 %
      //   2 hits : 67 %
      //   3 hits : 6–7 %
      //   4 hits : ~1 %
      // Ces valeurs sont une calibration de simulation, pas des taux officiels Bandai.
      const displays = 12;
      const minTotal = displays;
      const maxTotal = displays * 4;
      const wanted = Math.max(minTotal, Math.min(maxTotal, Math.round(Number(target) || 22)));
      const weights = { 1: 0.25, 2: 0.65, 3: 0.08, 4: 0.02 };

      // DP : poids total de toutes les suites possibles pour "slots" displays
      // totalisant exactement "sum" hits. Cela permet de respecter le total carton
      // tout en conservant la préférence 2 hits > 1 hit > 3 hits > 4 hits.
      const memo = new Map();
      const completionWeight = (slots, sum) => {
        if (slots === 0) return sum === 0 ? 1 : 0;
        if (sum < slots || sum > slots * 4) return 0;
        const key = `${slots}:${sum}`;
        if (memo.has(key)) return memo.get(key);
        let totalWeight = 0;
        for (let hits = 1; hits <= 4; hits++) {
          totalWeight += weights[hits] * completionWeight(slots - 1, sum - hits);
        }
        memo.set(key, totalWeight);
        return totalWeight;
      };

      const counts = [];
      let remaining = wanted;
      for (let i = 0; i < displays; i++) {
        const slotsLeft = displays - i - 1;
        const options = [];
        let optionTotal = 0;
        for (let hits = 1; hits <= 4; hits++) {
          const future = completionWeight(slotsLeft, remaining - hits);
          const weight = weights[hits] * future;
          if (weight > 0) {
            options.push({ hits, weight });
            optionTotal += weight;
          }
        }

        let roll = Math.random() * optionTotal;
        let chosen = options.length ? options[options.length - 1].hits : 1;
        for (const option of options) {
          roll -= option.weight;
          if (roll <= 0) { chosen = option.hits; break; }
        }
        counts.push(chosen);
        remaining -= chosen;
      }

      return shuffle(counts);
    }

    makePremiumCategoryQueue(target) {
      // Audit V11.7: calibration autour des moyennes de carton observées.
      // Base 22 hits/case : ~10 AA non-leader + 4 leaders AA + ~5 SEC + 1 SP Haki + 1 SP Gold,
      // puis les TR / Manga / Super Parallel / Super Leader agissent comme des remplacements rares.
      const base = [
        ...Array(11).fill('AA_OTHER'),
        ...Array(4).fill('AA_LEADER'),
        ...Array(5).fill('SEC'),
        'SP_HAKI',
        'SP_GOLD',
      ];
      let queue = shuffle(base);
      if (target < queue.length) queue = queue.slice(0, target);
      while (queue.length < target) queue.push('AA_OTHER');
      return shuffle(queue);
    }

    newCase() {
      const displays = 12;
      const target = this.casePremiumTotal();
      this.casePremiumCounts = this.makeCasePremiumCounts(target);
      const queue = this.makePremiumCategoryQueue(target);
      this.casePremiumPlans = [];
      let cursor = 0;
      for (const count of this.casePremiumCounts) {
        this.casePremiumPlans.push(queue.slice(cursor, cursor + count));
        cursor += count;
      }

      const pandaRange = this.rates?.pandaman_secret_alt_per_case?.range || [6, 8];
      const pandaMin = Number(pandaRange[0]) || 6;
      const pandaMax = Number(pandaRange[1]) || 8;
      const pandaTotal = pandaMin + Math.floor(Math.random() * (Math.max(pandaMin, pandaMax) - pandaMin + 1));
      this.casePandaCounts = this.distributeCount(pandaTotal, displays, 2);

      const specialDonTotal = Math.round(Number(this.rates?.special_DON_per_case?.approx ?? 2));
      this.caseSpecialDonCounts = this.distributeCount(specialDonTotal, displays, 1);
      this.caseDisplayIndex = -1;
      return this.casePremiumCounts;
    }

    choosePremiumType(type, used = []) {
      const fallback = () => this.unique(this.pools.AA_OTHER, used) || this.unique(this.pools.AA, used) || this.unique(this.pools.SEC, used) || this.unique(this.pools.SR, used) || this.unique(this.standardCards, used);
      if (type === 'AA_LEADER') return this.unique(this.pools.AA_LEADER, used) || fallback();
      if (type === 'SEC') return this.unique(this.pools.SEC, used) || fallback();
      if (type === 'SP_HAKI') return this.unique(this.pools.SP_HAKI, used) || this.unique(this.pools.SP, used) || fallback();
      if (type === 'SP_GOLD') return this.unique(this.pools.SP_GOLD, used) || this.unique(this.pools.SP, used) || fallback();
      return this.unique(this.pools.AA_OTHER, used) || fallback();
    }

    auditedBoxes(key, fallback) {
      const value = Number(this.rates?.audited_rates?.[key]?.simulator_boxes ?? this.rates?.audited_rates?.[key]?.approx_boxes ?? fallback);
      return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    rollUltraForDisplay() {
      // Très faibles taux: estimations communautaires, jamais des garanties Bandai.
      if (this.pools.PIRATE_CREW.length && Math.random() < 1 / this.auditedBoxes('pirate_crew_super_parallel', 338)) return { card: pick(this.pools.PIRATE_CREW), kind: 'PIRATE_CREW' };
      if (this.pools.MANGA.length && Math.random() < 1 / this.auditedBoxes('manga_tier', 48)) return { card: pick(this.pools.MANGA), kind: 'MANGA' };
      if (this.pools.SUPER_LEADER.length && Math.random() < 1 / this.auditedBoxes('super_leader_parallel', 48)) return { card: pick(this.pools.SUPER_LEADER), kind: 'SUPER_LEADER' };
      if (this.pools.SUPER_RED.length && Math.random() < 1 / this.auditedBoxes('red_super_alt', 96)) return { card: pick(this.pools.SUPER_RED), kind: 'SUPER_RED' };
      return null;
    }

    rollTreasureRare() {
      const boxes = Number(this.rates?.audited_rates?.treasure_rare?.approx_boxes ?? 12);
      return this.pools.TR.length && Number.isFinite(boxes) && boxes > 0 && Math.random() < 1 / boxes ? pick(this.pools.TR) : null;
    }


    // V12.1 — Booster aléatoire totalement indépendant de la display.
    // Il utilise les taux marginaux audités, sans lire ni modifier this.display.
    randomPack() {
      const pack = this.makeBasePack();

      const displaySize = 24;
      const caseDisplays = 12;
      const premiumPerCase = this.casePremiumTotal();
      const premiumChance = Math.min(1, Math.max(0, premiumPerCase / (caseDisplays * displaySize)));
      const srChance = Math.min(1, Math.max(0, Number(this.rates.standard_SR_per_display ?? 7) / displaySize));

      // Ultra / TR sont des remplacements rares du slot premium.
      const absPirate = this.pools.PIRATE_CREW.length ? 1 / (this.auditedBoxes('pirate_crew_super_parallel', 338) * displaySize) : 0;
      const absManga = this.pools.MANGA.length ? 1 / (this.auditedBoxes('manga_tier', 48) * displaySize) : 0;
      const absSuperLeader = this.pools.SUPER_LEADER.length ? 1 / (this.auditedBoxes('super_leader_parallel', 48) * displaySize) : 0;
      const absSuperRed = this.pools.SUPER_RED.length ? 1 / (this.auditedBoxes('red_super_alt', 96) * displaySize) : 0;
      const trBoxes = Number(this.rates?.audited_rates?.treasure_rare?.approx_boxes ?? 12);
      const absTR = this.pools.TR.length && Number.isFinite(trBoxes) && trBoxes > 0 ? 1 / (trBoxes * displaySize) : 0;
      const rareReplacementTotal = absPirate + absManga + absSuperLeader + absSuperRed + absTR;

      const hitRoll = Math.random();
      if (hitRoll < premiumChance) {
        let r = Math.random() * premiumChance;
        let premium = null;
        if ((r -= absPirate) < 0) premium = pick(this.pools.PIRATE_CREW);
        else if ((r -= absManga) < 0) premium = pick(this.pools.MANGA);
        else if ((r -= absSuperLeader) < 0) premium = pick(this.pools.SUPER_LEADER);
        else if ((r -= absSuperRed) < 0) premium = pick(this.pools.SUPER_RED);
        else if ((r -= absTR) < 0) premium = pick(this.pools.TR);
        else {
          // Distribution de base du carton audité : 11 AA non-leader, 4 AA leader,
          // 5 SEC, 1 SP Haki, 1 SP Gold sur 22 hits premium environ.
          const baseTypes = [
            ...Array(11).fill('AA_OTHER'),
            ...Array(4).fill('AA_LEADER'),
            ...Array(5).fill('SEC'),
            'SP_HAKI',
            'SP_GOLD'
          ];
          premium = this.choosePremiumType(pick(baseTypes));
        }
        if (premium) pack[11] = premium;
      } else if (hitRoll < premiumChance + srChance) {
        const sr = this.unique(this.pools.SR, pack);
        if (sr) pack[11] = sr;
      }

      // 2 DON!! / display en moyenne, avec ~2 DON!! spéciales / carton en upgrade.
      const donChance = Math.min(1, Math.max(0, Number(this.rates.standard_DON_per_display ?? 2) / displaySize));
      if (Math.random() < donChance && this.pools.DON.length) {
        const specialPerCase = Math.max(0, Number(this.rates?.special_DON_per_case?.approx ?? 2));
        const standardDonPerCase = Math.max(1, Number(this.rates.standard_DON_per_display ?? 2) * caseDisplays);
        const specialUpgradeChance = Math.min(1, specialPerCase / standardDonPerCase);
        const wantsSpecial = Math.random() < specialUpgradeChance && this.pools.DON_SPECIAL.length;
        const don = this.unique(wantsSpecial ? this.pools.DON_SPECIAL : this.pools.DON_STANDARD, pack)
          || this.unique(this.pools.DON, pack);
        if (don) pack[10] = don;
      }

      // Panda Man est un bonus séparé. On prend le milieu de la fourchette 6–8 / carton.
      const pandaRange = this.rates?.pandaman_secret_alt_per_case?.range || [6,8];
      const pandaAvg = ((Number(pandaRange[0]) || 6) + (Number(pandaRange[1]) || 8)) / 2;
      const pandaChance = this.pools.PANDA.length ? Math.min(1, pandaAvg / (caseDisplays * displaySize)) : 0;
      if (Math.random() < pandaChance) {
        const panda = this.unique(this.pools.PANDA, pack);
        if (panda) pack[7] = panda;
      }

      return pack;
    }

    newDisplay() {
      this.caseDisplayIndex += 1;
      if (this.caseDisplayIndex >= this.casePremiumCounts.length) {
        this.newCase();
        this.caseDisplayIndex = 0;
      }

      const premiumPlan = [...(this.casePremiumPlans[this.caseDisplayIndex] || ['AA_OTHER'])];
      const premiumCount = premiumPlan.length;
      this.currentDisplayPremiumTarget = premiumCount;

      const packs = Array.from({ length: 24 }, (_, index) => ({ index, cards: this.makeBasePack(), opened: false, premium: false, sr: false, don: false, panda: false, ultra: false }));
      const indexes = shuffle([...Array(24).keys()]);

      const srCount = Math.max(0, Math.round(Number(this.rates.standard_SR_per_display ?? 7)));
      indexes.slice(0, Math.min(srCount, 24)).forEach(packIndex => {
        const pack = packs[packIndex];
        const sr = this.unique(this.pools.SR, pack.cards);
        if (sr) {
          pack.cards[11] = sr;
          pack.sr = true;
        }
      });

      const premiumCandidates = shuffle(indexes.filter(i => !packs[i].sr));
      const premiumCards = premiumPlan.map(type => this.choosePremiumType(type)).filter(Boolean);

      // TR : moyenne ~1/case, mais non garanti. On le simule en roll 1/12 par display,
      // puis il remplace un hit régulier au lieu d'ajouter artificiellement un hit.
      const tr = this.rollTreasureRare();
      if (tr && premiumCards.length) premiumCards[0] = tr;

      // Ultra-raretés : même logique de remplacement pour garder la structure 1–4 hits/display.
      const ultra = this.rollUltraForDisplay();
      if (ultra?.card && premiumCards.length) {
        const replaceIndex = premiumCards.length > 1 && tr ? 1 : 0;
        premiumCards[replaceIndex] = ultra.card;
      }

      premiumCards.slice(0, premiumCandidates.length).forEach((card, idx) => {
        const pack = packs[premiumCandidates[idx]];
        pack.cards[11] = card;
        pack.premium = true;
        const original = String(card.originalVariant || '').toUpperCase();
        pack.ultra = card.variant === 'MANGA' || original.includes('SUPER_PARALLEL') || original.includes('SUPER_LEADER') || card.variant === 'SUPER ALT RED';
      });

      // 2 DON!! standards/display. Les ~2 DON!! spéciales/case sont des upgrades du slot DON,
      // pas des hits premium supplémentaires.
      const donCount = Math.max(0, Math.round(Number(this.rates.standard_DON_per_display ?? 2)));
      const specialDonCount = this.caseSpecialDonCounts[this.caseDisplayIndex] || 0;
      if (this.pools.DON_STANDARD.length || this.pools.DON_SPECIAL.length) {
        const donPacks = shuffle([...Array(24).keys()]).slice(0, Math.min(donCount, 24));
        donPacks.forEach((packIndex, i) => {
          const pack = packs[packIndex];
          const wantsSpecial = i < specialDonCount && this.pools.DON_SPECIAL.length;
          const don = this.unique(wantsSpecial ? this.pools.DON_SPECIAL : this.pools.DON_STANDARD, pack.cards)
            || this.unique(this.pools.DON, pack.cards);
          if (don) {
            pack.cards[10] = don;
            pack.don = true;
            pack.specialDon = wantsSpecial;
          }
        });
      }

      // Panda Man : bonus séparé, remplace un slot commun/rare et ne consomme pas le hit premium.
      const pandaCount = this.casePandaCounts[this.caseDisplayIndex] || 0;
      if (pandaCount && this.pools.PANDA.length) {
        shuffle([...Array(24).keys()]).slice(0, pandaCount).forEach(packIndex => {
          const pack = packs[packIndex];
          const panda = this.unique(this.pools.PANDA, pack.cards);
          if (panda) {
            pack.cards[7] = panda;
            pack.panda = true;
          }
        });
      }

      this.display = packs;
      return this.display;
    }

    nextPack() {
      const pack = this.display.find(p => !p.opened);
      if (!pack) {
        this.newDisplay();
        return this.nextPack();
      }
      pack.opened = true;
      return pack.cards;
    }

    takePack(index) {
      const pack = this.display[Number(index)];
      if (!pack || pack.opened) return null;
      pack.opened = true;
      return pack.cards;
    }

    remaining() {
      return this.display.filter(p => !p.opened).length;
    }

    displayState() {
      return this.display.map(p => ({ index: p.index, opened: p.opened }));
    }

    displayInfo() {
      const premiumRemaining = this.display.filter(p => !p.opened && p.premium).length;
      const premiumOpened = this.display.filter(p => p.opened && p.premium).length;
      return {
        remaining: this.remaining(),
        total: 24,
        caseDisplay: this.caseDisplayIndex + 1,
        caseTotal: 12,
        premiumTarget: this.currentDisplayPremiumTarget,
        premiumRemaining,
        premiumOpened,
        srRemaining: this.display.filter(p => !p.opened && p.sr).length,
        donRemaining: this.display.filter(p => !p.opened && p.don).length,
        ultraRemaining: this.display.filter(p => !p.opened && p.ultra).length,
        casePremiumTotal: this.casePremiumCounts.reduce((a, b) => a + b, 0),
        casePremiumCounts: [...this.casePremiumCounts],
      };
    }
  }

  window.OP17BoosterEngine = BoosterEngine;
})();
