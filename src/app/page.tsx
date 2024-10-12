import dynamic from 'next/dynamic'

import { GameMap } from '@/components/Game'

const TestConnectLoad = () => import('../components/TestConnect/TestConnect')
const TestConnect = dynamic(TestConnectLoad, {ssr: false})

export default function Page() {

  return (
    <>
      <h1>Hello, Pixel Games!</h1>
      {/* <TestConnect /> */}
      <GameMap />
    </>
  )
}
