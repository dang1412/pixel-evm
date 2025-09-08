import { http, HttpTransportConfig, type Transport } from 'viem'

interface HttpConfig {
  url: string
  config?: HttpTransportConfig
}

let isRoundRobinEnabled = true

export function enableRoundRobinHttp(isEnable: boolean) {
  isRoundRobinEnabled = isEnable
}

export function roundRobinHttp(configs: HttpConfig[]): Transport {
  let i = 0
  // let lastUsedSend = 0
  return (opts) => {
    // use viem's built-in http transport with that url
    return {
      // same shape viem expects
      ...http()(opts),
      request: async (args) => {
        // if (args.method === 'eth_sendRawTransaction') {
        //   lastUsedSend = i
        // }
        
        // pick next url
        // should use the same url of sending when receiving tx result
        // const config = configs[ args.method === 'eth_getTransactionReceipt' ? lastUsedSend : i ]
        const config = configs[i]
        console.log('----------- Request -------------', config.url, args.method)
        i = isRoundRobinEnabled ? (i + 1) % configs.length : i
        return http(config.url, config.config)(opts).request(args)
      },
    }
  }

  // return (opts) => {
  //   return {
  //     // same shape viem expects
  //     ...http(urls[i % urls.length])(opts),
  //     request: async (args) => {
  //       const url = urls[i % urls.length]
  //       i++
  //       return http(url)(opts).request(args)
  //     },
  //   }
  // }
}
