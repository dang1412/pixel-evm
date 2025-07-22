import { PixiAnimation } from '../Animation'
import { ViewportMap } from '../ViewportMap'

export function createAnimation(map: ViewportMap) {
  const animation = new PixiAnimation((f) => {
    const unsub = map.subscribe('tick', (e: CustomEvent<number>) => {
      f(e.detail)
      map.markDirty()
    })

    return unsub
  })

  return animation
}
