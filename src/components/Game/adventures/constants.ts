import { MonsterInfo, MonsterType } from './types'

export const monsterInfos: {[k in MonsterType]: Partial<MonsterInfo>} = {
  [MonsterType.MEGAMAN]: {
    spritesheet: '/animations/megaman/mm-01.json',
    image: 'mm-move-0.png',
    w: 1,
    h: 2,
    moveSpeed: 2.8
  },
  [MonsterType.NINJA]: {
    spritesheet: '/animations/ninja/ninja.json',
    image: 'ninja-0.png',
    w: 1,
    h: 2,
    moveSpeed: 2.8
  },
  [MonsterType.MONSTER]: {
    spritesheet: '/animations/monster/monster1.json',
    image: 'Troll_01_1_IDLE_000.png',
    w: 2,
    h: 2,
    moveSpeed: 2
  },
}

export function getMonsterInfo(type: MonsterType): MonsterInfo {
  const info = monsterInfos[type]

  return {
    spritesheet: info.spritesheet || '',
    image: info.image || '',
    imageMove: info.imageMove || info.image || '',
    w: info.w || 1,
    h: info.h || 1,
    offX: info.offX || 0,
    offY: info.offY || 0,

    moveRange: info.moveRange || 4,
    shootRange: info.shootRange || 4,
    shootSpeed: info.shootSpeed || 600,

    moveSpeed: info.moveSpeed || 1,
  }
}

export function getMonsterTypes(): MonsterType[] {
  return Object.keys(monsterInfos)
    .map((type) => Number(type) as MonsterType)
}

export const LOOP_TIME = 400
