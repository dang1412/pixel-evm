import { Assets, Spritesheet, Texture } from 'pixi.js'

/**
 * Loading sheet with merging animations from linked sheets
 */
export async function loadMultiPackSpritesheet(path: string, animationName: string): Promise<Texture[]> {
  const sheet = await Assets.load<Spritesheet>(path)
  const linkedSheets = sheet.linkedSheets
  let textures: { [name: string]: Texture } = sheet.textures
  for (const linked of linkedSheets) {
    Object.assign(textures, linked.textures)
  }

  const animations = sheet.data.animations
  if (!animations) return []

  const textureArr = animations[animationName].map(name => textures[name])

  return textureArr
}

// export async function loadMultiPackSpritesheet(mainJsonPath: string) {
//   // Load the main JSON
//   const mainSheet = await Assets.load<Spritesheet>(mainJsonPath)
//   const related = mainSheet.data.meta.related_multi_packs as string[] || []

//   // Load all related packs
//   const allSheetPaths = [mainJsonPath, ...related.map(p => mainJsonPath.replace(/[^/]+$/, p))]
//   await Promise.all(allSheetPaths.map(path => Assets.load<Spritesheet>(path)))

//   // Now all frames are available in the global cache
//   return mainSheet
// }
