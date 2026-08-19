#!/usr/bin/env python3
"""
Indexe un manuel en PDF pour pouvoir le consulter page par page.

POURQUOI UN INDEX
Un manuel comme le Clayden fait plus de mille pages : impossible de tout
lire d'un coup. On extrait donc le texte page par page, une fois pour
toutes, et on ne consulte ensuite que les pages utiles à la réaction en
cours de rédaction. C'est ce qui permet de citer « Clayden, 2e éd., p. 342 »
sans l'inventer.

OÙ VA LE TEXTE — ET POURQUOI PAS DANS LE DÉPÔT
Dans sources-locales/, un dossier ignoré par git. Le dépôt ChimieRév est
public : y publier le texte d'un manuel sous droits serait le redistribuer.
L'index reste donc sur la machine, le temps du travail. Ce qui entre dans
le dépôt, ce sont uniquement les explications réécrites et les références
bibliographiques — page comprise.

USAGE
    python3 outils/indexer-manuel.py chemin/du/manuel.pdf --nom clayden \
        [--decalage 24]

--decalage : écart entre le numéro de page du PDF et celui imprimé sur la
page. Si la page 25 du PDF porte le numéro 1, le décalage vaut 24. Sans
lui, les citations renverraient à de mauvaises pages.

Sans --decalage, le script cherche lui-même l'écart en lisant les numéros
imprimés en tête et en pied de page, et retient celui qui revient le plus
souvent. Il annonce sa trouvaille et sur combien de pages elle s'appuie :
à toi de la confirmer avant de citer quoi que ce soit.
"""
import argparse
import json
import re
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:
    sys.exit("PyMuPDF manquant. Installer avec :  pip install --break-system-packages pymupdf")

DOSSIER = Path("sources-locales")


def deviner_decalage(document) -> tuple[int, int, int]:
    """
    Cherche l'écart entre pagination du PDF et pagination imprimée.

    On lit le nombre isolé qui figure en tête ou en pied de page, et on
    compte les écarts obtenus. Celui qui revient le plus souvent est le bon,
    parce qu'un numéro de page suit la page, alors qu'un nombre quelconque
    du texte ne suit rien.
    """
    from collections import Counter
    ecarts = Counter()
    examinees = 0

    for numero in range(document.page_count):
        page = document[numero]
        hauteur = page.rect.height
        # On ne regarde que les bandeaux : 8 % en haut, 8 % en bas.
        bandeaux = [
            pymupdf.Rect(0, 0, page.rect.width, hauteur * 0.08),
            pymupdf.Rect(0, hauteur * 0.92, page.rect.width, hauteur)
        ]
        for bandeau in bandeaux:
            texte = page.get_textbox(bandeau)
            for nombre in re.findall(r"\b(\d{1,4})\b", texte):
                valeur = int(nombre)
                if 1 <= valeur <= document.page_count:
                    ecarts[(numero + 1) - valeur] += 1
        examinees += 1

    if not ecarts:
        return 0, 0, examinees
    decalage, appuis = ecarts.most_common(1)[0]
    return decalage, appuis, examinees


def indexer(pdf: Path, nom: str, decalage: int | None) -> None:
    if not pdf.exists():
        sys.exit(f"Fichier introuvable : {pdf}")

    document = pymupdf.open(pdf)

    # De quel ouvrage s'agit-il ? La réponse conditionne la référence.
    metadonnees = document.metadata or {}
    titre = (metadonnees.get("title") or "").strip()
    auteur = (metadonnees.get("author") or "").strip()
    print(f"  Fichier : {pdf.name} — {document.page_count} pages")
    if titre or auteur:
        print(f"  Métadonnées du PDF : {titre or '(sans titre)'} — {auteur or '(sans auteur)'}")
    else:
        print("  Métadonnées du PDF : absentes — l'ouvrage devra être identifié à la main.")

    if decalage is None:
        decalage, appuis, examinees = deviner_decalage(document)
        print(f"  Décalage deviné : {decalage} (numéro imprimé retrouvé sur {appuis} "
              f"repères, {examinees} pages examinées) — à confirmer.")

    destination = DOSSIER / nom
    destination.mkdir(parents=True, exist_ok=True)

    pages = []
    vides = 0

    for numero in range(document.page_count):
        texte = document[numero].get_text()
        # Les manuels scannés sans couche texte ressortent vides : on le
        # signale plutôt que de laisser croire à un index utilisable.
        if len(texte.strip()) < 20:
            vides += 1
        # Les césures de fin de ligne coupent les mots recherchés.
        texte = re.sub(r"-\n(?=[a-zà-ÿ])", "", texte)
        pages.append({
            "pdf": numero + 1,
            "imprimee": numero + 1 - decalage,
            "texte": texte
        })

    document.close()

    (destination / "pages.json").write_text(
        json.dumps({"nom": nom, "decalage": decalage, "pages": pages}, ensure_ascii=False),
        encoding="utf-8"
    )

    print(f"✓ {len(pages)} pages indexées dans {destination}/")
    if vides:
        part = vides * 100 // len(pages)
        print(f"⚠ {vides} pages sans texte ({part} %). Si la part est forte, "
              "le PDF est probablement un scan sans couche texte : il faudrait "
              "le passer à l'OCR avant de pouvoir le citer.")
    milieu = pages[len(pages) // 2] if pages else None
    if milieu:
        print(f"  Contrôle : page {milieu['pdf']} du PDF = page {milieu['imprimee']} imprimée. "
              "Ouvre cette page pour vérifier avant de citer.")


if __name__ == "__main__":
    analyseur = argparse.ArgumentParser(description="Indexe un manuel PDF pour consultation.")
    analyseur.add_argument("pdf", type=Path)
    analyseur.add_argument("--nom", required=True, help="nom court : clayden, march…")
    analyseur.add_argument("--decalage", type=int, default=None,
                           help="écart PDF/page imprimée ; deviné si absent")
    arguments = analyseur.parse_args()
    indexer(arguments.pdf, arguments.nom, arguments.decalage)
