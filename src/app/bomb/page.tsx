'use client'

import dynamic from 'next/dynamic'

const BombGameLoad = () => import('@/components/Game/Bomb/BombGameComponent')
const BombGame = dynamic(BombGameLoad, {ssr: false})

const BombPage = () => {
  
  return (
    <BombGame />
  )
}

export default BombPage
