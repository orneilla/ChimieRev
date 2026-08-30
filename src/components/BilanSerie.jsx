// Le récapitulatif d'une série de questions : ce qu'on a su, ce qui
// revient, et quand.
//
// Partagé par le quiz libre et la révision du jour. Ce qui compte ici
// n'est pas le score — c'est la troisième colonne : dire À QUELLE
// ÉCHÉANCE chaque réaction reviendra rend la répétition espacée visible,
// au lieu de la laisser travailler en silence.
import { Link } from 'react-router-dom'
import { DELAIS } from '../memorisation.js'

const NB = ' '

export default function BilanSerie({ questions, reponses, etat }) {
  const justes = reponses.filter((r) => r?.correct).length
  const manquees = questions.filter((_, i) => !reponses[i]?.correct)

  return (
    <>
      <p className="chiffre-cle">
        <strong>{justes}</strong> bonne{justes > 1 ? 's' : ''} réponse
        {justes > 1 ? 's' : ''} sur {questions.length}
      </p>

      <ul className="quiz-recapitulatif">
        {questions.map((q, i) => {
          const fiche = etat[q.reaction]
          return (
            <li key={q.reaction}>
              <span className={`etat ${reponses[i]?.correct ? 'etat-relue' : 'etat-absente'}`}>
                {reponses[i]?.correct ? 'juste' : 'manquée'}
              </span>
              <Link to={`/reaction/${q.reaction}`}>{q.explication.nom}</Link>
              {fiche && (
                <span className="quiz-echeance">
                  {fiche.boite === 0
                    ? 'à revoir'
                    : `revient dans ${DELAIS[fiche.boite]}${NB}j`}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {manquees.length > 0 && (
        <p className="note">
          {manquees.length === 1
            ? 'Une réaction est à revoir : elle reviendra dès la prochaine séance.'
            : `${manquees.length} réactions sont à revoir : elles reviendront dès la prochaine séance.`}
        </p>
      )}
    </>
  )
}
