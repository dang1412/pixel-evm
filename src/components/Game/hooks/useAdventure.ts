import { useEffect, useState } from 'react'

import { Adventures } from '../adventures/Adventures'
import { ViewportMap } from '../ViewportMap'
import { SendAllFunc, SendToFunc } from './useWebRTCConnects'

export function useAdventure(c: HTMLCanvasElement | null, sendAll: SendAllFunc, sendTo: SendToFunc): [Adventures | undefined] {
  const [adventures, setAdventures] = useState<Adventures | undefined>()

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
        const myadventures = new Adventures(vpmap, {
          sendAll,
          sendTo
        })

        setAdventures(myadventures)

        await myadventures.init()
      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [c])

  return [adventures]
}
