import { useCallback, useEffect, useRef, useState } from 'react'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'
import MonsterCard from './MonsterCard'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const gameRef = useRef<PixelArenaMap>()

  const [monster, setMonster] = useState<MonsterState>()
  const [actionType, setActionType] = useState(ActionType.Move)

  const changeMonster = useCallback((monster: MonsterState, actionType: ActionType) => {
    console.log('Change monster:', monster, actionType)
    setMonster(monster)
    setActionType(actionType)
  }, [])

  const onActionChange = useCallback((actionType: ActionType) => {
    gameRef.current?.updateMonsterActionType(actionType)
    setActionType(actionType)
  }, [])

  useEffect(() => {
    if (canvas && !gameRef.current) {
      console.log('Create game')
      const { vpmap, disconnect } = createViewportMap(canvas)

      const pixelArena = new PixelArenaMap(vpmap, 'scene-3', changeMonster)
      gameRef.current = pixelArena

      return disconnect
    }
  }, [canvas])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
      <div className="fixed bottom-6 left-6 z-10">
        {monster && <MonsterCard state={monster} actionType={actionType} onActionChange={onActionChange} />}
      </div>
    </>
  )
}

export default PixelArenaComponent
