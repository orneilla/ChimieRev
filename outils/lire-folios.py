#!/usr/bin/env python3
"""
Lit les numéros de page IMPRIMÉS d'un PDF en reconnaissant la forme des
chiffres, et en déduit les plages de décalage.

POURQUOI
Le McMurry compose ses folios dans une police sous-ensemblée dont le codage
change d'une page à l'autre : le texte extrait est illisible. Pire, les
fichiers dont nous disposons sont des scans PARTIELS — il manque des pages
entre les chapitres —, si bien qu'un décalage unique par volume donne des
citations FAUSSES. Le volume 6 en compte treize.

Les formes des chiffres, elles, sont les mêmes partout. On les compare donc
en image, à partir de quelques pages dont le folio a été lu à l'œil.

USAGE
    python3 outils/lire-folios.py fichier.pdf
    python3 outils/lire-folios.py fichier.pdf --modeles modeles.json
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

try:
    import pymupdf
except ImportError:
    sys.exit("PyMuPDF manquant : pip install --break-system-packages pymupdf")

ZOOM = 8
LARGEUR, HAUTEUR = 10, 14
TOLERANCE = 20        # pixels divergents admis entre un glyphe et son modèle
FOLIO_MAX = 1400


def span_du_folio(page):
    """Le span en gras, collé à la marge extérieure, qui porte le numéro."""
    r = page.rect
    zone = pymupdf.Rect(0, r.height * 0.03, r.width, r.height * 0.16)
    marge = r.width * 0.18
    candidats = []
    for bloc in page.get_text('rawdict', clip=zone)['blocks']:
        for ligne in bloc.get('lines', []):
            for span in ligne['spans']:
                if 'Bold' not in span['font']:
                    continue
                chars = [c for c in span['chars'] if c['c'].strip()]
                if not 1 <= len(chars) <= 4:
                    continue
                x0 = min(c['bbox'][0] for c in chars)
                x1 = max(c['bbox'][2] for c in chars)
                # à gauche sur les pages paires, à droite sur les impaires :
                # c'est ce qui distingue le folio d'un titre de section.
                if x0 < marge or x1 > r.width - marge:
                    candidats.append((span['bbox'][1], chars))
    if not candidats:
        return None
    candidats.sort(key=lambda t: t[0])
    return candidats[0][1]


def vignette(page, bbox):
    """Image binaire normalisée d'un glyphe, pour comparaison de forme."""
    pix = page.get_pixmap(matrix=pymupdf.Matrix(ZOOM, ZOOM),
                          clip=pymupdf.Rect(bbox), colorspace=pymupdf.csGRAY)
    src, grille = pix.samples, []
    for j in range(HAUTEUR):
        for i in range(LARGEUR):
            x = min(pix.width - 1, (i * pix.width) // LARGEUR)
            y = min(pix.height - 1, (j * pix.height) // HAUTEUR)
            grille.append(1 if src[y * pix.stride + x] < 128 else 0)
    return grille


def ecart(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)


def lire_folio(page, modeles):
    chars = span_du_folio(page)
    if not chars:
        return None
    chiffres = []
    for c in chars:
        v = vignette(page, c['bbox'])
        meilleur = min(modeles, key=lambda k: ecart(v, modeles[k]))
        if ecart(v, modeles[meilleur]) > TOLERANCE:
            return None
        chiffres.append(meilleur)
    numero = int(''.join(chiffres))
    return numero if 1 <= numero <= FOLIO_MAX else None


def plages_de_decalage(document, modeles):
    """[(pdf_debut, pdf_fin, decalage)] — une plage par tronçon continu."""
    brut = {}
    for pg in range(1, document.page_count + 1):
        numero = lire_folio(document[pg - 1], modeles)
        if numero:
            brut[pg] = numero

    # Une lecture n'est retenue que si une page voisine la confirme : le
    # folio d'une page suit celui de la précédente. Une reconnaissance
    # isolée, elle, peut être un titre pris pour un numéro.
    sures = {pg: n for pg, n in brut.items()
             if brut.get(pg - 1) == n - 1 or brut.get(pg + 1) == n + 1}

    plages, courant = [], None
    for pg in sorted(sures):
        delta = pg - sures[pg]
        if courant and courant[2] == delta and pg <= courant[1] + 3:
            courant[1] = pg
        else:
            if courant:
                plages.append(courant)
            courant = [pg, pg, delta]
    if courant:
        plages.append(courant)
    return [p for p in plages if p[1] - p[0] >= 3], sures


if __name__ == '__main__':
    a = argparse.ArgumentParser(description="Lit les folios d'un PDF.")
    a.add_argument('pdf', type=Path)
    a.add_argument('--modeles', type=Path, default=Path('sources-locales/modeles-chiffres.json'))
    args = a.parse_args()

    if not args.modeles.exists():
        sys.exit(f"Modèles de chiffres absents : {args.modeles}\n"
                 "Les créer avec apprendre-chiffres.py à partir de pages lues à l'œil.")
    modeles = json.loads(args.modeles.read_text())

    document = pymupdf.open(args.pdf)
    plages, sures = plages_de_decalage(document, modeles)
    print(f"{len(sures)}/{document.page_count} pages lues avec confirmation")
    print(f"\n{len(plages)} plage(s) de décalage constant :")
    for debut, fin, delta in plages:
        print(f"   pdf {debut:>4}–{fin:<4} → imprimées {debut-delta:>4}–{fin-delta:<4}"
              f"   (décalage {delta})")
    if len(plages) > 1:
        print("\n⚠ Ce fichier est un scan PARTIEL : un décalage unique donnerait"
              " des citations fausses.")
