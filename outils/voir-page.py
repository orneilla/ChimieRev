#!/usr/bin/env python3
"""
Rend une page de manuel en image, pour pouvoir la REGARDER.

POURQUOI
Dans un manuel de chimie, l'essentiel est dessiné : les mécanismes, les
flèches, la stéréochimie. Le texte extrait ne contient que la prose autour.
Cet outil produit l'image de la page, qui peut alors être examinée comme
on examine un manuel ouvert.

USAGE
    python3 outils/voir-page.py --nom clayden --page 342
    python3 outils/voir-page.py --nom mcmurry --page 357 --pages-suivantes 2
    python3 outils/voir-page.py mon-manuel.pdf --page 342 --decalage 24

Avec --nom, le fichier PDF et le décalage sont lus dans l'index établi par
indexer-manuel.py : rien à retenir, et aucun risque de citer une page en
ayant ouvert la mauvaise. C'est indispensable pour les ouvrages qui
arrivent en plusieurs fichiers — le McMurry en compte trois —, où la page
cherchée n'est pas toujours dans le même.
"""
import argparse
import json
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


# Même alias que dans chercher-source.py : le nom court documenté du
# Housecroft ne correspond pas au dossier où il a été indexé.
ALIAS = {
    "housecroft": "inorganique",
}


def resoudre(nom: str, imprimee: int) -> tuple[Path, int]:
    """Retrouve, dans l'index, le fichier qui contient cette page imprimée."""
    index = Path("sources-locales") / ALIAS.get(nom, nom) / "pages.json"
    if not index.exists():
        sys.exit(f"Manuel non indexé : {index}")
    donnees = json.loads(index.read_text(encoding="utf-8"))
    volumes = donnees.get("volumes") or []
    for page in donnees["pages"]:
        if page["imprimee"] == imprimee:
            fichier = page.get("fichier") or (volumes[0]["fichier"] if volumes else None)
            # Le décalage se lit sur la PAGE, jamais sur l'ouvrage : plusieurs
            # manuels en ont plusieurs — des pages non numérotées glissées
            # entre les chapitres décalent tout ce qui suit.
            decalage = page.get("decalage")
            if decalage is None:
                decalage = page["pdf"] - page["imprimee"]
            if fichier:
                return Path(fichier), decalage
            break
    if len(volumes) == 1 and "decalage" in volumes[0]:
        return Path(volumes[0]["fichier"]), volumes[0]["decalage"]
    sys.exit(f"Page {imprimee} absente de l'index « {nom} », ou index trop ancien : "
             f"relancer indexer-manuel.py.")


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description="Rend une page de manuel en image.")
    analyseur.add_argument("pdf", type=Path, nargs="?", default=None)
    analyseur.add_argument("--nom", help="nom court d'un manuel indexé (clayden, mcmurry…)")
    analyseur.add_argument("--page", type=int, required=True, help="numéro imprimé")
    analyseur.add_argument("--decalage", type=int, default=0)
    analyseur.add_argument("--pages-suivantes", type=int, default=0)
    analyseur.add_argument("--dossier", type=Path, default=Path("sources-locales/pages"))
    analyseur.add_argument("--zoom", type=float, default=2.0)
    arguments = analyseur.parse_args()

    pdf, decalage = arguments.pdf, arguments.decalage
    if arguments.nom:
        pdf, decalage = resoudre(arguments.nom, arguments.page)
        print(f"  {arguments.nom} : {pdf.name} (décalage {decalage})")
    elif pdf is None:
        analyseur.error("donner un chemin de PDF, ou --nom pour un manuel indexé")

    rendre(pdf, arguments.page, decalage,
           arguments.pages_suivantes, arguments.dossier, arguments.zoom)
