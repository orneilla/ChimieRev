// La révision du jour : un paquet court, une fois par jour.
//
// CE QUE CETTE PAGE CHERCHE À OBTENIR n'est pas un score, c'est une
// HABITUDE. D'où trois partis pris qui la séparent du quiz libre :
//
// — LE PAQUET EST BORNÉ, de cinq à dix réactions. Court, il se fait ; long,
//   il se remet à demain. Le plafond protège surtout les retours après une
//   absence : au bout d'une semaine sans réviser, quarante réactions sont
//   échues, et les proposer toutes d'un coup ferait abandonner.
// — LE PAQUET EST FIGÉ POUR LA JOURNÉE. Sa graine vient du jour civil, non
//   de l'instant : rouvrir l'application à midi rend exactement le paquet
//   du matin, et l'on reprend là où l'on s'était arrêté plutôt que de
//   recommencer sans le savoir.
// — LA SÉRIE DE JOURS EST MONTRÉE. C'est le seul ressort d'assiduité de
//   l'application ; il ne coûte rien et il porte tout le dispositif.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paquetDuJour, PAQUET_MAXIMUM, ordreEstJuste } from '../quiz.js'
import QuestionQuiz from '../components/QuestionQuiz.jsx'
import BilanSerie from '../components/BilanSerie.jsx'
import {
  lire, enregistrer, lireJournal, noterLeJour, serieDeJours, jourCivil
} from '../memorisation.js'

const NB = ' '

/** « lundi 30 août », pour que la page dise de quel jour elle parle. */
function enToutesLettres(jour) {
  const [a, m, j] = jour.split('-').map(Number)
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

function Serie({ jours }) {
  if (jours === 0) return null
  return (
    <p className="serie-jours">
      <span className="serie-flamme" aria-hidden="true">●</span>
      <strong>{jours}</strong> jour{jours > 1 ? 's' : ''} d'affilée
    </p>
  )
}

export default function PageRevisionDuJour() {
  const [etat, setEtat] = useState(lire)
  const [journal, setJournal] = useState(lireJournal)
  const [rang, setRang] = useState(0)
  const [reponses, setReponses] = useState([])
  // Le type « ordre » n'est pas un QCM : la suite d'étapes en cours de
  // composition vit ici, et se vide à chaque changement de question.
  const [choisies, setChoisies] = useState([])
  const placer = (etape) => setChoisies((s) => (s.includes(etape) ? s : [...s, etape]))
  const retirer = (etape) => setChoisies((s) => s.filter((e) => e !== etape))

  const [commence, setCommence] = useState(false)

  // L'instant est figé pour toute la séance : sans cela une réaction
  // répondue en début de paquet deviendrait « pas encore échue » au
  // milieu, et le paquet se réarrangerait sous les doigts.
  const [debut] = useState(() => Date.now())
  const jour = jourCivil(debut)

  // L'état de mémorisation n'est PAS dans les dépendances : il change à
  // chaque réponse, ce qui remplacerait les questions en cours.
  const paquet = useMemo(
    () => paquetDuJour({ etat, maintenant: debut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debut]
  )

  const dejaFait = journal.jours[jour]
  const serie = serieDeJours(journal, jour)
  const question = paquet.questions[rang]
  const repondu = reponses[rang] || null
  const fini = commence && rang >= paquet.questions.length
  const justes = reponses.filter((r) => r?.correct).length

  /**
   * Valider une suite d'étapes.
   *
   * On fabrique une « réponse » de la même forme que celle d'un QCM —
   * un objet portant `correct` — pour que le reste de la page, le
   * récapitulatif et la mémorisation n'aient pas à connaître le type de
   * question qui vient d'être posée.
   */
  const validerOrdre = () => {
    if (repondu) return
    const juste = ordreEstJuste(question, choisies)
    const suite = [...reponses]
    suite[rang] = { correct: juste, ordre: choisies }
    setReponses(suite)
    setEtat(enregistrer(etat, question.reaction, juste, Date.now()))
  }

  const choisir = (choix) => {
    if (repondu) return
    const suite = [...reponses]
    suite[rang] = choix
    setReponses(suite)
    // Écrit tout de suite : une séance interrompue ne doit pas être perdue.
    setEtat(enregistrer(etat, question.reaction, Boolean(choix.correct), Date.now()))
  }

  const avancer = () => {
    const suivant = rang + 1
    setRang(suivant)
    setChoisies([])
    // Le jour n'est noté qu'une fois le paquet ACHEVÉ : commencer ne
    // suffit pas, sinon la série récompenserait le fait d'ouvrir la page.
    if (suivant >= paquet.questions.length) {
      setJournal(noterLeJour(journal, jour, {
        posees: paquet.questions.length,
        justes: reponses.filter((r) => r?.correct).length
      }))
    }
  }

  // ————— Rien à faire aujourd'hui —————
  if (paquet.questions.length === 0) {
    return (
      <section>
        <div className="intro">
          <p className="sur-titre">{enToutesLettres(jour)}</p>
          <h1>Révision du jour</h1>
        </div>
        <div className="bloc">
          <p className="chiffre-cle">Rien à revoir aujourd'hui.</p>
          <p>
            Aucune réaction n'est échue et vous avez rencontré tout ce que
            l'application propose. Revenez demain{NB}: les échéances les plus
            proches vous attendent.
          </p>
          <Serie jours={serie} />
          <Link className="bouton-primaire" to="/quiz">Faire un quiz libre</Link>
        </div>
      </section>
    )
  }

  // ————— Le paquet est terminé —————
  if (fini) {
    return (
      <section>
        <div className="intro">
          <p className="sur-titre">{enToutesLettres(jour)}</p>
          <h1>C'est fait.</h1>
        </div>

        <div className="bloc quiz-bilan">
          <BilanSerie questions={paquet.questions} reponses={reponses} etat={etat} />
          <Serie jours={serie} />

          {paquet.duesRestantes > 0 && (
            <p className="note">
              Il reste <strong>{paquet.duesRestantes}</strong> réaction
              {paquet.duesRestantes > 1 ? 's' : ''} échue
              {paquet.duesRestantes > 1 ? 's' : ''} au-delà du paquet du
              jour. Le paquet est plafonné à {PAQUET_MAXIMUM} pour rester
              faisable{NB}; le reste vous sera proposé demain, ou tout de
              suite en quiz libre.
            </p>
          )}

          <Link className="bouton-primaire" to="/quiz">Continuer en quiz libre</Link>
        </div>
      </section>
    )
  }

  // ————— L'écran d'accueil du paquet —————
  if (!commence) {
    return (
      <section>
        <div className="intro">
          <p className="sur-titre">{enToutesLettres(jour)}</p>
          <h1>Révision du jour</h1>
          <p className="accroche">
            Un paquet court, composé pour aujourd'hui{NB}: d'abord ce qui est
            échu, puis une nouveauté ou deux s'il reste de la place. Une
            nouveauté ne prend jamais la place d'une révision.
          </p>
        </div>

        <div className="bloc">
          <p className="chiffre-cle">
            <strong>{paquet.questions.length}</strong> réaction
            {paquet.questions.length > 1 ? 's' : ''}
          </p>

          <ul className="paquet-composition">
            {paquet.dues > 0 && (
              <li>
                <strong>{paquet.dues}</strong> à réviser — leur échéance est passée
              </li>
            )}
            {paquet.neuves > 0 && (
              <li>
                <strong>{paquet.neuves}</strong> jamais rencontrée
                {paquet.neuves > 1 ? 's' : ''}
              </li>
            )}
          </ul>

          <Serie jours={serie} />

          {dejaFait && (
            <p className="note">
              Vous avez déjà terminé le paquet d'aujourd'hui
              ({dejaFait.justes}/{dejaFait.posees}). Le refaire ne comptera
              pas deux fois dans votre série, mais les réponses seront
              enregistrées.
            </p>
          )}

          <button type="button" className="bouton-primaire" onClick={() => setCommence(true)}>
            {dejaFait ? 'Refaire le paquet' : 'Commencer'}
          </button>
        </div>
      </section>
    )
  }

  // ————— Une question du paquet —————
  return (
    <section>
      <div className="intro">
        <p className="sur-titre">{enToutesLettres(jour)}</p>
        <h1>Révision du jour</h1>
      </div>

      <QuestionQuiz
        question={question}
        repondu={repondu}
        onChoisir={choisir}
        onSuivant={avancer}
        libelleSuivant={
          rang + 1 < paquet.questions.length ? 'Question suivante' : 'Terminer'
        }
        choisies={choisies}
        onPlacer={placer}
        onRetirer={retirer}
        onValider={validerOrdre}
        entete={
          <>
            <p className="quiz-progression">
              {rang + 1} sur {paquet.questions.length}
              <span className="quiz-score">{justes} juste{justes > 1 ? 's' : ''}</span>
            </p>
            {/* Une barre de progression, parce qu'un paquet court se fait
                surtout quand on voit qu'il est court. */}
            <span className="jauge paquet-jauge">
              <span
                className="jauge-remplissage"
                style={{ width: `${(rang / paquet.questions.length) * 100}%` }}
              />
            </span>
          </>
        }
      />
    </section>
  )
}
