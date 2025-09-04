'use client'

import dynamic from 'next/dynamic'

const PixelGiftLoad = () => import('@/components/Game/GiftBox/PixelGiftComponent')
const PixelGift = dynamic(PixelGiftLoad, {ssr: false})

const GiftPage = () => {
  return (
    <PixelGift />
  )
}

export default GiftPage
