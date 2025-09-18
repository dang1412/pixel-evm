'use client'
import { ReactNode } from 'react'
import { baseSepolia } from 'wagmi/chains'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ConnectKitProvider } from 'connectkit'

const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY

export function OnchainProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={apiKey}
      chain={baseSepolia}
      config={{
        appearance: {
          // mode: "",
        },
        wallet: {
          display: "modal",
          preference: "all",
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: undefined,
      }}
    >
      <ConnectKitProvider>{children}</ConnectKitProvider>
    </OnchainKitProvider>
  )
}
