OP17 SIMULATOR V10.1 FIX

Corrections principales :
- écran pack / écran carte / résumé ne peuvent plus se superposer ([hidden] forcé)
- fonctionne par double-clic sur index.html grâce à embedded-data.js
- fonctionne aussi via Live Server et préfère alors ./op17_data/cards.json
- dataset fourni par le nouveau scraper intégré (178 entrées)
- image_url utilisée quand image_file est vide
- fallback local vers data_fallback/images quand disponible
- variantes SUPER_PARALLEL / SUPER_LEADER / SPECIAL correctement normalisées
- booster PNG nettoyé avec fond extérieur transparent
- viewer recalé pour les écrans desktop moins hauts

Recommandé : Live Server reste préférable si tu régénères souvent op17_data avec le scraper.
