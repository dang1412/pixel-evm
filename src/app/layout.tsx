'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

import '../globals.css'

import { Header } from '@/components/layouts/Header'
import { WebRTCProvider } from '@/lib/webRTC/WebRTCProvider'

import { Web3Provider } from '@/providers/Web3Provider'
import { NotificationProvider } from '@/providers/NotificationProvider'
import { WebSocketProvider } from '@/providers/WebsocketProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <NotificationProvider>
            <div className='flex flex-col h-screen'>
              <Header />
              <div className='flex-1'>
                <WebSocketProvider url="wss://ws.pixelonbase.com">
                {/* <WebSocketProvider url="ws://localhost:8080"> */}
                  <WebRTCProvider>
                    {children}
                  </WebRTCProvider>
                </WebSocketProvider>
              </div>
            </div>
          </NotificationProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
