// Le « magasin » : tous les réactifs et tous les solvants au même endroit,
// avec, pour chacun, les réactions où il apparaît.
//
// Les renvois vers les réactions sont trouvés automatiquement (voir
// src/liens.js) : ajouter une réaction suffit à mettre cette page à jour.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactifs from '../data/reactifs.json'
import solvants from '../data/solvants.json'
import structures from '../data/structures.json'
import BlocTexte from '../components/BlocTexte.jsx'
import BasculeMode from '../components/BasculeMode.jsx'
import { useModeLecture } from '../mode.js'
import { couleurFamille } from '../couleurs.js'
import {
  reactionsUtilisantReactif,
  reactionsUtilisantSolvant,
  reactionParId
} from '../liens.js'

/** Le dessin d'une molécule, s'il existe. */
function Dessin({ cle, role = 'molecule', alt }) {
  const fichier = structures[cle]?.[role]
  if (!fichier) return null

  return (
    <div className="structure-plaque">
      <img src={`${import.meta.env.BASE_URL}structures/${fichier}`} alt={alt} loading="lazy" />
    </div>
  )
}

/** Liste de liens vers des réactions, en pastilles colorées par famille. */
function LiensReactions({ reactions, titre }) {
  if (reactions.length === 0) return null

  return (
    <>
      <h4 className="sous-titre">{titre}</h4>
      <div className="pastilles">
        {reactions.map((reaction) => (
          <Link
            key={reaction.id}
            to={`/reaction/${reaction.id}`}
            className="pastille pastille-lien active"
            style={{ '--couleur': couleurFamille(reaction.famille) }}
          >
            {reaction.nom}
          </Link>
        ))}
      </div>
    </>
  )
}

function FicheReactif({ reactif, mode }) {
  // Deux sources de renvois : ce que les données du réactif annoncent,
  // et ce qu'on trouve réellement dans les réactions déjà présentes.
  const trouvees = reactionsUtilisantReactif(reactif)
  const annoncees = (reactif.reactions_liees || []).map(reactionParId).filter(Boolean)
  const liees = [...new Map([...trouvees, ...annoncees].map((r) => [r.id, r])).values()]

  // Celles que les données annoncent mais qui n'existent pas encore.
  const aVenir = (reactif.reactions_liees || []).filter((id) => !reactionParId(id))

  return (
    <article className="bloc fiche-outil">
      <header className="outil-entete">
        <div>
          <h2>{reactif.nom}</h2>
          <p className="outil-nom-complet">{reactif.nom_complet}</p>
          <p className="outil-role">{reactif.role}</p>
        </div>
        <Dessin cle={reactif.id} alt={`Structure de ${reactif.nom}`} />
      </header>

      {reactif.anatomie_annotations?.length > 0 && (
        <>
          <h4 className="sous-titre">Son anatomie</h4>
          <ul className="liste-anatomie">
            {reactif.anatomie_annotations.map((partie, i) => (
              <li key={i}>
                <strong>{partie.partie}</strong>
                <span>{partie.role}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="texte-explication">
        <BlocTexte
          texte={mode === 'comprendre' ? reactif.explication_comprendre : reactif.explication_reference}
        />
      </div>

      {reactif.reactions_exemples?.length > 0 && (
        <>
          <h4 className="sous-titre">Ce qu'il transforme</h4>
          <ul className="liste-exemples">
            {reactif.reactions_exemples.map((exemple, rang) => (
              <li key={rang}>
                <p className="exemple-nom">{exemple.nom}</p>
                <div className="exemple-schema">
                  <Dessin cle={`${reactif.id}-ex${rang}`} role="substrat" alt="Molécule de départ" />
                  <span className="fleche-trait" aria-hidden="true">⟶</span>
                  <Dessin cle={`${reactif.id}-ex${rang}`} role="produit" alt="Molécule obtenue" />
                </div>
                {exemple.note && <p className="note">{exemple.note}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      <LiensReactions reactions={liees} titre="Où on le rencontre" />

      {aVenir.length > 0 && (
        <p className="note">
          Également cité pour : {aVenir.join(', ').replace(/_/g, ' ')} — ces
          réactions ne sont pas encore dans l'application.
        </p>
      )}
    </article>
  )
}

function FicheSolvant({ solvant }) {
  const liees = reactionsUtilisantSolvant(solvant)

  return (
    <article className="bloc fiche-outil">
      <header className="outil-entete">
        <div>
          <h2>{solvant.nom}</h2>
          <p className="outil-nom-complet">{solvant.nom_complet}</p>
          <p className="outil-role">{solvant.type}</p>
        </div>
        <Dessin cle={solvant.id} alt={`Structure de ${solvant.nom}`} />
      </header>

      <p>{solvant.usage}</p>

      <div className="texte-explication">
        <BlocTexte texte={solvant.explication_comprendre} />
      </div>

      <LiensReactions reactions={liees} titre="Où on le rencontre" />
    </article>
  )
}

export default function PageReactifs() {
  const [onglet, setOnglet] = useState('reactifs')
  const [mode, setMode] = useModeLecture()

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">Le magasin</p>
        <h1>Réactifs &amp; solvants</h1>
        <p className="accroche">
          Ce qu'on ajoute dans le ballon, et ce dans quoi tout se passe.
          Chaque fiche renvoie aux réactions où on le rencontre.
        </p>
      </div>

      <div className="bascule" role="group" aria-label="Choisir la catégorie">
        <button
          type="button"
          className={onglet === 'reactifs' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'reactifs'}
          onClick={() => setOnglet('reactifs')}
          style={{ '--couleur': '#F59120' }}
        >
          <span className="bascule-libelle">Réactifs</span>
          <span className="bascule-aide">{reactifs.length} fiches</span>
        </button>
        <button
          type="button"
          className={onglet === 'solvants' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'solvants'}
          onClick={() => setOnglet('solvants')}
          style={{ '--couleur': '#00A3D9' }}
        >
          <span className="bascule-libelle">Solvants</span>
          <span className="bascule-aide">{solvants.length} fiches</span>
        </button>
      </div>

      {onglet === 'reactifs' ? (
        <>
          <BasculeMode mode={mode} onChange={setMode} />
          {reactifs.map((reactif) => (
            <FicheReactif key={reactif.id} reactif={reactif} mode={mode} />
          ))}
        </>
      ) : (
        solvants.map((solvant) => <FicheSolvant key={solvant.id} solvant={solvant} />)
      )}
    </section>
  )
}
