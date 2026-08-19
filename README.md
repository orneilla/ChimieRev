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
- [ ] Les schémas de mécanisme s'affichent, flèches comprises.
- [ ] La page Réactifs montre les renvois vers les réactions.
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
npm run dessins     # structures + mécanismes
```

Une molécule dont le SMILES est illisible n'arrête pas la construction :
le script le signale, et la fiche affiche la formule SMILES en clair à la
place du dessin.

## Les mécanismes avec leurs flèches

Chaque fiche montre le **bilan** (ce qu'on met, ce qu'on obtient) puis le
**mécanisme pas à pas** : pour chaque étape, un schéma où les flèches
courbes rouges suivent les électrons — d'où ils partent, où ils vont.

### Comment les flèches tombent au bon endroit

RDKit dessine les molécules mais ne dit pas où il place les atomes.
L'astuce (`scripts/dessiner-mecanismes.mjs`) : on lui demande un second
dessin où **tous les atomes sont surlignés**. Il trace alors une ellipse
centrée exactement sur chaque atome. On récupère ces centres, on jette ce
dessin de repérage, et on pose les flèches sur le dessin propre — au pixel
près.

### « Cette flèche, elle touche quoi ? »

C'est la question de quelqu'un qui découvre la réaction, et une flèche
seule n'y répond pas. Trois réponses, dans le dessin même :

- ce que la flèche **quitte** est surligné en **bleu pâle**, ce qu'elle
  **atteint** en **rose pâle** — atome ou liaison ;
- chaque flèche porte un **numéro**, repris sous le schéma par une phrase
  qui dit ce qu'elle fait ;
- la pointe s'arrête au bord du surlignage, sans recouvrir la lettre.

### Pourquoi les espèces sont empilées

Dès qu'une étape porte des flèches, les espèces sont posées **l'une sous
l'autre**, une par ligne. Côte à côte, sur un téléphone tenu verticalement,
le texte des molécules tombait à une taille illisible — il fallait tourner
l'écran. Empilé, le schéma tient toujours dans la largeur. Les étapes sans
flèche (les bilans) restent sur deux colonnes : il n'y a rien à suivre du
regard.

### Dessiner un mécanisme soi-même

Aucune bibliothèque ne trace les flèches de mécanisme automatiquement :
dans ChemDraw ou Marvin, c'est un humain qui les place. Si un mécanisme
mérite d'être tracé à la main, exporte-le et dépose-le dans
`public/mecanismes-manuels/` (voir le LISEZ-MOI de ce dossier), puis
indique `"image": "mon-schema.svg"` sur l'étape : l'application l'utilise
tel quel, sans rien engendrer.

### Décrire une flèche

Tout se passe dans `src/data/mecanismes.json`. Le SMILES de l'étape fixe la
numérotation : le premier atome écrit porte le numéro 0. Les hydrogènes ne
comptent que s'ils sont écrits explicitement entre crochets `[H]` — c'est
ainsi qu'on peut viser le proton qu'une base vient arracher.

```json
{
  "de": { "atome": 2 },
  "vers": { "atome": 5 },
  "courbure": 0.3,
  "libelle": "Le doublet de la base va chercher l'hydrogène."
}
{ "de": { "liaison": [6, 7] }, "vers": { "atome": 7 }, "courbure": 0.4 }
```

`libelle` est la phrase affichée sous le schéma, en face du numéro de la
flèche.

`de` = d'où partent les électrons (un doublet, une liaison), `vers` = où ils
vont. `courbure` (entre -0,6 et 0,6) règle de quel côté et à quel point la
flèche s'arrondit — le signe change le côté.

Une étape peut n'avoir **que du texte** : toutes ne se dessinent pas
honnêtement (un état de transition, avec ses liaisons à moitié formées, n'a
pas de représentation juste en liaisons entières).

### Les flèches sont vérifiées par la machine

Personne ne peut relire à la main les flèches de centaines de mécanismes.
Une flèche pointée sur le mauvais atome passerait alors pour une vérité.

D'où ce contrôle : **une flèche courbe n'est pas un ornement, c'est un
déplacement de deux électrons — donc un calcul.** Le vérificateur
(`scripts/verifier-mecanismes.mjs`) applique les flèches d'une étape à la
molécule de départ, en comptant les électrons de valence, et en déduit le
produit. Il le compare à celui que l'étape annonce (`produit_attendu`).

```bash
npm run verifier   # applique les flèches et compare
npm run tester     # vérifie que le vérificateur détecte bien les fautes
```

Les deux tournent **avant chaque construction** : un mécanisme faux
n'arrive jamais en ligne, la construction s'arrête d'abord.

Ce que ce contrôle prouve :

- les flèches mènent bien au produit annoncé ;
- la charge totale est conservée ;
- la structure obtenue est chimiquement possible (valences légales).

Ce qu'il ne prouve pas : que ce mécanisme est celui qu'emprunte la nature.
Cela reste le travail d'un chimiste — d'où les **deux mentions distinctes**
sur chaque schéma : « flèches vérifiées » (la machine) et « à relire par un
chimiste » (l'humain, tant que `valide` n'est pas passé à `true`).

Et parce qu'un contrôle qui ne détecte rien ne protège de rien,
`scripts/tester-verificateur.mjs` lui tend cinq fautes connues — flèche sur
le mauvais carbone, mauvaise liaison rompue, flèche manquante, produit
annoncé erroné, produit non annoncé — et exige qu'il les refuse toutes.

### Écrire une flèche sans ambiguïté

Une flèche qui **forme** une liaison le dit :
`"vers": {"liaison": [a, b]}`. Pointer simplement un atome signifie que les
électrons s'y localisent en doublet libre — ce n'est pas la même chose, et
la vérification les distingue. Au dessin, une liaison qui naît est montrée
en pointant l'atome nouveau partenaire ; une liaison qui existe déjà (une
double liaison qui se déplace) est visée en son milieu.

### La relecture humaine, comme pour les DOI

Les flèches transcrivent les étapes décrites dans `mecanisme_etapes` :
c'est de la donnée scientifique, pas de la mise en page. Elles suivent donc
le même régime que les références.

> Tant qu'une étape porte `"valide": false`, la fiche affiche la mention
> **« à relire par un chimiste »**. On passe à `true` **après** relecture,
> jamais avant.

Une erreur de flèche est ainsi visible par le lecteur, au lieu de passer
pour une vérité établie.

### La mise en page, et pourquoi elle est verticale

Les espèces sont **toujours empilées**, une par ligne, séparées par un seul
« + » centré. Deux raisons :

- côte à côte, sur un téléphone tenu verticalement, le texte des molécules
  tombe à une taille illisible ;
- une équation qui passe à la ligne au milieu fait douter du nombre de
  « + » — en chimie, cette ambiguïté n'est pas acceptable.

Chaque espèce est resserrée sur son contenu réel avant d'être posée, et le
schéma final est recadré : pas de vide inutile à faire défiler.

### Ce que le moteur règle tout seul

Deux réglages seraient intenables à la main sur des centaines de réactions,
ils sont donc automatiques :

- **le côté de chaque flèche** : le moteur essaie plusieurs courbures des
  deux côtés et garde celle qui laisse le plus d'air autour des atomes que
  la flèche ne relie pas (le côté demandé dans les données garde un
  avantage, il n'est abandonné que si un autre dégage nettement mieux) ;
- **la position de chaque numéro** : il s'écarte de la courbe jusqu'à ne
  plus toucher aucun atome.

Reste un réglage utile à la main : **l'ordre des espèces dans le SMILES**.
Il fixe qui est dessiné en haut et qui est en bas. Écrire le substrat avant
la base, par exemple, place la base sous l'hydrogène qu'elle vient chercher,
et la flèche cesse de traverser la molécule.

## Réactifs & solvants

La page `/#/reactifs` rassemble tous les réactifs et tous les solvants :
structure, anatomie (quelle partie fait quoi), explication, réactions
d'exemple.

Les renvois « où on le rencontre » sont **trouvés automatiquement**
(`src/liens.js`) : on cherche le nom du réactif ou du solvant dans les
données des réactions. Ajouter une réaction suffit donc à mettre cette page
à jour — il n'y a aucune liste à tenir à la main.

## Les deux modes de lecture

Chaque fiche propose la même chose expliquée de deux façons :

- **Comprendre** — aucune base en chimie requise, on part du pourquoi ;
- **Référence** — la formulation technique exacte, pour réviser vite.

Personne n'est laissé de côté, dans un sens comme dans l'autre. Le choix
est retenu d'une fiche à l'autre (`localStorage`).

## Travailler à partir d'un manuel

Les explications ne doivent pas sortir d'une mémoire : elles doivent
s'appuyer sur un ouvrage qu'on peut citer, page comprise. D'où cet
outillage.

### Indexer un manuel

```bash
pip install --break-system-packages pymupdf          # une seule fois
python3 outils/indexer-manuel.py mon-manuel.pdf --nom clayden --decalage 24
```

`--decalage` est l'écart entre le numéro de page du PDF et celui imprimé
sur la page (si la page 25 du PDF porte le numéro 1, le décalage vaut 24).
Sans lui, les citations renverraient à de mauvaises pages.

Le script signale les pages sans texte : au-delà de quelques pour cent,
le PDF est un scan sans couche texte, inutilisable pour citer tant qu'il
n'est pas passé à l'OCR.

### Consulter

```bash
python3 outils/chercher-source.py "anti-periplanar" --nom clayden
python3 outils/chercher-source.py --page 342 --nom clayden
```

La recherche ignore accents et majuscules, et rend pour chaque occurrence
la page imprimée — celle qu'on cite.

### Ce qui entre dans le dépôt, et ce qui n'y entre pas

> Le dépôt ChimieRév est **public**. Un manuel sous droits n'y a pas sa
> place, ni son texte extrait : ce serait le redistribuer.

`sources-locales/` et les fichiers `.pdf` sont donc ignorés par git. Le
manuel sert de source pendant la rédaction, puis reste sur la machine.
Ce qui est publié : des explications **réécrites**, et des **références**
(ouvrage, chapitre, page) dans `references.json` — c'est-à-dire une
bibliographie, exactement ce que fait n'importe quel cours.

Les citations littérales restent courtes et attribuées, comme le veut
l'usage en matière de citation.

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
public/mecanismes/          les schémas de mécanisme (SVG, engendrés)
public/mecanismes-manuels/  tes propres schémas, dessinés à la main
outils/
  indexer-manuel.py         indexe un manuel PDF, page par page
  chercher-source.py        y cherche une expression, rend la page citable
scripts/
  dessiner-structures.mjs   dessine les structures avec RDKit-JS
  dessiner-mecanismes.mjs   dessine les mécanismes et leurs flèches
  verifier-mecanismes.mjs   applique les flèches et contrôle le produit
  tester-verificateur.mjs   tend des fautes au vérificateur
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
    mecanismes.json         LE CONTENU : les flèches de chaque mécanisme
    mecanismes-dessins.json liste des schémas disponibles (engendré)
    meta.json               le principe et le ton à tenir (Phase 6)
  couleurs.js               une couleur par famille de réactions
  components/
    BarreNavigation.jsx     en-tête + bande des couleurs
    CarteReaction.jsx       la tuile d'une réaction dans la liste
    BasculeMode.jsx         le choix Comprendre / Référence
    StructureMolecule.jsx   une structure 2D et sa légende
    MecanismeEtapes.jsx     le mécanisme, texte et schémas
    ReferencesReaction.jsx  les sources, avec l'état de vérification
    BlocTexte.jsx           affiche un texte long en paragraphes
.github/workflows/
  deploy.yml                construit et publie l'app à chaque modification
  pages/
    PageListeReactions.jsx  page d'accueil (liste + filtres)
    PageDetailReaction.jsx  fiche détaillée d'une réaction
    PageReactifs.jsx        réactifs et solvants, avec leurs renvois
    PageAPropos.jsx         philosophie du projet + avancement
  mode.js                   le choix Comprendre / Référence, et sa mémoire
  liens.js                  retrouve les réactions d'un réactif/solvant
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
