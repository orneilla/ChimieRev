// Les familles de réactifs et de solvants, dans l'ordre où on les range.
//
// Cet ordre n'est pas l'alphabet : il va du plus courant au plus
// spécialisé. On rencontre une base au premier chapitre, un ligand chiral
// au dernier — la page du magasin suit ce chemin-là.
//
// La liste sert aussi de garde-fou : `npm run valider` refuse un produit
// dont la famille n'est pas déclarée ici. Sans quoi une faute de frappe
// créerait silencieusement un douzième groupe d'un seul élément.
export const FAMILLES_REACTIFS = [
  'Bases',
  'Acides et acides de Lewis',
  'Nucléophiles',
  'Électrophiles',
  'Oxydants',
  'Hydrures et réducteurs',
  'Activation et groupes partants',
  'Amines et donneurs de condensation',
  'Carbènes et ylures',
  'Amorceurs et réactifs radicalaires',
  'Ligands et catalyseurs'
]

export const FAMILLES_SOLVANTS = [
  'Protiques',
  'Aprotiques polaires',
  'Aprotiques peu polaires',
  'Milieux particuliers'
]
