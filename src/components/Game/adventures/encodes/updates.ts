import { AdventureStateUpdates } from '../types'
import { decodeActionsView, encodeActionsView } from './actions'
import { decodeMonstersView, encodeMonstersView } from './states'

export function encodeUpdates(updates: AdventureStateUpdates): ArrayBuffer {
  const { actions } = updates

  const monsters = Object.values(updates.monsters)

  const buffer = new ArrayBuffer(2 + monsters.length * 4 + actions.length * 3)

  encodeMonstersView(new DataView(buffer), monsters)
  encodeActionsView(new DataView(buffer, 1 + monsters.length * 4), actions)

  return buffer
}

export function decodeUpdates(data: ArrayBuffer): AdventureStateUpdates {
  const updates: AdventureStateUpdates = { monsters: {}, actions: [] }
  const monsters = decodeMonstersView(new DataView(data))
  for (const monster of monsters) {
    updates.monsters[monster.id] = monster
  }

  updates.actions = decodeActionsView(new DataView(data, 1 + monsters.length * 4))

  return updates
}
