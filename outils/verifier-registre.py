#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Le corpus vouvoie. Cet outil cherche ce qui y a échappé.

L'application s'adresse au lecteur au VOUS, du début à la fin. Un « tu »
isolé au milieu d'une fiche ne casse rien et ne se voit pas à la
relecture : il se voit à l'écran, une fois la fiche en ligne, et c'est
trop tard. Il faut donc le chercher à la machine.

Deux leçons apprises en le faisant :

  • Chercher des chaînes littérales ne suffit pas. « Retiens : » s'écrit
    avec une ESPACE INSÉCABLE devant les deux-points — la typographie
    française l'exige, `normaliser-typographie.py` la pose — et une
    recherche sur « Retiens : » avec une espace ordinaire ne trouve rien.
    On cherche donc avec \\s, qui couvre les deux.

  • Un impératif à la deuxième personne du singulier ressemble souvent à
    un nom commun : « ce TON », « une NOTE », « la SUITE ». D'où la liste
    close de verbes ci-dessous plutôt qu'une règle grammaticale, et le
    fait qu'on AFFICHE le contexte au lieu de corriger tout seul.

    python3 outils/verifier-registre.py
"""
import json
import io
import re
import sys
import pathlib

# Les pronoms de la deuxième personne du singulier, et les impératifs
# qu'on emploie réellement dans une explication de chimie. Le « (?!z) »
# écarte la forme de politesse : « Regardez » n'est pas « Regarde ».
TUTOIEMENT = re.compile(
    r"\b(?:tu|toi|ton|ta|tes|t'as)\b"
    r"|\b(?:Regarde|Retiens|Imagine|Souviens|Vois|Prends|Compare|Cherche"
    r"|Essaie|Écris|Pars|Note|Rappelle|Observe|Dessine|Demande|Suis|Vas"
    r"|Fais|Sache|Choisis|Repère|Compte|Reprends|Oublie|Retire)\b(?!z)"
)

FICHIERS = ['reactions', 'reactifs', 'solvants', 'mecanismes',
            'references', 'programme']


def textes(valeur, chemin):
    """Toutes les chaînes du document, avec le chemin qui y mène."""
    if isinstance(valeur, str):
        yield chemin, valeur
    elif isinstance(valeur, dict):
        for cle, sous in valeur.items():
            yield from textes(sous, f'{chemin}.{cle}')
    elif isinstance(valeur, list):
        for i, sous in enumerate(valeur):
            yield from textes(sous, f'{chemin}[{i}]')


def main():
    racine = pathlib.Path(__file__).resolve().parent.parent
    total = 0
    for nom in FICHIERS:
        chemin = racine / 'src' / 'data' / f'{nom}.json'
        document = json.load(io.open(chemin, encoding='utf-8'))
        for ou, texte in textes(document, nom):
            for trouve in TUTOIEMENT.finditer(texte):
                debut = max(0, trouve.start() - 50)
                fin = min(len(texte), trouve.end() + 50)
                extrait = texte[debut:fin].replace('\n', ' ')
                print(f'  {trouve.group():10s} {ou}')
                print(f'             …{extrait}…')
                total += 1

    if total:
        print(f'\n{total} passage(s) à relire.')
        print('Attention : « ce ton », « une note » sont des NOMS, pas des '
              'impératifs.\nOn relit avant de corriger.')
    else:
        print('✓ le corpus vouvoie de bout en bout.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
