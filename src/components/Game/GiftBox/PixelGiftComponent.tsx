import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'
import { listenToBoxClaimed } from '@/lib/ws'

import Turnstile, { TurnstileRef } from '@/components/Turnstile'

import { PixelMap } from '../pixelmap/PixelMap'
import { BackButton } from '../pixelmap/BackButton'
import { mockImages } from '../mock/images'

import { useActiveBoxes, useClaimBox } from './api'
import { useCoolDownTime } from './api/useCoolDownTime'
import { PixelGift } from './PixelGift'
import { CoolDownCount } from './CoolDown'
import { OnboardingModal } from './OnboardModal'

interface Props {}

const PixelGiftComponent: React.FC<Props> = (props) => {
  const giftRef = useRef<PixelGift | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [curScene, setCurScene] = useState<string>('')
  const turnstileRef = useRef<TurnstileRef>(null);

  const boxes = useActiveBoxes()
  const { address } = useAccount()
  const coolDownTime = useCoolDownTime(address)
  const claimBox = useClaimBox(turnstileRef)

  const { notify, loading, setLoading } = useNotification()

  const claimBoxWithPermit = useCallback(async (pos: number) => {
    // check human
    try {
      // const token = await turnstileRef.current?.execute()
      // if (token) {
      //   console.log('Got turnstile token', token)
      //   const rs = await verifyHuman(address, token)
      //   console.log('verifyHuman', rs)
      //   if (rs.success && rs.signData) {
      //     const { deadline, signature } = rs.signData
          // claim
          setLoading(true)
          await claimBox(pos)
        // }
      // }
    } catch (e) {
      notify(`${e}`, 'error')
    } finally {
      turnstileRef.current?.remove()
      setLoading(false)
    }
  }, [address, claimBox])

  // attach claimBoxWithPermit to PixelGift instance
  useEffect(() => {
    if (giftRef.current) {
      giftRef.current.claimBox = claimBoxWithPermit
    }
  }, [claimBoxWithPermit])

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

  // listen websocket event
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

  return (
    <>
      <OnboardingModal />
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      <div className='w-full absolute top-16 flex items-center justify-center'>
        {curScene && curScene !== 'main' && <BackButton map={map} />}
        { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
        <CoolDownCount coolDownTime={coolDownTime || 0} />
      </div>

      <Turnstile ref={turnstileRef} />
    </>
  )
}

export default PixelGiftComponent
