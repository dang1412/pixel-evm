import { PointData } from 'pixi.js'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'
import MonsterCard from './MonsterCard'
import MonsterControlSelect from './MonsterControlSelect'
import { ArenaNetwork } from './ArenaNetwork'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const networkRef = useRef<ArenaNetwork>()

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
    networkRef.current?.map.selectMonsterById(id)
  }, [])

  useEffect(() => {
    if (canvas && !networkRef.current) {
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

      const network = new ArenaNetwork(pixelArena)
      networkRef.current = network

      return disconnect
    }
  }, [canvas])

  const onSelectAction = useCallback((type: ActionType) => {
    // gameRef.current?.sendMonsterAction(type)
    networkRef.current?.sendAction(type)
    setActionCtrlPos(undefined)
  }, [])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
      <div className="fixed bottom-2 left-2 z-10">
        <button
          className="px-4 py-2 mb-2 mr-2 bg-red-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => networkRef.current?.startServer('aaa')}
        >
          Start game
        </button>
        <button
          className="px-4 py-2 mb-2 mr-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => {}}
        >
          Join
        </button>
        <MonsterCard monsters={monsters} selectedMonsterId={selectedId} onSelectMonster={selectMonster} />
      </div>
      {actionCtrlPos && <MonsterControlSelect p={actionCtrlPos} onSelect={onSelectAction} />}
    </>
  )
}

export default PixelArenaComponent
