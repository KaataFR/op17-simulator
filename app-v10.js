(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const money = (value) => value == null || !Number.isFinite(Number(value))
    ? ''
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(value));
  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

  const els = {
    tabs: $$('.tab'), openingScreen: $('#openingScreen'), infoScreen: $('#infoScreen'), collectionScreen: $('#collectionScreen'),
    tableSurface: $('#tableSurface'), tableCards: $('#tableCards'), tableEmpty: $('#tableEmpty'), tableValue: $('#tableValue'), openedCountTable: $('#openedCountTable'),
    openingPanel: $('#openingPanel'), packHome: $('#packHome'), packStage: $('#packStage'), packBody: $('#packBody'), packTear: $('#packTear'), packFlash: $('#packFlash'), packParticles: $('#packParticles'),
    singleModeBtn: $('#singleModeBtn'), displayModeBtn: $('#displayModeBtn'), singleModePanel: $('#singleModePanel'), displayModePanel: $('#displayModePanel'), displayPackGrid: $('#displayPackGrid'), displayModeInfo: $('#displayModeInfo'), newDisplayBtn: $('#newDisplayBtn'),
    openBoosterBtn: $('#openBoosterBtn'), openedCount: $('#openedCount'), displayRemaining: $('#displayRemaining'), skipPackAnimation: $('#skipPackAnimation'), skipCardReveal: $('#skipCardReveal'), dataStatus: $('#dataStatus'),
    cardReveal: $('#cardReveal'), cardProgress: $('#cardProgress'), hitLabel: $('#hitLabel'), viewer: $('#viewer'), nextCardBack: $('#nextCardBack'), dragLayer: $('#dragLayer'), tiltLayer: $('#tiltLayer'), flipLayer: $('#flipLayer'), activeCard: $('#activeCard'), activeCardImage: $('#activeCardImage'), cardBack: $('#cardBack'), cardMeta: $('#cardMeta'), revealHint: $('#revealHint'), returnFromInspect: $('#returnFromInspect'),
    packSummary: $('#packSummary'), summaryKicker: $('#summaryKicker'), summaryTitle: $('#summaryTitle'), summaryValue: $('#summaryValue'), displayRecapStats: $('#displayRecapStats'), summaryCards: $('#summaryCards'), openAnotherBtn: $('#openAnotherBtn'), openAnotherLabel: $('#openAnotherLabel'),
    cardSearch: $('#cardSearch'), rateList: $('#rateList'), catalogSummary: $('#catalogSummary'), cardCatalog: $('#cardCatalog'),
    collectionUnique: $('#collectionUnique'), collectionTotal: $('#collectionTotal'), collectionValue: $('#collectionValue'), binderPage: $('.binder-page'), binderGrid: $('#binderGrid'), binderPrev: $('#binderPrev'), binderNext: $('#binderNext'), binderPageLabel: $('#binderPageLabel'),
    historyScreen: $('#historyScreen'), historyList: $('#historyList'), historyEmpty: $('#historyEmpty'), historyCount: $('#historyCount'), historyTotalValue: $('#historyTotalValue'), historyAverageValue: $('#historyAverageValue'),
    optionsBtn: $('#optionsBtn'), optionsMenu: $('#optionsMenu'),
    soundToggleBtn: $('#soundToggleBtn'), soundToggleIcon: $('#soundToggleIcon'), soundVolume: $('#soundVolume'), soundVolumeValue: $('#soundVolumeValue'),
    resetDataBtn: $('#resetDataBtn'), resetModal: $('#resetModal'), resetBackdrop: $('#resetBackdrop'), resetCancelBtn: $('#resetCancelBtn'), resetConfirmBtn: $('#resetConfirmBtn'), resetToast: $('#resetToast'),
    detailModal: $('#detailModal'), detailBackdrop: $('#detailBackdrop'), detailClose: $('#detailClose'), detailViewer: $('#detailViewer'), detailTiltLayer: $('#detailTiltLayer'), detailCard: $('#detailCard'), detailCardImage: $('#detailCardImage'), detailCardBack: $('#detailCardBack'), detailRarity: $('#detailRarity'), detailTitle: $('#detailTitle'), detailSubtitle: $('#detailSubtitle'), detailPrice: $('#detailPrice'), detailCode: $('#detailCode'), detailRarityText: $('#detailRarityText'), detailVariant: $('#detailVariant'), detailVersion: $('#detailVersion'), detailColor: $('#detailColor'), detailType: $('#detailType'), detailCost: $('#detailCost'), detailPower: $('#detailPower'), detailAttribute: $('#detailAttribute'), detailOwned: $('#detailOwned'), detailChance: $('#detailChance'), detailText: $('#detailText')
  };

  const COLLECTION_KEY = 'op17-v10-collection';
  const MODE_KEY = 'op17-v10-opening-mode';
  const RANDOM_OPENED_KEY = 'op17-v12-random-opened';
  const DISPLAY_OPENED_TOTAL_KEY = 'op17-v12-display-opened-total';
  const DISPLAY_HISTORY_KEY = 'op17-v12-display-history';
  const SFX_ENABLED_KEY = 'op17-v13-sfx-enabled';
  const SFX_VOLUME_KEY = 'op17-v13-sfx-volume';
  const state = {
    cards: [], rates: {}, source: '', engine: null,
    currentPack: null, currentPackMode: null, cardIndex: 0, inspectCard: null,
    randomOpened: Number(localStorage.getItem(RANDOM_OPENED_KEY) || 0),
    displayOpenedTotal: Number(localStorage.getItem(DISPLAY_OPENED_TOTAL_KEY) || 0),
    tableItems: [], interactionToken: 0, audio: null, isAnimating: false,
    sfxEnabled: localStorage.getItem(SFX_ENABLED_KEY) !== '0', sfxVolume: clamp(Number(localStorage.getItem(SFX_VOLUME_KEY) ?? 0.35), 0, 1), sfxPool: {}, lastRevealKey: null,
    openingMode: localStorage.getItem(MODE_KEY) === 'display' ? 'display' : 'single',
    collection: loadCollection(), binderPage: 0,
    displayHistory: loadDisplayHistory(), displayHistoryRecorded: false,
  };

  function loadCollection() {
    try {
      const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch (_) { return {}; }
  }

  function saveCollection() {
    try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(state.collection)); } catch (_) {}
  }


  function loadDisplayHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(DISPLAY_HISTORY_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (_) { return []; }
  }

  function saveDisplayHistory() {
    try { localStorage.setItem(DISPLAY_HISTORY_KEY, JSON.stringify(state.displayHistory)); } catch (_) {}
  }

  function collectionKey(card) {
    return String(card.id || `${card.code}|${card.variant}|${card.version ?? ''}|${card.name}`);
  }

  function registerPackPull(pack) {
    (pack || []).forEach(card => {
      const key = collectionKey(card);
      state.collection[key] = (Number(state.collection[key]) || 0) + 1;
    });
    saveCollection();
    renderCollectionStats();
  }

  function currentCard() {
    if (state.inspectCard) return state.inspectCard;
    return state.currentPack?.[state.cardIndex] || null;
  }

  function isOpeningPack() {
    return !!state.currentPack && state.cardIndex < state.currentPack.length && !state.inspectCard;
  }

  function showOnly(name) {
    els.packHome.hidden = name !== 'home';
    els.cardReveal.hidden = name !== 'card';
    els.packSummary.hidden = name !== 'summary';
  }

  function tableTotalValue() {
    return state.tableItems.reduce((sum, item) => sum + (Number(item.card?.price_eur) || 0), 0);
  }

  function updatePersistentHud() {
    els.openedCount.textContent = state.randomOpened;
    // Le tapis est commun : son compteur indique le total des ouvertures, tous modes confondus.
    els.openedCountTable.textContent = state.randomOpened + state.displayOpenedTotal;
    els.tableValue.textContent = money(tableTotalValue()) || '0,00 €';
  }

  function displayIsFullyRevealed(info) {
    if (!info || info.remaining !== 0) return false;
    if (!state.currentPack) return true;
    return state.cardIndex >= state.currentPack.length;
  }

  function setDisplayCounter() {
    const info = state.engine ? state.engine.displayInfo() : { remaining:24, premiumOpened:0 };
    const finished = displayIsFullyRevealed(info);
    els.displayRemaining.textContent = finished
      ? `0/24 · ${info.premiumOpened} hit${info.premiumOpened > 1 ? 's' : ''}`
      : `${info.remaining}/24`;
    renderDisplayGrid();
  }

  function hitText(card) {
    const variant = card.variant;
    if (variant === 'SUPER ALT RED') return '✦ SUPER ALT ROUGE';
    if (variant === 'MANGA') return '✦ MANGA';
    if (variant === 'SUPER ALT') return '✦ SUPER ALT';
    if (variant === 'TREASURE RARE') return '✦ TREASURE RARE';
    if (variant === 'SP') return '✦ SPECIAL';
    if (variant === 'ALT') return '✦ ALTERNATE ART';
    if (variant === 'PANDA') return '✦ PANDAMAN';
    if (card.rarity === 'SEC') return 'SECRET RARE';
    if (card.rarity === 'SR') return 'SUPER RARE';
    return '';
  }

  function rarityClass(rarity) {
    return String(rarity || 'C').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'c';
  }

  function rarityIcon(rarity) {
    return ({
      'C':'●', 'UC':'◆', 'R':'★', 'SR':'✦', 'SEC':'✹', 'L':'♛',
      'TR':'♦', 'PR':'✧', 'DON!!':'◈'
    })[String(rarity || '').toUpperCase()] || '●';
  }

  function rarityBadge(card, compact = false) {
    const rarity = String(card?.rarity || 'C').toUpperCase();
    return `<span class="rarity-badge rarity-${rarityClass(rarity)} ${compact ? 'compact' : ''}" title="Rareté ${escapeHtml(rarity)}"><span class="rarity-icon" aria-hidden="true">${rarityIcon(rarity)}</span><b>${escapeHtml(rarity)}</b></span>`;
  }

  function cardImageSrc(card) {
    return card?.image || card?.image_url || card?.fallbackImage || './assets/card-back-blue.png';
  }

  function cardMetaText(card) {
    const chunks = [card.code, card.rarity, card.variant !== 'STANDARD' ? card.variant : null].filter(Boolean);
    const price = money(card.price_eur);
    return `${rarityBadge(card, true)} <b>${escapeHtml(card.name)}</b><span> · ${escapeHtml(chunks.join(' · '))}</span>${price ? `<span class="price"> · ${escapeHtml(price)}</span>` : ''}`;
  }



  function formatPct(value) {
    if (!Number.isFinite(value)) return '—';
    if (value < 0.1) return `${value.toFixed(3).replace('.', ',')} %`;
    if (value < 1) return `${value.toFixed(2).replace('.', ',')} %`;
    return `${value.toFixed(1).replace('.', ',')} %`;
  }

  function poolForCard(card) {
    const pools = state.engine?.pools || {};
    const variant = String(card?.variant || '').toUpperCase();
    const rarity = String(card?.rarity || '').toUpperCase();
    const code = String(card?.code || '').toUpperCase();
    const originalVariant = String(card?.originalVariant || '').toUpperCase();
    const isDon = ['DON','DON!!'].includes(rarity) || /^DON-/.test(code) || variant === 'DON';
    const goldSpCodes = new Set(['P-084','ST27-005','OP13-028','ST31-004']);

    if (isDon && variant === 'STANDARD') return { key:'DON_STANDARD', pool:pools.DON_STANDARD || [], kind:'don-standard' };
    if (isDon) return { key:'DON_SPECIAL', pool:pools.DON_SPECIAL || [], kind:'don-special' };
    if (originalVariant.includes('SUPER_PARALLEL')) return { key:'PIRATE_CREW', pool:pools.PIRATE_CREW || [], kind:'ultra' };
    if (originalVariant.includes('SUPER_LEADER')) return { key:'SUPER_LEADER', pool:pools.SUPER_LEADER || [], kind:'ultra' };
    if (variant === 'MANGA') return { key:'MANGA', pool:pools.MANGA || [], kind:'ultra' };
    if (variant === 'SUPER ALT RED') return { key:'SUPER_RED', pool:pools.SUPER_RED || [], kind:'ultra' };
    if (variant === 'TREASURE RARE' || rarity === 'TR') return { key:'TR', pool:pools.TR || [], kind:'premium' };
    if (variant === 'PANDA') return { key:'PANDA', pool:pools.PANDA || [], kind:'bonus' };
    if (variant === 'SP') return { key:goldSpCodes.has(code) ? 'SP_GOLD' : 'SP_HAKI', pool:goldSpCodes.has(code) ? (pools.SP_GOLD || []) : (pools.SP_HAKI || []), kind:'premium' };
    if (variant === 'ALT' && rarity === 'L') return { key:'AA_LEADER', pool:pools.AA_LEADER || [], kind:'premium' };
    if (variant === 'ALT') return { key:'AA_OTHER', pool:pools.AA_OTHER || [], kind:'premium' };
    if (rarity === 'SEC' && variant === 'STANDARD') return { key:'SEC', pool:pools.SEC || [], kind:'premium' };
    if (rarity === 'SR' && variant === 'STANDARD') return { key:'SR', pool:pools.SR || [], kind:'sr' };
    if (rarity === 'C' && variant === 'STANDARD') return { key:'C', pool:pools.C || [], kind:'standard', slots:8 };
    if (rarity === 'UC' && variant === 'STANDARD') return { key:'UC', pool:pools.UC || [], kind:'standard', slots:2 };
    if ((rarity === 'R' || rarity === 'L') && variant === 'STANDARD') return { key:'R', pool:[...(pools.R || []), ...(pools.L || [])], kind:'standard', slots:2 };
    return { key:'OTHER', pool:state.cards.filter(c => c.rarity === card.rarity && c.variant === card.variant), kind:'standard', slots:1 };
  }

  function cardChanceDetails(card) {
    const bucket = poolForCard(card);
    const poolSize = Math.max(1, bucket.pool?.length || 0);
    const perCase = n => (Number(n) / (12 * 24)) * 100;
    const perDisplay = n => (Number(n) / 24) * 100;
    const perBoxes = n => (1 / (Number(n) * 24)) * 100;
    let groupPct = null;
    let displayLabel = 'Variable';
    let slotLabel = 'Slot du booster';
    let note = 'Estimation communautaire, non officielle.';

    if (bucket.key === 'PIRATE_CREW') {
      const boxes = Number(state.rates?.audited_rates?.pirate_crew_super_parallel?.simulator_boxes || 338);
      groupPct = perBoxes(boxes);
      displayLabel = `≈ 1 Pirate Crew Super Parallel / ${boxes} displays (toutes versions)`;
      slotLabel = 'Dernière carte / ultra-hit';
      note = 'Très faible confiance : les sources sur cette rareté divergent fortement. Le simulateur utilise le chiffre conservateur de 1/338 displays.';
    } else if (bucket.key === 'MANGA') {
      const boxes = Number(state.rates?.audited_rates?.manga_tier?.simulator_boxes || 48);
      groupPct = perBoxes(boxes);
      displayLabel = '≈ 1 Manga (tier complet) / 3 à 4 cartons';
      slotLabel = 'Dernière carte / ultra-hit';
      note = 'Fourchette recoupée : environ 36 à 48 displays pour un Manga, tous Manga confondus. Le moteur retient 48 displays par prudence.';
    } else if (bucket.key === 'SUPER_LEADER') {
      const boxes = Number(state.rates?.audited_rates?.super_leader_parallel?.simulator_boxes || 48);
      groupPct = perBoxes(boxes);
      displayLabel = `≈ 1 / ${boxes} displays dans le modèle`;
      slotLabel = 'Dernière carte / ultra-hit';
      note = 'Faible confiance : pas de consensus isolé robuste pour le Super Leader. Valeur conservatrice de simulation.';
    } else if (bucket.key === 'SUPER_RED') {
      const boxes = Number(state.rates?.audited_rates?.red_super_alt?.simulator_boxes || 96);
      groupPct = perBoxes(boxes);
      displayLabel = `≈ 1 / ${boxes} displays dans le modèle`;
      slotLabel = 'Dernière carte / ultra-hit';
      note = 'Estimation communautaire à faible confiance.';
    } else if (bucket.key === 'DON_STANDARD') {
      groupPct = perDisplay(state.rates?.standard_DON_per_display ?? 2);
      displayLabel = '≈ 2 DON!! standards / display';
      slotLabel = 'Slot DON!! près de la fin';
      note = 'Taux très stable dans les relevés communautaires récents.';
    } else if (bucket.key === 'DON_SPECIAL') {
      groupPct = perCase(state.rates?.special_DON_per_case?.approx ?? 2);
      displayLabel = '≈ 2 DON!! spéciales / carton de 12 displays';
      slotLabel = 'Upgrade du slot DON!!';
      note = 'Moyenne de carton communautaire, pas une garantie fabricant.';
    } else if (bucket.key === 'SR') {
      groupPct = perDisplay(state.rates?.standard_SR_per_display ?? 7);
      displayLabel = '≈ 7 SR standards / display';
      slotLabel = 'Dernière carte / slot SR';
      note = 'C’est le chiffre le plus stable et le mieux recoupé du set.';
    } else if (bucket.key === 'AA_LEADER') {
      groupPct = perCase(state.rates?.alt_art_leader_per_case?.approx ?? 4);
      displayLabel = '≈ 4 Leaders AA / carton';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Moyenne de carton recoupée sur plusieurs relevés.';
    } else if (bucket.key === 'AA_OTHER') {
      groupPct = perCase(state.rates?.alt_art_parallel_per_case?.approx ?? 10);
      displayLabel = '≈ 10 Alt Arts / Parallels non-leader / carton';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Moyenne de carton. La composition exacte varie fortement d’un carton à l’autre.';
    } else if (bucket.key === 'SEC') {
      groupPct = perCase(state.rates?.SEC_per_case?.approx ?? 5);
      displayLabel = '≈ 1 SEC tous les 2 à 3 displays';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Les relevés convergent vers environ 4 à 6 SEC par carton, centre du modèle : 5.';
    } else if (bucket.key === 'SP_HAKI') {
      groupPct = perCase(state.rates?.SP_haki_per_case?.approx ?? 1);
      displayLabel = '≈ 1 SP Haki des Rois / carton';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Estimation de carton, confiance moyenne.';
    } else if (bucket.key === 'SP_GOLD') {
      groupPct = perCase(state.rates?.SP_gold_per_case?.approx ?? 1);
      displayLabel = '≈ 1 SP dorée 4th Anniversary / carton';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Estimation de carton, confiance moyenne.';
    } else if (bucket.key === 'TR') {
      groupPct = perBoxes(state.rates?.audited_rates?.treasure_rare?.approx_boxes ?? 12);
      displayLabel = '≈ 1 TR / carton en moyenne, non garanti';
      slotLabel = 'Dernière carte / hit premium';
      note = 'Le moteur traite la TR comme un roll 1/12 par display, donc une case peut en avoir 0 ou plus d’une.';
    } else if (bucket.key === 'PANDA') {
      const range = state.rates?.pandaman_secret_alt_per_case?.range || [6,8];
      groupPct = perCase((Number(range[0]) + Number(range[1])) / 2);
      displayLabel = '≈ 6 à 8 Panda Man / carton';
      slotLabel = 'Slot bonus, ne consomme pas le hit premium';
      note = 'Bonus séparé du hit premium principal dans le modèle.';
    } else {
      const slots = Number(bucket.slots || 1);
      groupPct = (slots / poolSize) * 100;
      displayLabel = 'Carte de base du booster';
      slotLabel = bucket.key === 'R' ? 'Slots Rare / wild' : 'Slots standards';
      note = 'Approximation structurelle du booster, pas un taux fabricant.';
      return { specificBoosterPct: groupPct, perDisplay: displayLabel, slotLabel, poolSize, note };
    }

    const specificBoosterPct = Number.isFinite(groupPct) ? groupPct / poolSize : null;
    return { specificBoosterPct, perDisplay: displayLabel, slotLabel, poolSize, note };
  }

  function openDetail(card) {
    if (!card || !els.detailModal) return;
    const qty = Number(state.collection[collectionKey(card)]) || 0;
    const details = cardChanceDetails(card);
    const image = cardImageSrc(card);
    els.detailCardImage.onerror = () => { els.detailCardImage.src = card.fallbackImage || './assets/card-back-blue.png'; };
    els.detailCardImage.src = image;
    els.detailCardImage.alt = card.name;
    els.detailCardBack.style.backgroundImage = `url("${card.backImage || './assets/card-back-blue.png'}")`;
    els.detailCard.dataset.holo = card.holoStyle || 'none';
    els.detailCard.style.setProperty('--mx', '50%');
    els.detailCard.style.setProperty('--my', '50%');
    els.detailTiltLayer.style.transform = 'rotateX(0deg) rotateY(0deg)';

    els.detailRarity.innerHTML = rarityBadge(card);
    els.detailTitle.textContent = card.name || 'Carte inconnue';
    els.detailSubtitle.textContent = [card.code, card.rarity, card.variant !== 'STANDARD' ? card.variant : null].filter(Boolean).join(' · ');
    els.detailPrice.textContent = money(card.price_eur) || '—';
    els.detailCode.textContent = card.code || '—';
    els.detailRarityText.textContent = card.rarity || '—';
    els.detailVariant.textContent = card.variant || 'STANDARD';
    els.detailVersion.textContent = card.version ? `V${card.version}` : 'V1';
    els.detailColor.textContent = card.color || '—';
    els.detailType.textContent = card.type || '—';
    els.detailCost.textContent = card.cost ?? '—';
    els.detailPower.textContent = card.power ?? '—';
    els.detailAttribute.textContent = card.attribute || '—';
    els.detailOwned.textContent = String(qty);
    els.detailText.textContent = card.text || 'Aucun texte renseigné dans le dataset.';
    els.detailChance.innerHTML = `
      <div class="chance-row"><span>Chance simulée / booster</span><b>${formatPct(details.specificBoosterPct)}</b></div>
      <div class="chance-row"><span>Distribution / display</span><b>${escapeHtml(details.perDisplay)}</b></div>
      <div class="chance-row"><span>Slot concerné</span><b>${escapeHtml(details.slotLabel)}</b></div>
      <div class="chance-row"><span>Taille du pool</span><b>${details.poolSize} carte${details.poolSize > 1 ? 's' : ''}</b></div>
      <p class="chance-note">${escapeHtml(details.note)}</p>`;

    els.detailModal.hidden = false;
    els.detailModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    if (!els.detailModal) return;
    els.detailModal.hidden = true;
    els.detailModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function openOptionsMenu() {
    if (!els.optionsMenu || !els.optionsBtn) return;
    els.optionsMenu.hidden = false;
    els.optionsBtn.setAttribute('aria-expanded', 'true');
  }

  function closeOptionsMenu() {
    if (!els.optionsMenu || !els.optionsBtn) return;
    els.optionsMenu.hidden = true;
    els.optionsBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleOptionsMenu(force) {
    if (!els.optionsMenu || !els.optionsBtn) return;
    const shouldOpen = typeof force === 'boolean' ? force : els.optionsMenu.hidden;
    if (shouldOpen) openOptionsMenu();
    else closeOptionsMenu();
  }

  function openResetConfirmation() {
    closeOptionsMenu();
    if (!els.resetModal) return;
    els.resetModal.hidden = false;
    els.resetModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => els.resetCancelBtn?.focus(), 0);
  }

  function closeResetConfirmation() {
    if (!els.resetModal) return;
    els.resetModal.hidden = true;
    els.resetModal.setAttribute('aria-hidden', 'true');
    if (els.detailModal?.hidden !== false) document.body.style.overflow = '';
  }

  function showResetToast() {
    if (!els.resetToast) return;
    els.resetToast.hidden = false;
    els.resetToast.classList.remove('show');
    requestAnimationFrame(() => els.resetToast.classList.add('show'));
    clearTimeout(showResetToast.timer);
    showResetToast.timer = setTimeout(() => {
      els.resetToast.classList.remove('show');
      setTimeout(() => { els.resetToast.hidden = true; }, 180);
    }, 1800);
  }

  function resetAllSimulatorData() {
    // Ne touche qu'aux données OP17 afin d'éviter d'effacer d'autres apps hébergées sur le même localhost.
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^op17[-_]/i.test(key)) keys.push(key);
    }
    keys.forEach(key => localStorage.removeItem(key));

    state.currentPack = null;
    state.currentPackMode = null;
    state.cardIndex = 0;
    state.inspectCard = null;
    state.randomOpened = 0;
    state.displayOpenedTotal = 0;
    state.tableItems = [];
    state.collection = {};
    state.binderPage = 0;
    state.displayHistory = [];
    state.displayHistoryRecorded = false;
    state.openingMode = 'single';
    state.sfxEnabled = true;
    state.sfxVolume = .35;
    state.lastRevealKey = null;
    state.interactionToken += 1;
    state.isAnimating = false;
    if (state.cards.length) state.engine = new window.OP17BoosterEngine(state.cards, state.rates);

    if (els.skipPackAnimation) els.skipPackAnimation.checked = false;
    if (els.skipCardReveal) els.skipCardReveal.checked = false;
    closeDetail();
    closeResetConfirmation();
    closeOptionsMenu();
    showOnly('home');
    renderTable();
    renderCollectionStats();
    renderBinder();
    renderHistory();
    renderOpeningMode();
    setDisplayCounter();
    updatePersistentHud();
    updateSoundToggle();
    switchTab('opening');
    if (els.openBoosterBtn) els.openBoosterBtn.disabled = !state.engine;
    showResetToast();
  }

  function attachDetailInteraction() {
    if (!els.detailViewer) return;
    const rect = () => els.detailViewer.getBoundingClientRect();
    const update = (clientX, clientY) => {
      const r = rect();
      const px = clamp((clientX - r.left) / r.width, 0, 1);
      const py = clamp((clientY - r.top) / r.height, 0, 1);
      const rx = (0.5 - py) * 24;
      const ry = (px - 0.5) * 30;
      els.detailCard.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
      els.detailCard.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
      els.detailTiltLayer.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    };
    els.detailViewer.onpointermove = (event) => update(event.clientX, event.clientY);
    els.detailViewer.onpointerleave = () => { els.detailTiltLayer.style.transform = 'rotateX(0deg) rotateY(0deg)'; els.detailCard.style.setProperty('--mx', '50%'); els.detailCard.style.setProperty('--my', '50%'); };
  }

  const SFX_LIBRARY = {
    ui:       { src:'./assets/audio/ui_click.wav',         volume:.20 },
    pack:     { src:'./assets/audio/booster_open.wav',     volume:.62 },
    swipe:    { src:'./assets/audio/card_swipe.wav',       volume:.30 },
    place:    { src:'./assets/audio/card_place.wav',       volume:.30 },
    page:     { src:'./assets/audio/page_turn.wav',        volume:.30 },
    sparkle:  { src:'./assets/audio/rare_sparkle.wav',     volume:.45 },
    premium:  { src:'./assets/audio/premium_whoosh.wav',   volume:.62 },
    success:  { src:'./assets/audio/display_success.wav',  volume:.52 },
  };

  function preloadSfx() {
    Object.entries(SFX_LIBRARY).forEach(([name, config]) => {
      try {
        const audio = new Audio(config.src);
        audio.preload = 'auto';
        state.sfxPool[name] = audio;
      } catch (_) {}
    });
  }

  function playSfx(name, options = {}) {
    if (!state.sfxEnabled) return;
    const config = SFX_LIBRARY[name];
    if (!config) return;
    try {
      const base = state.sfxPool[name] || new Audio(config.src);
      const audio = base.cloneNode(true);
      audio.volume = clamp((options.volume ?? 1) * config.volume * state.sfxVolume, 0, 1);
      audio.playbackRate = clamp(options.rate ?? 1, .75, 1.35);
      const promise = audio.play();
      if (promise?.catch) promise.catch(() => {});
    } catch (_) {}
  }

  function updateSoundToggle() {
    if (!els.soundToggleBtn) return;
    const audible = state.sfxEnabled && state.sfxVolume > 0;
    els.soundToggleBtn.setAttribute('aria-pressed', audible ? 'true' : 'false');
    els.soundToggleBtn.setAttribute('aria-label', audible ? 'Couper les sons' : 'Activer les sons');
    els.soundToggleBtn.title = audible ? 'Couper les sons' : 'Activer les sons';
    if (els.soundToggleIcon) {
      els.soundToggleIcon.textContent = !audible ? '🔇' : state.sfxVolume < .5 ? '🔉' : '🔊';
    }
    els.soundToggleBtn.classList.toggle('muted', !audible);
    if (els.soundVolume) els.soundVolume.value = String(Math.round(state.sfxVolume * 100));
    if (els.soundVolumeValue) els.soundVolumeValue.textContent = `${Math.round(state.sfxVolume * 100)}%`;
    document.documentElement.style.setProperty('--sound-volume-pct', `${Math.round(state.sfxVolume * 100)}%`);
  }

  function setSoundVolume(value, preview = false) {
    const normalized = clamp(Number(value) / 100, 0, 1);
    state.sfxVolume = normalized;
    if (normalized > 0) state.sfxEnabled = true;
    localStorage.setItem(SFX_VOLUME_KEY, String(normalized));
    localStorage.setItem(SFX_ENABLED_KEY, state.sfxEnabled ? '1' : '0');
    updateSoundToggle();
    if (preview && normalized > 0) playSfx('ui', { volume:.55 });
  }

  function toggleSound() {
    const audible = state.sfxEnabled && state.sfxVolume > 0;
    if (audible) {
      playSfx('ui', { volume:.55 });
      state.sfxEnabled = false;
    } else {
      if (state.sfxVolume <= 0) state.sfxVolume = .35;
      state.sfxEnabled = true;
      playSfx('ui', { volume:.55 });
    }
    localStorage.setItem(SFX_ENABLED_KEY, state.sfxEnabled ? '1' : '0');
    localStorage.setItem(SFX_VOLUME_KEY, String(state.sfxVolume));
    updateSoundToggle();
  }

  function isUltraReveal(card) {
    const variant = String(card?.variant || '').toUpperCase();
    return variant === 'MANGA' || variant === 'SUPER ALT' || variant === 'SUPER ALT RED' || variant === 'SUPER LEADER';
  }

  function isRareReveal(card) {
    const variant = String(card?.variant || '').toUpperCase();
    const rarity = String(card?.rarity || '').toUpperCase();
    return ['SR','SEC'].includes(rarity) || ['ALT','SP','TREASURE RARE','PANDA','GOLD'].includes(variant);
  }

  function playCardRevealSfx(card) {
    if (!card || !isOpeningPack()) return;
    const key = `${collectionKey(card)}|${state.cardIndex}|${state.currentPackMode || ''}`;
    if (state.lastRevealKey === key) return;
    state.lastRevealKey = key;
    if (isUltraReveal(card)) playSfx('premium');
    else if (isRareReveal(card)) playSfx('sparkle');
  }

  // Backward-compatible aliases for the old calls that remain in a few UI paths.
  function sound(kind = 'soft') {
    if (kind === 'hit') playSfx('premium');
    else playSfx('ui');
  }

  function resetCardTransforms() {
    els.dragLayer.style.transition = '';
    els.dragLayer.style.transform = '';
    els.dragLayer.style.opacity = '1';
    els.tiltLayer.style.transition = 'transform .16s ease-out';
    els.tiltLayer.style.transform = '';
    els.flipLayer.style.transform = '';
    els.activeCard.classList.remove('dragging');
    els.tableSurface.classList.remove('drop-target');
    els.viewer.classList.remove('dragging', 'peeking', 'drop-gesture', 'horizontal-swipe', 'swipe-left', 'swipe-right', 'over-table');
    els.viewer.style.setProperty('--peek-height', '0px');
  }

  function prepareCard(card) {
    const image = cardImageSrc(card);
    els.activeCardImage.onerror = () => {
      const fallback = card.fallbackImage || './assets/card-back-blue.png';
      if (els.activeCardImage.src !== new URL(fallback, location.href).href) {
        els.activeCardImage.onerror = () => { els.activeCardImage.onerror = null; els.activeCardImage.src = './assets/card-back-blue.png'; };
        els.activeCardImage.src = fallback;
      }
    };
    els.activeCardImage.src = image;
    els.activeCardImage.alt = card.name;
    els.cardBack.style.backgroundImage = `url("${card.backImage || './assets/card-back-blue.png'}")`;
    const nextCard = !state.inspectCard ? state.currentPack?.[state.cardIndex + 1] : null;
    if (nextCard) {
      const nextImage = cardImageSrc(nextCard);
      els.nextCardBack.style.backgroundImage = `url("${nextImage}")`;
      els.nextCardBack.hidden = false;
      els.nextCardBack.setAttribute('aria-label', `Carte suivante : ${nextCard.name || ''}`);
    } else {
      els.nextCardBack.hidden = true;
      els.nextCardBack.style.backgroundImage = '';
    }
    els.activeCard.dataset.holo = card.holoStyle || 'none';
    els.cardMeta.innerHTML = cardMetaText(card);
    els.hitLabel.textContent = hitText(card);
    els.cardProgress.textContent = state.inspectCard ? 'Inspection' : `Carte ${state.cardIndex + 1} / ${state.currentPack.length}`;
    els.cardReveal.classList.toggle('inspect-mode', Boolean(state.inspectCard));
    els.revealHint.textContent = state.inspectCard
      ? 'Carte inspectée en détail. Déplace ta souris pour faire tourner la carte.'
      : 'Glisse vers le bas sur le tapis pour sauvegarder la carte. Glisse vers la droite pour passer à la suivante.';
    els.returnFromInspect.hidden = !state.inspectCard;
  }

  function animateFlipIn(card) {
    state.interactionToken += 1;
    prepareCard(card);
    resetCardTransforms();
    els.flipLayer.style.transition = 'none';
    els.flipLayer.style.transform = 'none';
    els.dragLayer.style.transition = 'none';
    els.dragLayer.style.opacity = '1';
    els.dragLayer.style.transform = 'translate3d(0,0,0)';
  }

  function showCurrentCard({ flip = true } = {}) {
    const card = currentCard();
    if (!card) { finishPack(); return; }
    showOnly('card');
    if (flip) animateFlipIn(card);
    else { prepareCard(card); resetCardTransforms(); }
    attachViewerInteraction();
    playCardRevealSfx(card);
  }

  function packAnimation() {
    return new Promise(resolve => {
      playSfx('pack');
      if (state.openingMode === 'display' || els.skipPackAnimation.checked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { resolve(); return; }
      state.isAnimating = true;
      els.packStage.classList.remove('idle');
      els.packStage.classList.add('opening');
      setTimeout(() => {
        els.packStage.classList.remove('opening');
        els.packStage.classList.add('idle');
        state.isAnimating = false;
        resolve();
      }, 790);
    });
  }

  async function openPreparedPack(pack, sourceMode) {
    if (!pack || state.isAnimating) return;
    state.inspectCard = null;
    state.currentPack = pack;
    state.currentPackMode = sourceMode;
    state.cardIndex = 0;
    state.lastRevealKey = null;

    if (sourceMode === 'display') {
      state.displayOpenedTotal += 1;
      localStorage.setItem(DISPLAY_OPENED_TOTAL_KEY, String(state.displayOpenedTotal));
    } else {
      state.randomOpened += 1;
      localStorage.setItem(RANDOM_OPENED_KEY, String(state.randomOpened));
    }

    registerPackPull(pack);
    updatePersistentHud();
    if (sourceMode === 'display') setDisplayCounter();
    els.openBoosterBtn.disabled = true;
    await packAnimation();
    els.openBoosterBtn.disabled = false;
    if (els.skipCardReveal.checked) finishPack();
    else showCurrentCard({ flip: false });
  }

  async function openBooster() {
    if (!state.engine || state.isAnimating) return;
    // IMPORTANT : le mode Booster ne touche jamais à la display.
    const pack = state.engine.randomPack();
    await openPreparedPack(pack, 'single');
  }

  async function openDisplayPack(index) {
    if (!state.engine || state.isAnimating || isOpeningPack()) return;
    const pack = state.engine.takePack(index);
    if (!pack) return;
    await openPreparedPack(pack, 'display');
  }

  function packTotalValue() {
    return (state.currentPack || []).reduce((sum, card) => sum + (Number(card.price_eur) || 0), 0);
  }

  function displayAllCards() {
    if (!state.engine?.display) return [];
    return state.engine.display.flatMap(pack => Array.isArray(pack.cards) ? pack.cards : []);
  }

  function rarityRank(card) {
    const variant = String(card?.variant || '').toUpperCase();
    const rarity = String(card?.rarity || '').toUpperCase();
    if (variant.includes('SUPER ALT RED')) return 100;
    if (variant.includes('SUPER') || variant.includes('MANGA')) return 95;
    if (variant.includes('TREASURE')) return 90;
    if (variant === 'SP' || rarity === 'SP') return 85;
    if (variant === 'ALT') return 78;
    if (rarity === 'SEC') return 72;
    if (rarity === 'SR') return 60;
    if (rarity === 'R') return 45;
    if (rarity === 'DON') return variant === 'ALT' ? 70 : 30;
    return 10;
  }

  function displayBestCards(limit = 6) {
    const grouped = new Map();
    displayAllCards().forEach(card => {
      const key = collectionKey(card);
      const row = grouped.get(key) || { card, qty: 0 };
      row.qty += 1;
      grouped.set(key, row);
    });
    return [...grouped.values()]
      .sort((a, b) => {
        const priceDiff = (Number(b.card?.price_eur) || 0) - (Number(a.card?.price_eur) || 0);
        if (priceDiff) return priceDiff;
        return rarityRank(b.card) - rarityRank(a.card);
      })
      .slice(0, limit);
  }


  function historyCardSnapshot(card, qty = 1) {
    return {
      key: collectionKey(card),
      name: card?.name || 'Carte inconnue',
      code: card?.code || '',
      rarity: card?.rarity || '',
      variant: card?.variant || 'STANDARD',
      version: Number(card?.version || 1),
      price_eur: Number(card?.price_eur) || 0,
      image: cardImageSrc(card),
      qty: Number(qty) || 1,
    };
  }

  function recordCompletedDisplay() {
    if (state.displayHistoryRecorded) return;
    const cards = displayAllCards();
    if (!cards.length) return;
    const info = state.engine?.displayInfo?.() || {};
    if (Number(info.remaining) !== 0) return;

    const total = cards.reduce((sum, card) => sum + (Number(card?.price_eur) || 0), 0);
    const srCount = cards.filter(card => String(card?.rarity || '').toUpperCase() === 'SR' && String(card?.variant || '').toUpperCase() === 'STANDARD').length;
    const donCount = cards.filter(card => String(card?.rarity || '').toUpperCase() === 'DON').length;
    const best = displayBestCards(6).map(entry => historyCardSnapshot(entry.card, entry.qty));
    const nextNumber = state.displayHistory.reduce((max, entry) => Math.max(max, Number(entry.number) || 0), 0) + 1;

    state.displayHistory.unshift({
      id: `display-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      number: nextNumber,
      completedAt: new Date().toISOString(),
      totalValue: total,
      boosters: 24,
      premiumHits: Number(info.premiumOpened || 0),
      srCount,
      donCount,
      best,
    });
    state.displayHistory = state.displayHistory.slice(0, 100);
    state.displayHistoryRecorded = true;
    saveDisplayHistory();
    renderHistory();
  }

  function formatHistoryDate(value) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value));
    } catch (_) { return 'Date inconnue'; }
  }

  function renderHistory() {
    if (!els.historyList || !els.historyEmpty) return;
    const entries = state.displayHistory || [];
    const totalValue = entries.reduce((sum, entry) => sum + (Number(entry.totalValue) || 0), 0);
    const average = entries.length ? totalValue / entries.length : 0;
    els.historyCount.textContent = entries.length;
    els.historyTotalValue.textContent = money(totalValue) || '0,00 €';
    els.historyAverageValue.textContent = money(average) || '0,00 €';
    els.historyEmpty.hidden = entries.length > 0;

    els.historyList.innerHTML = entries.map((entry, idx) => {
      const pulls = (entry.best || []).slice(0, 6).map(card => `
        <button class="history-pull" type="button" data-history-card-key="${escapeHtml(card.key || '')}" title="${escapeHtml(card.name || '')}">
          ${card.image ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name || '')}">` : ''}
          ${card.qty > 1 ? `<span class="history-pull-qty">×${card.qty}</span>` : ''}
          <span><b>${escapeHtml(card.name || '')}</b><small>${escapeHtml(card.rarity || '')}${card.variant && card.variant !== 'STANDARD' ? ` · ${escapeHtml(card.variant)}` : ''}</small></span>
        </button>`).join('');
      return `<article class="history-entry">
        <div class="history-entry-main">
          <div class="history-entry-index"><span>DISPLAY</span><b>#${escapeHtml(String(entry.number || entries.length - idx))}</b></div>
          <div class="history-entry-meta">
            <time>${escapeHtml(formatHistoryDate(entry.completedAt))}</time>
            <div class="history-entry-chips">
              <span>24 boosters</span>
              <span>${Number(entry.premiumHits || 0)} hit${Number(entry.premiumHits || 0) > 1 ? 's' : ''} premium</span>
              <span>${Number(entry.srCount || 0)} SR</span>
              <span>${Number(entry.donCount || 0)} DON!!</span>
            </div>
          </div>
          <div class="history-entry-value"><span>Valeur totale</span><b>${escapeHtml(money(entry.totalValue) || '0,00 €')}</b></div>
        </div>
        <div class="history-pulls">${pulls || '<span class="history-no-pulls">Aucun pull enregistré.</span>'}</div>
      </article>`;
    }).join('');
  }

  function renderDisplayRecap() {
    const cards = displayAllCards();
    const info = state.engine?.displayInfo?.() || {};
    const total = cards.reduce((sum, card) => sum + (Number(card?.price_eur) || 0), 0);
    const best = displayBestCards(6);
    const srCount = cards.filter(card => String(card?.rarity || '').toUpperCase() === 'SR' && String(card?.variant || '').toUpperCase() === 'STANDARD').length;
    const donCount = cards.filter(card => String(card?.rarity || '').toUpperCase() === 'DON').length;

    els.summaryKicker.textContent = 'DISPLAY TERMINÉE';
    els.summaryTitle.textContent = 'Tes meilleurs pulls';
    els.summaryValue.textContent = `Valeur indicative de la display : ${money(total) || '—'}`;
    els.openAnotherLabel.textContent = 'Retour à la display';
    els.displayRecapStats.hidden = false;
    els.displayRecapStats.innerHTML = `
      <span><b>24</b> boosters</span>
      <span><b>${Number(info.premiumOpened || 0)}</b> hits premium</span>
      <span><b>${srCount}</b> SR</span>
      <span><b>${donCount}</b> DON!!</span>`;

    els.summaryCards.classList.add('display-best-cards');
    els.summaryCards.innerHTML = best.map((entry, index) => {
      const card = entry.card;
      const price = money(card.price_eur) || 'Prix inconnu';
      return `<button class="summary-card display-best-card" data-display-best-key="${escapeHtml(collectionKey(card))}" type="button" title="${escapeHtml(card.name)}">
        <span class="best-rank">#${index + 1}</span>
        ${cardImageSrc(card) ? `<img src="${escapeHtml(cardImageSrc(card))}" alt="${escapeHtml(card.name)}">` : ''}
        ${entry.qty > 1 ? `<span class="best-qty">×${entry.qty}</span>` : ''}
        <span class="best-card-info"><b>${escapeHtml(card.name)}</b><small>${escapeHtml(card.rarity)}${card.variant && card.variant !== 'STANDARD' ? ` · ${escapeHtml(card.variant)}` : ''}</small><strong>${escapeHtml(price)}</strong></span>
      </button>`;
    }).join('');
  }

  function renderBoosterSummary() {
    els.summaryKicker.textContent = 'BOOSTER OUVERT';
    els.summaryTitle.textContent = 'Voici tes 12 cartes';
    els.openAnotherLabel.textContent = 'Ouvrir un autre booster';
    els.displayRecapStats.hidden = true;
    els.displayRecapStats.innerHTML = '';
    els.summaryCards.classList.remove('display-best-cards');
    els.summaryCards.innerHTML = (state.currentPack || []).map((card, index) => `
      <button class="summary-card" data-index="${index}" type="button" title="${escapeHtml(card.name)}">
        ${cardImageSrc(card) ? `<img src="${escapeHtml(cardImageSrc(card))}" alt="${escapeHtml(card.name)}">` : ''}
      </button>`).join('');
    const total = packTotalValue();
    const priced = (state.currentPack || []).filter(c => Number.isFinite(Number(c.price_eur))).length;
    els.summaryValue.textContent = priced ? `Valeur indicative des cartes renseignées : ${money(total)}` : 'Clique une carte pour la revoir.';
  }

  function finishPack() {
    state.inspectCard = null;
    if (state.currentPack) state.cardIndex = state.currentPack.length;
    if (state.currentPackMode === 'display') setDisplayCounter();
    showOnly('summary');

    const info = state.engine?.displayInfo?.();
    const displayFinished = state.currentPackMode === 'display' && displayIsFullyRevealed(info);
    if (displayFinished) {
      recordCompletedDisplay();
      renderDisplayRecap();
      playSfx('success');
    } else renderBoosterSummary();
  }

  function returnHome() {
    state.currentPack = null;
    state.currentPackMode = null;
    state.cardIndex = 0;
    state.inspectCard = null;
    showOnly('home');
    resetCardTransforms();
    if (state.openingMode === 'display') setDisplayCounter();
    renderOpeningMode();
  }

  function advanceCard(direction = 1) {
    if (!isOpeningPack()) return;
    playSfx('swipe', { rate: direction > 0 ? 1.02 : .96 });
    const distance = Math.max(window.innerWidth * .38, 420);
    els.dragLayer.style.transition = 'transform .22s cubic-bezier(.3,.7,.2,1), opacity .2s ease';
    els.dragLayer.style.transform = `translate3d(${direction * distance}px,-18px,0)`;
    els.dragLayer.style.opacity = '0';
    setTimeout(() => {
      state.cardIndex += 1;
      if (state.cardIndex >= state.currentPack.length) finishPack();
      else showCurrentCard({ flip: false });
    }, 205);
  }

  function tableCardWidth() {
    const rect = els.tableSurface.getBoundingClientRect();
    return clamp(rect.width * .21, 115, 190);
  }

  function addCardAt(card, clientX, clientY, rotation = 0) {
    const rect = els.tableSurface.getBoundingClientRect();
    const xPct = clamp((clientX - rect.left) / rect.width, .08, .92);
    const yPct = clamp((clientY - rect.top) / rect.height, .12, .88);
    state.tableItems.push({ card, xPct, yPct, rotation: clamp(rotation, -16, 16) });
    renderTable();
  }

  function animateDropToTable(card, sourceRect, clientX, clientY, rotation, done) {
    const tableRect = els.tableSurface.getBoundingClientRect();
    const width = tableCardWidth();
    const destX = clamp(clientX, tableRect.left + width / 2, tableRect.right - width / 2);
    const destY = clamp(clientY, tableRect.top + width / .715 / 2, tableRect.bottom - width / .715 / 2);
    const ghost = document.createElement('div');
    ghost.className = 'fly-ghost';
    ghost.style.left = `${sourceRect.left}px`;
    ghost.style.top = `${sourceRect.top}px`;
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    const ghostImage = cardImageSrc(card);
    ghost.innerHTML = ghostImage ? `<img src="${escapeHtml(ghostImage)}" alt="">` : '';
    document.body.appendChild(ghost);
    requestAnimationFrame(() => {
      ghost.style.transition = 'left .32s cubic-bezier(.2,.8,.2,1), top .32s cubic-bezier(.2,.8,.2,1), width .32s cubic-bezier(.2,.8,.2,1), height .32s cubic-bezier(.2,.8,.2,1), transform .32s cubic-bezier(.2,.8,.2,1)';
      ghost.style.left = `${destX - width / 2}px`;
      ghost.style.top = `${destY - (width / .715) / 2}px`;
      ghost.style.width = `${width}px`;
      ghost.style.height = `${width / .715}px`;
      ghost.style.transform = `rotate(${clamp(rotation, -16, 16)}deg)`;
    });
    ghost.addEventListener('transitionend', () => {
      ghost.remove();
      addCardAt(card, destX, destY, 0);
      playSfx('place');
      done?.();
    }, { once: true });
  }

  function dropCurrentOnTable(clientX, clientY, rotation = 0) {
    if (!isOpeningPack()) return;
    const card = currentCard();
    const sourceRect = els.activeCard.getBoundingClientRect();
    els.dragLayer.style.opacity = '0';
    animateDropToTable(card, sourceRect, clientX, clientY, rotation, () => {
      state.cardIndex += 1;
      if (state.cardIndex >= state.currentPack.length) finishPack();
      else showCurrentCard({ flip: false });
    });
  }

  function renderTable() {
    els.tableEmpty.style.display = state.tableItems.length ? 'none' : 'grid';
    const rect = els.tableSurface.getBoundingClientRect();
    const width = tableCardWidth();
    const height = width / .715;
    els.tableCards.innerHTML = state.tableItems.map((item, index) => {
      const left = clamp(item.xPct * rect.width - width / 2, 8, rect.width - width - 8);
      const top = clamp(item.yPct * rect.height - height / 2, 8, rect.height - height - 8);
      return `<button class="table-card inspectable ${item.card.isHolo ? 'holo' : ''}" type="button" data-index="${index}" style="left:${left}px;top:${top}px;width:${width}px;transform:rotate(${item.rotation}deg);z-index:${30 + index}" title="${escapeHtml(item.card.name)}">
        ${cardImageSrc(item.card) ? `<img src="${escapeHtml(cardImageSrc(item.card))}" alt="${escapeHtml(item.card.name)}">` : ''}
        ${rarityBadge(item.card, true)}
        <span class="table-remove" data-remove-index="${index}" role="button" aria-label="Retirer ${escapeHtml(item.card.name)} du tapis" title="Retirer du tapis">×</span>
      </button>`;
    }).join('');
    updatePersistentHud();
    attachTableInteractions();
  }

  function attachTableInteractions() {
    $$('.table-card').forEach(button => {
      let drag = null;
      const index = Number(button.dataset.index);
      const removeControl = button.querySelector('.table-remove');
      if (removeControl) {
        removeControl.onpointerdown = (event) => { event.preventDefault(); event.stopPropagation(); };
        removeControl.onclick = (event) => {
          event.preventDefault(); event.stopPropagation();
          const removeIndex = Number(removeControl.dataset.removeIndex);
          if (!Number.isInteger(removeIndex) || !state.tableItems[removeIndex]) return;
          state.tableItems.splice(removeIndex, 1);
          renderTable();
          playSfx('ui', { volume:.75 });
        };
      }
      button.onpointerdown = (event) => {
        if (event.target.closest('.table-remove')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        const item = state.tableItems[index];
        if (!item) return;
        const surfaceRect = els.tableSurface.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        drag = { startX:event.clientX, startY:event.clientY, offsetX:event.clientX-buttonRect.left, offsetY:event.clientY-buttonRect.top, surfaceRect, moved:false };
        button.setPointerCapture(event.pointerId);
        button.style.transition = 'none';
        button.style.zIndex = '120';
      };
      button.onpointermove = (event) => {
        if (!drag) return;
        const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
        if (!drag.moved) return;
        const width = button.offsetWidth, height = button.offsetHeight;
        const left = clamp(event.clientX - drag.surfaceRect.left - drag.offsetX, 6, drag.surfaceRect.width - width - 6);
        const top = clamp(event.clientY - drag.surfaceRect.top - drag.offsetY, 6, drag.surfaceRect.height - height - 6);
        button.style.left = `${left}px`; button.style.top = `${top}px`;
        button.style.transform = `rotate(${clamp(dx / 14, -14, 14)}deg) scale(1.02)`;
      };
      button.onpointerup = (event) => {
        if (!drag) return;
        const moved = drag.moved;
        const surfaceRect = els.tableSurface.getBoundingClientRect();
        const finalRect = button.getBoundingClientRect();
        const item = state.tableItems[index];
        button.style.transition = '';
        if (moved && item) {
          item.xPct = clamp((finalRect.left + finalRect.width / 2 - surfaceRect.left) / surfaceRect.width, .06, .94);
          item.yPct = clamp((finalRect.top + finalRect.height / 2 - surfaceRect.top) / surfaceRect.height, .08, .92);
          item.rotation = clamp((event.clientX - drag.startX) / 14, -14, 14);
          renderTable();
          playSfx('place', { volume:.75 });
        } else if (item) inspect(item.card);
        drag = null;
      };
      button.onpointercancel = () => { drag = null; renderTable(); };
    });
  }

  function inspect(card) {
    openDetail(card);
  }

  function attachViewerInteraction() {
    let drag = null;
    const baseRect = () => els.viewer.getBoundingClientRect();
    const isMobileLayout = () => window.matchMedia('(max-width: 760px)').matches;
    const stopAutoScroll = () => {
      if (drag?.autoScrollFrame) cancelAnimationFrame(drag.autoScrollFrame);
      if (drag) drag.autoScrollFrame = null;
    };
    const updateTableDropTarget = (clientX, clientY) => {
      const tableRect = els.tableSurface.getBoundingClientRect();
      const over = clientX >= tableRect.left && clientX <= tableRect.right && clientY >= tableRect.top && clientY <= tableRect.bottom;
      els.tableSurface.classList.toggle('drop-target', over && isOpeningPack());
      els.viewer.classList.toggle('over-table', over);
    };
    const keepTableReachable = () => {
      if (!drag || drag.mode !== 'drop') return;
      const edge = 76;
      const distanceToEdge = drag.lastClientY - (window.innerHeight - edge);
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (distanceToEdge > 0 && window.scrollY < maxScroll) {
        window.scrollBy(0, Math.min(12, Math.max(4, distanceToEdge * .18)));
      }
      updateTableDropTarget(drag.lastClientX, drag.lastClientY);
      drag.autoScrollFrame = requestAnimationFrame(keepTableReachable);
    };

    els.dragLayer.onpointerdown = (event) => {
      if (state.isAnimating) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      drag = { startX:event.clientX, startY:event.clientY, lastClientX:event.clientX, lastClientY:event.clientY, base:baseRect(), moved:false, mode:null, autoScrollFrame:null };
      els.dragLayer.setPointerCapture(event.pointerId);
      els.activeCard.classList.add('dragging');
      els.openingPanel.classList.add('drag-active');
      els.viewer.classList.add('dragging');
      els.viewer.classList.remove('peeking', 'drop-gesture', 'horizontal-swipe', 'swipe-left', 'swipe-right', 'over-table');
      els.viewer.style.setProperty('--peek-height', '0px');
      els.dragLayer.style.transition = 'none';
      els.tiltLayer.style.transition = 'none';
      els.tiltLayer.style.transform = '';
      els.dragLayer.style.transform = 'translate3d(0,0,0)';
    };

    els.dragLayer.onpointermove = (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      drag.lastClientX = event.clientX;
      drag.lastClientY = event.clientY;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      drag.moved ||= ax > 4 || ay > 4;

      // Lock gesture after a small dead-zone to prevent diagonal jitter.
      if (!drag.mode && (ax > 12 || ay > 12)) {
        const mobile = isMobileLayout();
        drag.mode = mobile
          ? (dy > 0 && ay > ax * 1.10 ? 'drop' : (dy < 0 && ay > ax * 1.10 ? 'peek' : 'horizontal'))
          : ((dy < 0 && ay > ax * 1.10) ? 'peek' : 'horizontal');
      }

      if (drag.mode === 'drop') {
        // Mobile : la carte suit le doigt vers le bas, se soulève légèrement
        // et rétrécit comme si elle était déposée sur le tapis.
        const downward = Math.max(0, dy);
        const progress = clamp(downward / Math.max(180, drag.base.height * .75), 0, 1);
        const travel = clamp(downward * .92, 0, Math.max(280, drag.base.height * .9));
        const lateral = clamp(dx * .12, -14, 14);
        const rotation = clamp(dx / 24, -8, 8);
        const scale = 1 - progress * .1;
        els.dragLayer.style.transform = `translate3d(${lateral}px,${travel}px,0) rotate(${rotation}deg) scale(${scale})`;
        els.viewer.classList.add('drop-gesture');
        els.viewer.classList.remove('peeking', 'horizontal-swipe', 'swipe-left', 'swipe-right');
        if (!drag.autoScrollFrame) drag.autoScrollFrame = requestAnimationFrame(keepTableReachable);
      } else if (drag.mode === 'peek') {
        // V11.6 : le peek vertical reste discret.
        // On montre seulement un petit bord de la prochaine carte, sans aller jusqu'au nom.
        const upward = Math.max(0, -dy);
        const lift = clamp((upward - 42) * 0.17, 0, 24);
        const peekHeight = clamp(lift, 0, 24);
        els.dragLayer.style.transform = `translate3d(0,${-lift}px,0)`;
        els.viewer.style.setProperty('--peek-height', `${peekHeight}px`);
        els.viewer.classList.toggle('peeking', peekHeight > 1);
        els.viewer.classList.remove('drop-gesture', 'horizontal-swipe', 'swipe-left', 'swipe-right');
      } else {
        // Mobile : la gauche reste neutre. Seul le déplacement vers la droite
        // est animé pour annoncer la carte suivante.
        els.viewer.classList.remove('peeking', 'drop-gesture');
        els.viewer.style.setProperty('--peek-height', '0px');
        const mobile = isMobileLayout();
        const rightward = mobile ? dx > 10 : ax > 10;
        els.viewer.classList.toggle('horizontal-swipe', rightward);
        els.viewer.classList.toggle('swipe-right', mobile ? rightward : dx >= 0);
        els.viewer.classList.toggle('swipe-left', mobile ? false : dx < 0);
        const limitedY = clamp(dy * 0.035, -3, 3);
        els.dragLayer.style.transform = `translate3d(${mobile ? Math.max(0, dx) : dx}px,${limitedY}px,0)`;
      }

      els.tiltLayer.style.transform = '';
      updateTableDropTarget(event.clientX, event.clientY);
    };

    els.dragLayer.onpointerup = (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.startX;
      const mode = drag.mode;
      const tableRect = els.tableSurface.getBoundingClientRect();
      const overTable = event.clientX >= tableRect.left && event.clientX <= tableRect.right && event.clientY >= tableRect.top && event.clientY <= tableRect.bottom;
      const moved = drag.moved;
      const startX = drag.startX;
      const startY = drag.startY;
      stopAutoScroll();
      drag = null;
      els.activeCard.classList.remove('dragging');
      els.openingPanel.classList.remove('drag-active');
      els.tableSurface.classList.remove('drop-target');
      els.viewer.classList.remove('dragging', 'peeking', 'drop-gesture', 'horizontal-swipe', 'swipe-left', 'swipe-right', 'over-table');
      els.viewer.style.setProperty('--peek-height', '0px');

      const downward = event.clientY > startY + 12;
      const mobileDropIntent = isMobileLayout() && mode === 'drop' && downward && event.clientY >= window.innerHeight - 56;
      if ((overTable || mobileDropIntent) && isOpeningPack() && (!isMobileLayout() || downward)) {
        const dropY = overTable ? event.clientY : tableRect.top + Math.min(tableRect.height * .36, 140);
        dropCurrentOnTable(event.clientX, dropY, clamp((event.clientX - startX) / 24, -8, 8));
        return;
      }
      const swipeThreshold = Math.max(110, els.viewer.clientWidth * .28);
      if (mode === 'horizontal' && moved && dx > swipeThreshold && isOpeningPack()) {
        advanceCard(1);
        return;
      }
      resetCardTransforms();
    };

    els.dragLayer.onpointercancel = () => {
      stopAutoScroll();
      drag = null;
      els.openingPanel.classList.remove('drag-active');
      els.tableSurface.classList.remove('drop-target');
      els.viewer.classList.remove('dragging', 'peeking', 'drop-gesture', 'horizontal-swipe', 'swipe-left', 'swipe-right', 'over-table');
      els.viewer.style.setProperty('--peek-height', '0px');
      resetCardTransforms();
    };
    els.dragLayer.onpointerleave = () => { if (!drag) { els.tiltLayer.style.transition = 'transform .2s ease'; els.tiltLayer.style.transform = ''; } };
  }

  [els.dragLayer, els.tableCards, els.tableSurface].forEach(node => node?.addEventListener('contextmenu', event => event.preventDefault()));

  function renderOpeningMode() {
    const isDisplay = state.openingMode === 'display';
    els.singleModeBtn.classList.toggle('active', !isDisplay);
    els.displayModeBtn.classList.toggle('active', isDisplay);
    els.singleModePanel.hidden = isDisplay;
    els.displayModePanel.hidden = !isDisplay;
    if (isDisplay) renderDisplayGrid();
    else els.openedCount.textContent = state.randomOpened;
  }

  function setOpeningMode(mode) {
    state.openingMode = mode === 'display' ? 'display' : 'single';
    localStorage.setItem(MODE_KEY, state.openingMode);
    renderOpeningMode();
  }

  function renderDisplayGrid() {
    if (!state.engine || !els.displayPackGrid) return;
    const info = state.engine.displayInfo();
    const states = state.engine.displayState();
    const finished = displayIsFullyRevealed(info);
    els.displayPackGrid.innerHTML = states.map(pack => `<button class="display-pack-button ${pack.opened ? 'opened' : ''}" type="button" data-pack-index="${pack.index}" ${pack.opened ? 'disabled' : ''} aria-label="Booster ${pack.index + 1}"></button>`).join('');
    els.displayModeInfo.textContent = finished
      ? `Display terminée · ${info.premiumOpened} hit${info.premiumOpened > 1 ? 's' : ''} premium au total · display ${info.caseDisplay}/12 du carton virtuel`
      : `${info.remaining}/24 boosters · hits premium cachés · display ${info.caseDisplay}/12 du carton virtuel`;
    els.displayRemaining.textContent = finished
      ? `0/24 · ${info.premiumOpened} hit${info.premiumOpened > 1 ? 's' : ''}`
      : `${info.remaining}/24`;
  }

  function renderRates() {
    const r = state.rates || {};
    const panda = r.pandaman_secret_alt_per_case?.range || [6,8];
    const rows = [
      ['SR standards / display', '7 · ≈29,17% des boosters'],
      ['SEC', '≈1 tous les 2–3 displays · ≈1,39–2,08%/booster'],
      ['Hits premium / display', '1 à 4 observés'],
      ['Hits premium / carton', '≈22 / 12 displays'],
      ['Alt Arts / Parallels non-leader', '≈10 / carton'],
      ['Leaders Alternate Art', '≈4 / carton · ≈1,39%/booster'],
      ['SP Haki des Rois', '≈1 / carton · ≈0,347%/booster'],
      ['SP dorée 4th Anniversary', '≈1 / carton · ≈0,347%/booster'],
      ['DON!! spéciales', '≈2 / carton · ≈0,694%/booster'],
      ['Treasure Rare', '≈1 / carton en moyenne · non garantie'],
      ['Panda Man', `${panda[0]} à ${panda[1]} / carton · ≈2,08–2,78%/booster`],
      ['Manga Rare (tier complet)', '≈1 / 3–4 cartons · ≈0,087–0,116%/booster'],
      ['Pirate Crew Super Parallel', '≈1 / 338 displays · ≈0,0123%/booster · faible confiance'],
    ];
    els.rateList.innerHTML = rows.map(([label, value]) => `<div class="rate-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('');
  }

  function renderCatalog() {
    const query = (els.cardSearch.value || '').trim().toLowerCase();
    const filtered = state.cards.filter(card => !query || `${card.name} ${card.code} ${card.rarity} ${card.variant}`.toLowerCase().includes(query));
    els.catalogSummary.textContent = `${filtered.length} carte${filtered.length > 1 ? 's' : ''} · Dataset : ${state.source}`;
    els.cardCatalog.innerHTML = filtered.slice(0, 120).map(card => `
      <article class="catalog-card" tabindex="0" data-card-key="${escapeHtml(collectionKey(card))}">
        <div class="catalog-thumb">${cardImageSrc(card) ? `<img src="${escapeHtml(cardImageSrc(card))}" alt="${escapeHtml(card.name)}" loading="lazy">` : ''}${rarityBadge(card, true)}</div>
        <div class="catalog-meta">
          <b>${escapeHtml(card.name)}</b>
          <span>${escapeHtml([card.code, card.rarity, card.variant !== 'STANDARD' ? card.variant : null].filter(Boolean).join(' · '))}</span>
          ${money(card.price_eur) ? `<span class="catalog-price">${escapeHtml(money(card.price_eur))}</span>` : ''}
        </div>
      </article>`).join('');
  }

  function cardSortValue(card) {
    const m = String(card.code || '').match(/OP17-(\d{3})/);
    const base = m ? Number(m[1]) : 1000 + String(card.code || '').charCodeAt(0);
    const version = Number(card.version) || (card.variant === 'STANDARD' ? 1 : 9);
    return base * 100 + version;
  }

  function orderedCollectionCards() {
    return [...state.cards].sort((a,b) => cardSortValue(a) - cardSortValue(b) || String(a.code).localeCompare(String(b.code)) || (Number(a.version)||0) - (Number(b.version)||0) || a.variant.localeCompare(b.variant));
  }

  function renderCollectionStats() {
    if (!state.cards.length) return;
    let unique = 0, total = 0, value = 0;
    state.cards.forEach(card => {
      const qty = Number(state.collection[collectionKey(card)]) || 0;
      if (qty > 0) unique += 1;
      total += qty;
      value += qty * (Number(card.price_eur) || 0);
    });
    els.collectionUnique.textContent = unique;
    els.collectionTotal.textContent = total;
    els.collectionValue.textContent = money(value) || '0,00 €';
  }

  function renderBinder() {
    if (!state.cards.length) return;
    const ordered = orderedCollectionCards();
    const perPage = 12;
    const pages = Math.max(1, Math.ceil(ordered.length / perPage));
    state.binderPage = clamp(state.binderPage, 0, pages - 1);
    const pageCards = ordered.slice(state.binderPage * perPage, state.binderPage * perPage + perPage);
    els.binderGrid.innerHTML = pageCards.map(card => {
      const qty = Number(state.collection[collectionKey(card)]) || 0;
      return `<article class="binder-slot ${qty ? '' : 'locked'}" tabindex="0" data-card-key="${escapeHtml(collectionKey(card))}">
        <div class="binder-pocket">
          ${qty && cardImageSrc(card) ? `<img src="${escapeHtml(cardImageSrc(card))}" alt="${escapeHtml(card.name)}">` : ''}
          ${rarityBadge(card, true)}
          <span class="binder-qty">×${qty}</span>
        </div>
        <div class="binder-slot-meta"><b>${escapeHtml(card.code)} · ${escapeHtml(card.name)}</b><span>${escapeHtml(card.rarity)} · ${escapeHtml(card.variant)}${card.version ? ` · V${escapeHtml(card.version)}` : ''}</span></div>
      </article>`;
    }).join('');
    els.binderPageLabel.textContent = `Page ${state.binderPage + 1} / ${pages}`;
    els.binderPrev.disabled = state.binderPage <= 0;
    els.binderNext.disabled = state.binderPage >= pages - 1;
    renderCollectionStats();
  }

  async function changeBinderPage(delta) {
    if (!state.cards.length || !delta) return;
    const ordered = orderedCollectionCards();
    const pages = Math.max(1, Math.ceil(ordered.length / 12));
    const target = clamp(state.binderPage + delta, 0, pages - 1);
    if (target === state.binderPage) return;
    playSfx('page');

    const page = els.binderPage;
    els.binderPrev.disabled = true;
    els.binderNext.disabled = true;

    if (page?.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const exitX = delta > 0 ? -34 : 34;
      const exitRot = delta > 0 ? -7 : 7;
      await page.animate([
        { transform:'perspective(1200px) translateX(0) rotateY(0deg)', opacity:1 },
        { transform:`perspective(1200px) translateX(${exitX}px) rotateY(${exitRot}deg)`, opacity:.32 }
      ], { duration:150, easing:'cubic-bezier(.4,0,1,1)', fill:'forwards' }).finished.catch(()=>{});
      state.binderPage = target;
      renderBinder();
      const enterX = delta > 0 ? 34 : -34;
      const enterRot = delta > 0 ? 7 : -7;
      await page.animate([
        { transform:`perspective(1200px) translateX(${enterX}px) rotateY(${enterRot}deg)`, opacity:.32 },
        { transform:'perspective(1200px) translateX(0) rotateY(0deg)', opacity:1 }
      ], { duration:190, easing:'cubic-bezier(.2,.8,.2,1)', fill:'both' }).finished.catch(()=>{});
    } else {
      state.binderPage = target;
      renderBinder();
    }
  }

  function switchTab(tabName) {
    const opening = tabName === 'opening';
    const info = tabName === 'info';
    const collection = tabName === 'collection';
    const history = tabName === 'history';
    els.openingScreen.classList.toggle('active', opening);
    els.infoScreen.classList.toggle('active', info);
    els.collectionScreen.classList.toggle('active', collection);
    els.historyScreen?.classList.toggle('active', history);
    els.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === tabName));
    if (collection) renderBinder();
    if (history) renderHistory();
  }

  async function init() {
    try {
      const result = await window.OP17DataLoader.load();
      state.cards = result.cards;
      state.rates = result.rates;
      state.source = result.source;
      state.engine = new window.OP17BoosterEngine(state.cards, state.rates);
      els.dataStatus.textContent = `${state.cards.length} cartes/variantes chargées · ${state.source}` + (location.protocol === 'file:' ? ' · mode direct OK' : '');
      els.openBoosterBtn.disabled = false;
      setDisplayCounter();
      renderRates();
      renderCatalog();
      renderCollectionStats();
      renderBinder();
      renderHistory();
    } catch (error) {
      console.error(error);
      els.dataStatus.textContent = 'Données introuvables. Place le dossier op17_data à côté de index.html.';
      els.openBoosterBtn.disabled = true;
      renderRates();
    }
    preloadSfx();
    updateSoundToggle();
    renderTable();
    showOnly('home');
    renderOpeningMode();
    els.packStage.classList.add('idle');
    updatePersistentHud();
    attachDetailInteraction();
  }

  els.openBoosterBtn.disabled = true;
  els.openBoosterBtn.addEventListener('click', openBooster);
  els.openAnotherBtn.addEventListener('click', () => { playSfx('ui'); returnHome(); });
  els.returnFromInspect.addEventListener('click', () => {
    state.inspectCard = null;
    if (state.currentPack && state.cardIndex < state.currentPack.length) showCurrentCard({ flip: false });
    else if (state.currentPack) finishPack();
    else returnHome();
  });
  els.summaryCards.addEventListener('click', (event) => {
    const button = event.target.closest('.summary-card');
    if (!button) return;
    if (button.dataset.displayBestKey) {
      const card = state.cards.find(c => collectionKey(c) === button.dataset.displayBestKey);
      if (card) inspect(card);
      return;
    }
    if (!state.currentPack) return;
    const card = state.currentPack[Number(button.dataset.index)];
    if (card) inspect(card);
  });
  els.tabs.forEach(tab => tab.addEventListener('click', () => { playSfx('ui'); switchTab(tab.dataset.tab); }));
  els.cardSearch.addEventListener('input', renderCatalog);
  els.skipPackAnimation.addEventListener('change', () => localStorage.setItem('op17-v10-skip-pack', els.skipPackAnimation.checked ? '1' : '0'));
  els.skipCardReveal.addEventListener('change', () => localStorage.setItem('op17-v10-skip-cards', els.skipCardReveal.checked ? '1' : '0'));
  els.singleModeBtn.addEventListener('click', () => { playSfx('ui'); setOpeningMode('single'); });
  els.displayModeBtn.addEventListener('click', () => { playSfx('ui'); setOpeningMode('display'); });
  els.displayPackGrid.addEventListener('click', event => {
    const button = event.target.closest('.display-pack-button');
    if (!button || button.disabled) return;
    openDisplayPack(Number(button.dataset.packIndex));
  });
  els.newDisplayBtn.addEventListener('click', () => {
    if (!state.engine || isOpeningPack()) return;
    playSfx('ui');
    state.engine.newDisplay();
    state.displayHistoryRecorded = false;
    state.currentPack = null; state.currentPackMode = null; state.cardIndex = 0; state.inspectCard = null;
    setDisplayCounter(); renderOpeningMode();
  });
  els.binderPrev.addEventListener('click', () => changeBinderPage(-1));
  els.binderNext.addEventListener('click', () => changeBinderPage(1));

  els.cardCatalog.addEventListener('click', event => {
    const cardNode = event.target.closest('.catalog-card');
    if (!cardNode) return;
    const key = cardNode.dataset.cardKey;
    const card = state.cards.find(c => collectionKey(c) === key);
    if (card) openDetail(card);
  });
  els.cardCatalog.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.catalog-card')) { event.preventDefault(); event.target.closest('.catalog-card').click(); } });
  els.binderGrid.addEventListener('click', event => {
    const slot = event.target.closest('.binder-slot');
    if (!slot) return;
    const key = slot.dataset.cardKey;
    const card = state.cards.find(c => collectionKey(c) === key);
    if (card) openDetail(card);
  });
  els.binderGrid.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.binder-slot')) { event.preventDefault(); event.target.closest('.binder-slot').click(); } });
  els.historyList?.addEventListener('click', event => {
    const button = event.target.closest('.history-pull');
    if (!button) return;
    const key = button.dataset.historyCardKey;
    const card = state.cards.find(c => collectionKey(c) === key);
    if (card) openDetail(card);
  });

  els.optionsBtn?.addEventListener('click', event => { event.stopPropagation(); playSfx('ui'); toggleOptionsMenu(); });
  els.optionsMenu?.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', event => {
    if (!els.optionsMenu || els.optionsMenu.hidden) return;
    if (els.optionsBtn?.contains(event.target) || els.optionsMenu.contains(event.target)) return;
    closeOptionsMenu();
  });
  els.soundToggleBtn?.addEventListener('click', toggleSound);
  els.soundVolume?.addEventListener('input', event => setSoundVolume(event.target.value, false));
  els.soundVolume?.addEventListener('change', event => setSoundVolume(event.target.value, true));
  els.resetDataBtn?.addEventListener('click', () => { playSfx('ui'); openResetConfirmation(); });
  els.resetCancelBtn?.addEventListener('click', () => { playSfx('ui'); closeResetConfirmation(); });
  els.resetBackdrop?.addEventListener('click', closeResetConfirmation);
  els.resetConfirmBtn?.addEventListener('click', () => { playSfx('ui'); resetAllSimulatorData(); });
  els.detailClose?.addEventListener('click', closeDetail);
  els.detailBackdrop?.addEventListener('click', closeDetail);
  window.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if (els.resetModal && !els.resetModal.hidden) closeResetConfirmation(); else if (els.detailModal && !els.detailModal.hidden) closeDetail(); else if (els.optionsMenu && !els.optionsMenu.hidden) closeOptionsMenu(); });
  window.addEventListener('resize', renderTable);

  init();
})();

// V13.2 options menu: groups audio and reset inside one clearer dropdown.
