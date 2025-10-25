import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'

import { PixelMap } from '../pixelmap/PixelMap'
import { BackButton } from '../pixelmap/BackButton'
import { mockImages } from '../mock/images'

import { BombMap } from './BombMap'
import { BombGame } from './BombGame'

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  const bombMapRef = useRef<BombMap | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [curScene, setCurScene] = useState<string>('')

  const { address } = useAccount()

  const { notify, loading, setLoading } = useNotification()

  const [ score, setScore ] = useState(0)

  // sync boxes when boxes data or scene changes

  useEffect(() => {
    if (canvas && bombMapRef.current === undefined) {
      // pixel map
      const map = new PixelMap(canvas, {
        // not open scene when click on image
        preOpenImageHook: (curScene, pixel, image) => false
      })
      map.addMainImages(mockImages)

      // initialize bombMap and bombGame logic
      const bombMap = new BombMap(map, (score) => setScore(score))
      bombMap.bombGame = new BombGame(bombMap)

      bombMapRef.current = bombMap

      // track scene changes
      const view = map.getView()
      view.subscribe('sceneactivated', (event: CustomEvent) => {
        console.log('Scene activated:', event.detail)
        const openedScene = event.detail
        setCurScene(openedScene)
      })
    }
  }, [canvas])

  // get the pixel map instance
  const map = bombMapRef.current?.map

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      <div className='w-full absolute top-16 flex items-center justify-center'>
        {curScene && curScene !== 'main' && <BackButton map={map} />}
        { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
        <div className='text-gray-800 font-semibold'>Score: {score}</div>
      </div>
    </>
  )
}

export default BombGameComponent
