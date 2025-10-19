import { useMemo } from 'react'
import { useAccount, useCapabilities, useChainId } from 'wagmi'

import { AccountCapabilities } from './types'

export function useAccountCapabilities(): AccountCapabilities {
  const { address: account } = useAccount()
  const chainId = useChainId()

  // Check for paymaster capabilities with `useCapabilities`
  const { data: availableCapabilities } = useCapabilities({
    account,
  });

  const capabilities = useMemo(() => {
    if (!availableCapabilities) return {};
    const capabilitiesForChain = availableCapabilities[chainId];
    if (
      capabilitiesForChain['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    ) {
      return {
        paymasterService: {
          url: `https://api.developer.coinbase.com/rpc/v1/base/hHOoAqY8XRuGls2QW5rV8qTxZhqZx9Ys`, //For production use proxy
        },
      };
    }
    return {};
  }, [availableCapabilities, chainId]);

  return capabilities
}
