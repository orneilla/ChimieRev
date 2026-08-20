#!/usr/bin/env python3
"""
Vérifie qu'un manuel indexé cite les bonnes pages.

POURQUOI
Un décalage faux entre pagination PDF et pagination imprimée ne se voit pas :
les recherches renvoient du texte plausible, sous un mauvais numéro. Les
fiches citent alors des pages qui n'existent pas ou parlent d'autre chose.
C'est arrivé au McMurry — trois scans partiels, trente et une plages — puis
au Grossman, au Dugas et au Carey & Sundberg, où des pages non numérotées
glissées entre les chapitres décalent tout ce qui suit.

CE QUE CE CONTRÔLE FAIT, ET CE QU'IL NE FAISAIT PAS
Il LIT le folio de la page, à l'endroit où il est imprimé — seul en tête ou
en pied — et le compare au numéro que l'index lui attribue. La version
précédente se contentait de chercher le numéro N'IMPORTE OÙ dans le texte
de la page : un manuel dont le décalage dérivait au fil des chapitres
gardait une majorité de pages justes, et passait. C'est ainsi que le
Grossman est resté faux.

Une page sans folio lisible ne prouve rien et n'est pas comptée. Ce qui
accuse, c'est un DÉSACCORD : la page porte un numéro, et ce n'est pas
celui de l'index.

Les ouvrages cités par section (LibreTexts, Roberts & Caserio) n'ont pas de
folio. Le McMurry compose les siens dans une police sous-ensemblée : il a
son propre outil, lire-folios.py, qui reconnaît la forme des chiffres.

USAGE
    python3 outils/verifier-folios.py            # tous les manuels indexés
    python3 outils/verifier-folios.py clayden
"""
import json
import random
import re
import sys
from pathlib import Path

import pymupdf

SANS_FOLIO = {'oc2', 'roberts_caserio'}
PAR_IMAGE = {'mcmurry'}
ECHANTILLON = 80
BANDE = 0.09
TOLERANCE = 0        # un désaccord, et c'est faux : le folio ne s'approche pas


def nombre_isole(document, numero_pdf):
    """Un nombre seul en tête ou en pied de cette page, s'il y en a un."""
    if not 1 <= numero_pdf <= len(document):
        return None
    page = document[numero_pdf - 1]
    r = page.rect
    for zone in (pymupdf.Rect(0, 0, r.width, r.height * BANDE),
                 pymupdf.Rect(0, r.height * (1 - BANDE), r.width, r.height)):
        texte = page.get_text('text', clip=zone).strip()
        if not texte:
            continue
        lignes = [x.strip() for x in texte.split('\n') if x.strip()]
        for candidat in (lignes[0], lignes[-1]):
            if re.fullmatch(r'\d{1,4}', candidat):
                return int(candidat)
    return None


def folio_lu(document, numero_pdf):
    """
    Le folio de cette page — confirmé par une voisine.

    Un nombre seul en tête n'est pas forcément un folio : bien des manuels
    impriment le NUMÉRO DE CHAPITRE au même endroit. On ne retient donc une
    lecture que si la page d'avant ou celle d'après porte le nombre qui
    précède ou qui suit. Un numéro de chapitre, lui, se répète à
    l'identique de page en page : il ne passe pas.
    """
    lu = nombre_isole(document, numero_pdf)
    if lu is None:
        return None
    avant = nombre_isole(document, numero_pdf - 1)
    apres = nombre_isole(document, numero_pdf + 1)
    if avant == lu - 1 or apres == lu + 1:
        return lu
    return None


def controler(nom, graine=1):
    index = Path('sources-locales') / nom / 'pages.json'
    if not index.exists():
        return None
    donnees = json.loads(index.read_text(encoding='utf-8'))
    pages = [p for p in donnees['pages'] if p.get('imprimee', 0) > 0]
    if not pages:
        return None
    random.seed(graine)
    echantillon = random.sample(pages, min(ECHANTILLON, len(pages)))

    documents = {}
    lus = accords = 0
    desaccords = []
    for page in echantillon:
        fichier = page.get('fichier') or donnees['volumes'][0]['fichier']
        if fichier not in documents:
            documents[fichier] = pymupdf.open(fichier)
        folio = folio_lu(documents[fichier], page['pdf'])
        if folio is None:
            continue
        lus += 1
        if folio == page['imprimee']:
            accords += 1
        else:
            desaccords.append((page['imprimee'], folio))
    for d in documents.values():
        d.close()
    return {'pages': len(pages), 'lus': lus, 'accords': accords, 'desaccords': desaccords}


def main():
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
        faux = len(r['desaccords']) > TOLERANCE
        marque = '✗' if faux else '✓'
        print(f"{marque} {nom:<18} {r['accords']}/{r['lus']} folios lus concordent   "
              f"({r['pages']} pages citables)")
        if faux:
            souci = True
            for attendu, trouve in r['desaccords'][:5]:
                print(f"    ⚠ l'index annonce la page {attendu} ; la page porte {trouve}")
            if len(r['desaccords']) > 5:
                print(f"    ⚠ … et {len(r['desaccords']) - 5} autre(s)")
    if souci:
        print("\n✗ Un manuel au moins est mal paginé : relancer "
              "outils/lire-folios-texte.py <nom> --ecrire.")
        return 1
    print("\n✓ Les pages citées portent bien leur numéro.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
