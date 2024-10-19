import { useEffect, useState } from 'react'

import { Address, RTCConnectState } from '@/lib/RTCConnectClients'
import { Adventures } from '../adventures/Adventures'
import { ViewportMap } from '../ViewportMap'

export type AddressesConnectStates = {[addr: Address]: RTCConnectState}

export function useAdventure(c: HTMLCanvasElement | null): [Adventures | undefined, AddressesConnectStates] {
  const [adventures, setAdventures] = useState<Adventures | undefined>()

  const [addrConnectStates, setAddrConnectStates] = useState<AddressesConnectStates>({})

  useEffect(() => {
    if (c) {
      const vpmap = new ViewportMap(c)
      // Create an instance of ResizeObserver
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          // adjust the canvas size since we only watch canvas
          const {width, height} = entry.contentRect
          vpmap.resize(width, height)
        }
      })

      resizeObserver.observe(c.parentNode as HTMLDivElement)

      ;(async () => {
        await vpmap.init()
        const { width, height } = (c.parentNode as HTMLDivElement).getBoundingClientRect()
        vpmap.resize(width, height)
        await vpmap.addImage('/images/pixel_logo.png', {x: 49, y: 49, w: 3, h: 3})
        vpmap.moveCenter()

        // Adventure game
        const adventures = new Adventures(vpmap, {
          onConnectStateChange: (addr, state) => {
            // setConnectingAddr(addr as Address)
            // setConnectState(state)
            // if (state === RTCConnectState.Connected) {
            //   setAddrs(addrs => [...addrs, addr as Address])
            // }
            setAddrConnectStates(states => ({...states, [addr]: state}))
          }
        })

        setAdventures(adventures)
      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [c])

  return [adventures, addrConnectStates]
}
