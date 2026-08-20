// Bloc « D'où vient ce savoir ? » : les sources de la fiche.
//
// RÈGLE ABSOLUE, reprise du fichier de références : aucun DOI n'est écrit
// de mémoire. Un DOI n'est affiché comme lien que s'il est marqué
// "verifie": true dans les données. Sinon, la référence est affichée
// telle quelle, avec la mention « DOI à vérifier » — jamais de lien inventé.
import references from '../data/references.json'

const { ouvrages_de_reference, references_par_reaction } = references

// Une entrée d'article : citation + état de vérification du DOI.
function Article({ article }) {
  const doiVerifie = article.verifie && article.doi

  return (
    <li className="reference">
      <p className="reference-citation">{article.citation}</p>

      {doiVerifie ? (
        <p className="reference-ligne">
          <span className="badge-verifie">DOI vérifié</span>
          <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer">
            {article.doi}
          </a>
        </p>
      ) : (
        <p className="reference-ligne">
          <span className="badge-a-verifier">DOI à vérifier</span>
        </p>
      )}

      {article.note && <p className="reference-note">{article.note}</p>}
    </li>
  )
}

export default function ReferencesReaction({ id, famille }) {
  const bloc = references_par_reaction[id]

  // Les règles de Woodward-Hoffmann sont le cadre théorique commun à
  // toutes les réactions péricycliques : on les rattache à ces fiches.
  const cadre =
    famille === 'Péricycliques'
      ? references_par_reaction.woodward_hoffmann_pericycliques
      : null

  if (!bloc && !cadre) {
    return (
      <section className="bloc bloc-references">
        <h3>D'où vient ce savoir ?</h3>
        <p className="note">
          Les références de cette réaction restent à établir. Elles seront
          ajoutées selon la même méthode que les autres : vérification de
          chaque DOI par au moins deux sources indépendantes.
        </p>
      </section>
    )
  }

  // Un ouvrage se cite de deux façons, l'une et l'autre acceptées :
  //   "clayden"                                   — l'ouvrage entier
  //   { ouvrage: "clayden", chapitre: "15", pages: "328–341" }
  // La seconde est celle qu'on vise : une référence sans page laisse le
  // lecteur chercher dans mille pages.
  const ouvrages = (bloc?.ouvrages || []).map((entree) => {
    if (typeof entree === 'string') {
      return { citation: ouvrages_de_reference[entree], precision: null }
    }

    const precisions = [
      entree.chapitre && `chapitre ${entree.chapitre}`,
      entree.pages && `p. ${entree.pages}`
    ].filter(Boolean)

    return {
      citation: ouvrages_de_reference[entree.ouvrage] || entree.ouvrage,
      precision: precisions.join(', ') || null,
      note: entree.note
    }
  })
  const articles = [
    ...(bloc?.articles_historiques || []),
    ...(bloc?.revues_modernes || [])
  ]

  return (
    <section className="bloc bloc-references">
      <h3>D'où vient ce savoir ?</h3>

      {ouvrages.length > 0 && (
        <>
          <h4 className="sous-titre">Ouvrages de référence</h4>
          <ul className="liste-references">
            {ouvrages.map((ouvrage, i) => (
              <li key={i} className="reference">
                <p className="reference-citation">
                  {ouvrage.citation}
                  {ouvrage.precision && (
                    <span className="reference-precision"> — {ouvrage.precision}</span>
                  )}
                </p>
                {ouvrage.note && <p className="reference-note">{ouvrage.note}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      {articles.length > 0 && (
        <>
          <h4 className="sous-titre">Articles</h4>
          <ul className="liste-references">
            {articles.map((article, i) => (
              <Article key={i} article={article} />
            ))}
          </ul>
        </>
      )}

      {cadre && (
        <>
          <h4 className="sous-titre">Cadre théorique</h4>
          <p className="note">{cadre._note}</p>
          <ul className="liste-references">
            {cadre.articles_historiques.map((article, i) => (
              <Article key={i} article={article} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
