'use client'

import dynamic from 'next/dynamic'

const PixelArenaComponentLoad = () => import('@/components/Game/arena/PixelArenaComponent')
const PixelArenaComponent = dynamic(PixelArenaComponentLoad, {ssr: false})

const ArenaPage = () => {
  return (
    <PixelArenaComponent />
  )
}

export default ArenaPage