// Page « À propos » : la philosophie, la méthode de sourçage, l'avancement.
import references from '../data/references.json'

// Les neuf ouvrages effectivement indexés, dans l'ordre où on les emploie.
const ORDRE_OUVRAGES = [
  'clayden', 'mcmurry', 'grossman', 'oc2', 'housecroft',
  'dugas', 'multicomposants', 'carey_sundberg_A', 'roberts_caserio'
]

export default function PageAPropos() {
  return (
    <section className="fiche">
      <div className="intro">
        <p className="sur-titre">ChimieRév</p>
        <h1>À propos</h1>
      </div>

      <section className="bloc bloc-explication">
        <h3>Le principe</h3>
        <p>
          Comprendre pour mémoriser, jamais mémoriser bêtement. Chaque fiche
          répond d'abord à « pourquoi ça se passe ainsi ? » avant de montrer
          comment. Le mécanisme découle toujours d'une raison physique
          intuitive, jamais d'un décret à retenir.
        </p>
        <p>
          Deux lectures du même contenu, au choix sur chaque fiche :
          <strong> Comprendre</strong>, qui ne suppose aucune base en chimie,
          et <strong> Référence</strong>, qui donne la formulation technique
          exacte. Personne n'est laissé de côté, dans un sens comme dans
          l'autre.
        </p>
      </section>

      <section className="bloc bloc-references">
        <h3>Sur les sources</h3>
        <p>
          En science, on n'affirme pas sans pouvoir dire d'où ça vient. Chaque
          fiche indique ses ouvrages de référence et ses articles fondateurs.
        </p>
        <p>
          Un identifiant DOI n'est affiché comme lien que s'il a été
          <strong> vérifié par au moins deux sources indépendantes</strong>.
          Tant qu'il ne l'est pas, la référence porte la mention « DOI à
          vérifier » : mieux vaut un manque assumé qu'un lien inventé.
        </p>
        <p>
          Les explications sont écrites <strong>page ouverte</strong>, jamais de
          mémoire. Voici les ouvrages consultés — chacun est indexé page par
          page, et chaque citation renvoie au numéro imprimé sur la page :
        </p>
        <ul className="liste-ouvrages">
          {ORDRE_OUVRAGES.map((cle) => (
            <li key={cle}>{references.ouvrages_de_reference[cle]}</li>
          ))}
        </ul>
        <p className="note">
          Un ouvrage cité sans être consultable ici porterait la mention « non
          indexé » : on ne cite pas une page qu'on n'a pas ouverte.
        </p>
      </section>

      <section className="bloc">
        <h3>Où en est l'application</h3>
        <ul className="liste-phases">
          <li className="fait"><strong>Phase 1</strong> — Socle : données, liste, fiches, mobile</li>
          <li className="fait"><strong>Identité visuelle</strong> — couleurs par famille, tuiles</li>
          <li className="fait"><strong>Phase 5</strong> — bascule Comprendre / Référence</li>
          <li className="fait"><strong>Références</strong> — sources vérifiées sur chaque fiche</li>
          <li className="fait"><strong>Phase 2</strong> — structures 2D dessinées (RDKit-JS)</li>
          <li className="fait"><strong>Mécanismes</strong> — schémas avec les flèches des électrons</li>
          <li className="fait"><strong>Réactifs &amp; solvants</strong> — leurs fiches et leurs renvois</li>
          <li className="abandonne">
            <strong>Phase 3</strong> — 3D interactive et orbitales :{' '}
            <em>abandonnée</em>. Ce que ces fiches doivent apprendre se lit
            sur un schéma plan et des flèches ; une molécule qu'on fait
            tourner impressionne sans rien démontrer de plus.
          </li>
          <li><strong>Phase 4</strong> — quiz engendré à partir des fiches</li>
          <li><strong>Phase 6</strong> — toutes les familles de réactions</li>
        </ul>
      </section>
    </section>
  )
}
