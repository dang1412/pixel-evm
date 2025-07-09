import { ActionType, MapItemType, MonsterDrawInfo, MonsterType } from "./types";

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
