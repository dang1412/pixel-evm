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
  let i = Math.floor(Math.random() * configs.length)
  return (opts) => {
    // use viem's built-in http transport with that url
    return {
      // same shape viem expects
      ...http()(opts),
      request: async (args) => {
        // pick next url
        const config = configs[i]
        console.log('----------- Request -------------', config.url, args.method)
        i = isRoundRobinEnabled ? (i + 1) % configs.length : i
        return http(config.url, config.config)(opts).request(args)
      },
    }
  }
}
