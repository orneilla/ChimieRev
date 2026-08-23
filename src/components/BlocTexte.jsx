// Affiche un texte long en respectant les paragraphes.
// Dans le JSON, les paragraphes sont séparés par une ligne vide ("\n\n"),
// et un simple retour à la ligne coupe la ligne sans ouvrir de paragraphe.
//
// Une liste à puces s'écrit avec des lignes commençant par « • » : elles
// sont regroupées en une vraie liste. Sans cela elles se retrouvaient
// mises bout à bout en un seul bloc de texte, et les quatre règles de
// Woodward-Hoffmann se lisaient comme une phrase unique.

// Repère une amorce écrite en majuscules en début de paragraphe
// (« POURQUOI ... ? », « COMMENT ... », « SN1 OU SN2 ... ») pour la mettre
// en valeur : c'est la charpente du mode « Comprendre ».
// Le « $ » de fin compte autant que l'espace : sans lui, le dernier mot
// d'une amorce qui occupe tout le paragraphe restait en dehors — on
// lisait « LA FAUTE DE DESSIN À NE PAS » en gras et « COMMETTRE » non.
//
// La PONCTUATION coupait l'amorce au mauvais endroit, et cela se voyait
// sur 354 lignes : « LA MÊME RÉACTION, EN SENS INVERSE, ET AVEC DEUX
// ÉLECTRONS DE MOINS. » ne donnait que « LA MÊME », parce que la virgule
// après « RÉACTION » faisait échouer le mot suivant et le moteur reculait
// jusqu'au dernier mot suivi d'une espace. D'où deux ajouts : une virgule
// ou un point-virgule TOLÉRÉS entre deux mots, et une fin d'amorce qui
// accepte la ponctuation autant que l'espace.
const AMORCE =
  /^([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ0-9'’-]*(?:[,;]?\s+[A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ0-9'’-]*)*)(?=[\s.,;:!?]|$)/

/** Une ligne de texte, l'amorce mise en valeur si la ligne en porte une. */
function Ligne({ texte, avecAmorce }) {
  const trouve = avecAmorce ? texte.match(AMORCE) : null

  // Une amorce d'au moins 3 lettres, sinon on laisse le texte tel quel
  // (évite de surligner une simple initiale ou un sigle isolé).
  if (trouve && trouve[1].length >= 3) {
    return (
      <>
        <strong className="amorce">{trouve[1]}</strong>
        {texte.slice(trouve[1].length)}
      </>
    )
  }
  return <>{texte}</>
}

/** Découpe un paragraphe en blocs : du texte, et des listes à puces. */
function blocsDe(paragraphe) {
  const blocs = []

  for (const ligne of paragraphe.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const puce = ligne.startsWith('•')
    const dernier = blocs[blocs.length - 1]

    if (dernier && dernier.puce === puce) dernier.lignes.push(ligne)
    else blocs.push({ puce, lignes: [ligne] })
  }
  return blocs
}

export default function BlocTexte({ texte }) {
  const paragraphes = texte.split('\n\n').filter((p) => p.trim() !== '')

  return (
    <>
      {paragraphes.map((paragraphe, index) =>
        blocsDe(paragraphe).map((bloc, rang) =>
          bloc.puce ? (
            <ul className="liste-puces" key={`${index}-${rang}`}>
              {bloc.lignes.map((ligne, i) => (
                <li key={i}>{ligne.replace(/^•\s*/, '')}</li>
              ))}
            </ul>
          ) : (
            <p key={`${index}-${rang}`}>
              {bloc.lignes.map((ligne, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  <Ligne texte={ligne} avecAmorce={rang === 0 && i === 0} />
                </span>
              ))}
            </p>
          )
        )
      )}
    </>
  )
}
