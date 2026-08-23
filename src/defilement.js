// Où l'on se retrouve après avoir changé de page.
//
// Sans rien, le navigateur garde la hauteur de défilement d'une page à
// l'autre : on quitte le bas d'une fiche de réaction, on demande la liste,
// et on arrive au bas de la liste — sur les dernières réactions, alors
// qu'on venait pour les premières. C'est le défaut le plus désorientant
// qu'on puisse laisser dans une application à plusieurs pages.
//
// La règle est celle qu'un navigateur applique à un site ordinaire :
//   • on OUVRE une page          → on arrive en haut ;
//   • on REVIENT en arrière      → on retrouve l'endroit qu'on avait quitté.
//
// Le second cas demande une précaution. Les schémas sont des images : la
// page n'atteint sa hauteur définitive qu'une fois qu'elles sont chargées.
// Demander tout de suite « descends à 3 000 px » sur un document qui n'en
// fait encore que 900 ne descend nulle part. On réessaie donc à chaque
// image de l'écran, jusqu'à ce que la position demandée soit atteinte.
import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const positions = new Map()

function allerA(y) {
  if (y <= 0) { window.scrollTo(0, 0); return }
  let essais = 0
  const poser = () => {
    window.scrollTo(0, y)
    if (Math.abs(window.scrollY - y) > 2 && essais++ < 40) requestAnimationFrame(poser)
  }
  requestAnimationFrame(poser)
}

export default function RestaurationDefilement() {
  const { key } = useLocation()
  const type = useNavigationType()
  const cle = useRef(key)

  // On tient nous-mêmes le registre des positions : laissé au navigateur,
  // il rejoue la sienne par-dessus la nôtre et les deux se contredisent.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // On note en continu où en est la page courante, pour pouvoir l'y
  // ramener si on y revient.
  useEffect(() => {
    const noter = () => positions.set(cle.current, window.scrollY)
    window.addEventListener('scroll', noter, { passive: true })
    return () => { noter(); window.removeEventListener('scroll', noter) }
  }, [])

  useEffect(() => {
    cle.current = key
    allerA(type === 'POP' ? (positions.get(key) || 0) : 0)
  }, [key, type])

  return null
}
