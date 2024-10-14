import { useEffect, useState } from 'react'
import { Adventures } from '../adventures/Adventures'
import { ViewportMap } from '../ViewportMap'

export function useAdventure(c: HTMLCanvasElement | null): Adventures | undefined {
  const [adventures, setAdventures] = useState<Adventures | undefined>()

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

      resizeObserver.observe(c)

      ;(async () => {
        await vpmap.init()
        const { width, height } = c.getBoundingClientRect()
        vpmap.resize(width, height)
        await vpmap.addImage('/images/pixel_logo.png', {x: 49, y: 49, w: 3, h: 3})
        vpmap.moveCenter()

        // Adventure game
        const adventures = new Adventures(vpmap)

        setAdventures(adventures)
      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [c])

  return adventures
}