'use client'

import { useCallback, useState } from 'react'
import { Address, useWebRTCConnect } from '../Game/hooks/useWebRTCConnects'
import { IPFSService } from '@/lib/IPFSService'

// import { Address, RTCConnectClients } from '@/lib/RTCConnectClients'

// const rtcClients = new RTCConnectClients()

// const ipfs = new IPFSService()

export default function Page() {

  // const connect = useCallback(() => {
  //   rtcClients.connectWallet()
  // }, [])

  // const waitForConnect = useCallback(() => {
  //   rtcClients.waitForConnect()
  // }, [])
  const { offerConnect, sendAll, sendTo } = useWebRTCConnect({
    onConnectStateChange(from, state) {
      console.log('onConnectStateChange', from, state)
    },
    onReceiveData(from, data) {
      console.log('onReceiveData', from, data)
    },
  })

  const [addr, setAddr] = useState('')

  const requestConnect = useCallback(() => {
    // rtcClients.offerConnectTo(addr as Address)
    offerConnect(addr as Address)
  }, [addr])

  const send = useCallback(async () => {
    // rtcClients.sendAll('Testabcd')
    // const rs = await rtcClients.ipfsService.fetch('QmZXGnLhXN5fKfDp9bjUoRtyeFe6W3xrQYMZygemeD7pwM')
    // console.log('Test', rs)
    sendAll('Testabcd')
  }, [])

  return (
    <>
      <button className='text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2' onClick={requestConnect}>Request to</button>
      <input value={addr} onChange={(e) => setAddr(e.target.value)} />
      <br/>
      <button className='text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2' onClick={send}>Test</button>
    </>
  )
}
