'use client'

import dynamic from 'next/dynamic'

// import { Header } from '@/components/layouts/Header'
// import { Web3Provider } from '@/providers/Web3Provider'
// import TestConnect from '@/components/TestConnect/TestConnect'
// import { WebRTCProvider } from '@/lib/webRTC/WebRTCProvider'

const GameMapLoad = () => import('@/components/Game/GameMap')
const GameMap = dynamic(GameMapLoad, {ssr: false})

export default function Page() {

  return (
    <GameMap />
  )
}
