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
  const familles = useMemo(famillesJouables, [])

  // La série ne se recalcule qu'au changement de graine ou de famille :
  // sans ce useMemo, chaque clic rebattrait les questions.
  const questions = useMemo(
    () => serie({ graine, combien: COMBIEN, famille }),
    [graine, famille]
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
  }

  const choisir = (choix) => {
    if (repondu) return
    const suite = [...reponses]
    suite[rang] = choix
    setReponses(suite)
  }

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">S'entraîner</p>
        <h1>Quiz</h1>
        <p className="accroche">
          Les questions sont <strong>engendrées à partir des fiches</strong>,
          jamais écrites à la main : {vivier().length} réactions en
          fournissent. Les mauvaises réponses sont prises dans la même
          famille en priorité — assez proches pour qu'il faille savoir.
        </p>
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
