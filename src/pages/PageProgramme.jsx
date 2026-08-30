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
  relue: { libelle: 'relue', classe: 'etat-relue' },
  // Pas un cinquième degré de la même échelle : une autre catégorie.
  // « À écrire » promettrait une fiche à venir ; celles-ci n'en auront
  // pas tant qu'un ouvrage les traitant ne sera pas indexé.
  hors_corpus: { libelle: 'hors corpus', classe: 'etat-hors-corpus' }
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
  // Les lignes hors corpus sortent du dénominateur : sinon la jauge
  // resterait sous 100 % pour toujours, et l'on lirait un retard là où
  // il y a une limite des ouvrages disponibles.
  const couvrable = famille.couvrable ?? famille.total

  return (
    <section className="bloc famille" style={{ '--couleur': couleur }}>
      <button
        type="button"
        className="famille-entete"
        aria-expanded={ouverte}
        onClick={() => setOuverte((v) => !v)}
      >
        <span className="famille-nom">{famille.nom}</span>
        <span className="famille-compte">{faites}/{couvrable}</span>
        <span className="famille-chevron" aria-hidden="true">{ouverte ? '▾' : '▸'}</span>
      </button>

      <Jauge partie={faites} total={couvrable} couleur={couleur} />

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

              {/* La raison s'affiche. Un trou muet ne dit rien au
                  lecteur ; un silence documenté lui apprend ce que le
                  corpus contient et ce qu'il ne contient pas. */}
              {reaction.hors_corpus && (
                <p className="programme-raison">{reaction.hors_corpus}</p>
              )}
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
          <strong>{avancement.redigees}</strong> réactions rédigées sur{' '}
          {avancement.couvrable} sourçables
        </p>
        <Jauge partie={avancement.redigees} total={avancement.couvrable} couleur="#16130F" />

        <ul className="liste-etats">
          <li>
            <span className="etat etat-verifiee">flèches vérifiées</span>
            {avancement.verifiees} — la machine a refait le calcul des flèches
          </li>
          <li>
            <span className="etat etat-relue">relues</span>
            {avancement.relues} — un chimiste a attesté le mécanisme
          </li>
          {avancement.hors_corpus > 0 && (
            <li>
              <span className="etat etat-hors-corpus">hors corpus</span>
              {avancement.hors_corpus} — au programme, mais aucun des neuf
              ouvrages indexés ne les traite. Elles restent affichées, avec
              le détail de ce que la recherche a rendu : on n'écrit pas de
              mémoire, et un silence se déclare.
            </li>
          )}
        </ul>

        <p className="note">{programme._meta.statut}</p>
      </div>

      {/* Vingt-huit familles à la file ne se lisent pas : on les regroupe
          par bloc, dans l'ordre où on les rencontre en cours. */}
      {[...new Set(avancement.familles.map((f) => f.bloc))].map((bloc) => {
        const familles = avancement.familles.filter((f) => f.bloc === bloc)
        const total = familles.reduce((t, f) => t + (f.couvrable ?? f.total), 0)
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
