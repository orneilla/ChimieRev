// Configuration Vite (l'outil qui lance le serveur de développement et
// qui construit la version finale de l'application).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Le plugin React permet d'écrire du JSX (le HTML dans le JavaScript).
  plugins: [react()],
  server: {
    // host: true => le serveur est visible sur le réseau local,
    // donc on peut ouvrir l'app depuis le téléphone (voir README).
    host: true,
    port: 5173
  }
})
