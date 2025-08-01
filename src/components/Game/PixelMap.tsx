import { useEffect, useState } from 'react'
import { PointData } from 'pixi.js'

import { createViewportMap } from './helpers/createViewportMap'
import { mockImages } from './mock/images'
import { PixelImage } from './types'

const PixelInfo: React.FC<{x: number, y: number}> = ({x, y}) => {
  return (
    <span>(x: {x}, y: {y})</span>
  )
}

const ImageInfo: React.FC<{image: PixelImage}> = ({image}) => {
  const { title, subtitle, area } = image

  return (
    <div className="bg-white rounded-lg shadow p-4 w-64">
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <div className="text-sm text-gray-800">
        <span className="font-semibold">Position:</span>
        <span> ({area.x}, {area.y}) ({area.w} x {area.h})</span>
      </div>
      <p className="text-gray-600 mb-2">{subtitle}</p>
    </div>
  )
}

interface Props {}

const PixelMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const [infoPos, setInfoPos] = useState<PointData>({x: 100, y: 100})
  const [infoPixel, setInfoPixel] = useState<PointData>({x: 0, y: 0})
  const [image, setImage] = useState<PixelImage>()

  useEffect(() => {
    if (canvas) {
      console.log('Create game')
      const { vpmap, getImageFromPixel } = createViewportMap(canvas, mockImages)

      vpmap.subscribe('mousemove', (e: CustomEvent<[number, number]>) => {
        const [x, y] = e.detail
        setInfoPos({ x: x + 20, y })
      })

      vpmap.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
        const [x, y] = e.detail
        setInfoPixel({ x, y })

        const image = getImageFromPixel(x, y)
        setImage(image)
      })
    }
  }, [canvas])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />
      {image ?
        <div className='absolute p-1 rounded' style={{top: infoPos.y, left: infoPos.x}}>
          <ImageInfo image={image}/>
        </div> :
        <div className='absolute text-white bg-black p-1 rounded' style={{top: infoPos.y, left: infoPos.x}}>
          <PixelInfo x={infoPixel.x} y={infoPixel.y} />
        </div>
      }
    </>
  )
}

export default PixelMap
