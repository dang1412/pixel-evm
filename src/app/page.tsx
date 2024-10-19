import { Header } from '@/components/layouts/Header'
import dynamic from 'next/dynamic'

const GameMapLoad = () => import('@/components/Game/GameMap')
const GameMap = dynamic(GameMapLoad, {ssr: false})


export default function Page() {

  return (
    <div className='flex flex-col h-lvh'>
      <Header />
      <div className='flex-grow overflow-hidden'>
        <GameMap />
      </div>
    </div>
  )
}
