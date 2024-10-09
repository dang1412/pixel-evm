'use client'

import { useEffect, useRef } from 'react'
import { ViewportMap } from './ViewportMap'
import { Adventures } from './adventures/Adventures'

interface Props {}

const MAP_H = 900

export const GameMap: React.FC<Props> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
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
        adventures.loadMonsters([
          {id: 1, pos: 5055, hp: 10, type: 1},
          {id: 2, pos: 5052, hp: 10, type: 2},
        ])

        adventures.startServer()
      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} style={{border: '1px solid #ccc', width: '100%', height: MAP_H}} />
    </>
  )
}
