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
| `roberts_caserio` | Roberts & Caserio, *Basic Principles of Organic Chemistry* | ch. 28-31 — photochimie, polymères, produits naturels ; cité par section |

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

### La règle des neuf ouvrages

**On ne s'appuie jamais sur un seul manuel.** Avant d'écrire une fiche, on
interroge les NEUF, sans exception :

```bash
python3 outils/chercher-partout.py "Beckmann"
python3 outils/chercher-partout.py "Beckmann" --extraits
```

L'outil existe pour une raison précise. `chercher-source.py` demande un
`--nom`, et on tape celui qu'on a en tête — le Clayden, presque toujours.
Le résultat s'est mesuré : **79 % des fiches ne citaient qu'un ouvrage**,
et le Housecroft n'apparaissait qu'une fois sur cent trente-sept. Ce
n'était pas un choix, c'était la pente.

`chercher-partout.py` supprime la pente : il interroge les neuf index d'un
coup et dit qui traite le sujet. Y compris ceux auxquels on n'aurait pas
pensé — le Dugas sur un mécanisme enzymatique, le Multicomposants sur une
condensation, le Roberts & Caserio sur un polymère.

**Trois raisons de fond**, et aucune n'est une question de forme :

- **Un manuel a des silences, et ils ne se voient pas de l'intérieur.**
  Le Clayden ne nomme ni la Chugaev ni l'élimination de Cope ; le Grossman
  les range dans leur vraie famille. Un lecteur du seul Clayden ne saurait
  même pas qu'il lui manque quelque chose.
- **Un manuel a un angle.** Le Clayden explique, le McMurry chiffre, le
  Grossman montre comment on DÉDUIT, le Housecroft compte les électrons,
  LibreTexts donne le détail que les autres sautent. Les preuves
  expérimentales — le marquage à l'¹⁸O, le piégeage du benzyne au furane,
  le ¹³C de l'insertion migratoire — viennent presque toutes d'un ouvrage
  qui n'était pas le premier consulté.
- **Deux ouvrages qui divergent sont une information.** Le Clayden écrit
  « vraisemblablement » là où le Grossman affirme ; on relaie les deux, et
  le lecteur sait ce qui est établi et ce qui est proposé.

**Un ouvrage muet est un RÉSULTAT, pas un oubli.** S'il couvre le domaine
et ne traite pas le sujet, la fiche le dit — « un seul ouvrage la traite,
et voici lesquels ne la traitent pas ». Sans cela, on ne distingue plus
une fiche bien sourcée d'une fiche écrite sans chercher.

### Ce que la recherche rend n'est pas encore une source

La reprise famille par famille a fait tomber le mono-sourçage de 79 % à
5 %. Il est depuis remonté à **14 %** (31 fiches sur 224), et la cause vaut
d'être connue avant de crier au relâchement : les blocs bio-inorganique et
bioorganique s'appuient sur des ouvrages que les six manuels d'organique ne
recoupent pas. Onze fiches tiennent sur le seul Housecroft, dix sur le seul
McMurry, trois sur le seul Dugas. **Un mono-sourçage qui vient du corpus
disponible n'est pas le même défaut qu'un mono-sourçage qui vient de la
paresse** — le premier se DÉCLARE dans la fiche, en nommant les ouvrages
muets ; le second ne se déclare pas, puisqu'on ne les a pas interrogés.
`mesurer-sources.py --seules` ne distingue pas les deux : c'est à la
relecture de la fiche de le faire.

Elle a surtout appris que **`chercher-partout.py` rend des PAGES, pas
des contenus** : entre le résultat et la citation, il faut ouvrir. Quatre
pièges se sont présentés, tous silencieux.

- **Une entrée d'index n'est pas un contenu.** Le Carey & Sundberg semblait
  traiter l'élimination de Peterson à cinq endroits : c'était son index, et
  il renvoyait à des pages hors de l'extrait indexé. Même chose pour le
  Roberts & Caserio sur la Beckmann et l'hydroboration. Une page d'index
  d'un ouvrage indexé PARTIELLEMENT est un piège parfait : elle contient le
  bon mot et pointe vers ce qu'on n'a pas.

  Le cas s'est représenté quatre fois d'affilée sur la seule résolution
  enzymatique : « acylase », « lipase », « kinetic resolution » et
  « enzymatic resolution » rendaient toutes des pages du Carey & Sundberg —
  1170, 1184, 1189, 1193, 1197 — qui sont son index, relié en fin de volume
  et donc DANS l'extrait indexé alors que ce qu'il désigne n'y est pas.
  Un ouvrage dont on n'a qu'un chapitre rend son index en entier : c'est la
  configuration la plus trompeuse qui soit.

- **Un mot de trois lettres ne se cherche pas.** « BOC » rend 108 pages du
  Clayden, 93 du McMurry, 67 de LibreTexts — la chaîne se loge à l'intérieur
  de mots quelconques. Le groupe protecteur, lui, se cherche sous
  « Boc group » ou « BOC anhydride », qui rendent quatre pages, toutes
  justes. À l'inverse « t-butoxycarbonyl » et « tert-butyl carbamate » ne
  rendent RIEN : le nom développé n'est pas celui qu'emploient les manuels.
  Devant un résultat pléthorique comme devant un silence, on essaie une
  autre formulation avant de conclure.
- **Un homonyme n'est pas une source.** « cuprate » rend huit pages du
  Housecroft — qui parlent des supraconducteurs YBa₂Cu₃O₇, pas des réactifs
  de Gilman. « pyrazole » y rend une ligne de tableau de ligands. Le mot
  est le bon, le sujet n'est pas le nôtre.
- **Une extraction fautive ressemble à un résultat.** « Knorr » rend deux
  pages du McMurry qui traitent du glucose : du bruit d'OCR. Rien ne le
  signale, sauf la lecture.
- **Une lettre grecque ne s'extrait pas.** « beta-oxidation » ne rend RIEN
  dans les neuf ouvrages. La section existe pourtant — McMurry lui consacre
  ses pages 972 à 976 — mais il compose le nom avec un β grec, que
  l'extraction de texte rend par un signe quelconque. Le même piège vaut
  pour « α-amino acid », « γ-lactone », « Δ⁹ ». On cherche sur le mot
  latin voisin (« oxidation of fatty acids », « catabolism ») ou sur le
  fragment sans la lettre.

  Le cas s'est aggravé sur la **transposition di-π-méthane** :
  « di-pi-methane » ne rend RIEN dans les neuf, alors que le Carey &
  Sundberg lui consacre plusieurs sections. Cherché sous
  **« methane rearrangement »** — le fragment sans la lettre —, il rend
  QUATORZE pages. Le même piège vaut pour « oxa-di-π-méthane », dont
  l'extraction rend « oxadi-&methane ». Un nom qui contient une lettre
  grecque se cherche toujours amputé.
- **Un tiret peut cacher un ouvrage entier.** « Baeyer-Villiger » ne rend
  RIEN dans le Clayden, qui compose ce nom avec un tiret demi-cadratin ;
  « Villiger » seul rend vingt-cinq pages. Devant un silence surprenant, on
  cherche sur le fragment le plus court avant de conclure.

Et une leçon qui ne concerne pas la recherche mais la lecture :
**deux affirmations d'un même ouvrage peuvent se contredire.** La page
§ 9.4 de LibreTexts donne la table de Woodward-Hoffmann, puis l'illustre
par une phrase qui la contredit. C'est le second ouvrage qui a tranché —
exactement ce à quoi sert la règle des neuf.

### Une référence orpheline ne s'affiche nulle part

`references.json` est indexé par identifiant de fiche. Une clé qui ne
correspond à aucune fiche ne casse rien, ne se voit pas, et ne s'affiche
pas : quatre DOI vérifiés des articles fondateurs de Woodward et Hoffmann
dormaient sous `woodward_hoffmann_pericycliques` alors que la fiche
s'appelle `woodward_hoffmann`. `npm run valider` refuse désormais toute
clé orpheline — et le refus a été prouvé en en injectant une.

Le compte se surveille :

```bash
python3 outils/mesurer-sources.py            # la répartition
python3 outils/mesurer-sources.py --seules   # les fiches mono-source
```

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

L'état au moment où cet outil a été écrit, et il n'était pas flatteur :
**79 % des fiches ne citaient qu'un seul ouvrage**, et le Clayden
apparaissait sur 96 % d'entre elles. Le Housecroft, sur une seule.

Aujourd'hui, sur 275 fiches : Clayden 68 %, McMurry 51 %, Grossman 28 %,
Dugas 17 %, LibreTexts 13 %, **Housecroft 13 %**, **Multicomposants 12 %**,
Carey & Sundberg 4 %, Roberts & Caserio 4 %. Le mono-sourçage est à **20 %**.

La cause reste celle déjà décrite : neuf des cinquante-quatre fiches
mono-sourcées tiennent sur le seul Multicomposants, onze sur le seul
Housecroft, parce que ces blocs s'appuient sur des ouvrages que les autres ne
recoupent pas. Chacune de ces fiches NOMME les ouvrages muets, et plusieurs
relaient les faux positifs rencontrés (« Sakurai » dans une bibliographie du
Carey & Sundberg, « Petasis » désignant le titanocène chez Grossman,
« hydantoin » désignant la dégradation d'Edman chez McMurry).

### La pente se reprend même quand on connaît la règle

Le bloc « Stratégie » l'a montré, et le cas vaut d'être gardé. Quatre fiches
y ont été écrites en lisant le chapitre 23 du Clayden d'un bout à l'autre.
C'est un excellent chapitre, il traite le sujet en entier, et l'on n'a pas
senti le besoin d'ouvrir autre chose. `mesurer-sources.py --seules` a rendu
trois d'entre elles mono-sourcées.

Ce que les huit autres ouvrages avaient à dire, une fois interrogés :

- **McMurry chiffrait.** L'éther silylé se pose par une SN2 sur un centre
  TERTIAIRE, ce qui devrait être impossible ; il donne la raison en deux
  nombres — C–C 154 pm, C–Si 195 pm (p. 554). Le Clayden explique l'affinité
  du silicium sans jamais dire pourquoi l'attaque passe.
- **Grossman ajoutait une serrure.** Le 2-nitrobenzyle est « stable aux bases
  et aux acides mais PHOTOLABILE » (p. 318). Les trois conditions
  orthogonales de la fiche en devenaient quatre, et la quatrième est la seule
  qui n'ajoute rien au milieu.
- **Dugas contredisait.** Là où Clayden appelle la synthèse peptidique « l'un
  des domaines les plus fiables et les plus prévisibles de la chimie
  organique », Dugas signale que la protection elle-même racémise, par
  formation d'azlactone, et que « l'activité catalytique dépend de
  l'intégrité optique » (p. 41). Les deux sont vrais ; la fiche ne le disait
  qu'à moitié.
- **Housecroft mesurait.** La chimiosélectivité et la régiosélectivité
  s'énoncent chez lui comme deux RAPPORTS d'hydroformylation, réglables par
  le seul catalyseur — de n:i ≈ 2:1 à 74:1 entre deux clusters du même métal
  (p. 789). La fiche définissait les notions sans jamais en donner un nombre.

Et une divergence de vocabulaire qui, seule, aurait fait conclure à un
silence : **McMurry n'écrit ni « chemoselectivity » ni « stereoselective »,
et dit « régiochimie » là où Clayden dit « régiosélectivité »** (p. 230).
Trois mots du corpus qui ne sont pas universels ; on cherche la notion, pas
le terme.

La leçon n'est pas qu'on a mal travaillé, c'est que **la qualité d'un
chapitre est ce qui endort.** Un ouvrage incomplet se signale de lui-même ;
un ouvrage excellent ne se signale pas. D'où la seule parade fiable : faire
tourner `mesurer-sources.py --seules` À CHAQUE BLOC, avant de committer, et
non une fois par trimestre.

Ces chiffres se relisent à chaque bloc terminé, et ils se REMPLACENT ici :
un compte périmé dans ce fichier est pire qu'aucun compte, puisqu'on le
croit.

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

### Une molécule trop grande ne montre plus ses petits détails

Le 2,3-oxydosqualène compte trente-et-un atomes lourds. Dessiné à 390 px, son
époxyde — un cycle à TROIS chaînons — se réduit à une tache : l'oxygène tombe
à 9 px de quatre liaisons auxquelles il n'appartient pas. Le contrôle de
lisibilité l'a refusé, et il avait raison : ce schéma ne prouvait rien.

Aucun réglage de courbure n'y change quoi que ce soit, parce que le défaut
n'est pas dans les flèches — il n'y en avait aucune. Il est dans l'échelle.
Trois écritures différentes du même SMILES ont été essayées : toutes
refusées.

**La parade est le GROS PLAN, et il se déclare.** On dessine le fragment
concerné — ici l'extrémité époxydée de la chaîne — et la légende dit en
toutes lettres que le reste continue. C'est la même convention que le
`SC` mis pour `SCoA` ou que la lumiflavine mise pour la FAD : une
simplification de schéma, énoncée, jamais une approximation de mécanisme.

Le seuil est empirique et vaut d'être connu : **au-delà d'une trentaine
d'atomes lourds, un cycle à trois ou quatre chaînons ne passe plus.** Un
squelette stéroïdien à vingt-huit atomes, lui, passe très bien — c'est la
taille du détail rapporté à celle de la molécule qui décide, pas le nombre
d'atomes seul.

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

### CoordGen pose parfois la charge SUR la liaison

Le même CoordGen a un second défaut, plus discret, et aucun contrôle ne
l'attrape. L'isonitrile `[C-]#[N+]C` sort dessiné `C≡N⁺—`, et le signe
moins du carbone est **absent à l'œil**. Il n'est pourtant pas absent du
fichier : le SVG compte bien deux glyphes pour cet atome, la lettre et la
charge. Simplement, RDKit dégage la place du LABEL en raccourcissant les
liaisons, et il ne dégage pas celle de la CHARGE : le petit trait se
retrouve posé à un demi-pixel du trait de la triple liaison, où il devient
un morceau de liaison.

Sans CoordGen, la même molécule est dessinée dans l'autre sens et la
charge se voit. Le défaut ne tient donc ni à la charge ni au réactif : il
tient à l'ORIENTATION que CoordGen choisit, et il ne se manifeste que sur
un fragment linéaire dont l'atome chargé est du côté de la liaison.

**La parade est l'ordre d'écriture du SMILES.** `C[N+]#[C-]` — le carbone
en dernier — rend `—N⁺≡C⁻`, charge dégagée. Le tert-butyle ne change rien :
`CC(C)(C)[N+]#[C-]` cache de nouveau le moins.

Une tentative de contrôle automatique a été faite et n'a pas abouti : elle
signalait 328 schémas sur 871, presque tous des faux positifs — le « H »
d'un hydroxyle passe près d'une liaison sans gêner personne. Distinguer
les deux demande de mesurer le RECOUVREMENT du glyphe, pas sa distance,
et c'est un travail en soi. En attendant, **la seule garantie est de
regarder les schémas où figure un atome chargé au bout d'un fragment
linéaire.**

#### Le défaut n'était pas hypothétique : il était en ligne, neuf fois

L'audit complet de l'application l'a cherché sur les 275 fiches, et l'a
trouvé. On ne le repère pas en lisant les données — il faut RENDRE le
schéma et le regarder, de préférence agrandi.

Le recensement se fait par expression régulière sur un motif précis : un
fragment qui COMMENCE par un atome chargé suivi d'une triple liaison,
`(?:^|\.)\[[A-Za-z][a-z]?[+-]\d?\]#`. Il rendait neuf occurrences, deux
espèces, et les deux étaient fausses à l'écran :

- **le cyanure** `[C-]#N` était dessiné **`C≡N`**, sans aucun moins. L'ion
  le plus courant de la chimie du carbonyle se lisait comme un fragment
  neutre. Cinq schémas : `cyanhydrine`, `addition_1_2_vs_1_4` (deux),
  `synthese_strecker`, `bucherer_bergs` ;
- **le monoxyde de carbone** `[C-]#[O+]` était dessiné **`C≡O⁺`**. Pire que
  le premier cas : une seule des deux charges tombait, et CO se présentait
  donc comme un CATION. Quatre occurrences : `carbonylation_catalysee`,
  `insertion_migratoire`, `synthese_fischer_tropsch` (schéma et fiche).

Écrits `N#[C-]` et `[O+]#[C-]`, les deux montrent leurs charges. La règle
se formule donc simplement : **dans un fragment linéaire, l'atome chargé
s'écrit EN DERNIER.**

Deux précautions pour appliquer la correction :

- **retourner un fragment renumérote ses atomes.** Sur `CC=O.[C-]#N` le
  carbanion est le n° 3 ; sur `CC=O.N#[C-]` il devient le n° 4. Toute
  flèche qui le vise doit être réindexée dans le même mouvement — sans
  quoi le vérificateur refuse, ce qu'il a fait.
- **le `produit_attendu` ne change pas.** Le vérificateur compare des
  SMILES canoniques, qui ne dépendent pas de l'ordre d'écriture.

Et la leçon de méthode, qui dépasse ce défaut-là : **aucun des sept
maillons ne voyait celui-ci.** Le bilan était juste, les flèches menaient
au bon produit, la charge était conservée, le schéma passait les contrôles
de lisibilité, la page s'affichait. Seul l'œil, sur un rendu agrandi,
attrapait la faute. C'est la raison d'être d'un audit périodique.

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

### Une forme limite juste n'est pas la forme qu'on écrit

Le vérificateur applique les flèches et rend le SMILES canonique de ce
qu'il obtient. Il ne juge pas de l'ÉCRITURE du résultat — seulement de son
bilan. D'où un piège qui ne se voit qu'en lisant ce qu'il rend.

L'oxydation par le NAD(P)H écrite avec deux flèches — la liaison C–H part,
le carbonyle se replie — donne un bilan parfaitement juste. Mais le produit
que rend la machine est `Cn1cc[cH+]c(C(N)=O)c1` : elle place la charge
positive sur un CARBONE, parce que rien dans les flèches n'a touché à
l'azote. C'est une forme limite valable du NAD⁺, et ce n'est pas ainsi
qu'on l'écrit.

La correction n'est pas cosmétique : elle consiste à **dessiner la poussée
du doublet de l'azote**, qui est le vrai mécanisme. Quatre flèches au lieu
de deux, et le produit devient `C[n+]1cccc(C(N)=O)c1` — le pyridinium
conventionnel.

**Un mécanisme dont le bilan est juste peut rester mal raconté.** Le
contrôle ne l'attrape pas ; la lecture du `produit_attendu` rendu, si.

### Un mécanisme écrit n'est pas un mécanisme vérifié

Quinze mécanismes de la famille bioorganique ont été écrits d'affilée, puis
vérifiés d'un coup. Trois étaient faux, et les trois fautes sont du même
genre : **un indice d'atome compté à la main**.

- Sur `.CC=O` ajouté en fin de SMILES, le carbone du carbonyle est le
  DEUXIÈME, pas le premier : la flèche visait le méthyle.
- Sur `C(C)(C(=O)[O-])C`, le carbone α porte deux méthyles avant son
  carboxyle : la liaison « C–CO₂⁻ » à rompre n'était pas celle qu'on
  croyait.
- Et `"produit_attendu": "PLACEHOLDER"` reste tel quel tant qu'on ne
  relance pas le vérificateur — il ne se remplit pas tout seul.

La parade est de **relancer le vérificateur après chaque lot**, pas à la
fin. Et pour obtenir le `produit_attendu` : écrire n'importe quel SMILES
lisible, lancer, et LIRE la ligne « obtenu » — c'est la seule façon d'avoir
la forme canonique exacte, et c'est l'occasion de vérifier que le produit
obtenu est bien celui qu'on voulait.

### Une fiche peut en doubler une autre sans que rien ne le dise

`carboxypeptidase_zinc` a failli republier, mot pour mot, la citation du
Housecroft sur « l'ion Zn²⁺ : l'acide de Lewis de la nature » — déjà portée
par `anhydrase_carbonique_zinc`, écrite plusieurs blocs plus tôt, dans une
AUTRE famille (« Bioinorganique »). Les deux fiches portaient jusqu'au même
symbole de tuile.

C'est la conséquence directe de la règle des neuf ouvrages : quand on
interroge tout le corpus, on retombe sur la même page, et l'on réécrit ce
qui y est. Rien ne le signale — deux fiches ne se comparent nulle part.

La parade tient en un réflexe : **avant d'écrire, chercher l'identifiant
et le sujet dans `reactions.json`**. Et quand deux fiches partagent une
source, la seconde RENVOIE à la première au lieu de la répéter — ce qui
vaut mieux que d'éviter le doublon, puisque le lecteur y gagne un lien.

```bash
python3 -c "import json;print([r['id'] for r in json.load(open('src/data/reactions.json')) if 'zinc' in r['id']])"
```

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

  Et une leçon sur l'outil lui-même : **un outil de typographie n'a pas à
  reformater ce qu'il touche.** Il réécrivait tout à `indent=2`, alors que
  `reactions.json` est indenté d'un seul signe. Résultat : un diff de six
  mille lignes déplacées pour une trentaine d'insécables — illisible en
  relecture —, et un COMPTE FAUX, puisqu'il comparait les deux textes signe
  pour signe. Il annonçait « 1 953 379 remplacements » là où il y en avait
  trois. Il relit désormais l'indentation du fichier au lieu de l'imposer,
  préserve le saut de ligne final, et s'arrête si la longueur a changé —
  parce qu'alors son compte ne veut plus rien dire.

- **Le corpus vouvoie de bout en bout.** Un « tu » isolé ne casse rien et
  ne se voit pas à la relecture — il se voit à l'écran, une fois la fiche
  en ligne. `outils/verifier-registre.py` le cherche. Même piège que
  ci-dessus : « Retiens : » s'écrit avec une insécable devant les
  deux-points, et une recherche sur la chaîne littérale ne trouve rien.
  L'outil AFFICHE le contexte au lieu de corriger seul, parce qu'un
  impératif ressemble souvent à un nom commun — « ce **ton** », « une
  **note** ».

### La page blanche, que rien n'attrapait

Dix-neuf fiches ont été publiées avec le champ `pieges` écrit comme une
CHAÎNE au lieu d'une liste. La page fait `reaction.pieges.map(...)` : une
chaîne y lève un `TypeError`, et l'on n'obtient qu'un **écran blanc**.

Aucun contrôle ne l'a vu, et il faut comprendre pourquoi. `valider` trouvait
le champ « présent et non vide » — une chaîne l'est. `verifier` ne regarde
que les flèches. Les dessins sortaient. L'inventaire comptait juste. Le
défaut n'était visible qu'en OUVRANT la page.

Et il ne s'arrêtait pas à la fiche fautive : **le routeur est en `hash`**,
donc l'erreur tuait l'application entière jusqu'au rechargement complet. Une
seule fiche cassée rendait tout le reste inaccessible sans que rien ne
l'explique à l'utilisateur.

Deux garde-fous en découlent, et le premier a été prouvé en injectant la
faute :

- `npm run valider` refuse désormais un champ dont la FORME est fausse, et
  non plus seulement un champ absent. `FORMES` déclare, pour chaque champ,
  s'il est une liste ou du texte. Contrôler la présence ne suffit pas.
- `npm run pages` ouvre les **356 pages** de l'application une à une et
  refuse toute page qui lève une erreur ou qui reste vide. Il faut un
  `about:blank` entre chaque : sans lui, le balayage lui-même mentirait, en
  attribuant à toutes les pages suivantes la panne de la première.

```bash
npx vite preview --port 4173 &
npm run pages
```

La leçon dépasse ce champ-là : **un défaut de données qui ne casse aucun
contrôle mais casse l'affichage ne se voit qu'en regardant l'écran.** Les
sept maillons de la chaîne vérifient la chimie ; celui-ci vérifie qu'elle
s'affiche.

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

### « Le plus long gagne » vaut aussi dans l'autre sens

La règle était écrite plus haut et appliquée à un seul endroit. `chercher`,
qui rend le réactif désigné par une ligne de conditions, prenait bien le nom
le plus long. `reactionsUtilisantReactif`, qui fait le chemin inverse — dans
quelles réactions ce produit apparaît-il ? —, se contentait d'une frontière
de mot.

Or **les indices typographiques ne sont pas des frontières de mot** : le
« ₂ » de K₂CO₃ n'est ni une lettre ni un chiffre, si bien que « CO » y
passait pour un mot entier. La page du monoxyde de carbone annonçait donc
être employée par le couplage de Suzuki, la réaction de Heck, l'amination de
Buchwald-Hartwig et la Reformatsky. « BH₃ » se cachait dans « Na(CN)BH₃ »,
« O₂ » dans « H₂O₂/NaOH », « Zn » dans « Zn(Hg) » — or l'amalgame de la
Clemmensen n'est pas du zinc en poudre.

**Vingt-quatre liens faux**, et aucun ne se voyait autrement qu'en ouvrant
la page du réactif. Le défaut ne casse rien, ne lève aucune erreur, et
n'apparaît dans aucun compte : c'est exactement le genre que ce dépôt
cherche à rendre visible. `produitsCitesDans` applique désormais la même
règle dans les deux sens — à un endroit donné du texte, un nom court ne
compte pas s'il est recouvert par un nom plus long.

### La famille d'une fiche est une CLÉ, pas un intitulé

`programme.json` distingue `nom` (« Acides aminés, peptides et protéines »,
ce que lit l'utilisateur) et `famille` (« Acides aminés », ce qui porte la
couleur). Une fiche doit déclarer la **clé**. Écrire l'intitulé n'échoue pas
silencieusement — `npm run valider` le refuse et liste les clés connues —,
mais il faut savoir que la question se pose.

## Écrire une fiche

Deux modes obligatoires, dans `src/data/reactions.json` :

- `explication_reference` — dense, précis, le vocabulaire technique assumé.
- `explication_comprendre` — répond à **POURQUOI avant COMMENT**. Chaque
  terme technique est d'abord introduit par une analogie de la vie
  courante, puis nommé. Ton adulte, jamais infantilisant. Le lecteur ne
  doit rien avoir à mémoriser pour suivre.

Les paragraphes sont séparés par une ligne vide ; une amorce en capitales
(« POURQUOI … ? ») est mise en valeur automatiquement.

## Les réactions qu'aucun ouvrage ne traite

Elles restent au programme avec `id` à `null`, et ce n'est pas un oubli :
c'est la règle de sourçage appliquée. On ne les écrira que le jour où un
ouvrage les traitant sera indexé. La liste se tient ici pour qu'on ne
recommence pas la recherche à chaque passage.

### Et elles se DÉCLARENT à l'écran, pas seulement ici

Ce fichier portait la raison ; l'application ne la portait pas. Elle
étiquetait ces six lignes **« à écrire »**, ce qui veut dire « on n'y est
pas encore arrivé » — et c'était faux. Elles ne seront pas écrites, et pas
par manque de temps. Le lecteur voyait un retard là où il y a une limite du
corpus, et il n'apprenait rien.

C'est la règle « un ouvrage muet est un RÉSULTAT, pas un oubli » appliquée
au programme au lieu de la seule fiche. D'où :

- chaque ligne sans identifiant porte un champ **`hors_corpus`** qui dit ce
  que la recherche dans les neuf a rendu — et la page l'AFFICHE, sous le
  nom de la réaction ;
- l'inventaire connaît un cinquième état, `hors_corpus`, qui n'est pas un
  degré de l'échelle « absente → rédigée → vérifiée → relue » mais une
  autre catégorie. Le badge est le seul en trait tireté ;
- ces lignes **sortent du dénominateur**. Sans cela chaque jauge concernée
  plafonnerait sous 100 % pour toujours — « Photochimie 11/12 » jusqu'à la
  fin des temps —, et l'on lirait comme un retard ce qui est une absence de
  source. Le compteur général affiche donc « 275 sur 275 sourçables », et
  une ligne à part énonce les six ;
- `npm run valider` **refuse** une ligne sans identifiant et sans raison
  lisible (moins de 40 signes), et refuse aussi une ligne qui porterait les
  deux. Prouvé en injectant les trois fautes.

Le dernier point est le vrai garde-fou : sans lui, un simple oubli
d'identifiant se présenterait comme un silence documenté, ce qui est
exactement le mensonge inverse de celui qu'on vient de corriger.

| réaction | ce que la recherche a rendu |
|---|---|
| Réduction de Meerwein-Ponndorf-Verley | aucune occurrence dans les neuf. |
| Effet chélate | le Housecroft le traite à sa page 185 — **hors de l'extrait indexé** (ch. 20-28). Dans l'extrait, « chelate » ne rend que des ligands particuliers (p. 677, 759) et l'angle de morsure en catalyse (p. 789) : jamais l'argument entropique qui fait le sujet. Le Clayden définit la chélation (p. 863) mais dans son sens organique — le contrôle stéréochimique par un métal —, et le Dugas ne montre que des cycles chélates de catalyseurs chiraux. |
| Réaction du gaz à l'eau | le Housecroft la traite à ses pages 239 et 366 — **hors de l'extrait indexé** (ch. 20-28). Dans l'extrait, elle n'apparaît que dans un tableau de procédés (p. 801), une ligne de catalyseur (p. 722) et une mention de passage (p. 596). C'est exactement le piège de l'entrée d'index d'un ouvrage indexé PARTIELLEMENT : le bon mot, pointant vers ce qu'on n'a pas. |
| Formation de la liaison N-glycosidique d'un nucléoside | ni la voie chimique ni la voie biologique n'est traitée. « Vorbruggen », « nucleoside synthesis », « synthesis of nucleosides », « Hilbert-Johnson », « silylated base » ne rendent RIEN dans les neuf ; « phosphoribosyl », « PRPP » et « ribonucleotide reductase » non plus. Le Clayden définit le N-glycoside (p. 1145), le McMurry montre la liaison sur la structure du nucléoside (p. 945) — aucun n'en écrit la formation. |
| Dépurination : hydrolyse acide d'une purine | « depurination », « depurinat », « apurinic », « abasic », « hydrolysis of DNA », « purine hydrolysis », « adenine release » : aucune occurrence utile. Les deux seuls retours — Housecroft p. 945 et Dugas p. 120 — sont respectivement une page d'index et un passage sur la chiralité de l'ATP. Le mécanisme serait celui de l'hydrolyse d'un glycoside, que le corpus traite ailleurs ; l'appliquer à une purine sans source qui le fasse reviendrait à écrire de mémoire. |
| Transposition photochimique d'une cyclohexadiénone | « santonin » et « lumisantonin » ne rendent RIEN dans les neuf. « dienone » rend trois pages du Carey & Sundberg, dont deux sont son index (1179, 1189) ; la troisième (1130) traite la transposition OXA-di-π-méthane et la migration 1,3-acyle des cétones β,γ-insaturées — une chimie voisine, pas celle-là. Le Grossman et LibreTexts emploient « dienone » hors photochimie. La photochimie des cyclohexadiénones réticulées n'est traitée par aucun des neuf. |

**Le silence se vérifie sur le fragment le plus court avant d'être déclaré.**
« Fischer-Tropsch » ne rend rien, « Tropsch » rend six pages ; « water-gas
shift » ne rend rien, « gas shift » rend quatre pages. Le tiret, une fois de
plus.

## Ce qui reste à faire

Phase 3 — 3D interactive et orbitales. Phase 4 — flashcards et exercices.
Phase 6 — les réactions du programme encore à écrire.
