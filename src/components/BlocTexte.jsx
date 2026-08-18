// Affiche un texte long en respectant les paragraphes.
// Dans le JSON, les paragraphes sont séparés par une ligne vide ("\n\n").
export default function BlocTexte({ texte }) {
  const paragraphes = texte.split('\n\n').filter((p) => p.trim() !== '')

  // Convention de rédaction : une ligne courte dont le premier mot est
  // écrit tout en majuscules ("POURQUOI ça se passe ainsi ?") sert
  // d'intertitre à l'intérieur d'une explication.
  const estIntertitre = (paragraphe) => {
    if (paragraphe.length > 90) return false
    const premierMot = paragraphe.trim().split(/\s+/)[0].replace(/[^A-Za-zÀ-ÿ]/g, '')
    return premierMot.length >= 2 && premierMot === premierMot.toUpperCase()
  }

  return (
    <>
      {paragraphes.map((paragraphe, index) =>
        estIntertitre(paragraphe) ? (
          <h4 key={index} className="intertitre">{paragraphe}</h4>
        ) : (
          <p key={index}>{paragraphe}</p>
        )
      )}
    </>
  )
}
