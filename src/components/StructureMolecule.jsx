// Affiche la structure 2D d'une molécule.
//
// Les dessins sont produits par RDKit-JS au moment de la construction
// (scripts/dessiner-structures.mjs) : ici, on ne fait qu'afficher l'image
// correspondante. Si une molécule n'a pas pu être dessinée, on retombe
// proprement sur sa formule SMILES plutôt que d'afficher une image cassée.
import structures from '../data/structures.json'

export default function StructureMolecule({ id, role, smiles, legende }) {
  const fichier = structures[id]?.[role]

  return (
    <figure className="structure">
      <div className="structure-plaque">
        {fichier ? (
          <img
            src={`${import.meta.env.BASE_URL}structures/${fichier}`}
            alt={`Structure développée : ${legende}`}
            width="300"
            height="180"
            loading="lazy"
          />
        ) : (
          <code className="structure-repli">{smiles}</code>
        )}
      </div>

      <figcaption>
        <span className="structure-role">{legende}</span>
        <code>{smiles}</code>
      </figcaption>
    </figure>
  )
}
