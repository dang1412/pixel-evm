'use client'

import { useEffect, useRef, useState } from 'react'
import { ViewportMap } from './ViewportMap'
import { Adventures, ActionMode } from './adventures/Adventures'
import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'

interface Props {}

const MAP_H = 800

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const adventure = useAdventure(canvas)

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} style={{border: '1px solid #ccc', width: '100%', height: MAP_H}} />
      <MonsterControl onSetMode={(m) => {if (adventure) adventure.mode = m}} />
    </>
  )
}
