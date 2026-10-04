# Compagnon du Sorceleur

Une application pour téléphone qui accompagne une partie de **The Witcher 3** avec le lore des livres
d'Andrzej Sapkowski. Vous indiquez où vous en êtes dans le jeu et quels livres vous avez lus,
et le compagnon ne vous dévoile rien de ce qui vient après.

## Ce que contient l'application

- **Partie** : le chapitre en cours, les livres à lire, les personnages et monstres du coin, une question du jour (avec série de jours), le quiz et les défis.
- **Codex** : 125 fiches (personnages, lieux, peuples, notions, livres), la **lignée de Ciri**, un lexique de langue ancienne, un carnet de favoris et l'historique des fiches consultées.
- **Carte** : une carte schématique du Continent, à zoomer du bout des doigts, qui signale les lieux du chapitre en cours.
- **Bestiaire** : huiles, signes, bombes et potions conseillés par le jeu, et ce que les livres disent de chaque créature.
- **Livres** : ordre de lecture avec suivi des livres lus, **contes et folklore** illustrés, frise chronologique, jeux et adaptations.
- **Recherche** partout, par nom, surnom, créature ou mot elfe.
- **Quiz** adapté à l'avancée, ou **défi entre amis** : mêmes questions pour tout le monde, sans spoiler, à envoyer par lien.
- **Demander** : questions libres à Claude, uniquement dans la version publiée sur Claude.

Les spoilers sont filtrés de deux façons :

- **le jeu** : chaque fiche ou note de jeu n'apparaît qu'à partir du bon chapitre ou de l'extension commencée ;
- **les livres** : les rebondissements d'un livre s'affichent d'eux-mêmes quand vous l'avez coché comme lu, et restent sinon derrière un bouton qui indique de quel livre ils viennent.

Côté application : accueil guidé au premier lancement, installation sur l'écran d'accueil, fonctionnement hors ligne,
mise à jour en arrière-plan, thème clair ou sombre, trois tailles de texte, option pour garder l'écran allumé,
retour en arrière par le bouton du téléphone (ou en glissant depuis le bord gauche sur iPhone), vibrations légères sur Android.

## Installer et partager

1. **Mettre l'application en ligne avec GitHub Pages** (gratuit, ouvert à tous sans compte) :
   dans le dépôt, *Settings* → *Pages* → *Build and deployment* → *Source : Deploy from a branch*,
   branche **main**, dossier **/ (root)**, puis *Save*.
   Une à deux minutes plus tard, elle est en ligne sur https://couefficguillaume-collab.github.io/Witcher-lore/.
2. **L'installer sur un téléphone** : ouvrir ce lien, puis
   - sur Android (Chrome) : accepter la proposition d'installation, ou menu ⋮ → *Installer l'application* ;
   - sur iPhone (Safari) : bouton Partager → *Sur l'écran d'accueil*.

   L'application explique elle-même ces étapes à la fin de l'accueil guidé et dans les réglages.
3. **La partager** : le bouton Partager donne un lien, un QR code, et sur téléphone l'envoi direct dans une application.
   Chaque fiche, lieu, créature ou défi a son propre lien. Sur ordinateur, la page affiche un QR code pour l'ouvrir sur téléphone.

La version publiée sur Claude (https://claude.ai/artifact/XHmn6MRvrESmEH8ux3peXH) reste disponible pour l'onglet *Demander* :
elle est privée tant que vous ne l'avez pas partagée depuis son menu *Partager*.

## Modifier le contenu

Les sources sont dans `src/` :

| Fichier | Contenu |
| --- | --- |
| `src/codex.js` | toutes les données : chapitres, fiches, bestiaire, lexique, frise, contes, carte, anecdotes |
| `src/app.js` | la logique de l'application |
| `src/style.css` | l'apparence |
| `src/body.html` | la structure de la page |
| `img/` | les illustrations du domaine public, en WebP |

Après une modification, reconstruisez l'application (Node.js 18 ou plus récent, aucune dépendance) :

```sh
npm run build
```

La commande vérifie les données (identifiants en double, renvois cassés, chapitres invalides, images manquantes,
spoilers sans livre associé), puis régénère `index.html`, `sw.js` (dont le numéro de version change à chaque contenu nouveau,
ce qui déclenche la mise à jour sur les téléphones) et `artifact/compagnon.html`, la version à publier sur Claude.

- `npm test` ajoute un test dans Chromium qui parcourt chaque écran sur quatre formats et joue un quiz complet (Playwright requis).
- `npm run captures` régénère aussi les captures d'écran affichées lors de l'installation sur Android (`captures/`).
- `node scripts/assets.mjs` régénère les icônes et l'image d'aperçu des liens (`og.png`).

### Ajouter une fiche

Copiez une fiche existante dans `src/codex.js` et adaptez-la :

```js
{ id: "visenna", t: "perso", src: "L", nom: "Visenna", alias: [],
  role: "Magicienne guérisseuse, mère de Geralt",
  resume: "Le résumé visible sans spoiler.",
  livres: "Ce que racontent les livres, sans révéler la fin.",
  rl: "epee-providence",
  rev: "Le rebondissement, affiché quand « L'Épée de la providence » est coché comme lu.",
  jeu: [{ c: 2, t: "Une note sur le jeu, visible à partir du chapitre 2 (Novigrad)." }],
  dans: ["epee-providence"],
  voir: ["geralt", "kaer-morhen"] },
```

- `t` : `perso`, `lieu`, `faction`, `concept` ou `livre`.
- `src` : `L` (livres), `J` (jeu) ou `LJ` (les deux).
- `rl` : obligatoire avec `rev`, l'identifiant du livre qui dévoile le rebondissement.
- `porte: { c: 3 }` masque toute la fiche avant le chapitre 3 ; `porte: { d: "bw" }` avant Blood and Wine.
- Chapitres : 0 Prologue, 1 Velen, 2 Novigrad, 3 Skellige, 4 Kaer Morhen, 5 Acte final, 6 Jeu terminé.
- Pour placer un lieu sur la carte, ajoutez son identifiant et ses coordonnées dans `carte.lieux` (cadre de 400 × 560).

## Illustrations

Toutes les illustrations sont des œuvres du domaine public, issues de Wikimedia Commons :
Arthur Rackham (*Blanche-Neige*, 1909), Walter Crane (*La Belle et la Bête*, 1875), Otto Ubbelohde (*Hans mon hérisson*, 1909),
Edmund Dulac (*La Petite Sirène* et *La Reine des neiges*, 1911), René Bull (*Le Pêcheur et le Génie*, 1898),
Ivan Bilibine (*Baba Yaga*, 1900 ; *Kikimora*, 1934) et Viktor Vasnetsov (*Le Léchi*, 1885 ; *Sirine et Alkonost*, 1896).
Les liens vers chaque source figurent dans `src/codex.js` et dans les réglages de l'application.

---

Guide non officiel, réalisé par des fans. La saga du Sorceleur est l'œuvre d'Andrzej Sapkowski ;
The Witcher est une série de jeux de CD Projekt Red.
