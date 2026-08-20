# ChimieRév — méthode de travail

Ce fichier est lu au début de chaque session. Il fixe ce qui ne se renégocie
pas : la manière de sourcer, la manière de vérifier, la manière d'écrire.

## Le but

Une application de révision qui permette de comprendre la chimie, pas de la
réciter. L'ambition assumée est le niveau d'excellence : de la licence au
master 2, organique, inorganique, biomolécules, méthodes.

## La règle de sourçage — la plus importante

**On n'écrit jamais de mémoire.** Chaque mécanisme, chaque sélectivité,
chaque piège vient d'un manuel qu'on a ouvert, et la fiche cite le numéro de
page imprimé.

Si une réaction n'est traitée par aucun ouvrage disponible, on le dit — on
n'invente pas. C'est vrai des mécanismes comme des DOI : **un DOI incertain
s'écrit `null`**, jamais approché.

### Les neuf ouvrages indexés

Les PDF vivent dans le dépôt privé `orneilla/manuel-chimie`, cloné dans
`/workspace/manuel-chimie`. Ils sont indexés dans `sources-locales/`, qui
est **ignoré par git** : le dépôt ChimieRév est public, y verser le texte
d'un manuel sous droits reviendrait à le redistribuer. Seules les
explications réécrites et les citations bibliographiques sont publiées.

| nom court | ouvrage | couverture |
|---|---|---|
| `clayden` | Clayden, Greeves & Warren, *Organic Chemistry* 2e | intégral |
| `mcmurry` | McMurry, *Organic Chemistry* 9e | intégral, ch. 1-31, reconstitué depuis trois fichiers |
| `grossman` | Grossman, *The Art of Writing Reasonable Organic Reaction Mechanisms* 3e | intégral |
| `oc2` | Morsch *et al.*, *Organic Chemistry II* (LibreTexts) | intégral, cité par section |
| `housecroft` | Housecroft & Sharpe, *Inorganic Chemistry* 2e | ch. 20-28 (p. 555-950) |
| `dugas` | Dugas, *Bioorganic Chemistry* 3e | intégral |
| `multicomposants` | Herrera & Marqués-López, *Multicomponent Reactions* | intégral — inclut la chimie durable (ch. 1.3) |
| `carey_sundberg_A` | Carey & Sundberg, *Advanced Organic Chemistry* A, 4e | ch. 12, photochimie (p. 1073-1197) |
| `roberts_caserio` | Roberts & Caserio, *Basic Principles of Organic Chemistry* | ch. 28, photochimie, cité par section |

Les ouvrages marqués `NON INDEXÉ` dans `src/data/references.json` (March,
Carey & Sundberg B, Fleming, Elschenbroich) ne sont **pas** disponibles :
ne jamais les citer avec un numéro de page.

### Les outils

```bash
python3 outils/chercher-source.py "Mitsunobu" --nom clayden      # chercher
python3 outils/chercher-source.py --page 350 --nom clayden       # lire le texte
python3 outils/voir-page.py --nom clayden --page 350 --zoom 3    # REGARDER la page
python3 outils/indexer-manuel.py fichier.pdf --nom x [--ajouter] # indexer
```

`voir-page.py --nom` retrouve seul le bon fichier et le bon décalage, y
compris pour un ouvrage en plusieurs volumes. **Regarder la page est
indispensable** : dans un manuel de chimie l'essentiel est dessiné, et le
texte extrait ne contient que la prose autour des figures.

Le décalage entre pagination PDF et pagination imprimée se **vérifie en
ouvrant une page**, jamais en faisant confiance à la détection automatique :
le McMurry compose ses folios dans une police à encodage propre, illisible à
l'extraction.

## La chaîne de garanties

Chaque maillon bloque la construction. `npm run build` les exécute dans cet
ordre :

1. `tester` — sept fautes injectées volontairement ; le vérificateur doit
   toutes les refuser. On teste le testeur avant de lui faire confiance.
2. `valider` — champs obligatoires, SMILES lisibles, identifiants uniques.
3. `verifier` — **les flèches sont appliquées par la machine** : on part du
   SMILES de l'étape, on déplace les électrons comme les flèches le disent,
   et le produit obtenu doit être exactement le produit annoncé. La charge
   doit être conservée. Un mécanisme faux n'est pas publié.
4. `inventaire` — l'avancement, recalculé.
5. Les dessins — un schéma illisible n'est pas publié non plus. Sont
   refusés : un numéro trop près d'un atome, d'un autre numéro, d'une
   liaison, du « + » de l'équation ou du trait d'une autre flèche ; et
   **deux flèches qui longent le même chemin**. Ce dernier contrôle mesure
   la LONGUEUR du voisinage, pas la distance : deux flèches qui se croisent
   franchement ne partagent qu'un point et restent lisibles, deux flèches
   enroulées du même côté d'un cycle à quatre chaînons forment une tache.

Ce que la machine ne contrôle pas, c'est le **choix** du mécanisme. D'où le
badge « à relire par un chimiste » tant que `valide` vaut `false`.

## Écrire un mécanisme

Dans `src/data/mecanismes.json`. Le SMILES de l'étape fixe la numérotation
des atomes : le premier écrit est le n° 0. Les hydrogènes ne comptent que
s'ils sont écrits `[H]`.

Deux pièges appris à la dure :

- **Un hydrogène visé par une flèche s'écrit explicitement.** Sur `[OH+]`,
  RDKit dessine une seule étiquette « OH⁺ » et la pointe de la flèche
  atterrit entre les deux : écrire `[O+]([H])` pour que la flèche vise bien
  l'oxygène.
- **Une charge ne doit pas être recouverte** par le crochet d'une flèche.
  Changer la courbure jusqu'à ce qu'elle se voie.

Après écriture : `node scripts/verifier-mecanismes.mjs`, puis
`node scripts/dessiner-mecanismes.mjs`, puis **regarder les schémas rendus
à 390 px**. Un schéma qui passe les contrôles peut rester confus.

## L'affichage

`npm run affichage` mesure la mise en page sur **douze largeurs d'écran**
(280 à 1920 px) et **huit pages**, à taille de texte normale puis agrandie
de 25 %. Il refuse : un débordement horizontal, un élément dont un bord
sort de l'écran, un texte rogné par son conteneur, une cible tactile de
moins de 40 px.

```bash
npm install --no-save playwright   # une fois : Playwright n'est pas une
npx vite preview --port 4173 &     # dépendance du projet, trop lourd pour
npm run affichage                  # la construction sur GitHub
```

Trois règles retenues de la première passe :

- **La barre de navigation ne rogne jamais un intitulé.** Sous 350 px elle
  devient un carré de deux sur deux ; au-dessus elle tient sur une ligne.
- **Un mot très long doit pouvoir se couper.** « Déshydrohalogénation » sur
  un écran de 320 px pousse toute la page dehors si on ne l'autorise pas
  (`overflow-wrap: break-word`).
- **Typographie française** : espace insécable devant `? ! ; : »`, sinon le
  signe se retrouve seul en début de ligne. `npm run valider` le signale.
  Piège rencontré deux fois : une insécable écrite littéralement dans un
  heredoc shell peut se dégrader en espace ordinaire, et la normalisation
  ne remplace alors rien. L'écrire `"\u00a0"`, et vérifier que le compte de
  remplacements n'est pas nul.

La largeur de lecture reste bornée à 860 px, même sur un grand écran :
au-delà d'une soixantaine de signes par ligne, l'œil perd la ligne
suivante. Seule la grille de tuiles s'élargit, parce que ce n'est pas du
texte.

## Les réactifs et les solvants

**Chaque réaction apporte ses réactifs et son solvant** : c'est la règle,
et elle se tient en même temps que la fiche, pas plus tard. La source est
déjà ouverte, la page déjà lue — la différer coûterait de tout rouvrir.

Dans `src/data/reactifs.json` et `src/data/solvants.json`. Le lien avec les
réactions est automatique (`src/liens.js`) : il suffit que le nom ou le nom
complet du produit apparaisse dans la ligne `reactifs` ou `solvant` de la
réaction. Quand deux noms correspondent, c'est le plus long qui gagne —
sans quoi « KOH » l'emporterait sur « KOtBu ».

`/reactifs` est un index avec recherche ; chaque produit a sa page,
`/reactif/:id` ou `/solvant/:id`, et son nom est cliquable depuis le bloc
« Bilan » de toute réaction qui l'emploie.

Une fiche de réactif dit **à quoi il sert, pourquoi il marche, et ce qu'il
ne faut pas confondre**. Elle cite ses pages comme le fait une fiche de
réaction.

## Écrire une fiche

Deux modes obligatoires, dans `src/data/reactions.json` :

- `explication_reference` — dense, précis, le vocabulaire technique assumé.
- `explication_comprendre` — répond à **POURQUOI avant COMMENT**. Chaque
  terme technique est d'abord introduit par une analogie de la vie
  courante, puis nommé. Ton adulte, jamais infantilisant. Le lecteur ne
  doit rien avoir à mémoriser pour suivre.

Les paragraphes sont séparés par une ligne vide ; une amorce en capitales
(« POURQUOI … ? ») est mise en valeur automatiquement.

## Ce qui reste à faire

Phase 3 — 3D interactive et orbitales. Phase 4 — flashcards et exercices.
Phase 6 — les 265 réactions du programme encore à écrire.
