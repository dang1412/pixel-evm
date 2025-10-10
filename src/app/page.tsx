'use client'

import dynamic from 'next/dynamic'

const PixelMapLoad = () => import('@/components/Game/pixelmap/PixelMapComponent')
const PixelMap = dynamic(PixelMapLoad, {ssr: false})

export default function Page() {

  return (
    <PixelMap />
  )
}
