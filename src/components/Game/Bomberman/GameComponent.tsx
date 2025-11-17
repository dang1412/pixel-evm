import { useCallback, useRef } from 'react'

import { GameMap } from './GameMap'
import { MapComponent } from './MapComponent'


interface Props {}

const GameComponent: React.FC<Props> = (props) => {
  const gameMapRef = useRef<GameMap>(undefined)

  const onGameMapReady = useCallback((gameMap: GameMap) => {
    gameMapRef.current = gameMap
  }, [])

  return (
    <>
      <MapComponent onGameMapReady={onGameMapReady} />
    </>
  )
}

export default GameComponent
