# ChimieRév

Application web de révision des réactions de chimie organique.

**Principe :** comprendre pour mémoriser, jamais mémoriser bêtement.
Chaque fiche répond d'abord à « pourquoi ça se passe ainsi ? » avant de
montrer « comment ».

État : **Phase 1 — Socle** (données, liste, fiches, responsive).

---

## Ouvrir l'application depuis ton téléphone

Tu n'as pas besoin d'ordinateur. L'application se construit toute seule sur
GitHub et s'ouvre dans le navigateur du téléphone.

### À faire une seule fois : activer GitHub Pages

Depuis ton téléphone, dans le navigateur :

1. Ouvre `github.com/orneilla/ChimieRev`
2. Onglet **Settings** (roue dentée ; sur mobile il est dans le menu « … »
   à droite des onglets)
3. Dans la colonne de gauche, section **Pages**
4. Sous **Build and deployment → Source**, choisis **GitHub Actions**
5. C'est tout, rien à valider de plus.

### Ensuite

À chaque fois que le code change, GitHub reconstruit l'application
automatiquement (fichier `.github/workflows/deploy.yml`) et l'adresse
publique se met à jour, en général en 1 à 2 minutes :

**https://orneilla.github.io/ChimieRev/**

Ajoute cette adresse à l'écran d'accueil de ton téléphone (menu du
navigateur → « Sur l'écran d'accueil ») : elle s'ouvrira comme une
application.

Pour suivre la construction : onglet **Actions** du dépôt. Une pastille
verte = c'est en ligne ; une rouge = la construction a échoué.

## Ce qu'il faut tester à la Phase 1

- [ ] La liste affiche les 5 réactions.
- [ ] La recherche filtre bien (essayer « SN2 », « base », « Grignard »).
- [ ] Les pastilles de famille filtrent la liste.
- [ ] Toucher une tuile ouvre la fiche détaillée.
- [ ] Les structures s'affichent sur chacune des 5 fiches.
- [ ] Le bascule Comprendre / Référence change bien le texte.
- [ ] Le lien « ← Toutes les réactions » revient à la liste.
- [ ] Rien ne dépasse à droite, aucun zoom horizontal nécessaire.
- [ ] Les boutons sont assez gros pour le doigt.
- [ ] Le bouton « retour » du téléphone fonctionne.

## Si un jour tu as un ordinateur

```bash
npm install     # une seule fois : télécharge les outils
npm run dev     # lance l'app, adresse affichée dans le terminal
npm run build   # construit la version finale dans dist/
```

---

## Le parti pris visuel

Direction inspirée des affiches de l'Année internationale de la chimie :
aplats de couleur saturés sur fond crème, gros symboles en didone, tuiles
de tableau périodique.

La couleur n'est pas décorative, **elle porte une information** : chaque
famille de réactions a sa teinte, et on la retrouve partout — sur la tuile,
sur le filtre, sur le bandeau de la fiche, sur les numéros d'étapes. L'œil
apprend le classement sans avoir à lire.

| Famille | Couleur |
|---|---|
| Substitutions | cyan `#00A3D9` |
| Éliminations | citron `#C6D42B` |
| Péricycliques | orange `#F59120` |
| Oxydo-réduction | vert `#2FB06A` |
| Organométalliques | rose `#FF8FA3` |

Les teintes se modifient à un seul endroit : `src/couleurs.js`. Une famille
non répertoriée prend automatiquement la couleur de repli (pétrole).

Les polices (Bodoni Moda pour les titres, Karla pour le texte) sont
**embarquées dans le projet** (`public/polices/`) : l'application ne dépend
d'aucun service extérieur et reste lisible même avec une connexion faible.

## Les structures dessinées

Les molécules sont dessinées par **RDKit-JS** à partir de leurs SMILES —
mais **au moment de la construction**, pas dans le navigateur.

RDKit pèse environ 7 Mo (WebAssembly). Le faire télécharger au téléphone à
chaque visite serait pénible. Le script `scripts/dessiner-structures.mjs`
fait donc le travail une fois pour toutes et enregistre des fichiers SVG
légers (quelques kilo-octets chacun) dans `public/structures/`.
L'application n'affiche que ces images : instantanées, et lisibles même
hors connexion.

Toutes les structures sont dessinées à la **même échelle** (longueur de
liaison fixe), comme dans un manuel : deux molécules se comparent d'un
coup d'œil.

Ce script tourne **automatiquement** avant chaque construction, y compris
sur GitHub. Concrètement : si tu ajoutes une réaction dans
`reactions.json` depuis ton téléphone, ses structures sont dessinées toutes
seules à la mise en ligne, tu n'as rien à faire.

Pour le lancer à la main (si tu as un ordinateur un jour) :

```bash
npm run structures
```

Une molécule dont le SMILES est illisible n'arrête pas la construction :
le script le signale, et la fiche affiche la formule SMILES en clair à la
place du dessin.

## Les deux modes de lecture

Chaque fiche propose la même chose expliquée de deux façons :

- **Comprendre** — aucune base en chimie requise, on part du pourquoi ;
- **Référence** — la formulation technique exacte, pour réviser vite.

Personne n'est laissé de côté, dans un sens comme dans l'autre. Le choix
est retenu d'une fiche à l'autre (`localStorage`).

## Les sources : la règle absolue

En science, on n'affirme pas sans pouvoir dire d'où ça vient. Chaque fiche
affiche ses ouvrages de référence et ses articles fondateurs, depuis
`src/data/references.json`.

> **Aucun DOI n'est jamais écrit de mémoire.** Un identifiant n'est affiché
> comme lien cliquable que si `"verifie": true`, c'est-à-dire confirmé par
> au moins deux sources indépendantes. Sinon la référence porte la mention
> « DOI à vérifier » — un manque assumé vaut mieux qu'un lien inventé.

Cette règle s'applique à toute référence ajoutée par la suite.

## Organisation des fichiers

```
index.html                  page HTML de départ
public/favicon.svg          icône de l'onglet
public/polices.css          déclarations des polices embarquées
public/polices/             les fichiers de police (woff2)
public/structures/          les structures 2D dessinées (SVG, engendrées)
scripts/
  dessiner-structures.mjs   dessine les structures avec RDKit-JS
src/
  main.jsx                  point d'entrée : accroche React à la page
  App.jsx                   structure commune + liste des adresses (routes)
  index.css                 toute la mise en forme (mobile-first)
  data/
    reactions.json          LE CONTENU : les réactions
    reactifs.json           LE CONTENU : les réactifs
    solvants.json           LE CONTENU : les solvants
    references.json         LE CONTENU : les sources et leurs DOI
    structures.json         liste des dessins disponibles (engendré)
    meta.json               le principe et le ton à tenir (Phase 6)
  couleurs.js               une couleur par famille de réactions
  components/
    BarreNavigation.jsx     en-tête + bande des couleurs
    CarteReaction.jsx       la tuile d'une réaction dans la liste
    BasculeMode.jsx         le choix Comprendre / Référence
    StructureMolecule.jsx   une structure 2D et sa légende
    ReferencesReaction.jsx  les sources, avec l'état de vérification
    BlocTexte.jsx           affiche un texte long en paragraphes
.github/workflows/
  deploy.yml                construit et publie l'app à chaque modification
  pages/
    PageListeReactions.jsx  page d'accueil (liste + filtres)
    PageDetailReaction.jsx  fiche détaillée d'une réaction
    PageAPropos.jsx         philosophie du projet + avancement
```

## Ajouter ou modifier une réaction

Tout le contenu chimique vit dans `src/data/reactions.json`. Aucun code à
toucher : il suffit d'ajouter un objet à la liste, en respectant ce schéma.

```json
{
  "id": "identifiant_sans_espace_ni_accent",
  "nom": "Nom affiché de la réaction",
  "symbole": "SN2",
  "famille": "Substitutions",
  "substrat_SMILES": "CCBr",
  "produit_SMILES": "CCO",
  "reactifs": ["HO⁻ (soude NaOH)"],
  "solvant": "DMSO (aprotique polaire)",
  "mecanisme_etapes": ["étape 1", "étape 2"],
  "selectivite": "…",
  "pieges": ["piège 1", "piège 2"],
  "explication_reference": "texte technique rigoureux",
  "explication_comprendre": "texte reconstruit sans prérequis",
  "niveau_difficulte": 3
}
```

`niveau_difficulte` est une note **sur 10**. `symbole` est le sigle court
affiché en grand sur la tuile (2 à 5 caractères) ; sans lui, l'identifiant
est utilisé.

Deux conventions utiles dans les textes longs (`explication_*`) :

- une **ligne vide** (`\n\n` dans le JSON) sépare deux paragraphes ;
- un paragraphe qui **commence par un mot en majuscules** (« POURQUOI … »,
  « COMMENT … », « QU'EST-CE … ») voit ce mot mis en valeur en brun :
  c'est la charpente du mode « Comprendre ».

Les fichiers `src/data/reactifs.json` et `src/data/solvants.json` suivent le
même principe (schémas déjà en place, leur affichage viendra plus tard).

> Le fichier `src/data/meta.json` conserve le principe et le ton à tenir
> pour toutes les entrées ajoutées en Phase 6.

---

## Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 1 | Socle : données, liste, fiches, mobile | ✅ fait |
| — | Identité visuelle : couleurs par famille, tuiles | ✅ fait |
| 5 | Bascule Comprendre / Référence *(arrivée en avance)* | ✅ fait |
| — | Sources vérifiées sur chaque fiche | ✅ fait |
| 2 | Structures 2D dessinées (RDKit-JS) | ✅ fait |
| 3 | 3D interactive et orbitales (3Dmol.js) | à venir |
| 4 | Flashcards et quiz (progression en `localStorage`) | à venir |
| 6 | Remplissage de toutes les familles de réactions | à venir |
