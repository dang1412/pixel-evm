'use client'

import { useEffect, useRef } from 'react'
import { ViewportMap } from './ViewportMap'

interface Props {}

export const GameMap: React.FC<Props> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (c) {
      const vpmap = new ViewportMap()
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
        await vpmap.init(c)
        vpmap.resize(window.innerWidth - 16, 800)
        await vpmap.addImage('/images/pixel_logo.png', {x: 49, y: 49, w: 3, h: 3})
        vpmap.moveCenter()
      })()

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} style={{border: '1px solid #ccc', width: '100%', height: 800}} />
    </>
  )
}
