'use client'

import { useCallback, useEffect, useState, PointerEvent } from 'react'

import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'
import { Address, RTCConnectState } from '@/lib/RTCConnectClients'
import { MenuModal } from './MenuModal'
import { ConnectingState } from './ConnectingState'
import { useWebRTCConnect } from './hooks/useWebRTCConnects'
import { ActionType, MonsterType } from './adventures/types'
import { xyToPosition, xyToPosition10 } from './utils'

interface Props {}

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const { offerConnect, sendAll, sendTo, connectStates } = useWebRTCConnect({
    onConnectStateChange(from, state) {
      // if (!adventures) return
      console.log('onConnectStateChange', from, state)

      if (adventures && state === RTCConnectState.Connected) {
        // Send all current states to client
        if (adventures.isServer) {
          adventures.sendStates(from)
        } else {
          // save the server address
          adventures.serverAddr = from
        }
      }
    },
    onReceiveData(from, data) {
      console.log('onReceiveData', from, data, adventures?.isServer)

      if (typeof data === 'string') {

      } else if (adventures) {
        if (adventures.isServer) {
          adventures.receiveActionData(data)
        } else {
          adventures.receiveUpdatesData(data)
        }
      }
    },
  })

  const [adventures] = useAdventure(canvas, sendAll, sendTo)

  // server run
  const startServer = useCallback(async () => {
    if (!adventures || adventures.isServer) return
    // await adventures.rtcClients.connectWallet()
    adventures.startServer()
    adventures.addMonsters([
      {id: 0, pos10: 500550, target: 5055, hp: 10, type: MonsterType.MEGAMAN},
    ])

    setIsMenuModalOpen(false)
  }, [adventures])

  // connect to server
  const connect = useCallback(async (addr: string) => {
    offerConnect(addr as Address)
    setIsMenuModalOpen(false)
  }, [offerConnect])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)

  const [isConnectingStatesOpen, setIsConnectingStatesOpen] = useState(false)

  // open connecting states when any update
  useEffect(() => {
    if (Object.keys(connectStates).length) setIsConnectingStatesOpen(true)
  }, [connectStates])

  // const monsterDrag = useCallback((e: DragEvent<HTMLImageElement>, type: MonsterType) => {
  //   e.dataTransfer?.setData('monsterType', `${type}`)
  // }, [])
  // const monsterDrag = useCallback((e: PointerEvent, type: MonsterType) => {
  //   if (!adventures) return

  //   console.log('Drag', type)
  //   adventures.map.subscribeOnce('pixelup', (e: CustomEvent<[number, number]>) => {
  //     const [px, py] = e.detail
  //     const pos10 = xyToPosition10(px, py)
  //     const target = xyToPosition(px, py)
  //     if (adventures.isServer) {
  //       adventures.addMonster({ id: 0, hp: 10, type, pos10, target })
  //     } else {
  //       adventures.sendActionToServer({ id: type, type: ActionType.ONBOARD, val: target })
  //     }
  //   })
  // }, [adventures])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='w-full' style={{border: '1px solid #ccc'}} />
      <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} openConnectInfo={() => setIsConnectingStatesOpen(true)} />
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
      {isConnectingStatesOpen && <ConnectingState states={connectStates} onClose={() => setIsConnectingStatesOpen(false)} />}
      {/* <div className='absolute bottom-2 right-2'>
        {monsters.map(mon => (
          <img className='h-12 w-14' src={mon[1]} onPointerDown={(e) => monsterDrag(e, mon[0])} />
        ))}
      </div> */}
    </>
  )
}

export default GameMap
