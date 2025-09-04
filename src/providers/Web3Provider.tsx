import { WagmiProvider, createConfig, http, webSocket } from 'wagmi'
import { mainnet, baseSepolia, sepolia } from 'wagmi/chains'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

import { localChain } from './chains/local'

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [baseSepolia, mainnet],
    transports: {
      // RPC URL for each chain
      [localChain.id]: http('http://127.0.0.1:8545'),
      [mainnet.id]: http(),
      // [baseSepolia.id]: http('https://base-sepolia.blockpi.network/v1/rpc/public'),
      // [baseSepolia.id]: http('https://base-sepolia.gateway.tenderly.co'),
      // [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'),
      [baseSepolia.id]: webSocket('wss://base-sepolia.g.alchemy.com/v2/SGhknXwY9r_VlRV44vghO0RfBXc1nhcB'),
      [sepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: 'c95656a6a5af8b81d90d49036fd23353',

    // Required App Info
    appName: 'Pixel EVM',

    // Optional App Info
    appDescription: 'Pixel games',
    appUrl: 'https://pixelgames.com', // your app's url
    appIcon: 'https://pixelgames.com/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
)

const queryClient = new QueryClient()

export const Web3Provider = ({ children }: { children: JSX.Element }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}