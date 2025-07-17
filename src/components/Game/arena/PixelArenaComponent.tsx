import { PointData } from 'pixi.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Address } from '@/lib/RTCConnectClients'

import { createViewportMap } from '../helpers/createViewportMap'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'
import MonsterCard from './MonsterCard'
import MonsterControlSelect from './MonsterControlSelect'
import { ArenaNetwork } from './ArenaNetwork'
import { useWebRTC } from '@/lib/webRTC/WebRTCProvider'
import { getAccountConnectService, useWebRTCConnect } from '@/lib/webRTC/hooks/useWebRTCConnect'
import { MenuModal } from '../MenuModal'
import { useAccount } from 'wagmi'

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

      const sceneName = 'scene-3'
      const pixelArena = new PixelArenaMap(vpmap, {
        sceneName,
        onMonstersUpdate,
        onMonsterSelect,
        onActionPosition(action, p) {
          setActionCtrlPos(p)
        },
      })

      const unsub = pixelArena.map.subscribe('sceneactivated', (event: CustomEvent) => {
        console.log('Scene activated:', event.detail)
        const addedScene = event.detail
        if (addedScene === sceneName) {
          unsub()
          setIsMenuModalOpen(true)
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
  }, [offerConnect])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)

  const { address } = useAccount()
  const startServer = useCallback(() => {
    if (address && networkRef.current) {
      networkRef.current.startServer(address)
      setIsMenuModalOpen(false)
    }
  }, [address])

  return (
    <>
      <canvas ref={(c) => setCanvas(c || undefined)} className='' style={{border: '1px solid #ccc'}} />
      <div className="fixed bottom-2 left-2 z-10">
        {/* <button
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
        </button> */}
        <MonsterCard monsters={monsters} selectedMonsterId={selectedId} onSelectMonster={selectMonster} />
      </div>
      {(actionCtrlPos && selectedMonster) && <MonsterControlSelect p={actionCtrlPos} onSelect={onSelectAction} monster={selectedMonster} />}
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
    </>
  )
}

export default PixelArenaComponent
