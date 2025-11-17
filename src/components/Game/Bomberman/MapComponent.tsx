import { useEffect, useRef, useState } from 'react'

import { PixelMap } from '../pixelmap/PixelMap'
import { mockImages } from '../mock/images'

import { GameMap } from './GameMap'

interface Props {
  onGameMapReady: (gameMap: GameMap) => void
}

export const MapComponent: React.FC<Props> = ({ onGameMapReady }) => {
  const gameMapRef = useRef<GameMap | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (canvas && gameMapRef.current === undefined) {
      // pixel map
      const map = new PixelMap(canvas, {
        // not open scene when click on image
        preOpenImageHook: (curScene, pixel, image) => false
      })
      map.addMainImages(mockImages)

      // initialize gameMap
      const gameMap = new GameMap(map)

      onGameMapReady(gameMap)
    }
  }, [canvas])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />
    </>
  )
}
