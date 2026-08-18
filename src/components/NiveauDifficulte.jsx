// Indicateur de difficulté, sur une échelle de 10 (celle des données).
// Affiché sous forme de jauge : plus la barre est remplie, plus c'est ardu.
export default function NiveauDifficulte({ niveau }) {
  const MAXIMUM = 10
  // On borne la valeur entre 0 et 10, au cas où une donnée serait erronée.
  const valeur = Math.max(0, Math.min(MAXIMUM, Number(niveau) || 0))
  const pourcentage = (valeur / MAXIMUM) * 100

  return (
    <p className="difficulte">
      <span className="difficulte-libelle">Difficulté</span>

      <span className="jauge" aria-hidden="true">
        <span className="jauge-remplissage" style={{ width: `${pourcentage}%` }} />
      </span>

      <span className="difficulte-valeur">{valeur}/{MAXIMUM}</span>
    </p>
  )
}
