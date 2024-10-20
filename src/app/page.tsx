'use client'

import dynamic from 'next/dynamic'

import { Header } from '@/components/layouts/Header'
import { Web3Provider } from '@/providers/Web3Provider'
import TestConnect from '@/components/TestConnect/TestConnect'

const GameMapLoad = () => import('@/components/Game/GameMap')
const GameMap = dynamic(GameMapLoad, {ssr: false})

export default function Page() {

  return (
    <Web3Provider>
      <div className='flex flex-col h-lvh'>
        <Header />
        <div className='flex-grow overflow-hidden'>
          <GameMap />
          {/* <TestConnect /> */}
        </div>
      </div>
    </Web3Provider>
  )
}
