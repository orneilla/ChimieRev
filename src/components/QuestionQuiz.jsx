// Une question de quiz, posée et corrigée.
//
// Extrait de la page « Quiz » pour que la « Révision du jour » l'emploie
// telle quelle : deux pages qui posent la même question doivent la poser
// de la même façon, et une correction améliorée d'un côté doit l'être des
// deux. Ce composant ne décide RIEN — ni quelles questions, ni dans quel
// ordre : il reçoit une question et rend son affichage.
//
// Deux partis pris, et ils tiennent au sujet :
//
// — ON NE DIT JAMAIS « FAUX » TOUT SEUL. Un quiz qui compte les points
//   sans expliquer entraîne à deviner. À chaque réponse, la bonne molécule
//   est marquée, la réaction nommée, et la règle rappelée — c'est-à-dire
//   la RAISON pour laquelle c'est ce produit-là.
// — ON NE REVIENT PAS SUR UNE RÉPONSE. Sans cela on clique jusqu'à tomber
//   juste, et le score ne veut plus rien dire.
import { Link } from 'react-router-dom'
import { couleurFamille } from '../couleurs.js'
import BlocTexte from './BlocTexte.jsx'

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
        <span className="choix-lettre" aria-hidden="true">{'ABCD'[rang]}</span>
        <img
          src={`${import.meta.env.BASE_URL}structures/${choix.fichier}`}
          alt={`Proposition ${'ABCD'[rang]}`}
          loading="lazy"
        />
      </button>
    </li>
  )
}

export default function QuestionQuiz({
  question, repondu, onChoisir, onSuivant, libelleSuivant, entete
}) {
  return (
    <div
      className="bloc quiz-question"
      style={{ '--couleur': couleurFamille(question.explication.famille) }}
    >
      {entete}

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
                  préposition s'y heurtait. Un intitulé règle le cas quelle
                  que soit la forme du champ. */}
              <span className="quiz-etiquette">solvant</span>
              {question.solvant}
            </p>
          )}
        </div>
      </div>

      <ul className="quiz-choix">
        {question.choix.map((c, i) => (
          <Choix key={c.id} choix={c} rang={i} repondu={repondu} onChoisir={onChoisir} />
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

          {/* La raison, et non le seul verdict : c'est là qu'on apprend.
              Bornée à l'amorce de la fiche — le cours entier enterrait le
              bouton suivant. */}
          {question.explication.pourquoi && (
            <BlocTexte texte={question.explication.pourquoi} />
          )}

          <button type="button" className="bouton-primaire" onClick={onSuivant}>
            {libelleSuivant}
          </button>
        </div>
      )}
    </div>
  )
}
