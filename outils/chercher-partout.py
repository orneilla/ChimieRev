#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chercher une expression dans TOUS les ouvrages indexés, d'un coup.

RAISON D'ÊTRE. Le corpus s'est écrit pendant des mois sur un seul manuel,
non par choix mais par facilité : `chercher-source.py` demande un `--nom`,
et on tape celui qu'on a en tête. Le résultat s'est mesuré — 79 % des
fiches ne citaient qu'un ouvrage, et le Housecroft n'apparaissait qu'une
fois sur cent trente-sept.

Cet outil supprime la friction. Il interroge les neuf index et dit, pour
chacun, combien de pages parlent du sujet et lesquelles. On voit d'un coup
d'œil qui traite la question — y compris les ouvrages auxquels on n'aurait
pas pensé : le Dugas sur un mécanisme enzymatique, le Carey & Sundberg sur
une photochimie, le Multicomposants sur une condensation.

Un ouvrage qui ne renvoie rien est une INFORMATION, pas un silence : il
faut alors l'écrire sur la fiche plutôt que de laisser croire qu'on n'a
pas cherché.

    python3 outils/chercher-partout.py "Beckmann"
    python3 outils/chercher-partout.py "Beckmann" --extraits    # avec le texte
"""
import argparse
import io
import json
import pathlib
import sys
import unicodedata

RACINE = pathlib.Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "sources-locales"

# Le nom du dossier d'index ne coïncide pas toujours avec le nom court de
# l'ouvrage (celui de CLAUDE.md et de references.json).
NOM_COURT = {"inorganique": "housecroft"}

# Ce que chaque ouvrage couvre, pour savoir si un silence est normal.
COUVERTURE = {
    "clayden": "organique, intégral",
    "mcmurry": "organique, intégral",
    "grossman": "écriture des mécanismes, intégral",
    "oc2": "organique 2 (LibreTexts), par section",
    "housecroft": "inorganique, ch. 20-28",
    "dugas": "bioorganique, intégral",
    "multicomposants": "réactions multicomposants, chimie durable",
    "carey_sundberg_A": "photochimie (ch. 12) seulement",
    "roberts_caserio": "principes de base, ch. 28-31",
}


def sans_accents(texte: str) -> str:
    decompose = unicodedata.normalize("NFD", texte)
    return "".join(c for c in decompose if unicodedata.category(c) != "Mn").lower()


def index_disponibles() -> dict:
    trouves = {}
    for chemin in sorted(DOSSIER.iterdir()):
        fichier = chemin / "pages.json"
        if fichier.exists():
            nom = NOM_COURT.get(chemin.name, chemin.name)
            trouves[nom] = fichier
    return trouves


def pages_de(fichier: pathlib.Path):
    """Renvoie une liste de (étiquette, texte) quel que soit le format."""
    brut = json.load(io.open(fichier, encoding="utf-8"))
    pages = brut.get("pages") if isinstance(brut, dict) else brut
    if isinstance(pages, dict):
        return [(str(cle), valeur if isinstance(valeur, str)
                 else valeur.get("texte", "")) for cle, valeur in pages.items()]
    sortie = []
    for entree in pages or []:
        if not isinstance(entree, dict):
            continue
        etiquette = next((str(entree[c]) for c in ("imprimee", "section", "page", "numero")
                          if c in entree and entree[c] is not None), "?")
        sortie.append((etiquette, entree.get("texte", "")))
    return sortie


def main() -> int:
    analyseur = argparse.ArgumentParser()
    analyseur.add_argument("expression")
    analyseur.add_argument("--extraits", action="store_true",
                           help="afficher un extrait pour chaque ouvrage")
    analyseur.add_argument("--taille", type=int, default=200)
    arguments = analyseur.parse_args()

    cible = sans_accents(arguments.expression)
    index = index_disponibles()
    if not index:
        sys.exit("Aucun index dans sources-locales/. Les manuels ne sont pas "
                 "sur cette machine : on ne peut rien citer.")

    muets = []
    print(f"« {arguments.expression} » dans les {len(index)} ouvrages indexés\n")
    for nom, fichier in index.items():
        touchees = []
        premier = None
        for etiquette, texte in pages_de(fichier):
            position = sans_accents(texte).find(cible)
            if position == -1:
                continue
            touchees.append(etiquette)
            if premier is None:
                debut = max(0, position - arguments.taille // 2)
                premier = " ".join(texte[debut:debut + arguments.taille].split())

        if not touchees:
            muets.append(nom)
            continue
        apercu = ", ".join(touchees[:8]) + (" …" if len(touchees) > 8 else "")
        print(f"  {nom:18s} {len(touchees):3d} page(s) : {apercu}")
        if arguments.extraits and premier:
            print(f"                     …{premier}…")

    if muets:
        print("\n  aucune occurrence :")
        for nom in muets:
            print(f"    · {nom:18s} ({COUVERTURE.get(nom, '?')})")
        print("\n  Un silence n'est pas une lacune : si l'ouvrage couvre le")
        print("  sujet et n'en parle pas, la fiche doit le DIRE.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
