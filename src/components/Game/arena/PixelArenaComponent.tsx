import { PointData } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaRotate } from 'react-icons/fa6'

import { Address } from '@/lib/RTCConnectClients'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'
import MonsterCard from './MonsterCard'
import MonsterControlSelect from './MonsterControlSelect'
import { ArenaNetwork } from './ArenaNetwork'
import { MenuModal } from '../MenuModal'
import { useWebRTC } from '@/lib/webRTC/WebRTCProvider'
import { getAccountConnectService, useWebRTCConnect } from '@/lib/webRTC/hooks/useWebRTCConnect'

interface Props {}

const PixelArenaComponent: React.FC<Props> = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const networkRef = useRef<ArenaNetwork>()

  const [monsters, setMonsters] = useState<MonsterState[]>([])
  const [selectedId, setSelectedId] = useState(0)
  const [actionCtrlPos, setActionCtrlPos] = useState<PointData>()

  const [arenaSceneOpening, setArenaSceneOpening] = useState(false)

  const onMonstersUpdate = useCallback((monsters: MonsterState[]) => {
    setMonsters(monsters)
  }, [])

  const onMonsterSelect = useCallback((id: number) => {
    setSelectedId(id)
  }, [])

  const selectedMonster = useMemo(() => monsters.find(m => m.id === selectedId), [monsters, selectedId])

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

      const sceneName = '4848'
      const pixelArena = new PixelArenaMap(vpmap, {
        sceneName,
        onMonstersUpdate,
        onMonsterSelect,
        onActionPosition(action, p) {
          setActionCtrlPos(p)
        },
      })

      pixelArena.map.subscribe('sceneactivated', (event: CustomEvent) => {
        console.log('Scene activated:', event.detail)
        const addedScene = event.detail
        if (addedScene === sceneName) {
          if (!networkRef.current?.gameStarted) setIsMenuModalOpen(true)
          setArenaSceneOpening(true)
        } else {
          setIsMenuModalOpen(false)
          setArenaSceneOpening(false)
        }
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

  const { state: { addressList } } = useWebRTC()

  const sendAll = useCallback((data: ArrayBuffer) => {
    console.log('sendAll', addressList, data)
    for (const addr of addressList) {
      getAccountConnectService(addr)?.sendMessage(data)
    }
  }, [addressList])

  // send data to specific address
  const sendTo = useCallback((addr: Address, data: ArrayBuffer) => {
    console.log('sendTo', addr, data)
    getAccountConnectService(addr)?.sendMessage(data)
  }, [])

  useEffect(() => {
    networkRef.current?.setOpts({ sendAll, sendTo })
  }, [sendAll, sendTo])

  const onMsg = useCallback((from: string, data: string | ArrayBuffer) => {
    const network = networkRef.current
    if (!network) return

    if (typeof data === 'string') {
      if (data === '_connected_') {
        network.connected(from as Address)
      }
    } else {
      network.receiveData(from, data)
    }
  }, [])
  
  const { offerConnect } = useWebRTCConnect(onMsg)

  // connect to server
  const connect = useCallback(async (addr: string) => {
    offerConnect(addr as Address)
    setIsMenuModalOpen(false)
    if (networkRef.current) networkRef.current.gameStarted = true
  }, [offerConnect])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)

  // const { address } = useAccount()
  const startServer = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.gameStarted = true
      networkRef.current.startServer()
      setIsMenuModalOpen(false)
    }
  }, [])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
      {arenaSceneOpening && <div className="fixed bottom-2 left-2 z-10">
        <FaRotate
          className="text-gray-700 cursor-pointer mb-1 text-2xl flex items-center justify-center"
          onClick={() => networkRef.current?.restart()}
          aria-label="Close"
        />
        <MonsterCard monsters={monsters} selectedMonsterId={selectedId} onSelectMonster={selectMonster} />
      </div>}
      {(actionCtrlPos && selectedMonster) && <MonsterControlSelect p={actionCtrlPos} onSelect={onSelectAction} monster={selectedMonster} />}
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
    </>
  )
}

export default PixelArenaComponent
