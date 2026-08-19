// Le programme : ce qu'il y a à couvrir, et où on en est.
//
// Cette page existe pour une raison précise : sur un projet qui vise
// toutes les réactions de la licence au master, il faut pouvoir dire à
// tout moment ce qui est écrit, ce que la machine a vérifié, et ce qu'un
// chimiste a relu. Rien ne doit pouvoir passer pour sûr sans l'être.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import avancement from '../data/avancement.json'
import programme from '../data/programme.json'
import { couleurFamille } from '../couleurs.js'

const ETATS = {
  absente: { libelle: 'à écrire', classe: 'etat-absente' },
  redigee: { libelle: 'rédigée', classe: 'etat-redigee' },
  verifiee: { libelle: 'flèches vérifiées', classe: 'etat-verifiee' },
  relue: { libelle: 'relue', classe: 'etat-relue' }
}

function Jauge({ partie, total, couleur }) {
  const pourcentage = total === 0 ? 0 : (partie / total) * 100

  return (
    <span className="jauge jauge-large">
      <span
        className="jauge-remplissage"
        style={{ width: `${pourcentage}%`, background: couleur }}
      />
    </span>
  )
}

function Famille({ famille }) {
  const [ouverte, setOuverte] = useState(false)
  const couleur = couleurFamille(famille.famille)
  const faites = famille.redigee + famille.verifiee + famille.relue

  return (
    <section className="bloc famille" style={{ '--couleur': couleur }}>
      <button
        type="button"
        className="famille-entete"
        aria-expanded={ouverte}
        onClick={() => setOuverte((v) => !v)}
      >
        <span className="famille-nom">{famille.nom}</span>
        <span className="famille-compte">{faites}/{famille.total}</span>
        <span className="famille-chevron" aria-hidden="true">{ouverte ? '▾' : '▸'}</span>
      </button>

      <Jauge partie={faites} total={famille.total} couleur={couleur} />

      {ouverte && (
        <ul className="liste-programme">
          {famille.reactions.map((reaction) => (
            <li key={reaction.nom}>
              <span className={`etat ${ETATS[reaction.statut].classe}`}>
                {ETATS[reaction.statut].libelle}
              </span>

              <span className="programme-nom">
                {reaction.id ? (
                  <Link to={`/reaction/${reaction.id}`}>{reaction.nom}</Link>
                ) : (
                  reaction.nom
                )}
              </span>

              <span className="programme-niveau">{reaction.niveau}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function PageProgramme() {
  return (
    <section>
      <div className="intro">
        <p className="sur-titre">Où on en est</p>
        <h1>Programme</h1>
        <p className="accroche">
          Toutes les réactions à couvrir, de la licence au master 2. Rien
          n'est présenté comme sûr avant d'avoir été vérifié par la machine,
          puis relu par un chimiste.
        </p>
      </div>

      <div className="bloc bilan-avancement">
        <p className="chiffre-cle">
          <strong>{avancement.redigees}</strong> réactions rédigées sur {avancement.total}
        </p>
        <Jauge partie={avancement.redigees} total={avancement.total} couleur="#16130F" />

        <ul className="liste-etats">
          <li>
            <span className="etat etat-verifiee">flèches vérifiées</span>
            {avancement.verifiees} — la machine a refait le calcul des flèches
          </li>
          <li>
            <span className="etat etat-relue">relues</span>
            {avancement.relues} — un chimiste a attesté le mécanisme
          </li>
        </ul>

        <p className="note">{programme._meta.statut}</p>
      </div>

      {/* Vingt-huit familles à la file ne se lisent pas : on les regroupe
          par bloc, dans l'ordre où on les rencontre en cours. */}
      {[...new Set(avancement.familles.map((f) => f.bloc))].map((bloc) => {
        const familles = avancement.familles.filter((f) => f.bloc === bloc)
        const total = familles.reduce((t, f) => t + f.total, 0)
        const faites = familles.reduce(
          (t, f) => t + f.redigee + f.verifiee + f.relue, 0)

        return (
          <div key={bloc || 'sans-bloc'}>
            {bloc && (
              <h2 className="titre-bloc">
                {bloc}
                <span className="titre-bloc-compte">{faites}/{total}</span>
              </h2>
            )}
            {familles.map((famille) => (
              <Famille key={famille.id} famille={famille} />
            ))}
          </div>
        )
      })}
    </section>
  )
}
