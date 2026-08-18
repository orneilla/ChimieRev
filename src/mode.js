// Le mode de lecture — « Comprendre » ou « Référence » — est un choix
// personnel qui vaut pour toute l'application, pas seulement pour la fiche
// ouverte. On le range donc ici, avec sa mémoire.
import { useState, useEffect } from 'react'

const CLE = 'chimierev.mode'

export function useModeLecture() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(CLE) || 'comprendre'
    } catch {
      // Navigation privée sur certains téléphones : on continue sans mémoire.
      return 'comprendre'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(CLE, mode)
    } catch {
      /* pas de stockage disponible : sans conséquence */
    }
  }, [mode])

  return [mode, setMode]
}
