// Petit indicateur visuel : 5 points, dont "niveau" sont remplis.
export default function NiveauDifficulte({ niveau }) {
  const points = [1, 2, 3, 4, 5]

  return (
    <p className="difficulte" title={`Difficulté ${niveau} sur 5`}>
      <span className="difficulte-libelle">Difficulté</span>
      {points.map((p) => (
        <span
          key={p}
          className={p <= niveau ? 'point plein' : 'point'}
          aria-hidden="true"
        />
      ))}
      {/* Texte lu par les lecteurs d'écran, invisible à l'œil. */}
      <span className="lecture-seule-ecran">{niveau} sur 5</span>
    </p>
  )
}
