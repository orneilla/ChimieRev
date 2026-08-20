#!/usr/bin/env python3
"""
Lit les folios d'un manuel dans son en-tête ou son pied de page, et en tire
les PLAGES DE DÉCALAGE réelles entre pagination PDF et pagination imprimée.

POURQUOI CET OUTIL EXISTE
Un décalage unique par ouvrage est une hypothèse, pas un fait. Le McMurry
l'avait démentie le premier — trois scans partiels, trente et une plages.
Le Grossman, le Dugas et le Carey & Sundberg la démentent aussi : des pages
non numérotées glissées entre les chapitres décalent tout ce qui suit, d'un
cran à chaque fois. Les recherches continuent pourtant de renvoyer du texte
plausible, sous un mauvais numéro — c'est exactement la faute que la règle
de sourçage doit empêcher.

CE QU'IL LIT
Le folio se trouve seul, en tête ou en pied, au début ou à la fin de la
première ou de la dernière ligne. On ne retient qu'un nombre ISOLÉ : un
numéro de figure ou une année dans le corps du texte ne compte pas. Et une
lecture n'est gardée que si une page voisine la confirme, à un près — sans
quoi un « 5 » égaré fabriquerait une plage.

Le McMurry ne se lit PAS ainsi : ses folios sont composés dans une police
sous-ensemblée, illisible à l'extraction. Il a son propre outil,
lire-folios.py, qui reconnaît la FORME des chiffres.

USAGE
    python3 outils/lire-folios-texte.py grossman            # constater
    python3 outils/lire-folios-texte.py grossman --ecrire   # corriger l'index
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

BANDE = 0.09          # hauteur des zones scrutées, en fraction de la page
FOLIO_MAX = 2000


def folios_du_fichier(fichier):
    """{numéro de page PDF, 1-based : folio lu} — lectures confirmées seules."""
    document = pymupdf.open(fichier)
    brut = {}
    for n in range(len(document)):
        page = document[n]
        r = page.rect
        zones = [pymupdf.Rect(0, 0, r.width, r.height * BANDE),
                 pymupdf.Rect(0, r.height * (1 - BANDE), r.width, r.height)]
        for zone in zones:
            texte = page.get_text('text', clip=zone).strip()
            if not texte:
                continue
            lignes = [x.strip() for x in texte.split('\n') if x.strip()]
            for candidat in (lignes[0], lignes[-1]):
                if re.fullmatch(r'\d{1,4}', candidat) and int(candidat) <= FOLIO_MAX:
                    brut[n + 1] = int(candidat)
                    break
            if n + 1 in brut:
                break
    document.close()

    # Une lecture n'est retenue que si une voisine la confirme.
    return {p: f for p, f in brut.items()
            if brut.get(p - 1) == f - 1 or brut.get(p + 1) == f + 1}


def plages(lus):
    """Suites de pages PDF consécutives partageant le même décalage."""
    groupes = []
    for p in sorted(lus):
        decalage = p - lus[p]
        if groupes and groupes[-1][2] == decalage and p - groupes[-1][1] <= 3:
            groupes[-1][1] = p
        else:
            groupes.append([p, p, decalage])
    groupes = [g for g in groupes if g[1] - g[0] >= 2]

    # Deux groupes voisins de même décalage ne font qu'une plage : la
    # coupure ne venait que d'une page sans folio — une ouverture de
    # chapitre, une planche.
    fusionnes = []
    for g in groupes:
        if fusionnes and fusionnes[-1][2] == g[2]:
            fusionnes[-1][1] = g[1]
        else:
            fusionnes.append(g)
    return fusionnes


def etendre(groupes, total):
    """Chaque plage vaut jusqu'à mi-chemin de la suivante ; le reste n'est pas citable."""
    bornes = []
    for i, (debut, fin, decalage) in enumerate(groupes):
        d = 1 if i == 0 else (groupes[i - 1][1] + debut) // 2 + 1
        f = total if i == len(groupes) - 1 else (fin + groupes[i + 1][0]) // 2
        bornes.append([d, f, decalage])
    return bornes


def main():
    if not sys.argv[1:]:
        print(__doc__)
        return 1
    nom = sys.argv[1]
    ecrire = '--ecrire' in sys.argv
    chemin = Path('sources-locales') / nom / 'pages.json'
    donnees = json.loads(chemin.read_text(encoding='utf-8'))

    for volume in donnees['volumes']:
        lus = folios_du_fichier(volume['fichier'])
        document = pymupdf.open(volume['fichier'])
        total = len(document)
        document.close()
        groupes = etendre(plages(lus), total)
        print(f"\n{Path(volume['fichier']).name}")
        print(f"  décalage actuellement indexé : {volume.get('decalage')}")
        print(f"  {len(lus)} folio(s) confirmé(s) sur {total} pages")
        for debut, fin, decalage in groupes:
            print(f"  PDF {debut:>4}–{fin:<4} décalage {decalage:>4}  "
                  f"→ imprimées {debut - decalage}–{fin - decalage}")
        volume['plages'] = groupes

    if not ecrire:
        print("\n(rien n'a été écrit — ajouter --ecrire pour corriger l'index)")
        return 0

    par_fichier = {v['fichier']: v['plages'] for v in donnees['volumes']}
    gardees = []
    for page in donnees['pages']:
        fichier = page.get('fichier') or donnees['volumes'][0]['fichier']
        decalage = next((d for a, b, d in par_fichier[fichier] if a <= page['pdf'] <= b), None)
        if decalage is None:
            continue          # hors de toute plage : non citable
        page['imprimee'] = page['pdf'] - decalage
        page['decalage'] = decalage
        gardees.append(page)

    avant = len(donnees['pages'])
    donnees['pages'] = gardees
    for volume in donnees['volumes']:
        volume.pop('decalage', None)
    chemin.write_text(json.dumps(donnees, ensure_ascii=False), encoding='utf-8')
    print(f"\n✓ index réécrit : {len(gardees)} pages citables sur {avant}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
