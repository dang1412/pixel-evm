import { PixelArea } from '../ViewportMap'
import { ActionType, MapItemType, MonsterDrawInfo, MonsterType } from './types'

export const monsterInfos: Record<MonsterType, MonsterDrawInfo> = {
  [MonsterType.Axie]: {
    type: MonsterType.Axie,
    image: '/images/characters/axie.png',
    w: 1.4,
    h: 1,
  },
  [MonsterType.Hero]: {
    type: MonsterType.Hero,
    image: '/images/characters/axie4.png',
    w: 1.4,
    h: 1.2,
    dy: -0.2,
  },
  [MonsterType.Aqua]: {
    type: MonsterType.Aqua,
    image: '/images/characters/axie3.png',
    w: 1.4,
    h: 1,
    dx: -0.1,
  },
  [MonsterType.Baby]: {
    type: MonsterType.Baby,
    image: '/images/characters/axie5.png',
    w: 1.35,
    h: 1,
    dx: -0.1,
  },
  [MonsterType.Tralarelo]: {
    type: MonsterType.Tralarelo,
    image: '/images/characters/Tralalero-Tralala.png',
    w: 1.33,
    h: 1.2,
    dx: -0.15,
    dy: -0.1,
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
    dx: -0.2,
    dy: -0.5,
  },
  [MonsterType.Saitama]: {
    type: MonsterType.Saitama,
    image: '/images/characters/saitama.png',
    w: 1.2,
    h: 1.5,
    dx: -0.1,
    dy: -0.25,
  },
  [MonsterType.Shadow]: {
    type: MonsterType.Shadow,
    image: '/images/characters/shadow.png',
    w: 1.4,
    h: 2,
    dx: -0.2,
    dy: -0.5,
  },
}

export const actionImages: Record<ActionType, string> = {
  [ActionType.None]: '/svgs/crosshairs.svg',
  [ActionType.Move]: '',
  [ActionType.Shoot]: '/images/energy2.png',
  [ActionType.ShootBomb]: '/svgs/bomb.svg',
  [ActionType.ShootRocket]: '/svgs/rocket.svg',
  [ActionType.ShootFire]: '/svgs/fire.svg',
  [ActionType.FinalBlow]: '/svgs/skull.svg',
  [ActionType.Drop]: '',
}

export const itemImages: Record<MapItemType, string> = {
  [MapItemType.None]: '',
  [MapItemType.Car]: '/svgs/car.svg',
  [MapItemType.Rocket]: '/svgs/rocket.svg',
  [MapItemType.Fire]: '/svgs/fire.svg',
  [MapItemType.Bomb]: '/svgs/bomb.svg',
}

// export const vehicleImages: Record<VehicleType, string> = {
//   [VehicleType.None]: '',
//   [VehicleType.Car]: itemImages[MapItemType.Car],
// }

export const damgeAreas: Partial<Record<ActionType, PixelArea>> = {
  [ActionType.Shoot]: { x: 0, y: 0, w: 1, h: 1 },
  [ActionType.ShootRocket]: { x: -1, y: -2, w: 3, h: 3 },
  [ActionType.ShootFire]: { x: -1, y: -2, w: 3, h: 3 },
}
