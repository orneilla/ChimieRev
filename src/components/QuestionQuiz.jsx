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

/** L'état d'un choix après la réponse : bon, donné-et-faux, ou éteint. */
function etatDuChoix(choix, repondu) {
  if (!repondu) return ''
  if (choix.correct) return ' choix-bon'
  return repondu === choix ? ' choix-mauvais' : ' choix-eteint'
}

function Choix({ choix, rang, repondu, onChoisir }) {
  // Une fois répondu, on marque la bonne réponse ET celle qu'on a donnée :
  // voir seulement « faux » n'apprend rien.
  const etat = etatDuChoix(choix, repondu)
  // Un choix se montre en molécule DESSINÉE ou en texte, selon le type de
  // question. Le texte peut être une liste — les réactifs en sont une.
  const texte = choix.texte

  return (
    <li>
      <button
        type="button"
        className={`choix${texte ? ' choix-texte' : ''}${etat}`}
        disabled={Boolean(repondu)}
        onClick={() => onChoisir(choix)}
      >
        <span className="choix-lettre" aria-hidden="true">{'ABCD'[rang]}</span>
        {texte ? (
          texte.length === 1
            ? <span className="choix-corps">{texte[0]}</span>
            : <ul className="choix-corps">{texte.map((t) => <li key={t}>{t}</li>)}</ul>
        ) : (
          <img
            src={`${import.meta.env.BASE_URL}structures/${choix.fichier}`}
            alt={`Proposition ${'ABCD'[rang]}`}
            loading="lazy"
          />
        )}
      </button>
    </li>
  )
}

/**
 * L'énoncé : le substrat, et selon le type ce qu'on donne en plus.
 *
 * — « quel produit ? » montre le substrat et les conditions ;
 * — « quel réactif ? » et « quel solvant ? » montrent substrat ET produit,
 *   puisque la transformation est connue et que c'est le moyen qui manque ;
 * — « quel piège ? » montre la transformation entière.
 */
function Enonce({ question }) {
  const { substrat, produit, reactifs, solvant } = question
  return (
    <div className="quiz-enonce">
      <figure className="structure-plaque">
        <img
          src={`${import.meta.env.BASE_URL}structures/${substrat}`}
          alt="Substrat de la transformation"
        />
        <figcaption>substrat</figcaption>
      </figure>

      <div className="quiz-conditions">
        <p className="quiz-fleche" aria-hidden="true">→</p>
        {reactifs?.length > 0 && (
          <ul>{reactifs.map((r) => <li key={r}>{r}</li>)}</ul>
        )}
        {solvant && (
          <p className="quiz-solvant">
            {/* Pas de « dans » en préfixe : le champ `solvant` est parfois
                une phrase entière avec sa majuscule (« Solvant non
                polaire, tétrachlorométhane… »), et la préposition s'y
                heurtait. Un intitulé règle le cas quelle que soit la
                forme du champ. */}
            <span className="quiz-etiquette">solvant</span>
            {solvant}
          </p>
        )}
        {!reactifs?.length && !solvant && (
          <p className="quiz-inconnu" aria-hidden="true">?</p>
        )}
      </div>

      {produit && (
        <figure className="structure-plaque">
          <img
            src={`${import.meta.env.BASE_URL}structures/${produit}`}
            alt="Produit de la transformation"
          />
          <figcaption>produit</figcaption>
        </figure>
      )}
    </div>
  )
}

/**
 * « Remettez les étapes dans l'ordre » — la seule question qui ne soit
 * pas un QCM.
 *
 * ON CLIQUE LES ÉTAPES DANS L'ORDRE plutôt que de les faire glisser : le
 * glisser-déposer demande une bibliothèque, ne se fait pas au clavier, et
 * se rate constamment sur un écran tactile où le doigt masque ce qu'il
 * déplace. Un clic numérote, un second clic sur la dernière posée la
 * reprend.
 */
function Ordre({ question, choisies, onChoisir, onRetirer, repondu }) {
  const rangDe = (etape) => choisies.indexOf(etape)

  // UNE FOIS RÉPONDU, LA LISTE SE REMET DANS LE BON ORDRE.
  //
  // Laissée mélangée avec les bons numéros écrits à côté, elle obligeait à
  // reconstituer la suite de tête — or c'est précisément la suite qu'il
  // faut retenir. Rangée, elle se lit comme le mécanisme, et la couleur
  // dit au passage lesquelles on avait bien placées.
  const affichees = repondu ? question.ordreAttendu : question.propositions

  return (
    <ol className="quiz-ordre">
      {affichees.map((etape) => {
        const rang = rangDe(etape)
        const place = rang >= 0
        // Après la réponse, on montre où l'étape aurait dû aller.
        const attendu = question.ordreAttendu.indexOf(etape)
        const juste = repondu && rang === attendu
        const etat = !repondu ? (place ? ' etape-placee' : '')
          : juste ? ' etape-juste' : ' etape-fausse'

        return (
          <li key={etape}>
            <button
              type="button"
              className={`etape-choix${etat}`}
              disabled={Boolean(repondu)}
              onClick={() => (place ? onRetirer(etape) : onChoisir(etape))}
            >
              <span className="etape-rang" aria-hidden="true">
                {repondu ? attendu + 1 : (place ? rang + 1 : '·')}
              </span>
              <span className="etape-texte">{etape}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default function QuestionQuiz({
  question, repondu, onChoisir, onSuivant, libelleSuivant, entete,
  // Le type « ordre » n'est pas un QCM : la page tient la suite d'étapes
  // choisies et les deux gestes qui la modifient.
  choisies = [], onPlacer, onRetirer, onValider
}) {
  const enOrdre = question.format === 'ordre'
  const complet = enOrdre && choisies.length === question.propositions.length

  return (
    <div
      className="bloc quiz-question"
      style={{ '--couleur': couleurFamille(question.explication.famille) }}
    >
      {entete}

      <h2>{question.intitule}</h2>

      <Enonce question={question} />

      {enOrdre ? (
        <>
          <Ordre
            question={question}
            choisies={choisies}
            onChoisir={onPlacer}
            onRetirer={onRetirer}
            repondu={repondu}
          />
          {!repondu && (
            <>
              <p className="note">
                Touchez les étapes dans l'ordre où elles se produisent. Un
                second appui sur une étape déjà placée la reprend.
              </p>
              <button
                type="button"
                className="bouton-primaire"
                disabled={!complet}
                onClick={onValider}
              >
                {complet
                  ? 'Valider'
                  : `Encore ${question.propositions.length - choisies.length} étape${
                      question.propositions.length - choisies.length > 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </>
      ) : (
        <ul className="quiz-choix">
          {question.choix.map((c, i) => (
            <Choix key={c.id} choix={c} rang={i} repondu={repondu} onChoisir={onChoisir} />
          ))}
        </ul>
      )}

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
