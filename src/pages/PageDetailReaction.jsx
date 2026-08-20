// Fiche complète d'une réaction.
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import reactions from '../data/reactions.json'
import BlocTexte from '../components/BlocTexte.jsx'
import StructureMolecule from '../components/StructureMolecule.jsx'
import MecanismeEtapes from '../components/MecanismeEtapes.jsx'
import BasculeMode from '../components/BasculeMode.jsx'
import ReferencesReaction from '../components/ReferencesReaction.jsx'
import { couleurFamille } from '../couleurs.js'
import { useModeLecture } from '../mode.js'
import { reactifDeLaLigne, solvantDeLaLigne } from '../liens.js'

// Une ligne de conditions. Si le produit qu'elle nomme a sa fiche, on
// peut la toucher pour aller voir à quoi il sert et pourquoi il marche.
function Condition({ texte, trouver }) {
  const outil = trouver(texte)
  if (!outil) return texte

  return (
    <Link to={`/${outil.genre}/${outil.id}`} className="lien-condition">
      {texte}
      <span className="lecture-seule-ecran">
        {' '}— voir la fiche {/[AEIOUYÀÂÉÈÊÎÔÛ]/.test(outil.nom[0]) ? "d'" : 'de '}{outil.nom}
      </span>
    </Link>
  )
}

export default function PageDetailReaction() {
  const { id } = useParams()
  const reaction = reactions.find((r) => r.id === id)

  // Mode de lecture, partagé avec le reste de l'application.
  const [mode, setMode] = useModeLecture()

  // On remonte en haut quand on ouvre une autre fiche.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (!reaction) {
    return (
      <section>
        <p className="message-vide">Cette réaction n'existe pas (encore).</p>
        <Link to="/" className="lien-retour">← Retour à la liste</Link>
      </section>
    )
  }

  const couleur = couleurFamille(reaction.famille)

  return (
    <article className="fiche" style={{ '--couleur': couleur }}>
      <Link to="/" className="lien-retour">← Toutes les réactions</Link>

      {/* Bandeau coloré : la couleur de la famille, comme sur la tuile. */}
      <header className="bandeau">
        <p className="bandeau-famille">{reaction.famille}</p>
        <p className="bandeau-symbole">{reaction.symbole || reaction.id}</p>
        <h1 className="bandeau-titre">{reaction.nom}</h1>
        <p className="bandeau-difficulte">
          Difficulté <strong>{reaction.niveau_difficulte}</strong>
          <span className="sur-dix">/10</span>
        </p>
      </header>

      {/* Le bilan : ce qu'on met d'un côté, ce qu'on obtient de l'autre.
          Le détail du trajet des électrons est plus bas, dans le mécanisme. */}
      <section className="bloc schema">
        <h3>Bilan de la réaction</h3>

        <div className="schema-ligne">
          <StructureMolecule
            id={reaction.id}
            role="substrat"
            smiles={reaction.substrat_SMILES}
            legende="Substrat"
          />

          {/* Au-dessus de la flèche, ce qu'on AJOUTE ; en dessous, ce
              DANS QUOI ça se passe. Sans ces deux mots, on lit deux
              lignes de texte autour d'une flèche sans savoir laquelle
              dit quoi. */}
          <div className="fleche-bloc">
            <div className="conditions">
              <span className="conditions-etiquette">On ajoute</span>
              <ul className="conditions-liste">
                {reaction.reactifs.map((texte) => (
                  <li key={texte}><Condition texte={texte} trouver={reactifDeLaLigne} /></li>
                ))}
              </ul>
            </div>

            <span className="fleche-trait" aria-hidden="true">⟶</span>

            <div className="conditions">
              <span className="conditions-etiquette">Milieu</span>
              <p className="conditions-valeur">
                <Condition texte={reaction.solvant} trouver={solvantDeLaLigne} />
              </p>
            </div>
          </div>

          <StructureMolecule
            id={reaction.id}
            role="produit"
            smiles={reaction.produit_SMILES}
            legende="Produit"
          />
        </div>
      </section>

      {/* Le cœur de la fiche : la même chose expliquée de deux façons. */}
      <section className="bloc bloc-explication">
        <BasculeMode mode={mode} onChange={setMode} />
        <div className="texte-explication">
          <BlocTexte
            texte={
              mode === 'comprendre'
                ? reaction.explication_comprendre
                : reaction.explication_reference
            }
          />
        </div>
      </section>

      <MecanismeEtapes id={reaction.id} etapes={reaction.mecanisme_etapes} />

      <section className="bloc">
        <h3>Sélectivité</h3>
        <BlocTexte texte={reaction.selectivite} />
      </section>

      <section className="bloc bloc-pieges">
        <h3>Pièges classiques</h3>
        <ul className="liste-pieges">
          {reaction.pieges.map((piege, index) => (
            <li key={index}>{piege}</li>
          ))}
        </ul>
      </section>

      <ReferencesReaction id={reaction.id} famille={reaction.famille} />

      <Link to="/" className="lien-retour bas">← Toutes les réactions</Link>
    </article>
  )
}
