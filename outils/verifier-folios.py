#!/usr/bin/env python3
"""
Vérifie qu'un manuel indexé cite les bonnes pages.

POURQUOI
Un décalage faux entre pagination PDF et pagination imprimée ne se voit pas :
les recherches renvoient du texte plausible, sous un mauvais numéro. Les
fiches citent alors des pages qui n'existent pas ou parlent d'autre chose.
C'est arrivé au McMurry, dont les trois fichiers sont des scans PARTIELS
comportant jusqu'à treize plages de décalage différentes.

LE CONTRÔLE
Une page imprimée porte presque toujours son propre numéro en tête ou en
pied. Si le texte extrait d'une page ne contient pas le numéro qu'on lui
attribue, et que cela se répète, le décalage est faux.

Les ouvrages cités PAR SECTION (LibreTexts, Roberts & Caserio) n'ont pas de
folio exploitable : ils sont ignorés.

USAGE
    python3 outils/verifier-folios.py            # tous les manuels indexés
    python3 outils/verifier-folios.py clayden
"""
import json
import random
import re
import sys
from pathlib import Path

SANS_FOLIO = {'oc2', 'roberts_caserio'}   # cités par section
# Le McMurry compose ses folios dans une police sous-ensemblée : ils ne
# ressortent pas à l'extraction. Sa pagination est établie par
# lire-folios.py, qui reconnaît la FORME des chiffres.
PAR_IMAGE = {'mcmurry'}
ECHANTILLON = 60
# Un taux bas ne prouve rien : bien des pages n'impriment pas de folio.
# Ce qui accuse, c'est qu'un AUTRE décalage fasse nettement mieux.
MARGE = 6


def controler(nom, graine=1):
    index = Path('sources-locales') / nom / 'pages.json'
    if not index.exists():
        return None
    donnees = json.loads(index.read_text(encoding='utf-8'))
    pages = [p for p in donnees['pages']
             if p.get('imprimee', 0) and p['imprimee'] > 0 and len(p['texte']) > 400]
    if not pages:
        return None
    random.seed(graine)
    echantillon = random.sample(pages, min(ECHANTILLON, len(pages)))

    def score(decalage):
        return sum(1 for p in echantillon
                   if re.search(rf'(?<![0-9]){p["imprimee"] + decalage}(?![0-9])', p['texte']))

    actuel = score(0)
    meilleur = max(range(-5, 6), key=score)
    return {
        'pages': len(pages),
        'testees': len(echantillon),
        'reussies': actuel,
        'taux': actuel / len(echantillon),
        'meilleur_decalage': meilleur,
        'meilleur_score': score(meilleur),
    }


if __name__ == '__main__':
    demandes = sys.argv[1:] or sorted(
        d.name for d in Path('sources-locales').iterdir() if d.is_dir())
    souci = False
    for nom in demandes:
        if nom in SANS_FOLIO:
            print(f"  {nom:<18} cité par section — pas de folio à vérifier")
            continue
        if nom in PAR_IMAGE:
            print(f"  {nom:<18} folio en police sous-ensemblée — pagination établie "
                  f"par lire-folios.py")
            continue
        r = controler(nom)
        if r is None:
            continue
        mieux = r['meilleur_decalage'] != 0 and r['meilleur_score'] > r['reussies'] + MARGE
        marque = '✗' if mieux else '✓'
        print(f"{marque} {nom:<18} {r['reussies']:>2}/{r['testees']} pages portent "
              f"leur folio   ({r['pages']} pages citables)")
        if mieux:
            souci = True
            print(f"    ⚠ le décalage {r['meilleur_decalage']:+d} ferait nettement mieux "
                  f"({r['meilleur_score']}/{r['testees']}) : la pagination est fausse.")
    if souci:
        print("\n✗ Un manuel au moins est mal paginé : relancer lire-folios.py.")
        sys.exit(1)
    print("\n✓ Les pages citées portent bien leur numéro.")
