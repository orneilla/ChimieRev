// Affiche un texte long en respectant les paragraphes.
// Dans le JSON, les paragraphes sont séparés par une ligne vide ("\n\n").

// Repère une amorce écrite en majuscules en début de paragraphe
// (« POURQUOI ... ? », « COMMENT ... », « QU'EST-CE ... ») pour la mettre
// en valeur : c'est la charpente du mode « Comprendre ».
const AMORCE = /^([A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ'’-]*(?:\s+[A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ'’-]*)*)(?=\s)/

export default function BlocTexte({ texte }) {
  const paragraphes = texte.split('\n\n').filter((p) => p.trim() !== '')

  return (
    <>
      {paragraphes.map((paragraphe, index) => {
        const texteParagraphe = paragraphe.trim()
        const trouve = texteParagraphe.match(AMORCE)

        // Une amorce d'au moins 3 lettres, sinon on laisse le texte tel quel
        // (évite de surligner une simple initiale ou un sigle isolé).
        if (trouve && trouve[1].length >= 3) {
          const amorce = trouve[1]
          const suite = texteParagraphe.slice(amorce.length)
          return (
            <p key={index}>
              <strong className="amorce">{amorce}</strong>
              {suite}
            </p>
          )
        }

        return <p key={index}>{texteParagraphe}</p>
      })}
    </>
  )
}
