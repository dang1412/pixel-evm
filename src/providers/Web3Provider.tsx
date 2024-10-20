import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, baseSepolia, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [baseSepolia, mainnet],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(),
      [baseSepolia.id]: http('https://base-sepolia.blockpi.network/v1/rpc/public'),
      [sepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: 'c95656a6a5af8b81d90d49036fd23353',

    // Required App Info
    appName: 'Pixel EVM',

    // Optional App Info
    appDescription: 'Pixel games',
    appUrl: 'https://family.co', // your app's url
    appIcon: 'https://family.co/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
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