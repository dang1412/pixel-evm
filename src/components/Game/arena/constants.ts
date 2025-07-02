import { ActionType, MonsterDrawInfo, MonsterType } from "./types";

export const monsterInfos: Record<MonsterType, MonsterDrawInfo> = {
  [MonsterType.Axie]: {
    type: MonsterType.Axie,
    image: '/images/characters/axie.png',
    w: 1.4,
    h: 1,
  },
}

export const actionImages: Record<ActionType, string> = {
  [ActionType.Move]: '/svgs/walk.svg',
  [ActionType.Shoot]: '/svgs/crosshairs.svg',
  [ActionType.ShootBomb]: '/svgs/crosshairs.svg',
  [ActionType.ShootFire]: '/svgs/crosshairs.svg',
}
