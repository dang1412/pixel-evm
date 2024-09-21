'use client'

import { useCallback, useState } from 'react'

import { RTCConnectClients } from '../../lib/RTCConnectClient'

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
    rtcClients.offerConnectTo(addr)
  }, [addr])

  return (
    <>
      <button onClick={connect}>Connect</button>
      <br/>
      <button onClick={waitForConnect}>Wait for Connect</button>
      <br/>
      <button onClick={requestConnect}>Request to</button><input value={addr} onChange={(e) => setAddr(e.target.value)} />
    </>
  )
}
