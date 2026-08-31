// La progression : quelles familles retravailler.
//
// La page répond à UNE question — « par quoi dois-je reprendre ? » — et
// tout y est ordonné pour elle : les familles les plus ratées en tête,
// celles jamais rencontrées à la fin, parce qu'elles ne sont pas à
// retravailler mais à découvrir.
//
// DEUX MESURES, ET LES CONFONDRE SERAIT TROMPEUR. Le taux dit la qualité
// des réponses ; la couverture dit l'étendue. On peut être à 100 % sur une
// famille dont on n'a rencontré que deux réactions sur quinze — la barre
// seule le cacherait, le compte à côté le dit.
//
// ET UN TAUX SUR DEUX RÉPONSES N'EST PAS UN TAUX. Sur trois réponses, il
// ne peut valoir que 0, 33, 67 ou 100 %, et une étourderie fait chuter de
// 100 à 67. Ces familles-là sont montrées autrement : le chiffre reste,
// la barre devient tiretée, et la mention « trop peu pour conclure »
// accompagne. On ne cache rien ; on dit ce que le chiffre vaut.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { vivier } from '../quiz.js'
import { couleurFamille } from '../couleurs.js'
import {
  lire, statistiquesParFamille, statistiques, REPONSES_POUR_CONCLURE
} from '../memorisation.js'

const NB = ' '

/** Pour l'ŒIL : « 33 % », avec l'insécable que veut le français. */
const pourcent = (x) => `${Math.round(x * 100)}${NB}%`

/**
 * Pour le CSS : « 33% », sans espace.
 *
 * Les deux ne se confondent pas, et les confondre ne se voit pas en
 * relisant le code : `width: "33 %"` avec une insécable est une valeur
 * INVALIDE, que le navigateur ignore en silence. La barre repasse alors à
 * `width: auto`, c'est-à-dire PLEINE — toutes les familles s'affichaient
 * à 100 %, quel que soit leur taux, et le chiffre à côté disait 33 %.
 */
const largeurCss = (x) => `${Math.round(x * 100)}%`

function Famille({ f }) {
  const couleur = couleurFamille(f.famille)

  return (
    <li className="progression-famille">
      <div className="progression-entete">
        <Link to={`/quiz?famille=${encodeURIComponent(f.famille)}`}>{f.famille}</Link>
        <span className="progression-taux">{pourcent(f.taux)}</span>
      </div>

      {/* La barre de réussite. Sur trop peu de réponses elle est tiretée :
          la forme dit la fiabilité, sans qu'il faille lire la légende. */}
      <span
        className={`jauge jauge-large${f.concluant ? '' : ' jauge-incertaine'}`}
        role="img"
        aria-label={`${f.famille}${NB}: ${pourcent(f.taux)} de réussite sur ${f.reponses} réponses`}
      >
        {/* À zéro, on ne dessine RIEN. La jauge porte un `min-width` de
            3 px pour qu'une progression minime reste visible ; appliqué à
            0 %, il montrerait un filet de couleur là où il n'y a aucune
            réussite. */}
        {f.taux > 0 && (
          <span
            className="jauge-remplissage"
            style={{ width: largeurCss(f.taux), background: couleur }}
          />
        )}
      </span>

      <p className="progression-detail">
        {f.justes}/{f.reponses} réponse{f.reponses > 1 ? 's' : ''}
        {' · '}{f.vues}/{f.total} réaction{f.total > 1 ? 's' : ''} rencontrée
        {f.vues > 1 ? 's' : ''}
        {f.acquises > 0 && <> · {f.acquises} acquise{f.acquises > 1 ? 's' : ''}</>}
        {!f.concluant && (
          <span className="progression-reserve">
            {' '}— trop peu de réponses pour conclure
          </span>
        )}
      </p>
    </li>
  )
}

/**
 * Les familles jamais rencontrées, repliées.
 *
 * Il y en a vingt et une au départ, et dépliées elles font une traîne de
 * barres vides qui enterre la seule chose que la page doit montrer d'un
 * coup d'œil : ce qu'on rate. Elles ne sont pas cachées pour autant — le
 * compte est annoncé, et un clic les déplie. Une barre vide et tiretée ne
 * dirait de toute façon rien de plus que « rien ».
 */
function JamaisVues({ familles }) {
  const [ouvert, setOuvert] = useState(false)
  if (familles.length === 0) return null
  const aDecouvrir = familles.reduce((n, f) => n + f.total, 0)

  return (
    <div className="bloc progression-inconnues">
      <button
        type="button"
        className="famille-entete"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
      >
        <span className="famille-nom">
          {familles.length} famille{familles.length > 1 ? 's' : ''} jamais rencontrée
          {familles.length > 1 ? 's' : ''}
        </span>
        <span className="famille-compte">{aDecouvrir} réactions</span>
        <span className="famille-chevron" aria-hidden="true">{ouvert ? '▾' : '▸'}</span>
      </button>

      {ouvert && (
        <ul className="liste-programme">
          {familles.map((f) => (
            <li key={f.famille}>
              <Link className="programme-nom" to={`/quiz?famille=${encodeURIComponent(f.famille)}`}>
                {f.famille}
              </Link>
              <span className="programme-niveau">{f.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function PageProgression() {
  const [etat] = useState(lire)

  const { familles, ensemble, aRetravailler } = useMemo(() => {
    const maintenant = Date.now()
    const reactions = vivier()
    const familles = statistiquesParFamille(etat, reactions, maintenant)
    return {
      familles,
      ensemble: statistiques(etat, reactions.map((r) => r.id), maintenant),
      // Ce qu'on propose de reprendre : assez de réponses pour conclure,
      // et moins de trois sur quatre de réussite.
      aRetravailler: familles.filter((f) => f.concluant && f.taux < 0.75)
    }
  }, [etat])

  const repondu = familles.some((f) => f.taux !== null)

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">Où vous en êtes</p>
        <h1>Progression</h1>
        <p className="accroche">
          Votre taux de réussite par famille, calculé sur vos réponses au
          quiz. Les familles les plus ratées sont en tête{NB}: ce sont
          celles à reprendre.
        </p>
      </div>

      {!repondu ? (
        <div className="bloc">
          <p className="chiffre-cle">Rien à afficher pour l'instant.</p>
          <p>
            Cet écran se remplit à mesure que vous répondez. Une famille
            n'affiche un taux qu'à partir de {REPONSES_POUR_CONCLURE}
            {NB}réponses — en dessous, un pourcentage ne veut rien dire.
          </p>
          <Link className="bouton-primaire" to="/revision">
            Commencer par la révision du jour
          </Link>
        </div>
      ) : (
        <>
          <div className="bloc">
            <p className="chiffre-cle">
              <strong>{ensemble.vues}</strong> réaction{ensemble.vues > 1 ? 's' : ''}{' '}
              rencontrée{ensemble.vues > 1 ? 's' : ''} sur {ensemble.total}
              {' · '}<strong>{ensemble.acquises}</strong> acquise
              {ensemble.acquises > 1 ? 's' : ''}
            </p>

            {aRetravailler.length > 0 ? (
              <p className="note">
                À reprendre en priorité{NB}:{' '}
                {aRetravailler.slice(0, 3).map((f, i) => (
                  <span key={f.famille}>
                    {i > 0 && ', '}
                    <strong>{f.famille}</strong> ({pourcent(f.taux)})
                  </span>
                ))}
                {aRetravailler.length > 3 && `, et ${aRetravailler.length - 3} autre${aRetravailler.length - 3 > 1 ? 's' : ''}`}.
              </p>
            ) : (
              <p className="note">
                Aucune famille sous les trois quarts de réussite, sur les
                familles où vous avez assez répondu pour conclure.
              </p>
            )}
          </div>

          <ul className="progression-liste">
            {familles.filter((f) => f.taux !== null)
              .map((f) => <Famille key={f.famille} f={f} />)}
          </ul>

          <JamaisVues familles={familles.filter((f) => f.taux === null)} />
        </>
      )}
    </section>
  )
}
