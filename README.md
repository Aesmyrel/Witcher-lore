# Compagnon du Sorceleur

Le lore des livres d'Andrzej Sapkowski, au rythme de votre partie de **The Witcher 3**.
Vous indiquez où vous en êtes dans le jeu, et le compagnon masque tout ce qui vient après.
Les rebondissements de la fin des livres restent cachés derrière un bouton.

Contenu :

- **Partie** : ce qu'il faut savoir sur le chapitre en cours, les livres à lire, les monstres du coin, une question du jour et des anecdotes.
- **Codex** : 125 fiches (personnages, lieux, peuples, notions, livres) et un lexique de langue ancienne, avec recherche par nom ou surnom.
- **Bestiaire** : huiles, signes, bombes et potions conseillés par le jeu, et ce que les livres disent de chaque créature.
- **Livres** : ordre de lecture avec suivi des livres lus, frise chronologique, jeux et adaptations.
- **Quiz** : dix questions adaptées à votre avancée, ou un **défi entre amis** (mêmes questions pour tout le monde, sans spoiler) à envoyer par lien.
- **Demander** : questions libres à Claude, uniquement dans la version publiée sur Claude.

## Partager le compagnon

Le bouton **Partager** de la page donne un lien, un QR code, et un lien direct vers la fiche ou le défi affiché.
Chaque ami règle sa propre avancée : rien ne lui est dévoilé.

Trois façons de le diffuser :

1. **Version Claude** : https://claude.ai/artifact/XHmn6MRvrESmEH8ux3peXH. Elle est privée tant que vous ne l'avez pas partagée depuis le menu *Partager* de la page. C'est la seule version où l'onglet *Demander* fonctionne.
2. **Site public gratuit avec GitHub Pages**, ouvert à tous sans compte :
   dans le dépôt, *Settings* → *Pages* → *Build and deployment* → *Source : Deploy from a branch*,
   choisissez la branche qui contient `index.html` et le dossier `/ (root)`, puis *Save*.
   Après une minute, le compagnon est en ligne sur https://couefficguillaume-collab.github.io/Witcher-lore/.
   Sur téléphone, « Ajouter à l'écran d'accueil » l'installe comme une application, utilisable hors ligne.
3. **Le fichier lui-même** : `index.html` fonctionne seul. Envoyez-le par message ou par e-mail, il s'ouvre dans n'importe quel navigateur.

## Modifier le contenu

Les sources sont dans `src/` :

| Fichier | Contenu |
| --- | --- |
| `src/codex.js` | toutes les données : chapitres, fiches, bestiaire, lexique, frise, anecdotes |
| `src/app.js` | la logique de l'application |
| `src/style.css` | l'apparence |
| `src/body.html` | la structure de la page |

Après une modification, reconstruisez la page (Node.js 18 ou plus récent, aucune dépendance) :

```sh
npm run build
```

La commande vérifie les données (identifiants en double, renvois cassés, chapitres invalides) puis régénère
`index.html` et `artifact/compagnon.html`, la version à publier sur Claude.

`npm test` ajoute un test dans Chromium qui parcourt chaque écran et joue un quiz complet (Playwright requis).
`node scripts/assets.mjs` régénère les icônes et l'image d'aperçu des liens (`og.png`).

### Ajouter une fiche

Copiez une fiche existante dans `src/codex.js` et adaptez-la :

```js
{ id: "visenna", t: "perso", src: "L", nom: "Visenna", alias: [],
  role: "Magicienne guérisseuse, mère de Geralt",
  resume: "Le résumé visible sans spoiler.",
  livres: "Ce que racontent les livres, sans révéler la fin.",
  rev: "Les rebondissements, cachés derrière un bouton.",
  jeu: [{ c: 2, t: "Une note sur le jeu, visible à partir du chapitre 2 (Novigrad)." }],
  dans: ["epee-providence"],
  voir: ["geralt", "kaer-morhen"] },
```

- `t` : `perso`, `lieu`, `faction`, `concept` ou `livre`.
- `src` : `L` (livres), `J` (jeu) ou `LJ` (les deux).
- `porte: { c: 3 }` masque toute la fiche avant le chapitre 3 ; `porte: { d: "bw" }` avant Blood and Wine.
- Chapitres : 0 Prologue, 1 Velen, 2 Novigrad, 3 Skellige, 4 Kaer Morhen, 5 Acte final, 6 Jeu terminé.

---

Guide non officiel, réalisé par des fans. La saga du Sorceleur est l'œuvre d'Andrzej Sapkowski ;
The Witcher est une série de jeux de CD Projekt Red.
