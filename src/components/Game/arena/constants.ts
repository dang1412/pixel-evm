import { ActionType, MapItemType, MonsterDrawInfo, MonsterType, VehicleType } from "./types";

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
  [ActionType.Move]: '/svgs/walk.svg',
  [ActionType.Shoot]: '/svgs/crosshairs.svg',
  [ActionType.ShootBomb]: '/svgs/crosshairs.svg',
  [ActionType.ShootFire]: '/svgs/crosshairs.svg',
  [ActionType.DropVehicle]: '',
}

export const itemImages: Record<MapItemType, string> = {
  [MapItemType.Car]: '/svgs/car.svg',
  [MapItemType.Bomb]: '/svgs/rocket.svg',
  [MapItemType.Fire]: '/svgs/rocket.svg',
}

export const vehicleImages: Record<VehicleType, string> = {
  [VehicleType.None]: '',
  [VehicleType.Car]: itemImages[MapItemType.Car],
}
