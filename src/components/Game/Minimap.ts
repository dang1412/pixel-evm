import { Container, Graphics, RenderTexture, Renderer, Sprite } from 'pixi.js'
import { ViewportMap } from './ViewportMap'

export class Minimap {
  private renderTexture: RenderTexture
  private mapSprite: Sprite
  private viewBorder: Graphics
  private worldBorder: Graphics

  container: Container

  constructor(private renderer: Renderer, private map: ViewportMap) {
    const renderTexture = this.renderTexture = RenderTexture.create({ width: 120, height: 120 })
    const mapSprite = this.mapSprite = new Sprite(renderTexture)

    const worldBorder = this.worldBorder = new Graphics()
    const viewBorder = this.viewBorder = new Graphics()

    const container = this.container = new Container()

    container.addChild(mapSprite)
    container.addChild(worldBorder)
    container.addChild(viewBorder)

    let shouldUpdate = false
    map.subscribe('updated', () => shouldUpdate = true)

    // update every 0.5s
    setInterval(() => {
      if (shouldUpdate) {
        if (this.update()) shouldUpdate = false
      }
    }, 500)

    const view = map.viewport!
    view.on('zoomed', () => this.updateViewBorder())
    view.on('moved', () => this.updateViewBorder())
  }
 
  private update() {
    const scene = this.map.getActiveScene()
    if (!this.map.viewport || !scene) return false

    console.log('Update mini map content')

    const container = scene.container

    const { worldWidth, worldHeight } = this.map.viewport
    const ratio = Math.max(120 / worldWidth, 120 / worldHeight)

    // world border
    this.worldBorder.clear()
    this.worldBorder
      .rect(0, 0, worldWidth * ratio, worldHeight * ratio)
      .fill({color: 'pink', alpha: 0.2})
      .stroke({width: 1, color: 'pink', alpha: 0.5})

    // view border
    this.updateViewBorder(ratio)

    // redraw minimap
    this.mapSprite.scale.x = ratio * worldWidth / 120
    this.mapSprite.scale.y = ratio * worldHeight / 120
    // update renderTexture size to cover whole map
    this.renderTexture.resize(worldWidth, worldHeight)

    // this.renderer.render(container, {renderTexture: this.renderTexture})
    this.renderer.render({ container, target: this.renderTexture })

    this.map.markDirty()

    return true
  }

  private updateViewBorder(_r?: number) {
    if (!this.map.viewport) return
    const { top, left, worldScreenWidth, worldScreenHeight, worldWidth, worldHeight } = this.map.viewport
    const ratio = _r || Math.max(120 / worldWidth, 120 / worldHeight)

    // view border
    this.viewBorder.clear()
    this.viewBorder
      .rect(left * ratio, top * ratio, worldScreenWidth * ratio, worldScreenHeight * ratio)
      .stroke({ width: 1, color: 0xCCC })
  }
}