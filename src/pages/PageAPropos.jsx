// Page « À propos » : rappelle la philosophie du projet et l'état d'avancement.
export default function PageAPropos() {
  return (
    <section className="fiche">
      <h1>À propos de ChimieRév</h1>

      <section className="bloc bloc-comprendre">
        <h3>Le principe</h3>
        <p>
          Comprendre pour mémoriser, jamais mémoriser bêtement. Chaque fiche
          répond d'abord à « pourquoi ça se passe ainsi ? », avant de montrer
          comment. Le mécanisme découle toujours d'une raison physique
          intuitive, jamais d'un décret à retenir.
        </p>
        <p>
          Quand la raison est bien comprise, la réaction devient évidente,
          donc inoubliable : la mémorisation est la <em>conséquence</em> de la
          compréhension, pas le point de départ.
        </p>
      </section>

      <section className="bloc">
        <h3>Où en est l'application</h3>
        <ul className="liste-phases">
          <li className="fait">
            <strong>Phase 1 — Socle</strong> : données structurées, liste et
            fiches détaillées, navigation mobile.
          </li>
          <li>
            <strong>Phase 2 — Structures 2D</strong> : dessin des molécules à
            partir des SMILES (RDKit-JS).
          </li>
          <li>
            <strong>Phase 3 — 3D interactive</strong> : rotation, zoom tactile
            et orbitales (3Dmol.js).
          </li>
          <li>
            <strong>Phase 4 — Révision</strong> : flashcards et quiz avec
            progression enregistrée.
          </li>
          <li>
            <strong>Phase 5 — Deux modes</strong> : bascule Référence /
            Comprendre sur chaque fiche.
          </li>
          <li>
            <strong>Phase 6 — Contenu</strong> : toutes les familles de
            réactions.
          </li>
        </ul>
      </section>
    </section>
  )
}
