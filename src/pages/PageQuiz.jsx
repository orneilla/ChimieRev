// Le quiz. Aucune question n'est écrite : toutes sont engendrées à partir
// des fiches (voir src/quiz.js).
//
// Deux partis pris d'affichage, et ils tiennent au sujet :
//
// — ON NE DIT JAMAIS « FAUX » TOUT SEUL. Un quiz qui compte les points
//   sans expliquer entraîne à deviner. À chaque réponse, la bonne molécule
//   est montrée, la réaction nommée, et sa sélectivité rappelée — c'est-à-
//   dire la RAISON pour laquelle c'est ce produit-là.
// — ON NE PEUT PAS REVENIR SUR UNE RÉPONSE. Sans cela on clique jusqu'à
//   tomber juste, et le score ne veut plus rien dire.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { serie, famillesJouables, vivier } from '../quiz.js'
import { couleurFamille } from '../couleurs.js'
import BlocTexte from '../components/BlocTexte.jsx'
import {
  lire, enregistrer, oublier, statistiques, DELAIS, DERNIERE_BOITE
} from '../memorisation.js'

const COMBIEN = 10

/** Une graine neuve : le quiz change d'une partie à l'autre. */
const graineNeuve = () => Math.floor(Math.random() * 2 ** 31)

function Choix({ choix, rang, repondu, onChoisir }) {
  // Une fois répondu, on marque la bonne réponse ET celle qu'on a donnée :
  // voir seulement « faux » n'apprend rien.
  const etat = !repondu
    ? ''
    : choix.correct
      ? ' choix-bon'
      : repondu === choix ? ' choix-mauvais' : ' choix-eteint'

  return (
    <li>
      <button
        type="button"
        className={`choix${etat}`}
        disabled={Boolean(repondu)}
        onClick={() => onChoisir(choix)}
      >
        <span className="choix-lettre" aria-hidden="true">
          {'ABCD'[rang]}
        </span>
        <img
          src={`${import.meta.env.BASE_URL}structures/${choix.fichier}`}
          alt={`Proposition ${'ABCD'[rang]}`}
          loading="lazy"
        />
      </button>
    </li>
  )
}

export default function PageQuiz() {
  const [famille, setFamille] = useState(null)
  const [graine, setGraine] = useState(graineNeuve)
  const [rang, setRang] = useState(0)
  const [reponses, setReponses] = useState([])   // un choix par question
  // La progression, relue une fois au montage. `lire()` ne lève jamais :
  // sans stockage utilisable, on révise sans mémoire (voir memorisation.js).
  const [etat, setEtat] = useState(lire)
  const familles = useMemo(famillesJouables, [])

  // L'INSTANT DE DÉPART EST FIGÉ POUR TOUTE LA SÉRIE.
  //
  // Si l'on rappelait Date.now() à chaque rendu, une réaction répondue en
  // début de séance deviendrait « pas encore échue » au milieu de cette
  // même séance, et l'ordre se réarrangerait sous les doigts de l'élève.
  // Une séance se juge à l'heure où elle commence.
  const [debut, setDebut] = useState(() => Date.now())

  // La série ne se recalcule qu'au changement de graine ou de famille :
  // sans ce useMemo, chaque clic rebattrait les questions. L'état de
  // mémorisation N'EST PAS dans les dépendances, et c'est voulu — il
  // change à chaque réponse, ce qui remplacerait les questions en cours.
  const questions = useMemo(
    () => serie({ graine, combien: COMBIEN, famille, etat, maintenant: debut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graine, famille, debut]
  )

  const bilan = useMemo(
    () => statistiques(etat, vivier(famille).map((r) => r.id), debut),
    [etat, famille, debut]
  )

  const question = questions[rang]
  const repondu = reponses[rang] || null
  const fini = rang >= questions.length
  const justes = reponses.filter((r) => r?.correct).length

  const relancer = (nouvelleFamille = famille) => {
    setFamille(nouvelleFamille)
    setGraine(graineNeuve())
    setRang(0)
    setReponses([])
    setDebut(Date.now())
    setEtat(lire())
  }

  const choisir = (choix) => {
    if (repondu) return
    const suite = [...reponses]
    suite[rang] = choix
    setReponses(suite)
    // La réponse est retenue TOUT DE SUITE, non à la fin de la série :
    // une séance interrompue — un onglet fermé, un téléphone qui s'éteint —
    // ne doit pas être perdue.
    setEtat(enregistrer(etat, question.reaction, Boolean(choix.correct), Date.now()))
  }

  const toutOublier = () => {
    if (!globalThis.confirm?.('Effacer toute la progression enregistrée sur cet appareil ?')) return
    oublier()
    setEtat({})
    relancer()
  }

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">S'entraîner</p>
        <h1>Quiz</h1>
        <p className="accroche">
          Les questions sont <strong>engendrées à partir des fiches</strong>,
          jamais écrites à la main : {vivier().length} réactions en
          fournissent. Les mauvaises réponses sont prises dans la même
          famille en priorité — assez proches pour qu'il faille savoir.
        </p>
        <p className="accroche">
          Ce que vous ratez <strong>revient dès la séance suivante</strong> ;
          ce que vous réussissez s'espace — 1 jour, puis 3, 7, 21, 60. La
          progression reste <strong>sur cet appareil</strong>, elle n'est
          envoyée nulle part.
        </p>
      </div>

      {/* Où en est l'élève. Sans cet écran, la répétition espacée
          travaillerait sans qu'il le sache : il ne verrait qu'un quiz qui
          repose curieusement les mêmes questions. */}
      <div className="bloc quiz-memoire">
        <p className="quiz-memoire-titre">
          Ce que vous savez, d'après vos réponses
        </p>

        {bilan.vues === 0 ? (
          <p className="note">
            Rien d'enregistré pour l'instant. Chaque réponse compte : une
            réaction ratée revient dès la séance suivante, une réaction
            réussie plusieurs fois de suite s'espace jusqu'à deux mois.
          </p>
        ) : (
          <>
            <ul className="quiz-boites">
              {bilan.parBoite.map((combien, boite) => (
                <li key={boite} className={combien ? '' : 'boite-vide'}>
                  <span className="boite-barre">
                    <span
                      className="boite-remplissage"
                      style={{
                        height: `${bilan.vues ? (combien / bilan.vues) * 100 : 0}%`,
                        background: boite === DERNIERE_BOITE ? 'var(--vert)' : 'var(--cyan)'
                      }}
                    />
                  </span>
                  <span className="boite-compte">{combien}</span>
                  <span className="boite-delai">
                    {DELAIS[boite] === 0 ? 'à revoir' : `${DELAIS[boite]} j`}
                  </span>
                </li>
              ))}
            </ul>

            <p className="quiz-memoire-chiffres">
              <strong>{bilan.vues}</strong> réaction{bilan.vues > 1 ? 's' : ''} rencontrée
              {bilan.vues > 1 ? 's' : ''} sur {bilan.total}
              {' · '}<strong>{bilan.acquises}</strong> acquise{bilan.acquises > 1 ? 's' : ''}
              {bilan.echues > 0 && <> · <strong>{bilan.echues}</strong> à revoir</>}
            </p>

            <button type="button" className="bouton-discret" onClick={toutOublier}>
              Effacer ma progression
            </button>
          </>
        )}
      </div>

      <div className="bloc quiz-reglages">
        <label htmlFor="quiz-famille">Se limiter à une famille</label>
        <select
          id="quiz-famille"
          value={famille || ''}
          onChange={(e) => relancer(e.target.value || null)}
        >
          <option value="">Toutes les familles ({vivier().length})</option>
          {familles.map(({ famille: f, n }) => (
            <option key={f} value={f}>{f} ({n})</option>
          ))}
        </select>
      </div>

      {fini ? (
        <div className="bloc quiz-bilan">
          <p className="chiffre-cle">
            <strong>{justes}</strong> bonne{justes > 1 ? 's' : ''} réponse
            {justes > 1 ? 's' : ''} sur {questions.length}
          </p>

          <ul className="quiz-recapitulatif">
            {questions.map((q, i) => (
              <li key={q.reaction}>
                <span className={`etat ${reponses[i]?.correct ? 'etat-relue' : 'etat-absente'}`}>
                  {reponses[i]?.correct ? 'juste' : 'manquée'}
                </span>
                <Link to={`/reaction/${q.reaction}`}>{q.explication.nom}</Link>
                {etat[q.reaction] && (
                  <span className="quiz-echeance">
                    {etat[q.reaction].boite === 0
                      ? 'à revoir'
                      : `revient dans ${DELAIS[etat[q.reaction].boite]}$ j`}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <button type="button" className="bouton-primaire" onClick={() => relancer()}>
            Une autre série
          </button>
        </div>
      ) : question ? (
        <div
          className="bloc quiz-question"
          style={{ '--couleur': couleurFamille(question.explication.famille) }}
        >
          <p className="quiz-progression">
            Question {rang + 1} sur {questions.length}
            <span className="quiz-score">{justes} juste{justes > 1 ? 's' : ''}</span>
          </p>

          <h2>{question.intitule}</h2>

          <div className="quiz-enonce">
            <figure className="structure-plaque">
              <img
                src={`${import.meta.env.BASE_URL}structures/${question.substrat}`}
                alt="Substrat de la transformation"
              />
              <figcaption>substrat</figcaption>
            </figure>

            <div className="quiz-conditions">
              <p className="quiz-fleche" aria-hidden="true">→</p>
              <ul>
                {question.reactifs.map((r) => <li key={r}>{r}</li>)}
              </ul>
              {question.solvant && (
                <p className="quiz-solvant">
                  {/* Pas de « dans » en préfixe : le champ `solvant` est
                      parfois une phrase entière avec sa majuscule
                      (« Solvant non polaire, tétrachlorométhane… »), et la
                      préposition s'y heurtait. Un intitulé règle le cas
                      quelle que soit la forme du champ. */}
                  <span className="quiz-etiquette">solvant</span>
                  {question.solvant}
                </p>
              )}
            </div>
          </div>

          <ul className="quiz-choix">
            {question.choix.map((c, i) => (
              <Choix
                key={c.id}
                choix={c}
                rang={i}
                repondu={repondu}
                onChoisir={choisir}
              />
            ))}
          </ul>

          {repondu && (
            <div className="quiz-correction">
              <p className={repondu.correct ? 'quiz-verdict-bon' : 'quiz-verdict-mauvais'}>
                {repondu.correct ? 'Juste.' : 'Manquée.'}{' '}
                <Link to={`/reaction/${question.reaction}`}>
                  {question.explication.nom}
                </Link>
              </p>

              {/* La raison, et non le seul verdict : c'est là qu'on
                  apprend. Bornée à l'amorce de la fiche — le cours entier
                  enterrait le bouton suivant. */}
              {question.explication.pourquoi && (
                <BlocTexte texte={question.explication.pourquoi} />
              )}

              <button
                type="button"
                className="bouton-primaire"
                onClick={() => setRang(rang + 1)}
              >
                {rang + 1 < questions.length ? 'Question suivante' : 'Voir le bilan'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bloc">
          <p>Pas assez de réactions dans cette famille pour un quiz.</p>
        </div>
      )}
    </section>
  )
}
