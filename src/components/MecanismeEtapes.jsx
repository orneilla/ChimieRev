// Le mécanisme : chaque étape décrite en mots, et — quand elle existe —
// son schéma avec les flèches courbes.
//
// Les schémas sont dessinés à la construction (scripts/dessiner-mecanismes.mjs).
// Une étape peut n'avoir que du texte : toutes ne se dessinent pas
// (un état de transition, par exemple, ne se représente pas honnêtement
// avec des liaisons entières).
import dessins from '../data/mecanismes-dessins.json'
import BlocTexte from './BlocTexte.jsx'

export default function MecanismeEtapes({ id, etapes }) {
  const schemas = dessins[id] || {}

  // Une flèche à demi-pointe ne veut pas dire la même chose qu'une flèche
  // ordinaire. On ne l'explique que là où il y en a : sur une fiche ionique,
  // la précision n'aurait aucun sens.
  const avecHamecons = Object.values(schemas).some((s) => s.hamecons)

  // Onze mécanismes n'ont AUCUNE flèche, et c'est délibéré. Deux raisons se
  // rencontrent : autour d'un métal de transition les étapes sont concertées
  // et l'ouvrage lui-même ne les dessine pas autrement (couplages, cycle du
  // palladium) ; ailleurs, l'ouvrage ne donne tout simplement pas le détail
  // (Clemmensen, hydrogénations, Luche). Annoncer des flèches rouges là où il
  // n'y en a pas promettrait ce que la fiche ne donne pas, et laisserait
  // croire à un oubli. On dit donc ce qu'il en est.
  const avecFleches = Object.values(schemas).some((s) => (s.fleches || []).length > 0)

  // On parcourt les étapes décrites, plus les schémas complémentaires
  // (bilan, produits formés) numérotés au-delà de la dernière étape.
  const numeros = [...new Set([
    ...etapes.map((_, i) => i + 1),
    ...Object.keys(schemas).map(Number)
  ])].sort((a, b) => a - b)

  return (
    <section className="bloc bloc-mecanisme">
      <h3>Le mécanisme, pas à pas</h3>

      {avecFleches ? (
        <p className="note note-fleches">
          Les flèches rouges suivent les électrons. Ce qu'elles quittent est
          marqué en <span className="marque-depart">bleu</span>, ce qu'elles
          atteignent en <span className="marque-arrivee">rose</span> : la cible
          n'est jamais à deviner.
        </p>
      ) : (
        <p className="note note-sans-fleches">
          <strong>Ce mécanisme se lit sans flèches courbes</strong>, et ce n'est
          pas un oubli. Ou bien les étapes en jeu sont <strong>concertées</strong> —
          tout y bouge en même temps, et une flèche laisserait croire à une
          séquence — ou bien l'ouvrage d'où vient la fiche ne les détaille pas.
          Dans les deux cas, <strong>on ne dessine pas ce qu'on n'a pas lu</strong> :
          chaque schéma montre l'<strong>état</strong> du système, et la légende
          de l'étape dit ce qui s'y passe et pourquoi.
        </p>
      )}

      {avecHamecons && (
        <p className="note note-fleches">
          Ici les flèches portent une <strong>demi-pointe</strong> : on les
          appelle des <strong>hameçons</strong>, et chacune ne déplace
          qu'<strong>un seul</strong> électron, non un doublet. Une liaison en
          valant deux, il en faut donc deux, appariés, pour la rompre ou pour
          la former — comptez-les.
        </p>
      )}

      {avecFleches && (
        <p className="note">
          Chaque jeu de flèches est <strong>appliqué par la machine</strong> avant
          publication : s'il ne mène pas au produit annoncé, ou s'il ne conserve
          pas la charge, le schéma n'est pas publié.
        </p>
      )}

      <ol className="liste-etapes">
        {numeros.map((numero) => {
          const texte = etapes[numero - 1]
          const schema = schemas[numero]

          return (
            <li key={numero}>
              <span className="numero-etape" aria-hidden="true">{numero}</span>

              <div className="etape-corps">
                <p className="etape-texte">{texte || schema.titre}</p>

                {schema && (
                  <figure className="schema-etape">
                    <div className="structure-plaque">
                      <img
                        src={`${import.meta.env.BASE_URL}mecanismes/${schema.fichier}`}
                        alt={`Schéma du mécanisme : ${schema.titre}`}
                        loading="lazy"
                      />
                    </div>

                    {/* Ce que fait chaque flèche, en face de son numéro. */}
                    {schema.fleches?.some(Boolean) && (
                      <ol className="legende-fleches">
                        {schema.fleches.map((libelle, i) => (
                          <li key={i}>
                            <span className="puce-fleche">{i + 1}</span>
                            <span>{libelle}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    <figcaption>
                      <BlocTexte texte={schema.legende} />

                      <span className="etats-schema">
                        {schema.coherenceVerifiee && (
                          <span
                            className="badge-verifie badge-schema"
                            title="Les flèches ont été appliquées par la machine : elles mènent bien au produit annoncé, et la charge est conservée."
                          >
                            Flèches vérifiées
                          </span>
                        )}
                        {!schema.valide && (
                          <span
                            className="badge-a-verifier badge-schema"
                            title="La machine contrôle la cohérence des flèches, pas le choix du mécanisme : cela reste à relire par un chimiste."
                          >
                            À relire par un chimiste
                          </span>
                        )}
                      </span>
                    </figcaption>
                  </figure>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
