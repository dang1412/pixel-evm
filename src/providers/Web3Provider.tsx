import { WagmiProvider, createConfig, http, webSocket } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

import { roundRobinHttp } from './roundRobinHttp'
import { OnchainKitProvider } from '@coinbase/onchainkit'

const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [base, baseSepolia],
    transports: {
      // RPC URL for each chain
      // [localChain.id]: http('http://127.0.0.1:8545'),
      // [base.id]: http(),
      [base.id]: roundRobinHttp([
        {url: 'https://mainnet.base.org'},
        {url: `https://api.developer.coinbase.com/rpc/v1/base/${apiKey}`},
        {url: 'https://chain-proxy.wallet.coinbase.com?targetName=base'},
        {url: 'https://base-mainnet.public.blastapi.io'},
        {url: 'https://base-mainnet.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'},
      ]),
      // [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'),
      // [baseSepolia.id]: webSocket('wss://base-sepolia.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'),
      // [baseSepolia.id]: webSocket('wss://go.getblock.io/d0aca3a299984a3ab6561fbb9cba99af'),
      // [baseSepolia.id]: roundRobinHttp([
      //   {url: 'https://sepolia.base.org'},
      //   {url: 'https://chain-proxy.wallet.coinbase.com?targetName=base-sepolia'},
      //   {url: 'https://quaint-aged-isle.base-sepolia.quiknode.pro/778cd5f53cd714ba78fc39caefafc9784b2cbb3a/'},
      //   {url: 'https://base-sepolia.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'},
      //   {url: 'https://base-sepolia.core.chainstack.com/f261d7b1c99ec08c17270535b5ac79b9'}, // 25 rps
      //   {url: 'https://base-sepolia.public.blastapi.io'}, // 10rps
      //   {url: 'https://go.getblock.io/044d67eda14144b6b5429b4daab0dc03'}, // 5rps
      // ]),
      // [sepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: 'c95656a6a5af8b81d90d49036fd23353',

    // Required App Info
    appName: 'PixelGame',

    // Optional App Info
    appDescription: 'Pixel games',
    appUrl: 'https://pixelgames.com', // your app's url
    appIcon: 'https://pixelgames.com/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)

const queryClient = new QueryClient()

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* <OnchainKitProvider
          apiKey={apiKey}
          chain={base}
          miniKit={{
            enabled: true,
            autoConnect: true,
            notificationProxyUrl: undefined,
          }}
        > */}
          <ConnectKitProvider>{children}</ConnectKitProvider>
        {/* </OnchainKitProvider> */}
      </QueryClientProvider>
    </WagmiProvider>
  )
}