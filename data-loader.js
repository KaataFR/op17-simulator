(() => {
  const clampNumber = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const normalized = String(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  function cleanVariant(raw) {
    const value = String(raw || 'STANDARD').trim().toUpperCase().replace(/[-_]+/g, ' ');
    if (/MANGA/.test(value)) return 'MANGA';
    if (/SUPER\s*(ALT|PARALLEL).*RED|RED.*SUPER\s*(ALT|PARALLEL)/.test(value)) return 'SUPER ALT RED';
    if (/SUPER\s*(ALT|PARALLEL)|SUPER\s*LEADER/.test(value)) return 'SUPER ALT';
    if (/TREASURE|\bTR\b/.test(value)) return 'TREASURE RARE';
    if (/PANDA/.test(value)) return 'PANDA';
    if (/\bSP\b|SPECIAL/.test(value)) return 'SP';
    if (/ALT|PARALLEL/.test(value)) return 'ALT';
    if (/GOLD/.test(value)) return 'GOLD';
    if (/DON/.test(value)) return 'DON';
    return 'STANDARD';
  }

  function inferHolo(card) {
    const explicit = card.is_holo ?? card.isHolo ?? card.holo ?? card.foil;
    if (typeof explicit === 'boolean') return explicit;
    if (explicit === 1 || explicit === '1' || String(explicit).toLowerCase() === 'true') return true;
    const variant = cleanVariant(card.variant);
    const rarity = String(card.rarity || '').toUpperCase();
    return variant !== 'STANDARD' || ['SR', 'SEC', 'L', 'TR'].includes(rarity);
  }

  function holoStyle(card) {
    const variant = cleanVariant(card.variant);
    if (variant === 'MANGA' || variant === 'SUPER ALT RED') return 'manga';
    if (variant === 'SUPER ALT' || variant === 'TREASURE RARE' || variant === 'SP') return 'premium';
    if (variant === 'ALT' || variant === 'GOLD') return 'prism';
    if (inferHolo(card)) return 'foil';
    return 'none';
  }

  function backAsset(card) {
    const color = String(card.color || card.card_color || '').toLowerCase();
    if (color.includes('red') || color.includes('rouge')) return './assets/card-back-red.png';
    if (color.includes('green') || color.includes('vert')) return './assets/card-back-green.png';
    return './assets/card-back-blue.png';
  }

  function resolvePath(value, basePath) {
    if (!value) return '';
    const cleaned = String(value).replace(/^\.\//, '').replace(/\\/g, '/');
    if (/^(https?:|data:|blob:)/i.test(cleaned)) return cleaned;
    if (cleaned.startsWith('data_fallback/') || cleaned.startsWith('op17_data/')) return './' + cleaned;
    return `${basePath}/${cleaned}`.replace(/\/+/g, '/').replace(':/', '://');
  }

  function normalizeCard(raw, basePath = './op17_data') {
    const imageFile = raw.image_file || raw.local_image || raw.localImage || raw.image_path || raw.file || '';
    const fallbackImage = resolvePath(raw.fallback_image_file || raw.fallback_image || '', '.');
    let image = resolvePath(raw.image || imageFile, basePath);
    if (!image) image = raw.image_url || raw.card_image || '';
    if (!image && fallbackImage) image = fallbackImage;

    const code = String(raw.code || raw.card_set_id || raw.card_code || raw.number || raw.image_id || raw.card_image_id || '').trim().toUpperCase();
    const variant = cleanVariant(raw.variant || raw.card_variant || raw.printing || raw.version_name || (/_p\d+$/i.test(String(raw.card_image_id || '')) ? 'ALT' : 'STANDARD'));
    const price = clampNumber(raw.price_eur ?? raw.cardmarket_from_eur ?? raw.price ?? raw.market_price);
    const card = {
      raw,
      id: String(raw.id || raw.card_image_id || raw.image_id || `${code}|${variant}|${raw.name || raw.card_name || ''}|${raw.version || ''}`),
      code,
      name: String(raw.name || raw.card_name || code || 'Carte inconnue'),
      rarity: String(raw.rarity || '').toUpperCase(),
      variant,
      originalVariant: String(raw.variant || ''),
      version: raw.version ?? null,
      color: raw.color || raw.card_color || '',
      type: raw.type || raw.card_type || '',
      cost: raw.cost ?? raw.card_cost ?? null,
      power: raw.power ?? raw.card_power ?? null,
      attribute: raw.attribute || '',
      text: raw.text || raw.card_text || '',
      image,
      fallbackImage,
      price_eur: price,
      price_source: raw.price_source || (raw.cardmarket_from_eur != null ? 'cardmarket' : ''),
      image_file: imageFile,
    };
    card.isHolo = inferHolo(card);
    card.holoStyle = holoStyle(card);
    card.backImage = backAsset(card);
    card.key = `${card.id}|${card.image}|${card.variant}`;
    return card;
  }

  async function readJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
  }

  async function load() {
    const candidates = [
      { cards: './op17_data/cards.json', rates: './op17_data/pull_rates.json', base: './op17_data', label: 'op17_data' },
      { cards: './data_fallback/cards.json', rates: './data_fallback/pull_rates.json', base: './data_fallback', label: 'fallback intégré' },
    ];
    let lastError = null;

    if (location.protocol !== 'file:') {
      for (const source of candidates) {
        try {
          const payload = await readJson(source.cards);
          const rows = Array.isArray(payload) ? payload : (payload.cards || payload.data || payload.results || []);
          if (!Array.isArray(rows) || !rows.length) throw new Error('Aucune carte');
          let rates = {};
          try { rates = await readJson(source.rates); } catch (_) {}
          return { cards: rows.map(row => normalizeCard(row, source.base)), rates, source: source.label };
        } catch (err) { lastError = err; }
      }
    }

    // Direct-file fallback: no fetch(), so Chrome can open index.html by double click.
    if (Array.isArray(window.OP17_EMBEDDED_CARDS) && window.OP17_EMBEDDED_CARDS.length) {
      return {
        cards: window.OP17_EMBEDDED_CARDS.map(row => normalizeCard(row, './op17_data')),
        rates: window.OP17_EMBEDDED_RATES || {},
        source: location.protocol === 'file:' ? 'dataset intégré (mode fichier)' : 'dataset intégré',
      };
    }
    throw lastError || new Error('Dataset OP17 introuvable');
  }

  window.OP17DataLoader = { load, normalizeCard, cleanVariant };
})();
