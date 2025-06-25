import { useEffect, useRef, useState } from 'react'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaGame } from './PixelArenaGame'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const gameRef = useRef<PixelArenaGame>()

  useEffect(() => {
    if (canvas && !gameRef.current) {
      console.log('Create game')
      const { vpmap, disconnect } = createViewportMap(canvas)

      const pixelArena = new PixelArenaGame(vpmap)
      gameRef.current = pixelArena

      return disconnect
    }
  }, [canvas])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
    </>
  )
}

export default PixelArenaComponent
