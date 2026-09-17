OP17 SIMULATOR V10 ULTIMATE
===========================

BUT
---
V10 revient volontairement à l'essentiel :
- onglet Ouverture
- onglet Informations
- une vraie table à gauche
- un booster OP17 à droite
- une seule action principale : Ouvrir un booster

INSPIRATION OPENING
-------------------
Le flow reprend l'idée d'un simulateur d'ouverture direct : pack visible, bouton d'ouverture,
option pour passer l'animation et option pour passer les cartes, puis révélation des cartes.
Le code, la DA et les animations sont propres au projet V10.

INSTALLATION DU DATASET
-----------------------
Ton nouveau scraper doit produire :

op17_data/
  cards.json
  cards.csv
  pull_rates.json
  cardmarket_raw.json
  manifest.json
  images/

Place simplement ce dossier à la racine de V10.
V10 charge automatiquement ./op17_data/cards.json et ./op17_data/pull_rates.json.

Si op17_data/cards.json est absent, V10 utilise data_fallback/ pour pouvoir être testée immédiatement.
Le fallback est uniquement une base de secours et doit être remplacé par la sortie du nouveau scraper.

LANCEMENT
---------
Méthode recommandée : Live Server dans VS Code.

Ou double-clique start_server.bat.
Puis ouvre : http://localhost:8000/index.html

OPENING V10
-----------
1. Le booster flotte légèrement dans la zone d'ouverture.
2. Cliquer Ouvrir un booster lance une ouverture avec :
   - petit shake
   - déchirure visuelle de la partie haute
   - séparation du wrapper
   - flash/particules
3. Le dos de la première carte apparaît puis la carte se retourne.
4. Maintenir clic gauche et déplacer :
   - mouvement libre de la carte
   - rotation 3D forte
   - reflet qui suit la souris si la carte est foil/holo
5. Relâcher horizontalement au-delà du seuil : carte suivante.
6. Relâcher au-dessus de la table : la carte vole vers l'endroit exact où elle a été déposée.
7. Cliquer une carte sur la table : inspection dans le viewer.
8. Une carte posée sur la table peut aussi être déplacée à un autre endroit de la table.
9. Fin du booster : résumé des 12 cartes + valeur indicative si le scraper a fourni price_eur.

ROTATION
--------
Le bug des anciennes versions est supprimé :
- dragLayer = translation du drag
- tiltLayer = rotation X/Y
- flipLayer = retournement recto/verso
- le calcul souris se fait par rapport à .card-viewer qui ne subit aucun transform

Les rotations ne recalculent donc jamais leur géométrie sur un élément déjà transformé.

HOLOGRAPHIQUE
-------------
V10 respecte en priorité les champs du scraper : is_holo / holo / foil.
Sinon un fallback est appliqué selon la rareté/variante.

Styles :
- SR/SEC/Leader foil : reflet léger
- Alternate Art : prisme
- SP/TR/Super Alt : premium
- Manga/Super Alt rouge : rainbow + étoiles + glare renforcé

DOS DES CARTES
--------------
Les trois dos transmis sont inclus :
- card-back-blue.png
- card-back-red.png
- card-back-green.png

La couleur du dos peut suivre le champ color/card_color du dataset quand il est rouge ou vert,
sinon le dos bleu est utilisé.

MOTEUR DE BOOSTERS
------------------
Le moteur construit une display virtuelle de 24 boosters, puis consomme les boosters un par un.
Par défaut/fallback :
- 7 SR standards distribuées dans la display
- 2 DON!! distribués dans la display quand le dataset en contient
- 1 à 4 hits premium distribués dans la display

Si pull_rates.json contient ces valeurs, elles sont utilisées.
Les poids internes des types de gros hits ne sont pas présentés comme des probabilités officielles Bandai.

FICHIERS
--------
index.html
style-v10.css
data-loader.js
booster-engine.js
app-v10.js
assets/
op17_data/
data_fallback/
start_server.bat
README-V10.txt
