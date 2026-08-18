// Bascule entre les deux façons de lire une explication.
// Le choix est retenu d'une fiche à l'autre (localStorage).
export default function BasculeMode({ mode, onChange }) {
  const modes = [
    { id: 'comprendre', libelle: 'Comprendre', aide: 'Sans aucune base en chimie' },
    { id: 'reference', libelle: 'Référence', aide: 'Formulation technique' }
  ]

  return (
    <div className="bascule" role="group" aria-label="Mode de lecture">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className={m.id === mode ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={m.id === mode}
          onClick={() => onChange(m.id)}
        >
          <span className="bascule-libelle">{m.libelle}</span>
          <span className="bascule-aide">{m.aide}</span>
        </button>
      ))}
    </div>
  )
}
