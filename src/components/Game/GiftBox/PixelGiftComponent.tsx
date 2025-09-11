import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

import { PixelMap } from '../pixelmap/PixelMap'
import { BackButton } from '../pixelmap/BackButton'
import { mockImages } from '../mock/images'

import { useActiveBoxes, useClaimBox } from './api'
import { PixelGift } from './PixelGift'
import { CoolDownCount } from './CoolDown'
import { watchBoxClaimed } from './api/watchBoxClaimed'
import { useCoolDownTime } from './api/useCoolDownTime'
import { listenToBoxClaimed } from '@/lib/ws'
import { useNotification } from '@/providers/NotificationProvider'
import { FaSpinner } from 'react-icons/fa'

interface Props {}

const PixelGiftComponent: React.FC<Props> = (props) => {
  const giftRef = useRef<PixelGift | undefined>()
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [curScene, setCurScene] = useState<string>('')

  const boxes = useActiveBoxes()
  const claimBox = useClaimBox()

  const claimBoxWithPermit = useCallback(async (pos: number) => {
    const deadline = Math.floor(Date.now() / 1000) + 300
    // TODO get signature from backend
    await claimBox(pos, deadline, '0x1234567890abcdef')
  }, [claimBox])

  // attach claimBoxWithPermit to PixelGift instance
  useEffect(() => {
    if (giftRef.current) {
      giftRef.current.claimBox = claimBoxWithPermit
    }
  }, [claimBoxWithPermit])

  // watchBoxClaimed()

  useEffect(() => {
    if (canvas && giftRef.current === undefined) {
      // pixel map
      const map = new PixelMap(canvas, {
        preOpenImageHook(curScene, pixel, image) {
          // proceed if not main or no box at pixel
          return curScene !== 'main' || !giftRef.current?.hasBox(pixel)
        }
      })
      map.addMainImages(mockImages)

      // pixel gift boxes map
      const pixelGift = new PixelGift(map)
      giftRef.current = pixelGift

      // track scene changes
      const view = map.getView()
      view.subscribe('sceneactivated', (event: CustomEvent) => {
        console.log('Scene activated:', event.detail)
        const openedScene = event.detail
        setCurScene(openedScene)
      })

      // attach claimBoxWithPermit to PixelGift instance
      pixelGift.claimBox = claimBoxWithPermit
    }
  }, [canvas])

  useEffect(() => {
    listenToBoxClaimed()
  }, [])

  // get the pixel map instance
  const map = giftRef.current?.map

  // sync boxes when boxes data or scene changes
  useEffect(() => {
    const pixelGift = giftRef.current
    if (boxes && boxes.length && curScene === 'main' && pixelGift) {
      console.log('Active boxes:', boxes)
      pixelGift.syncBoxes(Array.from(boxes))
    }
  }, [boxes, curScene])

  const { address } = useAccount()
  const waitSec = useCoolDownTime(address)

  const { loading } = useNotification()

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      <div className='w-full absolute top-16 flex items-center justify-center'>
        {curScene && curScene !== 'main' && <BackButton map={map} />}
        { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
        <CoolDownCount waitSec={waitSec} />
      </div>
    </>
  )
}

export default PixelGiftComponent
