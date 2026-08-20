// La page d'un réactif ou d'un solvant, pris isolément.
//
// Elle existe pour qu'on puisse arriver directement sur « PBr₃ » depuis
// une fiche de réaction, depuis la recherche, ou depuis un lien partagé.
import { Link, useParams, Navigate } from 'react-router-dom'
import reactifs from '../data/reactifs.json'
import solvants from '../data/solvants.json'
import BasculeMode from '../components/BasculeMode.jsx'
import { useModeLecture } from '../mode.js'
import { FicheReactif, FicheSolvant } from '../components/FichesOutils.jsx'

export default function PageDetailOutil({ genre }) {
  const { id } = useParams()
  const [mode, setMode] = useModeLecture()

  const liste = genre === 'reactif' ? reactifs : solvants
  const entree = liste.find((e) => e.id === id)

  // Un identifiant inconnu renvoie au magasin plutôt que d'afficher
  // une page vide.
  if (!entree) return <Navigate to="/reactifs" replace />

  return (
    <section className="fiche">
      <Link to="/reactifs" className="lien-retour">← Réactifs &amp; solvants</Link>

      {genre === 'reactif' ? (
        <>
          <BasculeMode mode={mode} onChange={setMode} />
          <FicheReactif reactif={entree} mode={mode} />
        </>
      ) : (
        <FicheSolvant solvant={entree} />
      )}

      <Link to="/reactifs" className="lien-retour bas">← Réactifs &amp; solvants</Link>
    </section>
  )
}
