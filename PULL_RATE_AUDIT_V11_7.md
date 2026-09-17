# OP17 pull-rate audit — V11.7

Date de l’audit : 10 septembre 2026.

## Principe
Bandai ne publie pas de tableau numérique officiel des pull rates OP17. Le produit est aléatoire. Les valeurs ci-dessous sont donc des **estimations communautaires**, pas des garanties. La V11.7 privilégie les relevés FR/EN récents, les recoupe quand possible et utilise la valeur la plus prudente pour les ultra-raretés.

## Valeurs retenues

| Catégorie | Valeur retenue | Équivalent par booster | Confiance |
|---|---:|---:|---|
| SR standard | 7 / display | 29,17 % de boosters avec un SR si 1 slot max | forte |
| SEC | ~1 / 2–3 displays (~5/case) | ~1,39–2,08 % | forte à moyenne |
| Premium total au-dessus des SR | 1–4 / display, ~22 / case | ~7,64 % en moyenne | moyenne |
| Alt Arts / Parallels non-leader | ~10 / case | ~3,47 % | moyenne |
| Leader AA | ~4 / case | ~1,39 % | forte à moyenne |
| SP Haki des Rois | ~1 / case | ~0,347 % | moyenne |
| SP dorée 4th Anniversary | ~1 / case | ~0,347 % | moyenne |
| DON!! spéciale | ~2 / case | ~0,694 % | moyenne |
| Treasure Rare | ~1 / case en moyenne, non garanti | ~0,347 % | moyenne |
| Panda Man | 6–8 / case | ~2,08–2,78 % | forte à moyenne |
| Manga tier complet | ~1 / 3–4 cases | ~0,087–0,116 % | moyenne |
| Pirate Crew Super Parallel | ~1 / 338 displays | ~0,0123 % | faible |

Les pourcentages par booster sont des conversions mathématiques des moyennes box/case. Ils ne signifient pas que chaque booster est tiré indépendamment avec cette probabilité. OP17 semble justement présenter une forte structure à l’échelle display/case.

## Modèle V11.7
- 12 displays virtuelles par carton, 24 boosters/display, 12 cartes/booster.
- ~22 hits premium répartis à raison de 1–4 par display.
- Calibration du budget principal autour de ~10 AA non-leader, 4 Leader AA, ~5 SEC, 1 SP Haki et 1 SP Gold.
- TR et ultra-raretés remplacent un hit principal plutôt que d’ajouter artificiellement un hit supplémentaire.
- 2 DON!! standards par display. Environ 2 DON!! spéciales par case sont traitées comme des upgrades du slot DON.
- 6–8 Panda Man/case sont traités comme bonus séparés du hit premium.
- Manga : le simulateur utilise 1/48 displays, borne prudente de la fourchette ~36–48 displays.
- Pirate Crew Super Parallel : 1/338 displays, mais ce taux est **faible confiance** car les sources divergent et l’échantillon reste faible.
- Le nombre de hits encore cachés n’est jamais affiché avant la fin de la display.

## Sources
1. TCGTalk — OP17 Pull Rates & Case Opening — agrégat annoncé de 1 000+ boosters / trois cartons et ouvertures supplémentaires : https://tcgtalk.com/guides/op17-pull-rates-case-opening
2. Shop-TCG.fr — Pull rate OP17 — compilation annoncée d’environ 7 cartons FR/EN et recoupement avec TCGTalk : https://shop-tcg.fr/blog/one-piece-op17-pull-rate-taux-de-tirage/
3. OnePiece Terminal — modèle communautaire OP17 : https://onepiece.app/set/OP17
4. Samurai Sword Tokyo — synthèse launch-week des ultra-raretés et divergences entre sources : https://samuraiswordtokyo.com/blogs/news/op-17-pull-rates-best-cards
5. Site officiel ONE PIECE CARD GAME — la composition des produits est officielle, mais aucun tableau numérique de pull rates n’est publié.


## Calibration V13.4 — distribution des hits par display

Le simulateur conserve environ **22 hits premium par carton de 12 displays** et **1 à 4 hits premium par display**. La distribution interne a été recalibrée pour éviter la surreprésentation des displays à 1 hit de l'ancien algorithme. Pour un carton de 22 hits, le profil simulé est approximativement : **1 hit 25 %**, **2 hits 67 %**, **3 hits 6–7 %**, **4 hits ~1 %**. Ces pourcentages sont une calibration de simulation cohérente avec la moyenne carton, pas des taux officiels Bandai.
