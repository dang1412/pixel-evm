'use client'

import { useMiniKit } from '@coinbase/onchainkit/minikit'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'

const PixelGiftLoad = () => import('@/components/Game/GiftBox/PixelGiftComponent')
const PixelGift = dynamic(PixelGiftLoad, {ssr: false})

const GiftPage = () => {
  // const { setFrameReady, isFrameReady } = useMiniKit()

  // useEffect(() => {
  //   if (!isFrameReady) {
  //     console.log('setFrameReady')
  //     setFrameReady()
  //   }
  // }, [setFrameReady, isFrameReady])
  
  return (
    <PixelGift />
  )
}

export default GiftPage
