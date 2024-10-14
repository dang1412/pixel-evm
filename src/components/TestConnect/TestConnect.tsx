'use client'

import { useCallback, useState } from 'react'

import { Address, RTCConnectClients } from '@/lib/RTCConnectClients'

const rtcClients = new RTCConnectClients()

export default function Page() {

  const connect = useCallback(() => {
    rtcClients.connectWallet()
  }, [])

  const waitForConnect = useCallback(() => {
    rtcClients.waitForConnect()
  }, [])

  const [addr, setAddr] = useState('')

  const requestConnect = useCallback(() => {
    rtcClients.offerConnectTo(addr as Address)
  }, [addr])

  const send = useCallback(async () => {
    rtcClients.sendAll('Testabcd')
    // const rs = await rtcClients.ipfsService.fetch('QmZXGnLhXN5fKfDp9bjUoRtyeFe6W3xrQYMZygemeD7pwM')
    // console.log('Test', rs)
  }, [])

  return (
    <>
      <button onClick={connect}>Connect</button>
      <br/>
      <button onClick={waitForConnect}>Wait for Connect</button>
      <br/>
      <button onClick={requestConnect}>Request to</button><input value={addr} onChange={(e) => setAddr(e.target.value)} />
      <br/>
      <button onClick={send}>Test</button>
    </>
  )
}
