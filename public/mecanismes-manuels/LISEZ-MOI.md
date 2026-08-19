# Schémas dessinés à la main

Ce dossier accueille les schémas de mécanisme que tu préfères tracer
toi-même, dans ton logiciel de chimie habituel, plutôt que de les laisser
engendrer par l'application.

## Comment faire

1. Exporte ton schéma en **SVG** (net à toutes les tailles) ou à défaut en
   **PNG** large, et dépose le fichier ici.
2. Dans `src/data/mecanismes.json`, sur l'étape concernée, remplace les
   flèches par le nom du fichier :

```json
{
  "numero": 1,
  "titre": "L'attaque, par l'arrière",
  "image": "sn2-attaque.svg",
  "legende": "…"
}
```

L'étape utilisera ton dessin tel quel. Le SMILES et les flèches deviennent
inutiles pour cette étape : tu peux les laisser (ils seront ignorés) ou les
retirer.

## Conseils

- Vise un dessin **plus haut que large** : l'application est d'abord lue sur
  un téléphone tenu verticalement.
- Un fond transparent ou blanc convient ; le cadre est ajouté par
  l'application.
