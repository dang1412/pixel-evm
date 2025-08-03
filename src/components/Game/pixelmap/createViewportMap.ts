import { ViewportMap } from '../ViewportMap'

/**
 * Create viewport map 100x100
 * 
 * @param c HTMLCanvasElement
 * @returns vpmap: ViewportMap
 */
export function createViewportMap(c: HTMLCanvasElement) {
  const vpmap = new ViewportMap(c)
  // Create an instance of ResizeObserver
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      // adjust the canvas size since we only watch canvas
      const {width, height} = entry.contentRect
      vpmap.resize(width - 2, height - 2)
    }
  })

  resizeObserver.observe(c.parentNode as HTMLDivElement)

  // init map with main scene, move to center
  ;(async () => {
    const { width, height } = (c.parentNode as HTMLDivElement).getBoundingClientRect()
    await vpmap.init(width - 2, height - 2)
  })()

  const disconnect = () => resizeObserver.disconnect()

  return { vpmap, disconnect }
}

// export async function initMainMapWithImages(map: ViewportMap, images: PixelImage[]) {
//   await map.initialize
//   const main = map.getScene('main')
//   if (!main) return

//   main.loadImages(images)

//   setPixelToImage(images)

//   // map pixel to image_index
//   // const pixelImageIndexMap: {[pixel: number]: number} = {}
//   // for (let i = 0; i < images.length; i++) {
//   //   const image = images[i]
//   //   const pixels = getAreaPixels(image.area)
//   //   for (const pixel of pixels) {
//   //     pixelImageIndexMap[pixel] = i
//   //   }
//   // }

//   const pixelSceneMap: {[pixel: number]: string} = {}

//   // open scene
//   const openPixelImage = (p: number) => {
//     const image = getImageFromPixel(p)
//     if (!image) return false

//     const { x, y, w, h } = image.area
//     const pixel = xyToPosition(x, y)
//     const sceneName = `${pixel}`

//     if (!pixelSceneMap[pixel]) {
//       // create new scene
//       const scene = map.addScene(sceneName, w * 10, h * 10, image.imageUrl)
//       pixelSceneMap[pixel] = sceneName
//       // load subImages in scene
//       if (image.subImages) scene.loadImages(image.subImages)
//     }

//     map.activate(sceneName)

//     return true
//   }

//   // draw go back button
//   await Assets.load(['/svgs/back.svg'])
//   const button = new ButtonContainer(
//     new Sprite(Texture.from('/svgs/back.svg'))
//   )

//   button.visible = false
//   button.x = 12
//   button.y = 12
//   button.onPress.connect(() => {
//     map.activate('main')
//     button.visible = false
//   })

//   map.wrapper.addChild(button)

//   // open scene when click on image
//   map.subscribe('pixelclick', (e) => {
//     if (map.activeScene !== 'main') {
//       return
//     }
//     const [x, y] = e.detail
//     // open map
//     const pixel = xyToPosition(x, y)
//     if (openPixelImage(pixel)) {
//       button.visible = true
//     }
//   })
// }
