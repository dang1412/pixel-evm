import { Container, Graphics, RenderTexture, Renderer, Sprite } from 'pixi.js'

export class Minimap {
  private renderTexture: RenderTexture
  private mapSprite: Sprite
  private viewBorder: Graphics
  private worldBorder: Graphics

  container: Container

  constructor(private renderer: Renderer) {
    const renderTexture = this.renderTexture = RenderTexture.create({ width: 1000, height: 1000 })
    const mapSprite = this.mapSprite = new Sprite(renderTexture)

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
    // this.worldBorder.beginFill('pink', 0.2)
    this.worldBorder
      // .lineStyle(1, 'pink', 0.5)
      .rect(0, 0, worldWidth * ratio, worldHeight * ratio)
      .fill({color: 'pink', alpha: 0.2})
      .stroke({width: 1, color: 'pink', alpha: 0.5})
    // this.worldBorder.endFill()

    // view border
    this.viewBorder.clear()
    this.viewBorder
      // .lineStyle(1, 0xCCC)
      .rect(left * ratio, top * ratio, worldScreenWidth * ratio, worldScreenHeight * ratio)
      .stroke({ width: 1, color: 0xCCC })

    // redraw minimap
    this.mapSprite.scale.x = this.mapSprite.scale.y = ratio
    // update renderTexture size to cover whole map
    this.renderTexture.resize(worldWidth, worldHeight)

    this.renderer.render(content, {renderTexture: this.renderTexture})
  }
}