interface GlobalState {
  address?: `0x${string}`
  giftBoxCooldownTime?: number
  boxes?: number[]
}

export const globalState: GlobalState = {}
