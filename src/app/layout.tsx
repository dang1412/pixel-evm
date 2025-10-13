'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

import '../globals.css'

import { Header } from '@/components/layouts/Header'
import { WebRTCProvider } from '@/lib/webRTC/WebRTCProvider'

import { Web3Provider } from '@/providers/Web3Provider'
import { NotificationProvider } from '@/providers/NotificationProvider'

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
                <WebRTCProvider>
                  {children}
                </WebRTCProvider>
                {/* <TestConnect /> */}
              </div>
            </div>
          </NotificationProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
