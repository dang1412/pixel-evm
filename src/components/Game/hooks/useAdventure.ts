import { useEffect, useRef, useState } from 'react'

import { Adventures } from '../adventures/Adventures'
import { ViewportMap } from '../ViewportMap'
import { SendAllFunc, SendToFunc } from './useWebRTCConnects'

export function useAdventure(c: HTMLCanvasElement | null, sendAll: SendAllFunc, sendTo: SendToFunc) {
  // const [adventures, setAdventures] = useState<Adventures | undefined>()
  const adventuresRef = useRef<Adventures>(undefined)

  useEffect(() => {
    if (c) {
      const vpmap = new ViewportMap(c)
      // Create an instance of ResizeObserver
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          // adjust the canvas size since we only watch canvas
          const {width, height} = entry.contentRect
          vpmap.resize(width - 2, height - 2)
        }
      })

      resizeObserver.observe(c.parentNode as HTMLDivElement)

      ;(async () => {
        const { width, height } = (c.parentNode as HTMLDivElement).getBoundingClientRect()
        await vpmap.init(width - 2, height - 2)
        vpmap.moveCenter()

        // Adventure game
        const myadventures = new Adventures(vpmap)
        await myadventures.init()

        adventuresRef.current = myadventures

        // setAdventures(myadventures)

      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [c])

  // Update adventures options when sendAll or sendTo changes
  useEffect(() => {
    const adventures = adventuresRef.current
    if (adventures) {
      adventures.updateOptions({
        sendAll,
        sendTo
      })
    }
  }, [sendAll, sendTo])

  return adventuresRef
}
