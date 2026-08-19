#!/usr/bin/env python3
"""
Rend une page de manuel en image, pour pouvoir la REGARDER.

POURQUOI
Dans un manuel de chimie, l'essentiel est dessiné : les mécanismes, les
flèches, la stéréochimie. Le texte extrait ne contient que la prose autour.
Cet outil produit l'image de la page, qui peut alors être examinée comme
on examine un manuel ouvert.

USAGE
    python3 outils/voir-page.py mon-manuel.pdf --page 342 --decalage 24
    python3 outils/voir-page.py mon-manuel.pdf --page 342 --pages-suivantes 2
"""
import argparse
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    sys.exit("PyMuPDF manquant. Installer avec :  pip install --break-system-packages pymupdf")


def rendre(pdf: Path, imprimee: int, decalage: int, suivantes: int, dossier: Path, zoom: float):
    document = pymupdf.open(pdf)
    dossier.mkdir(parents=True, exist_ok=True)

    for decalage_page in range(suivantes + 1):
        numero_pdf = imprimee + decalage + decalage_page
        if not (1 <= numero_pdf <= document.page_count):
            print(f"⚠ page {numero_pdf} hors du document ({document.page_count} pages)")
            continue

        page = document[numero_pdf - 1]
        # Un zoom de 2 suffit à lire les indices et les charges d'une
        # formule ; au-delà, l'image devient lourde pour rien.
        image = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom))
        sortie = dossier / f"page-{imprimee + decalage_page}.png"
        image.save(sortie)
        print(f"✓ page {imprimee + decalage_page} imprimée → {sortie} "
              f"({image.width}×{image.height} px, {sortie.stat().st_size // 1024} Ko)")

    document.close()


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description="Rend une page de manuel en image.")
    analyseur.add_argument("pdf", type=Path)
    analyseur.add_argument("--page", type=int, required=True, help="numéro imprimé")
    analyseur.add_argument("--decalage", type=int, default=0)
    analyseur.add_argument("--pages-suivantes", type=int, default=0)
    analyseur.add_argument("--dossier", type=Path, default=Path("sources-locales/pages"))
    analyseur.add_argument("--zoom", type=float, default=2.0)
    arguments = analyseur.parse_args()

    rendre(arguments.pdf, arguments.page, arguments.decalage,
           arguments.pages_suivantes, arguments.dossier, arguments.zoom)
