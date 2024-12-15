import { Container, Graphics, RenderTexture, Renderer, Sprite } from 'pixi.js'

export class Minimap {
  private renderTexture: RenderTexture
  private viewBorder: Graphics
  private worldBorder: Graphics

  container: Container

  constructor(private renderer: Renderer) {
    const renderTexture = this.renderTexture = RenderTexture.create({ width: 120, height: 120 })
    const mapSprite = new Sprite(renderTexture)

    const worldBorder = this.worldBorder = new Graphics()
    const viewBorder = this.viewBorder = new Graphics()

    const container = this.container = new Container()

    container.addChild(mapSprite)
    container.addChild(worldBorder)
    container.addChild(viewBorder)
  }
 
  update(
    worldWidth: number,
    worldHeight: number,
    top: number,
    left: number,
    worldScreenWidth: number,
    worldScreenHeight: number,
    content: Container
  ) {
    const ratio = Math.max(120 / worldWidth, 120 / worldHeight)

    // update view border
    // world border
    this.worldBorder.clear()
    this.worldBorder
      .rect(0, 0, worldWidth * ratio, worldHeight * ratio)
      .fill({color: 'pink', alpha: 0.2})
      .stroke({width: 1, color: 'pink', alpha: 0.5})

    // view border
    this.viewBorder.clear()
    this.viewBorder
      .rect(left * ratio, top * ratio, worldScreenWidth * ratio, worldScreenHeight * ratio)
      .stroke({ width: 1, color: 0xCCC })

    // redraw minimap
    // this.mapSprite.scale.x = this.mapSprite.scale.y = ratio
    // update renderTexture size to cover whole map
    this.renderTexture.resize(worldWidth, worldHeight)

    this.renderer.render(content, {renderTexture: this.renderTexture})
  }
}