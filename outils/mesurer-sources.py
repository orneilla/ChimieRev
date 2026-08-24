#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Combien d'ouvrages chaque fiche cite-t-elle vraiment ?

Une fiche adossée à un SEUL manuel n'est pas fausse : elle est appauvrie.
Elle hérite du découpage de cet auteur, de ses silences, et de ses partis
pris. Croiser deux ouvrages fait apparaître ce qu'aucun des deux ne dit
seul — l'expérience de marquage au ¹³C qui nomme l'insertion migratoire
est dans le Housecroft et pas dans le Clayden ; le cycle du cuivre du
Sonogashira est dans LibreTexts et pas ailleurs.

Le défaut ne se voit pas fiche par fiche. Il se voit au COMPTE, d'où cet
outil. Il vérifie aussi que chaque page citée existe dans l'index local :
une citation vers une page absente est une citation qu'on n'a pas ouverte.

    python3 outils/mesurer-sources.py
    python3 outils/mesurer-sources.py --seules      # lister les fiches mono-source
"""
import argparse
import collections
import io
import json
import pathlib
import re
import sys

# Le nom court d'un ouvrage ne coïncide pas toujours avec son dossier
# d'index — même alias que dans chercher-source.py.
ALIAS = {"housecroft": "inorganique"}

# Ces ouvrages ne sont PAS indexés : on les cite sans page, jamais avec.
NON_INDEXES = {"march", "carey_sundberg_B", "fleming", "elschenbroich"}

RACINE = pathlib.Path(__file__).resolve().parent.parent


def index_local() -> dict:
    """Les pages imprimées connues, par ouvrage."""
    connu = {}
    dossier = RACINE / "sources-locales"
    if not dossier.exists():
        return connu
    for chemin in dossier.iterdir():
        fichier = chemin / "pages.json"
        if not fichier.exists():
            continue
        brut = json.load(io.open(fichier, encoding="utf-8"))
        pages = brut.get("pages") if isinstance(brut, dict) else brut
        numeros = set()
        if isinstance(pages, dict):
            numeros = {str(cle) for cle in pages}
        elif isinstance(pages, list):
            for entree in pages:
                if not isinstance(entree, dict):
                    continue
                for cle in ("imprimee", "page", "numero"):
                    if cle in entree:
                        numeros.add(str(entree[cle]))
        connu[chemin.name] = numeros
    return connu


def main() -> int:
    analyseur = argparse.ArgumentParser()
    analyseur.add_argument("--seules", action="store_true",
                           help="lister les fiches adossées à un seul ouvrage")
    arguments = analyseur.parse_args()

    refs = json.load(io.open(RACINE / "src/data/references.json", encoding="utf-8"))
    par_reaction = refs["references_par_reaction"]
    connu = index_local()

    apparitions = collections.Counter()
    seules = []
    introuvables = []
    citations = 0

    for reaction, bloc in sorted(par_reaction.items()):
        ouvrages = [o for o in bloc.get("ouvrages", []) if isinstance(o, dict)]
        noms = {o["ouvrage"] for o in ouvrages}
        for nom in noms:
            apparitions[nom] += 1
        if len(noms) <= 1:
            seules.append((reaction, next(iter(noms), "aucun")))

        for o in ouvrages:
            nom, pages = o["ouvrage"], str(o.get("pages", ""))
            citations += 1
            if nom in NON_INDEXES or pages.startswith("§"):
                continue
            dossier = ALIAS.get(nom, nom)
            if dossier not in connu:
                # L'index n'est pas là : on ne peut rien affirmer, et
                # surtout pas que la page est fausse.
                continue
            for numero in re.findall(r"\d+", pages):
                if numero not in connu[dossier]:
                    introuvables.append((reaction, nom, numero))

    total = len(par_reaction)
    print(f"{total} fiches sourcées, {citations} citations\n")
    print("ouvrages, et sur combien de fiches ils apparaissent :")
    for nom, compte in apparitions.most_common():
        part = 100 * compte / total
        print(f"   {compte:4d}  ({part:4.0f} %)  {nom}")

    part_seules = 100 * len(seules) / total
    print(f"\nfiches adossées à UN SEUL ouvrage : {len(seules)} sur {total} "
          f"({part_seules:.0f} %)")
    repartition = collections.Counter(nom for _, nom in seules)
    for nom, compte in repartition.most_common():
        print(f"   {compte:4d}  {nom}")

    if arguments.seules:
        print("\nle détail :")
        for reaction, nom in seules:
            print(f"   {reaction:38s} {nom}")

    if introuvables:
        print(f"\n✗ {len(introuvables)} page(s) citée(s) absente(s) de l'index :")
        for reaction, nom, numero in introuvables[:30]:
            print(f"   {reaction} — {nom} p. {numero}")
        return 1

    print("\n✓ toutes les pages citées existent dans l'index local.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
