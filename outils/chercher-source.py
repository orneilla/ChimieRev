#!/usr/bin/env python3
"""
Cherche une expression dans un manuel indexé, et rend les pages où elle
apparaît, avec leur numéro imprimé — celui qu'on cite.

USAGE
    python3 outils/chercher-source.py "Wittig" --nom clayden
    python3 outils/chercher-source.py "anti-periplanar" --nom clayden --extrait 400
    python3 outils/chercher-source.py --page 342 --nom clayden      (lire une page)
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

DOSSIER = Path("sources-locales")


def sans_accents(texte: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texte)
                   if unicodedata.category(c) != "Mn").lower()


def charger(nom: str) -> dict:
    fichier = DOSSIER / nom / "pages.json"
    if not fichier.exists():
        sys.exit(f"Manuel non indexé : {fichier}\n"
                 f"Lancer d'abord :  python3 outils/indexer-manuel.py <pdf> --nom {nom}")
    return json.loads(fichier.read_text(encoding="utf-8"))


def chercher(manuel: dict, expression: str, taille: int, limite: int) -> None:
    cible = sans_accents(expression)
    trouvees = 0

    for page in manuel["pages"]:
        plat = sans_accents(page["texte"])
        if cible not in plat:
            continue

        trouvees += 1
        if trouvees > limite:
            continue

        position = plat.index(cible)
        debut = max(0, position - taille // 2)
        extrait = re.sub(r"\s+", " ", page["texte"][debut:debut + taille]).strip()
        print(f"\n── page {page['imprimee']} imprimée (page {page['pdf']} du PDF)")
        print(f"   …{extrait}…")

    if trouvees == 0:
        print(f"Aucune occurrence de « {expression} ».")
    else:
        print(f"\n{trouvees} page(s) contiennent « {expression} »"
              + (f" — {limite} affichées." if trouvees > limite else "."))


def lire(manuel: dict, imprimee: int) -> None:
    for page in manuel["pages"]:
        if page["imprimee"] == imprimee:
            print(f"── page {imprimee} imprimée (page {page['pdf']} du PDF)\n")
            print(page["texte"])
            return
    sys.exit(f"Page {imprimee} absente de l'index.")


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description="Consulte un manuel indexé.")
    analyseur.add_argument("expression", nargs="?")
    analyseur.add_argument("--nom", required=True)
    analyseur.add_argument("--extrait", type=int, default=300, help="longueur de l'extrait")
    analyseur.add_argument("--limite", type=int, default=12, help="nombre de pages affichées")
    analyseur.add_argument("--page", type=int, help="afficher une page entière")
    arguments = analyseur.parse_args()

    manuel = charger(arguments.nom)
    if arguments.page:
        lire(manuel, arguments.page)
    elif arguments.expression:
        chercher(manuel, arguments.expression, arguments.extrait, arguments.limite)
    else:
        sys.exit("Donner une expression à chercher, ou --page.")
