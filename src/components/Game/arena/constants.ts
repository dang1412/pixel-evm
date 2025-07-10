import { PixelArea } from '../ViewportMap'
import { ActionType, MapItemType, MonsterDrawInfo, MonsterType } from './types'

export const monsterInfos: Record<MonsterType, MonsterDrawInfo> = {
  [MonsterType.Axie]: {
    type: MonsterType.Axie,
    image: '/images/characters/axie.png',
    w: 1.4,
    h: 1,
  },
  [MonsterType.Tralarelo]: {
    type: MonsterType.Tralarelo,
    image: '/images/characters/Tralalero-Tralala.png',
    w: 1.4,
    h: 1,
  },
  [MonsterType.TrippiTroppi]: {
    type: MonsterType.TrippiTroppi,
    image: '/images/characters/Trippi-Troppi.png',
    w: 1,
    h: 1,
  },
  [MonsterType.FamilyBrainrot]: {
    type: MonsterType.FamilyBrainrot,
    image: '/images/characters/family_brainrot.png',
    w: 1.4,
    h: 2,
  },
}

export const actionImages: Record<ActionType, string> = {
  [ActionType.None]: '/svgs/crosshairs.svg',
  [ActionType.Move]: '',
  [ActionType.Shoot]: '/images/energy2.png',
  [ActionType.ShootBomb]: '/svgs/rocket.svg',
  [ActionType.ShootFire]: '/svgs/fire.svg',
  [ActionType.Drop]: '',
}

export const itemImages: Record<MapItemType, string> = {
  [MapItemType.Car]: '/svgs/car.svg',
  [MapItemType.Bomb]: '/svgs/rocket.svg',
  [MapItemType.Fire]: '/svgs/rocket.svg',
}

// export const vehicleImages: Record<VehicleType, string> = {
//   [VehicleType.None]: '',
//   [VehicleType.Car]: itemImages[MapItemType.Car],
// }

export const damgeAreas: Partial<Record<ActionType, PixelArea>> = {
  [ActionType.Shoot]: { x: 0, y: 0, w: 1, h: 1 },
  [ActionType.ShootBomb]: { x: -1, y: -2, w: 3, h: 3 },
  [ActionType.ShootFire]: { x: -1, y: -2, w: 3, h: 3 },
}
