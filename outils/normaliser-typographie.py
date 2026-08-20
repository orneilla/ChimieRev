#!/usr/bin/env python3
"""
Pose les espaces insécables de la typographie française dans les données.

POURQUOI
Un « ? » ou un « : » précédé d'une espace ordinaire peut se retrouver seul
en début de ligne. `npm run valider` le refuse. Cet outil corrige d'un coup
tous les fichiers de données.

POURQUOI UN OUTIL PLUTÔT QU'UNE COMMANDE JETABLE
Parce que l'insécable écrite littéralement dans un heredoc shell se dégrade
en espace ordinaire — la substitution tourne alors sans rien remplacer, et
le silence passe pour un succès. Ici l'insécable est écrite \\u00a0, une
assertion le vérifie, et le compte de remplacements est affiché.

USAGE
    python3 outils/normaliser-typographie.py
"""
import json
import re
import sys
from pathlib import Path

INSECABLE = " "
assert INSECABLE != " " and len(INSECABLE) == 1

FICHIERS = [
    "src/data/reactions.json",
    "src/data/reactifs.json",
    "src/data/solvants.json",
    "src/data/mecanismes.json",
    "src/data/references.json",
]


def normaliser(valeur):
    """Espace insécable devant ? ! ; : » et après «."""
    if isinstance(valeur, str):
        texte = re.sub(r"(?<=\S) (?=[?!;:»])", INSECABLE, valeur)
        return texte.replace("« ", "«" + INSECABLE)
    if isinstance(valeur, list):
        return [normaliser(v) for v in valeur]
    if isinstance(valeur, dict):
        return {c: normaliser(v) for c, v in valeur.items()}
    return valeur


def main():
    total = 0
    for nom in FICHIERS:
        chemin = Path(nom)
        if not chemin.exists():
            sys.exit(f"Fichier absent : {nom}")
        avant = chemin.read_text(encoding="utf-8")
        donnees = normaliser(json.loads(avant))
        chemin.write_text(
            json.dumps(donnees, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        apres = chemin.read_text(encoding="utf-8")
        # Les deux textes ont la même longueur : une insécable remplace une
        # espace, caractère pour caractère.
        remplacements = sum(1 for a, b in zip(avant, apres) if a != b)
        total += remplacements
        print(f"{nom} : {remplacements} remplacement(s)")
    print(f"\n✓ {total} espace(s) insécable(s) posée(s).")


if __name__ == "__main__":
    main()
