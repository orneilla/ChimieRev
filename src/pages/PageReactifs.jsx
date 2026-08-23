// Le « magasin » : tous les réactifs et tous les solvants au même endroit.
//
// C'est un INDEX, pas un empilement de fiches : une recherche, puis des
// vignettes. Le détail de chacun vit sur sa propre page — sans quoi, à
// cinquante réactifs, la page ferait quinze écrans de haut et on ne
// retrouverait plus rien.
//
// À quatre-vingt-douze réactifs, l'ordre du fichier — celui où ils ont
// été écrits, réaction après réaction — ne veut plus rien dire pour qui
// cherche : NaBH₄ tombait entre MeI et H₂SO₄. Deux rangements valent
// mieux, et on ne peut pas trancher pour le lecteur :
//
//   • PAR FAMILLE, quand on cherche un OUTIL sans savoir lequel — « il me
//     faut un oxydant doux » — et qu'on veut voir les voisins ;
//   • DE A À Z, quand on sait déjà le nom et qu'on veut juste sa fiche.
//
// Dans les deux cas l'intérieur d'un groupe est alphabétique : c'est le
// seul ordre qu'on n'a pas à apprendre.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import reactifs from '../data/reactifs.json'
import solvants from '../data/solvants.json'
import { reactionsUtilisantReactif, reactionsUtilisantSolvant } from '../liens.js'
import { FAMILLES_REACTIFS, FAMILLES_SOLVANTS } from '../familles-outils.js'

/** Compare sans se soucier des accents ni des majuscules. */
const normalise = (texte) =>
  (texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// La clé de rangement : on ne garde que les LETTRES. Un nom de réactif
// est plein de parenthèses, de chiffres et d'indices — « (EtO)₂P(O)CH₂CO₂Et »
// — et trié tel quel il se range avant le A, sous sa parenthèse ouvrante.
// On le cherche pourtant à E, comme on l'appelle. Les accents tombent
// aussi : « Éthanol » se range à E, pas après le Z.
const cle = (nom) => normalise(nom).replace(/[^a-z]/g, '')

const alphabetique = (a, b) =>
  cle(a.nom).localeCompare(cle(b.nom), 'fr') || a.id.localeCompare(b.id)

/** La lettre sous laquelle un produit se range. */
const initiale = (nom) => (cle(nom)[0] || '#').toUpperCase()

function Vignette({ entree, vers, sousTitre, nombre }) {
  return (
    <Link to={vers} className="vignette-outil">
      <span className="vignette-nom">{entree.nom}</span>
      <span className="vignette-complet">{entree.nom_complet}</span>
      <span className="vignette-role">{sousTitre}</span>
      {nombre > 0 && (
        <span className="vignette-compte">
          {nombre} réaction{nombre > 1 ? 's' : ''}
        </span>
      )}
    </Link>
  )
}

export default function PageReactifs() {
  const [onglet, setOnglet] = useState('reactifs')
  const [rangement, setRangement] = useState('famille')
  const [recherche, setRecherche] = useState('')

  const liste = onglet === 'reactifs' ? reactifs : solvants

  const affichees = useMemo(() => {
    const terme = normalise(recherche.trim())
    if (!terme) return liste

    // On cherche dans tout ce qui identifie le produit : son nom court,
    // son nom complet, sa famille, son rôle, sa formule. Taper « base »,
    // « oxydant » ou « THF » doit fonctionner.
    return liste.filter((e) =>
      [e.nom, e.nom_complet, e.famille, e.role, e.type, e.usage, e.SMILES]
        .filter(Boolean)
        .some((champ) => normalise(champ).includes(terme))
    )
  }, [liste, recherche])

  // Un groupe = un intertitre et ses vignettes. Que le rangement soit
  // par famille ou par lettre, la page se dessine de la même façon.
  const groupes = useMemo(() => {
    const trie = [...affichees].sort(alphabetique)

    if (rangement === 'alphabet') {
      const par = new Map()
      for (const e of trie) {
        const l = initiale(e.nom)
        if (!par.has(l)) par.set(l, [])
        par.get(l).push(e)
      }
      return [...par.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
        .map(([titre, entrees]) => ({ titre, entrees }))
    }

    const familles = onglet === 'reactifs' ? FAMILLES_REACTIFS : FAMILLES_SOLVANTS
    return familles
      .map((titre) => ({ titre, entrees: trie.filter((e) => e.famille === titre) }))
      .filter((g) => g.entrees.length)
  }, [affichees, rangement, onglet])

  const vers = onglet === 'reactifs' ? 'reactif' : 'solvant'

  return (
    <section>
      <div className="intro">
        <p className="sur-titre">Le magasin</p>
        <h1>Réactifs &amp; solvants</h1>
        <p className="accroche">
          Ce qu'on ajoute dans le ballon, et ce dans quoi tout se passe.
          Chaque fiche dit à quoi il sert, pourquoi il marche, et renvoie
          aux réactions où on le rencontre.
        </p>
      </div>

      <div className="bascule" role="group" aria-label="Choisir la catégorie">
        <button
          type="button"
          className={onglet === 'reactifs' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'reactifs'}
          onClick={() => { setOnglet('reactifs'); setRecherche('') }}
          style={{ '--couleur': '#F59120' }}
        >
          <span className="bascule-libelle">Réactifs</span>
          <span className="bascule-aide">{reactifs.length} fiches</span>
        </button>
        <button
          type="button"
          className={onglet === 'solvants' ? 'bascule-bouton actif' : 'bascule-bouton'}
          aria-pressed={onglet === 'solvants'}
          onClick={() => { setOnglet('solvants'); setRecherche('') }}
          style={{ '--couleur': '#00A3D9' }}
        >
          <span className="bascule-libelle">Solvants</span>
          <span className="bascule-aide">{solvants.length} fiches</span>
        </button>
      </div>

      <label className="champ-recherche">
        <span className="lecture-seule-ecran">Rechercher</span>
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={onglet === 'reactifs'
            ? 'Rechercher (nom, rôle : base, oxydant…)'
            : 'Rechercher (nom, type : aprotique…)'}
        />
      </label>

      <div className="rangement" role="group" aria-label="Choisir le rangement">
        <span className="rangement-etiquette">Ranger</span>
        <button
          type="button"
          className={rangement === 'famille' ? 'pastille active' : 'pastille'}
          aria-pressed={rangement === 'famille'}
          onClick={() => setRangement('famille')}
        >
          par famille
        </button>
        <button
          type="button"
          className={rangement === 'alphabet' ? 'pastille active' : 'pastille'}
          aria-pressed={rangement === 'alphabet'}
          onClick={() => setRangement('alphabet')}
        >
          de A à Z
        </button>
      </div>

      {groupes.length === 0 ? (
        <p className="message-vide">Rien ne correspond à cette recherche.</p>
      ) : (
        groupes.map(({ titre, entrees }) => (
          <section key={titre} className="groupe-outils">
            <h2 className="titre-groupe">
              {titre}
              <span className="titre-groupe-compte">{entrees.length}</span>
            </h2>
            <div className="grille-outils">
              {entrees.map((entree) => (
                <Vignette
                  key={entree.id}
                  entree={entree}
                  vers={`/${vers}/${entree.id}`}
                  sousTitre={onglet === 'reactifs' ? entree.role : entree.type}
                  nombre={(onglet === 'reactifs'
                    ? reactionsUtilisantReactif(entree)
                    : reactionsUtilisantSolvant(entree)).length}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  )
}
