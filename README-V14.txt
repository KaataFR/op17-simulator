OP17 SIMULATOR — VERSION 14

Ouvre index.html pour lancer le simulateur. Aucun téléchargement de dépendances n’est nécessaire. Si la page était déjà ouverte, recharge-la avec Ctrl + F5.

EXPÉRIENCE
• Interface marine et dorée, booster au premier plan et tapis séparé pour les favoris.
• Navigation mobile en bas de l’écran et commandes adaptées au tactile.
• Révélation par boutons, gestes ou clavier : flèche droite pour avancer, flèche bas pour poser sur le tapis.
• Bilan des 12 cartes et accès direct au booster suivant ou au choix du mode.
• Animations de déchirure, arrivée des cartes, reflets holographiques et mise en valeur des raretés.
• Options : volume, silence, passage de l’animation, bilan direct et réduction des mouvements.
• Catalogue complet des 178 cartes/variantes, recherche et message en l’absence de résultat.

FIABILITÉ
• Actions verrouillées pendant les transitions pour éviter les doubles ouvertures.
• Aucun blocage de dépôt si une animation est interrompue ou désactivée.
• Effets sonores préchargés, décodés après interaction et limités à six voix simultanées. Le silence arrête les sons déjà en cours ; le volume est commun à tous les effets.
• Cartes locales affichées immédiatement. Les visuels français distants prennent le relais lorsqu’ils chargent à temps. Certaines illustrations locales portent la mention SAMPLE et sont en anglais, comme dans les ressources d’origine.
• Gestion du focus des fenêtres, touche Échap, navigation clavier et respect du réglage système de réduction des animations.
• Préférences restaurées ; erreur de sauvegarde signalée si le navigateur bloque le stockage.

DONNÉES
Le moteur de tirage et les probabilités sont inchangés. Collection, compteurs et historique déjà présents utilisent les mêmes clés de sauvegarde. Le tapis et la display en cours restent liés à la session, comme dans la version d’origine.
La simulation est gratuite. Les valeurs des cartes sont indicatives et proviennent du jeu de données fourni.

VÉRIFICATIONS
Tests dans Chromium sur 320×568, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 et 844×390 : aucun débordement horizontal dans les quatre rubriques.
Display complète : 24 boosters, 288 cartes, 7 SR standards, 2 DON et une seule entrée d’historique.
Vérifications complémentaires : double clic, geste tactile, clavier, dépôt sur tapis, focus modal, préférences après rechargement, annulation/confirmation de réinitialisation, réinitialisation pendant une animation, lecture et arrêt des sons, images distantes bloquées, animations réduites, stockage bloqué et ouverture directe en fichier.
Les tailles mobiles sont émulées dans Chromium ; Safari/iOS n’a pas été testé sur un appareil physique.

FICHIERS MODIFIÉS
index.html, style-v10.css, app-v10.js.

V14.1 — PRÉVISUALISATION RÉTABLIE
Glisse la carte vers le haut pour entrevoir jusqu’à 24 px du bord inférieur de la suivante, comme dans le système d’origine. Relâcher referme l’aperçu sans avancer. Le bouton « Maintenir pour prévisualiser » fonctionne à la souris, au tactile et en maintenant Espace ou Entrée au clavier. L’aperçu est masqué au repos, pendant un balayage horizontal et sur la dernière carte.
