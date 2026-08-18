# ChimieRév

Application web de révision des réactions de chimie organique.

**Principe :** comprendre pour mémoriser, jamais mémoriser bêtement.
Chaque fiche répond d'abord à « pourquoi ça se passe ainsi ? » avant de
montrer « comment ».

État : **Phase 1 — Socle** (données, liste, fiches, responsive).

---

## Lancer l'application (première fois)

Il faut avoir **Node.js** installé (https://nodejs.org, version 18 ou plus).
Pour vérifier, ouvre un terminal et tape :

```bash
node -v
```

Ensuite, dans le dossier du projet :

```bash
npm install     # à faire une seule fois : télécharge les outils nécessaires
npm run dev     # lance l'application
```

Le terminal affiche deux adresses :

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

- **Sur ton PC** : ouvre l'adresse `Local` dans le navigateur.
- **Sur ton téléphone ou ta tablette** : connecte l'appareil au **même
  réseau Wi-Fi** que le PC, puis tape l'adresse `Network` dans le
  navigateur du téléphone. C'est la même application, en direct : si tu
  modifies un fichier, la page se met à jour toute seule.

Pour arrêter le serveur : `Ctrl + C` dans le terminal.

## Vérifier la version « finale »

```bash
npm run build     # construit la version optimisée dans le dossier dist/
npm run preview   # sert cette version, comme en ligne
```

## Ce qu'il faut tester à la Phase 1

- [ ] La liste affiche les 5 réactions.
- [ ] La recherche filtre bien (essayer « SN2 », « base », « Grignard »).
- [ ] Les pastilles de famille filtrent la liste.
- [ ] Cliquer sur une carte ouvre la fiche détaillée.
- [ ] Le lien « ← Toutes les réactions » revient à la liste.
- [ ] Sur téléphone : rien ne dépasse à droite, aucun zoom horizontal
      nécessaire, les boutons sont assez gros pour le doigt.
- [ ] Le bouton « retour » du navigateur/téléphone fonctionne.

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
  components/
    BarreNavigation.jsx     en-tête + menu
    CarteReaction.jsx       aperçu d'une réaction dans la liste
    NiveauDifficulte.jsx    les points de difficulté
    BlocTexte.jsx           affiche un texte long en paragraphes
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

Deux conventions utiles dans les textes longs (`explication_*`) :

- une **ligne vide** (`\n\n` dans le JSON) sépare deux paragraphes ;
- un paragraphe court dont le **premier mot est en majuscules**
  (« POURQUOI ça se passe ainsi ? ») s'affiche automatiquement comme un
  intertitre.

Le fichier `src/data/reactifs.json` suit le même principe pour les réactifs
(schéma déjà en place, l'affichage viendra plus tard).

> Le contenu chimique actuel des 5 réactions est du contenu de manuel
> standard, mis en place pour faire tourner l'application. Il est prévu pour
> être **remplacé tel quel** par le JSON de référence : le schéma est
> identique, il suffit d'écraser le fichier.

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
