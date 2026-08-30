// Composant racine : il définit la structure commune à toutes les pages
// (en-tête + zone de contenu + pied de page) et la liste des routes.
import { Routes, Route, Navigate } from 'react-router-dom'
import BarreNavigation from './components/BarreNavigation.jsx'
import BoutonRemonter from './components/BoutonRemonter.jsx'
import RestaurationDefilement from './defilement.js'
import PageListeReactions from './pages/PageListeReactions.jsx'
import PageReactifs from './pages/PageReactifs.jsx'
import PageDetailOutil from './pages/PageDetailOutil.jsx'
import PageProgramme from './pages/PageProgramme.jsx'
import PageQuiz from './pages/PageQuiz.jsx'
import PageDetailReaction from './pages/PageDetailReaction.jsx'
import PageAPropos from './pages/PageAPropos.jsx'

export default function App() {
  return (
    <div className="app">
      {/* On arrive en haut d'une page qu'on ouvre, et on retrouve son
          milieu quand on y revient : voir src/defilement.js. */}
      <RestaurationDefilement />
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
          <Route path="/reactifs" element={<PageReactifs />} />
          <Route path="/reactif/:id" element={<PageDetailOutil genre="reactif" />} />
          <Route path="/solvant/:id" element={<PageDetailOutil genre="solvant" />} />
          <Route path="/quiz" element={<PageQuiz />} />
          <Route path="/programme" element={<PageProgramme />} />
          <Route path="/a-propos" element={<PageAPropos />} />
          {/* Toute adresse inconnue renvoie vers la liste. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BoutonRemonter />

      <footer className="pied-de-page">
        <p>ChimieRév — comprendre pour mémoriser, jamais mémoriser bêtement.</p>
      </footer>
    </div>
  )
}
