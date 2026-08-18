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
- [ ] Toucher une carte ouvre la fiche détaillée.
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

## Organisation des fichiers

```
index.html                  page HTML de départ
public/favicon.svg          icône de l'onglet
src/
  main.jsx                  point d'entrée : accroche React à la page
  App.jsx                   structure commune + liste des adresses (routes)
  index.css                 toute la mise en forme (mobile-first)
  data/
    reactions.json          LE CONTENU : les réactions
    reactifs.json           LE CONTENU : les réactifs
    solvants.json           LE CONTENU : les solvants
    meta.json               le principe et le ton à tenir (Phase 6)
  components/
    BarreNavigation.jsx     en-tête + menu
    CarteReaction.jsx       aperçu d'une réaction dans la liste
    NiveauDifficulte.jsx    la jauge de difficulté (sur 10)
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

`niveau_difficulte` est une note **sur 10** (elle s'affiche en jauge).

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
| 1 | Socle : données, liste, fiches, responsive | ✅ fait |
| 2 | Structures 2D dessinées (RDKit-JS) | à venir |
| 3 | 3D interactive et orbitales (3Dmol.js) | à venir |
| 4 | Flashcards et quiz (progression en `localStorage`) | à venir |
| 5 | Bascule Référence / Comprendre | à venir |
| 6 | Remplissage de toutes les familles de réactions | à venir |
