'use client'

import '../globals.css'

import { Header } from '@/components/layouts/Header'
import { Web3Provider } from '@/providers/Web3Provider'
import TestConnect from '@/components/TestConnect/TestConnect'
import { WebRTCProvider } from '@/lib/webRTC/WebRTCProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <div className='flex flex-col h-screen'>
            <Header />
            <div className='flex-1'>
              <WebRTCProvider>
                {children}
              </WebRTCProvider>
              {/* <TestConnect /> */}
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  )
}
