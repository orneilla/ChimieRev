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
   liaison, du « + » de l'équation ou du trait d'une autre flèche.

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
