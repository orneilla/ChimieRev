// Configuration Vite (l'outil qui lance le serveur de développement et
// qui construit la version finale de l'application).
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

// La version affichée en pied de page. Elle ne sert qu'à UNE chose, et
// c'est une chose qui a manqué : savoir quelle construction on a sous les
// yeux. Un iPhone qui garde l'application sur son écran d'accueil peut
// servir l'ancienne page pendant longtemps, et « ça ne marche toujours
// pas » veut alors dire « je regarde toujours l'ancienne version ». Sans
// repère affiché, ni l'utilisateur ni nous ne pouvons faire la
// différence entre un défaut non corrigé et une correction non reçue.
const VERSION = (() => {
  const jour = new Date().toISOString().slice(0, 10)
  try {
    const { execSync } = require('node:child_process')
    return `${jour}·${execSync('git rev-parse --short HEAD').toString().trim()}`
  } catch {
    return jour
  }
})()

export default defineConfig({
  // Le plugin React permet d'écrire du JSX (le HTML dans le JavaScript).
  plugins: [react()],
  define: { __VERSION__: JSON.stringify(VERSION) },
  // Chemins relatifs : l'application fonctionne aussi bien à la racine d'un
  // domaine que dans un sous-dossier (cas de GitHub Pages : /ChimieRev/).
  base: './',
  server: {
    // host: true => le serveur est visible sur le réseau local,
    // donc on peut ouvrir l'app depuis le téléphone (voir README).
    host: true,
    port: 5173
  }
})
