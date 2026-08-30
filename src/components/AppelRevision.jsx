// L'appel à la révision du jour, posé en haut de l'accueil.
//
// C'est le déclencheur de l'habitude : il doit dire en un coup d'œil
// COMBIEN il y a à faire — un nombre court engage, « réviser » n'engage
// personne — et si c'est déjà fait.
//
// Il ne calcule que ce qu'il affiche : la composition du paquet, non ses
// questions. Engendrer dix questions et leurs distracteurs pour afficher
// un nombre coûterait cher à chaque ouverture de l'accueil.
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { composerLePaquet } from '../quiz.js'
import { lire, lireJournal, serieDeJours, jourCivil } from '../memorisation.js'

const NB = ' '

export default function AppelRevision() {
  // Une seule lecture du stockage par affichage. `lire` et `lireJournal`
  // ne lèvent jamais : sans stockage utilisable, on obtient un état vide
  // et la carte propose simplement de commencer.
  const { paquet, fait, serie } = useMemo(() => {
    const maintenant = Date.now()
    const etat = lire()
    const journal = lireJournal()
    const jour = jourCivil(maintenant)
    return {
      paquet: composerLePaquet({ etat, maintenant }),
      fait: journal.jours[jour] || null,
      serie: serieDeJours(journal, jour)
    }
  }, [])

  const combien = paquet.reactions.length
  if (combien === 0 && !fait) return null

  return (
    <Link to="/revision" className={`appel-revision${fait ? ' appel-fait' : ''}`}>
      <span className="appel-titre">
        Révision du jour
        {serie > 0 && (
          <span className="appel-serie">
            {serie}{NB}jour{serie > 1 ? 's' : ''} d'affilée
          </span>
        )}
      </span>

      <span className="appel-detail">
        {fait ? (
          <>Terminée{NB}: {fait.justes}/{fait.posees}. À demain.</>
        ) : (
          <>
            <strong>{combien}</strong> réaction{combien > 1 ? 's' : ''}
            {paquet.dues > 0 && <> · {paquet.dues} à réviser</>}
            {paquet.neuves > 0 && <> · {paquet.neuves} nouvelle{paquet.neuves > 1 ? 's' : ''}</>}
          </>
        )}
      </span>

      <span className="appel-fleche" aria-hidden="true">→</span>
    </Link>
  )
}
