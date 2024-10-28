import { MonsterInfo, MonsterType } from './types'

export const monsterInfos: {[k in MonsterType]: Partial<MonsterInfo>} = {
  // [MonsterType.AXIE]: {
  //   image: '/images/saitama_fight.png',
  //   w: 2,
  //   h: 2.4,
  //   offY: -0.2
  // },
  // [MonsterType.SONIC]: {
  //   image: '/images/sonic_stand.png',
  //   imageMove: '/images/sonic_move.png',
  //   w: 2,
  //   h: 3.2,
  //   offY: -0.2,
  //   moveRange: 15,
  //   shootRange: 6,
  //   shootSpeed: 400,
  // },
  // [MonsterType.SHINIC]: {
  //   image: '/images/shinic.webp',
  //   w: 2,
  //   h: 2,
  //   offX: -0.3
  // },
  // [MonsterType.SHINIC2]: {
  //   image: '/images/shinic_run.webp',
  //   w: 2,
  //   h: 2,
  //   shootSpeed: 200,
  //   shootRange: 6,
  // },
  // [MonsterType.SHADOW]: {
  //   image: '/images/shadow.png',
  //   w: 2,
  //   h: 2.4,
  //   offY: -0.2,
  //   shootSpeed: 200,
  //   shootRange: 8,
  //   moveRange: 8,
  // },
  [MonsterType.MEGAMAN]: {
    image: 'mm-move-0.png',
    w: 2,
    h: 2.4,
    // offY: -0.2,
    shootSpeed: 200,
    shootRange: 8,
    moveRange: 8,
  },
}

export function getMonsterInfo(type: MonsterType): MonsterInfo {
  const info = monsterInfos[type]

  return {
    image: info.image || '',
    imageMove: info.imageMove || info.image || '',
    w: info.w || 1,
    h: info.h || 1,
    offX: info.offX || 0,
    offY: info.offY || 0,

    moveRange: info.moveRange || 4,
    shootRange: info.shootRange || 4,
    shootSpeed: info.shootSpeed || 600,
  }
}

export function getMonsterTypes(): MonsterType[] {
  return Object.keys(monsterInfos)
    .map((type) => Number(type) as MonsterType)
    // .map((type) => [type, monsterInfos[type as MonsterType].image || ''])
}
