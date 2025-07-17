import { encodeMonsters, decodeMonstersData, MonsterEncodeLength } from './monsters'
import { MonsterState, MapItemType, MonsterType } from '../types'

describe('monsters encode/decode', () => {
  const sampleMonster: MonsterState = {
    id: 7,
    ownerId: 2,
    type: MonsterType.Axie,
    hp: 10,
    vehicle: MapItemType.Car,
    pos: { x: 15, y: 25 },
    weapons: {
      [MapItemType.Bomb]: 3,
      [MapItemType.Fire]: 2,
    }
  }

  it('should encode and decode a single monster correctly', () => {
    const monsters = [sampleMonster]
    const encoded = encodeMonsters(monsters)
    expect(encoded.byteLength).toBe(monsters.length * MonsterEncodeLength + 2)

    const decoded = decodeMonstersData(encoded)
    expect(decoded).toEqual(monsters)
  })

  it('should encode and decode multiple monsters correctly', () => {
    const monsters: MonsterState[] = [
      sampleMonster,
      {
        id: 1,
        ownerId: 1,
        type: MonsterType.Hero,
        hp: 5,
        vehicle: MapItemType.None,
        pos: { x: 0, y: 0 },
        weapons: {
          [MapItemType.Bomb]: 0,
          [MapItemType.Fire]: 1,
        }
      }
    ]
    const encoded = encodeMonsters(monsters)
    expect(encoded.byteLength).toBe(monsters.length * MonsterEncodeLength + 2)

    const decoded = decodeMonstersData(encoded)
    expect(decoded).toEqual(monsters)
  })

  it('should handle edge values for id, hp, and weapons', () => {
    const monster: MonsterState = {
      id: 255,
      ownerId: 15,
      type: MonsterType.FamilyBrainrot,
      hp: 15,
      vehicle: MapItemType.Car,
      pos: { x: 255, y: 255 },
      weapons: {
        [MapItemType.Bomb]: 15,
        [MapItemType.Fire]: 15,
      }
    }
    const encoded = encodeMonsters([monster])
    const decoded = decodeMonstersData(encoded)
    expect(decoded).toEqual([monster])
  })

  it('should handle zero values for all fields', () => {
    const monster: MonsterState = {
      id: 0,
      ownerId: 0,
      type: MonsterType.Axie,
      hp: 0,
      vehicle: MapItemType.None,
      pos: { x: 0, y: 0 },
      weapons: {
        [MapItemType.Bomb]: 0,
        [MapItemType.Fire]: 0,
      }
    }
    const encoded = encodeMonsters([monster])
    const decoded = decodeMonstersData(encoded)
    expect(decoded).toEqual([monster])
  })
})
