// Le bouton qui ramène en haut.
//
// Il ne s'affiche qu'une fois qu'on a descendu deux écrans : sur une page
// courte il n'aurait rien à faire là, et un bouton flottant permanent
// mange un coin de l'écran pour rien.
import { useEffect, useState } from 'react'

export default function BoutonRemonter() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const regarder = () => setVisible(window.scrollY > window.innerHeight * 1.5)
    regarder()
    window.addEventListener('scroll', regarder, { passive: true })
    window.addEventListener('resize', regarder)
    return () => {
      window.removeEventListener('scroll', regarder)
      window.removeEventListener('resize', regarder)
    }
  }, [])

  return (
    <button
      type="button"
      className={visible ? 'bouton-remonter visible' : 'bouton-remonter'}
      // Hors écran, il ne doit pas non plus être atteignable au clavier :
      // sans cela on tabule sur un bouton qu'on ne voit pas.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <span className="remonter-fleche" aria-hidden="true">↑</span>
      <span className="lecture-seule-ecran">Remonter en haut de la page</span>
    </button>
  )
}
