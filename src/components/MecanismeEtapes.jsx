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
        Les flèches rouges suivent les électrons : elles partent de là où
        ils se trouvent (un doublet, une liaison) et pointent là où ils vont.
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
                    <figcaption>{schema.legende}</figcaption>
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
