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

### Croiser les ouvrages, et ne pas croire à un silence

**Une fiche adossée à un seul manuel est une fiche appauvrie.** Le socle
organique s'est écrit presque entièrement sur le Clayden, ce qui se
défend — il porte l'essentiel de la matière. Le bloc catalyse ne le
permet pas : le Housecroft en dit davantage, le Grossman montre comment
s'écrit un cycle, LibreTexts donne des étapes que les autres omettent.
Sur chaque sujet, on ouvre les neuf.

Trois exemples de ce que le croisement a rapporté sur le seul cycle du
palladium :

- le Clayden compte les électrons (14, 16, 18) ; le **Housecroft** dit la
  règle qui en découle — un centre à 18 électrons ne peut PAS faire
  d'addition oxydante sans perdre d'abord un ligand à deux électrons, et
  il donne l'équation qui le montre (p. 720) ;
- le Clayden nomme l'insertion migratoire ; le **Housecroft** donne
  l'expérience de marquage au ¹³C qui prouve que c'est le MÉTHYLE qui
  migre et non le CO qui s'insère (p. 721) ;
- le Clayden ne détaille pas la formation de l'acétylure de cuivre du
  Sonogashira ; **LibreTexts** l'écrit (§ 12.2.6).

**Un « aucune occurrence » ne prouve rien.** Le nom passé à `--nom` est
celui du dossier d'index, qui ne coïncide pas toujours avec le nom court
du tableau — le Housecroft y est rangé sous `inorganique`. Les deux outils
acceptent désormais les deux noms, et une recherche sous un nom inconnu
liste les ouvrages disponibles au lieu de laisser croire à un silence.

**Le défaut ne se voit pas fiche par fiche, il se voit au compte.** D'où :

```bash
python3 outils/mesurer-sources.py            # la répartition
python3 outils/mesurer-sources.py --seules   # les fiches mono-source
```

Il vérifie au passage que chaque page citée existe dans l'index : une
citation vers une page absente est une citation qu'on n'a pas ouverte.

L'état au moment où cet outil a été écrit, et il n'est pas flatteur :
**79 % des fiches ne citent qu'un seul ouvrage**, et le Clayden apparaît
sur 96 % d'entre elles. Le Housecroft, sur une seule. C'est le chantier
de fond du corpus.

### La pagination, qui a menti une fois

Le décalage entre pagination PDF et pagination imprimée ne se devine pas.
Le McMurry en donne le pire exemple : ses folios sont composés dans une
police sous-ensemblée dont le codage change à chaque page — illisible à
l'extraction — et ses trois fichiers sont des scans **partiels**, avec des
pages insérées entre les chapitres. Un décalage unique par volume donnait
donc des citations fausses de plusieurs dizaines de pages. Le volume 6
compte à lui seul **treize** plages de décalage.

Le McMurry n'était pas seul. Le **Grossman**, le **Dugas** et le **Carey
& Sundberg** ont eux aussi des pages non numérotées glissées entre les
chapitres : le décalage y avance d'un cran à chaque fois — quatre plages
pour le Grossman, trois pour les deux autres. Le Clayden, lui, tient sur un
décalage unique, et c'est heureux : il porte l'essentiel des citations.

Trois outils en découlent, et ils tournent **avant** de citer :

```bash
python3 outils/lire-folios-texte.py grossman            # constater
python3 outils/lire-folios-texte.py grossman --ecrire   # corriger l'index
python3 outils/lire-folios.py fichier.pdf               # cas McMurry, par la forme
python3 outils/verifier-folios.py                       # la page porte-t-elle son folio ?
```

`lire-folios-texte.py` lit le folio là où il est imprimé — seul en tête ou
en pied. `lire-folios.py` sert au seul McMurry, dont les folios sont
composés dans une police sous-ensemblée : il reconnaît la **forme** des
chiffres, pas leur codage.

Les deux ne retiennent une lecture que si une page voisine la confirme,
et ce n'est pas une précaution de style : bien des manuels impriment le
**numéro de chapitre** seul, au même endroit que le folio. Un numéro de
chapitre se répète à l'identique de page en page ; un folio avance de un.
C'est la seule chose qui les distingue.

`verifier-folios.py` compare le folio LU au numéro que l'index annonce. Sa
version précédente se contentait de chercher ce numéro n'importe où dans le
texte de la page : un ouvrage dont le décalage dérivait au fil des
chapitres gardait une majorité de pages justes et passait. C'est ainsi que
le Grossman est resté faux. Une page sans folio lisible ne prouve rien et
n'est pas comptée ; ce qui accuse, c'est un DÉSACCORD.

Ces outils ne tournent pas à la construction : les PDF ne sont pas dans le
dépôt. Ils tournent sur la machine où sont les manuels, avant d'écrire une
fiche.

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
   liaison, du « + » de l'équation ou du trait d'une autre flèche ;
   **deux flèches qui longent le même chemin** ; et **deux étiquettes
   d'atomes qui se recouvrent**.

   Le contrôle des flèches mesure la LONGUEUR du voisinage, pas la
   distance : deux flèches qui se croisent franchement ne partagent qu'un
   point et restent lisibles, deux flèches enroulées du même côté d'un
   cycle à quatre chaînons forment une tache.

   Le contrôle des atomes ne regarde que les atomes ÉCRITS — un carbone
   neutre n'est qu'un sommet de traits, deux sommets rapprochés ne gênent
   personne. Deux hydrogènes portés par le même atome font exception :
   c'est l'écriture courante d'un CH₂ dont on veut viser un proton.

Ce que la machine ne contrôle pas, c'est le **choix** du mécanisme. D'où le
badge « à relire par un chimiste » tant que `valide` vaut `false`.

### La mise en page, qui a menti elle aussi

Le contrôle des étiquettes a été ajouté après coup, parce qu'un schéma
illisible était parti en ligne : le périodinane de Dess-Martin, chaîne
posée sur son cycle et « H » sur un « O ». Toutes les flèches étaient
pourtant bien placées — le contrôle ne regardait pas la molécule.

La cause tenait à un piège de RDKit qu'il faut connaître : **les
coordonnées ne sont pas calculées à la lecture du SMILES mais au moment du
dessin**. Poser `prefer_coordgen(true)` autour du seul `get_mol` ne sert
donc à rien ; il faut tenir le drapeau levé pendant tous les appels à
`get_svg`. CoordGen place bien mieux les atomes hypervalents — un iode à
cinq liaisons, un chrome, un phosphore — mais il échoue sur une espèce
réduite à un seul atome, où il ne rend aucune coordonnée : l'ion hydrure
disparaît du schéma. On le réserve donc aux espèces qui ont une liaison.

Deux outils en découlent :

```bash
CHIMIEREV_RAPPORT=refus.json node scripts/dessiner-mecanismes.mjs
```

Le mode rapport ne s'arrête pas au premier refus : il les liste tous. Il
sert au réglage des courbures, qui essaie des centaines de candidats dans
un seul processus — relancer RDKit à chaque essai coûtait deux secondes,
et une étape à quatre flèches ne se réglait pas en un temps humain. **La
construction, elle, tourne toujours sans ce mode** : un schéma refusé y
arrête tout, et c'est bien ce qu'on veut.

## Écrire un mécanisme

Dans `src/data/mecanismes.json`. Le SMILES de l'étape fixe la numérotation
des atomes : le premier écrit est le n° 0. Les hydrogènes ne comptent que
s'ils sont écrits `[H]`.

**La chimie radicalaire déplace UN électron à la fois.** Une flèche porte
alors `"electrons": 1` : c'est un HAMEÇON, dessiné avec une demi-pointe.
Une liaison en valant deux, il en faut **deux, appariés**, pour la rompre ou
pour la former — le vérificateur refuse une liaison qui se retrouverait à
moitié rompue. Un nombre impair d'électrons non liants signe un radical,
noté `M  RAD` dans le molblock : sans quoi la relecture rendrait l'électron
célibataire sous forme d'un hydrogène de plus.

Deux hameçons qui visent la même liaison sont dispensés des contrôles de
superposition : c'est l'écriture normale d'une liaison qui naît de deux
électrons célibataires, ils arrivent forcément au même point. Il faut leur
donner des courbures **opposées** pour qu'on les distingue.

Deux pièges appris à la dure :

- **Un hydrogène visé par une flèche s'écrit explicitement.** Sur `[OH+]`,
  RDKit dessine une seule étiquette « OH⁺ » et la pointe de la flèche
  atterrit entre les deux : écrire `[O+]([H])` pour que la flèche vise bien
  l'oxygène.
- **Une charge ne doit pas être recouverte** par le crochet d'une flèche.
  Changer la courbure jusqu'à ce qu'elle se voie.

### Les flèches d'une réaction péricyclique ne racontent pas la même chose

Le Grossman le dit là où personne d'autre ne le dit (p. 198), et cela
change la façon de relire un schéma :

> « Quand on dessine le changement de schéma de liaison dans une réaction
> péricyclique, PEU IMPORTE qu'on dessine les électrons tournant dans un
> sens ou dans l'autre, parce que les réactions péricycliques ne sont pas
> caractérisées par un déplacement de densité électronique d'un site riche
> vers un site pauvre. Les flèches ne servent qu'à montrer le changement
> de schéma de liaison entre réactif et produit. »

Deux conséquences pour ce dépôt :

- **Le sens de rotation est libre**, sauf quand un composant porte une
  charge formelle négative — cycloaddition [3+2], sigmatropique [2,3],
  rétro-hétéro-ène — où **il faut commencer là**. Le vérificateur
  n'attrape pas cette faute : elle est de lecture, pas de bilan.
- **Un test de relecture** qui attrape la faute la plus fréquente du
  domaine : « s'assurer qu'on peut NOMMER chaque étape péricyclique de son
  mécanisme ». Il n'y a que quatre archétypes — électrocyclique,
  cycloaddition, sigmatropique, ène. Si l'étape qu'on vient de dessiner ne
  porte aucun de ces noms, elle n'existe probablement pas.

Et un piège de comptage, du même auteur (p. 194) : **les doublets libres
d'un hétéroatome ne comptent pas** dans le décompte électronique d'une
électrocyclisation s'ils ne font pas partie du système π qui se referme.

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
  Piège rencontré trois fois : une insécable écrite littéralement dans un
  heredoc shell se dégrade en espace ordinaire, et la normalisation tourne
  alors sans rien remplacer — le silence passant pour un succès. D'où un
  outil durable, qui écrit l'insécable `\u00a0`, le vérifie par assertion
  et affiche le compte :

```bash
python3 outils/normaliser-typographie.py
```

- **Le corpus vouvoie de bout en bout.** Un « tu » isolé ne casse rien et
  ne se voit pas à la relecture — il se voit à l'écran, une fois la fiche
  en ligne. `outils/verifier-registre.py` le cherche. Même piège que
  ci-dessus : « Retiens : » s'écrit avec une insécable devant les
  deux-points, et une recherche sur la chaîne littérale ne trouve rien.
  L'outil AFFICHE le contexte au lieu de corriger seul, parce qu'un
  impératif ressemble souvent à un nom commun — « ce **ton** », « une
  **note** ».

La largeur de lecture reste bornée à 860 px, même sur un grand écran :
au-delà d'une soixantaine de signes par ligne, l'œil perd la ligne
suivante. Seule la grille de tuiles s'élargit, parce que ce n'est pas du
texte.

### Un texte long ne s'affiche pas tel quel

Trois pièges, découverts en regardant l'application plutôt que les
données. Tous produisaient le même symptôme : un pavé de texte d'un seul
tenant, illisible sur un téléphone.

- **Tout texte long passe par `BlocTexte`.** La légende d'une étape de
  mécanisme, elle, était posée brute dans son `<figcaption>` : les lignes
  vides du JSON disparaissaient, et les 108 mécanismes affichaient leur
  légende en un bloc. Un texte à paragraphes ne s'écrit jamais en clair
  dans du JSX.
- **Une liste à puces s'écrit `•` en tête de ligne**, avec un simple
  retour à la ligne — et `BlocTexte` la regroupe en vraie liste. Sans
  cela, les quatre règles de Woodward-Hoffmann se lisaient comme une seule
  phrase. Un retour à la ligne isolé coupe la ligne sans ouvrir de
  paragraphe : c'est ce qu'il faut pour une formule sur trois lignes.
- **L'amorce en capitales s'arrêtait à la première virgule.** « LA MÊME
  RÉACTION, EN SENS INVERSE, ET AVEC DEUX ÉLECTRONS DE MOINS. » ne mettait
  en valeur que « LA MÊME » : le mot suivant la virgule ne correspondait
  pas, et le moteur reculait jusqu'au dernier mot suivi d'une espace.
  354 lignes étaient tronquées ainsi — « LE CONTRASTE À », « CE QUI SE »,
  « SUR LE ». La virgule est désormais tolérée entre deux mots, et la fin
  d'amorce accepte la ponctuation autant que l'espace.

### Se déplacer d'une page à l'autre

Trois défauts qui, ensemble, rendaient l'application pénible à parcourir.
Aucun ne se voit dans les données : ils se voient à l'usage.

- **On ne repart jamais du milieu d'une page qu'on vient d'ouvrir.** Sans
  rien, le navigateur garde la hauteur de défilement d'une page à
  l'autre : on quittait le bas d'une fiche, on demandait la liste, on
  arrivait sur les DERNIÈRES réactions. `src/defilement.js` applique la
  règle d'un site ordinaire — on ouvre une page, on arrive en haut ; on
  revient en arrière, on retrouve l'endroit qu'on avait quitté.

  Le retour en arrière demande une précaution : **les schémas sont des
  images, et la page n'atteint sa hauteur définitive qu'une fois
  qu'elles sont chargées.** Demander « descends à 3 000 px » sur un
  document qui n'en fait encore que 900 ne descend nulle part. On
  réessaie à chaque image de l'écran jusqu'à y arriver.

- **Un lien de retour en haut ET en bas de page n'existe nulle part.**
  Une fiche fait couramment quinze écrans : depuis le milieu du
  mécanisme, il fallait choisir dans quel sens parcourir dix écrans pour
  atteindre la sortie. `BarreRetour` reste collé sous l'en-tête.

  Il se colle à `var(--hauteur-entete)`, que `BarreNavigation` **mesure**
  et publie : cette hauteur change avec la largeur de l'écran, et une
  valeur écrite en dur laisse un trou ou un recouvrement.

- **Un texte long mérite un retour en haut.** `BoutonRemonter` apparaît
  passé deux écrans, et se retire du parcours au clavier tant qu'il est
  invisible.

### La couleur, qui se mesure

La couleur d'une famille est toujours un **fond** sur lequel on écrit à
l'encre. Deux propriétés en découlent, et **elles se mesurent** — sans
mesure elles se dégradent sans que personne ne s'en aperçoive :

- **le contraste avec l'encre**, au moins 4,5 pour 1. La palette
  précédente comptait six couleurs sous ce seuil, dont une à **2,4** : sur
  la tuile « Catalyse », l'intitulé était illisible ;
- **l'écart entre deux familles**, en ΔE dans l'espace CIELAB. Sous 15,
  deux aplats côte à côte se lisent comme « la même couleur, en un peu
  différent ». La palette précédente descendait à **7,3** — trois verts,
  trois oranges et quatre turquoises se marchaient dessus.

Comparer deux codes hexadécimaux ne dit rien : `#00FF00` et `#00E000` sont
loin l'un de l'autre en chiffres et presque identiques à l'œil. D'où
`ecartCouleurs` et `contraste`, dans `src/couleurs.js`, et le contrôle
qu'en fait `npm run valider` — qui **arrête la construction**.

Une leçon de méthode : **vingt-huit couleurs mutuellement distinctes ne
s'écrivent pas à la main.** Une palette dessinée à l'intuition, teinte par
teinte, est retombée à ΔE 8,8 — à peine mieux que celle qu'elle
remplaçait. Ce qui marche est le partage du travail : on choisit les
TEINTES (l'identité d'une famille tient à sa teinte, « Substitutions » est
bleu depuis le premier jour), et on laisse une recherche numérique régler
la clarté et la saturation. La palette actuelle tient ΔE 19,1 et contraste
5,4, chaque famille restant à moins de 20° de sa teinte d'origine.

Attention au piège inverse : un optimiseur laissé libre part dans le
fluorescent et le délavé — c'est là que se trouvent les couleurs les plus
éloignées les unes des autres. On borne donc le vivier sur l'enveloppe de
la direction artistique (clarté 58-90, saturation 38 et plus, jamais sur
le bord du gamut).

### Le tableau se mélange

Les fiches sont écrites famille par famille, et `reactions.json` garde cet
ordre — c'est celui du programme, et c'est bien ainsi pour écrire.
**Affiché tel quel, il donne des paquets** : vingt tuiles bleues, puis
douze citron, puis neuf orange. On ne lit plus un tableau périodique, on
lit des blocs, et l'information que porte la teinte se perd.

`src/ordre.js` entrelace. Deux exigences qui tirent en sens contraire :
chaque famille doit s'étaler sur TOUTE la grille, et deux tuiles voisines
ne doivent pas porter des couleurs proches. Trois points à retenir :

- **« voisine » vaut aussi verticalement.** La grille compte deux colonnes
  sur téléphone et trois sur ordinateur : les rangs i+2 et i+3 touchent le
  rang i tout autant que i+1.
- **On raisonne en COULEUR, pas en famille.** Écarter deux tuiles de la
  même famille ne suffit pas : « Réarrangements » est bleu ciel et
  « Substitutions » bleu franc, et posées l'une au-dessus de l'autre elles
  font une tache. On mesure l'écart.
- **Le numéro de la tuile suit cet ordre**, pas celui du fichier. Sans
  quoi la grille afficherait 2, 47, 13 — un tableau périodique se lit dans
  l'ordre.

Le résultat ne dépend que des données : le tableau ne se réorganise pas
d'une visite à l'autre.

### Quand un mécanisme n'a pas de flèches

Onze mécanismes n'en portent aucune, et ce n'est pas un manque. Deux
raisons se rencontrent :

- **les étapes sont concertées.** Autour d'un métal de transition —
  addition oxydante, élimination réductrice, insertion migratoire,
  élimination β-hydrure — tout bouge en même temps. Une flèche courbe
  raconte un déplacement de doublets d'un atome à un autre ; l'employer
  ici laisserait croire à une séquence qui n'existe pas. **Clayden ne les
  dessine pas non plus**, et sa boîte sur le complexe de Vaska (p. 1074)
  dit pourquoi il ne faut surtout pas généraliser : l'addition oxydante
  de H₂ se fait en *cis*, donc en un seul geste ; celle de l'iodométhane
  se fait en *trans*, « géométriquement impossible pour un processus
  concerté », donc par un mécanisme de type SN2. Même métal, deux
  mécanismes.
- **l'ouvrage ne donne pas le détail.** C'est le cas de la Clemmensen, des
  hydrogénations, de la réduction de Luche. On ne dessine pas ce qu'on
  n'a pas lu.

`MecanismeEtapes` le détecte et remplace l'en-tête. Sans cela, la fiche
promettait des « flèches rouges » qu'elle ne donnait pas, et le lecteur
concluait à un oubli. La note prend le liseré de la famille, pour qu'on
voie tout de suite que ce n'est pas le même avertissement.

**Le palladium entre dans le comptage électronique** du vérificateur avec
**deux** électrons de valence engagés : Pd(0) part avec un doublet
disponible, l'addition oxydante le change en deux liaisons σ, l'élimination
réductrice les rend. Les ligands — phosphines, solvant — ne sont pas
écrits dans les SMILES : ils ne changent pas, et les faire figurer
imposerait des charges formelles que la liaison dative crée sans qu'elles
existent.

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

**Chaque produit porte une `famille`**, déclarée dans
`src/familles-outils.js` — et `npm run valider` refuse un produit dont la
famille n'y figure pas : une faute de frappe créerait sans cela un groupe
d'un seul élément, sans rien casser et sans qu'on le voie. La famille ne
dit rien de neuf, elle reprend le `role` déjà écrit sur la fiche.

Le magasin propose **deux rangements**, et on ne peut pas trancher pour le
lecteur : *par famille* quand on cherche un outil sans savoir lequel — « il
me faut un oxydant doux » — et *de A à Z* quand on connaît déjà le nom.
Dans les deux cas l'intérieur d'un groupe est alphabétique.

Un piège de tri : **la clé alphabétique ne garde que les LETTRES.** Un nom
de réactif est plein de parenthèses et d'indices, et
« (EtO)₂P(O)CH₂CO₂Et » trié tel quel se range avant le A, sous sa
parenthèse ouvrante — alors qu'on le cherche à E.

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
