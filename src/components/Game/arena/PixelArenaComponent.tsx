import { useEffect, useRef, useState } from 'react'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const gameRef = useRef<PixelArenaMap>()

  useEffect(() => {
    if (canvas && !gameRef.current) {
      console.log('Create game')
      const { vpmap, disconnect } = createViewportMap(canvas)

      const pixelArena = new PixelArenaMap(vpmap, 'scene-3')
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
