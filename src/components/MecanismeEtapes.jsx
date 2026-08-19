// Le mécanisme : chaque étape décrite en mots, et — quand elle existe —
// son schéma avec les flèches courbes.
//
// Les schémas sont dessinés à la construction (scripts/dessiner-mecanismes.mjs).
// Une étape peut n'avoir que du texte : toutes ne se dessinent pas
// (un état de transition, par exemple, ne se représente pas honnêtement
// avec des liaisons entières).
import dessins from '../data/mecanismes-dessins.json'

export default function MecanismeEtapes({ id, etapes }) {
  const schemas = dessins[id] || {}

  // On parcourt les étapes décrites, plus les schémas complémentaires
  // (bilan, produits formés) numérotés au-delà de la dernière étape.
  const numeros = [...new Set([
    ...etapes.map((_, i) => i + 1),
    ...Object.keys(schemas).map(Number)
  ])].sort((a, b) => a - b)

  return (
    <section className="bloc bloc-mecanisme">
      <h3>Le mécanisme, pas à pas</h3>

      <p className="note note-fleches">
        Les flèches rouges suivent les électrons. Ce qu'elles quittent est
        marqué en <span className="marque-depart">bleu</span>, ce qu'elles
        atteignent en <span className="marque-arrivee">rose</span> : la cible
        n'est jamais à deviner.
      </p>

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
                        alt={`Schéma du mécanisme : ${schema.titre}`}
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
                      {schema.legende}
                      {!schema.valide && (
                        <span className="badge-a-verifier badge-schema">
                          Schéma à valider
                        </span>
                      )}
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
