import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

import { PixelMap } from '../pixelmap/PixelMap'
import { BackButton } from '../pixelmap/BackButton'
import { mockImages } from '../mock/images'

import { useActiveBoxes, useClaimBox } from './api'
import { PixelGift } from './PixelGift'
import { watchBoxClaimed } from './api/watchBoxClaimed'
import { useBalance } from './api/useBalance'

interface Props {}

const PixelGiftComponent: React.FC<Props> = (props) => {
  const giftRef = useRef<PixelGift | undefined>()
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [curScene, setCurScene] = useState<string>('')

  const boxes = useActiveBoxes()
  const claimBox = useClaimBox()

  const boxClaimed = useCallback((user: `0x${string}`, pos: number, token: number) => {
    console.log('Box claimed by', user, 'at position', pos, 'with token', token)
    const pixelGift = giftRef.current
    pixelGift?.boxTaken(pos, token)
  }, [])

  watchBoxClaimed(boxClaimed)

  // const { address } = useAccount()
  // const balance = useBalance(address || `0x`)
  // console.log('User balance:', address, balance)

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

      // claim box
      pixelGift.claimBox = async (pos: number) => {
        // console.log('Claim box at position:', pos, positionToXY(pos))
        const deadline = Math.floor(Date.now() / 1000) + 600
        // // const deadline = Math.floor(Date.now() / 1000) - 600
        await claimBox(pos, deadline, '0x1234567890abcdef')
        // pixelGift.boxTaken(pos, 100)
      }
    }
  }, [canvas])

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
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />
      {curScene && curScene !== 'main' && <BackButton map={map} />}
    </>
  )
}

export default PixelGiftComponent
