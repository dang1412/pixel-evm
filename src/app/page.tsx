import { Header } from '@/components/layouts/Header'
import dynamic from 'next/dynamic'

const GameMapLoad = () => import('@/components/Game/GameMap')
const GameMap = dynamic(GameMapLoad, {ssr: false})


export default function Page() {

  return (
    <>
      <Header />
      <GameMap />
    </>
  )
}
