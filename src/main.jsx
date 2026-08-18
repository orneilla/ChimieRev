// Point d'entrée de l'application.
// C'est le tout premier fichier JavaScript exécuté par le navigateur :
// il « accroche » le composant App dans la balise <div id="root"> de index.html.
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      HashRouter gère la navigation entre les pages (adresses du type
      .../#/reaction/sn2). On le choisit plutôt que BrowserRouter parce
      qu'il fonctionne partout sans configuration serveur : ouverture
      directe d'un lien, actualisation de la page, hébergement statique.
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
