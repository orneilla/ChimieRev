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
          ajoutées selon la même méthode que les autres : vérification de
          chaque DOI par au moins deux sources indépendantes.
        </p>
      </section>
    )
  }

  // Les clés d'ouvrages ("clayden", "march"…) renvoient à la liste commune.
  const ouvrages = (bloc?.ouvrages || []).map((cle) => ouvrages_de_reference[cle])
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
                <p className="reference-citation">{ouvrage}</p>
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
