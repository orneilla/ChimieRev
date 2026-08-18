// Composant racine : il définit la structure commune à toutes les pages
// (en-tête + zone de contenu + pied de page) et la liste des routes.
import { Routes, Route, Navigate } from 'react-router-dom'
import BarreNavigation from './components/BarreNavigation.jsx'
import PageListeReactions from './pages/PageListeReactions.jsx'
import PageDetailReaction from './pages/PageDetailReaction.jsx'
import PageAPropos from './pages/PageAPropos.jsx'

export default function App() {
  return (
    <div className="app">
      <BarreNavigation />

      <main className="contenu">
        {/*
          Chaque <Route> associe une adresse à une page.
          ":id" est un paramètre : /reaction/sn2 ou /reaction/e2 affichent
          la même page, avec une réaction différente.
        */}
        <Routes>
          <Route path="/" element={<PageListeReactions />} />
          <Route path="/reaction/:id" element={<PageDetailReaction />} />
          <Route path="/a-propos" element={<PageAPropos />} />
          {/* Toute adresse inconnue renvoie vers la liste. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="pied-de-page">
        <p>ChimieRév — comprendre pour mémoriser, jamais mémoriser bêtement.</p>
      </footer>
    </div>
  )
}
