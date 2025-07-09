import { PointData } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'
import MonsterCard from './MonsterCard'
import MonsterControlSelect from './MonsterControlSelect'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const gameRef = useRef<PixelArenaMap>()

  const [monsters, setMonsters] = useState<MonsterState[]>([])
  const [selectedId, setSelectedId] = useState(0)
  const [actionCtrlPos, setActionCtrlPos] = useState<PointData>()

  const onMonstersUpdate = useCallback((monsters: MonsterState[]) => {
    setMonsters(monsters)
  }, [])

  const onMonsterSelect = useCallback((id: number) => {
    setSelectedId(id)
  }, [])

  // const changeMonster = useCallback((monster: MonsterState, actionType: ActionType) => {
  //   console.log('Change monster:', monster, actionType)
  //   setMonster(monster)
  //   setActionType(actionType)
  // }, [])

  // const onActionChange = useCallback((actionType: ActionType) => {
  //   gameRef.current?.updateMonsterActionType(actionType)
  //   setActionType(actionType)
  // }, [])

  const selectMonster = useCallback((id: number) => {
    setSelectedId(id)
    gameRef.current?.selectMonsterById(id)
  }, [])

  useEffect(() => {
    if (canvas && !gameRef.current) {
      console.log('Create game')
      const { vpmap, disconnect } = createViewportMap(canvas)

      const pixelArena = new PixelArenaMap(vpmap, {
        sceneName: 'scene-3',
        onMonstersUpdate,
        onMonsterSelect,
        onActionPosition(action, p) {
          setActionCtrlPos(p)
        },
      })
      gameRef.current = pixelArena

      return disconnect
    }
  }, [canvas])

  const onSelectAction = useCallback((type: ActionType) => {
    gameRef.current?.sendMonsterAction(type)
    setActionCtrlPos(undefined)
  }, [])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
      <div className="fixed bottom-2 left-2 z-10">
        <MonsterCard monsters={monsters} selectedMonsterId={selectedId} onSelectMonster={selectMonster} />
      </div>
      {actionCtrlPos && <MonsterControlSelect p={actionCtrlPos} onSelect={onSelectAction} />}
    </>
  )
}

export default PixelArenaComponent
