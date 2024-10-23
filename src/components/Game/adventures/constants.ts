import { MonsterDrawInfo, MonsterType } from './types'

export const monsterInfos: {[k in MonsterType]: Partial<MonsterDrawInfo>} = {
  [MonsterType.AXIE]: { 
    image: '/images/axie.png',
    w: 1.3,
    h: 1
  },
  [MonsterType.SONIC]: {
    image: '/images/sonic.webp',
    imageMove: '/images/sonic_run.webp',
    w: 2.6,
    h: 3,
    offX: -0.3
  },
  [MonsterType.NINE]: {
    image: '/images/nine.png',
    // imageMove: '/images/nine_run.png',
    w: 2.6,
    h: 3,
    offX: -0.3
  },
  [MonsterType.SHINIC]: {
    image: '/images/shinic.webp',
    imageMove: '/images/shinic_run.webp',
    w: 2,
    h: 2,
    offX: -0.3
  }
}

export function getMonsterInfo(type: MonsterType): MonsterDrawInfo {
  const info = monsterInfos[type]

  return {
    image: info.image || '',
    imageMove: info.imageMove || info.image || '',
    w: info.w || 1,
    h: info.h || 1,
    offX: info.offX || 0,
    offY: info.offY || 0,
  }
}

export function getMonsters(): [MonsterType, string][] {
  return Object.keys(monsterInfos)
    .map((type) => Number(type) as MonsterType)
    .map((type) => [type, monsterInfos[type as MonsterType].image || ''])
}
