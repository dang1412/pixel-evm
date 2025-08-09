import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Assets, PointData } from 'pixi.js'

import { mockImages } from './mock/images'
import { PixelImage, PixelArea } from './types'
import { PixelMap } from './pixelmap/PixelMap'
import { EditImage } from './pixelmap/EditImage'
import { BackButton } from './pixelmap/BackButton'

const PixelInfo: React.FC<{x: number, y: number}> = ({x, y}) => {
  return (
    <span className='bg-white p-2 shadow rounded-lg text-gray-800'>({x}, {y})</span>
  )
}

const ImageInfo: React.FC<{p: PointData, image: PixelImage}> = ({p, image}) => {
  const { title, subtitle, area } = image

  return (
    <div className="bg-white rounded-lg shadow px-4 py-2 w-64">
      <span className="text-gray-800">({p.x}, {p.y})</span>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <div className="text-sm text-gray-800 font-semibold">
        <span>({area.x}, {area.y})</span>
        <span> ({area.w} x {area.h})</span>
      </div>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  )
}

interface SelectPixelsProps {
  area: PixelArea
  actionText: string
  takeAction: () => void
}

const SelectPixels: React.FC<SelectPixelsProps> = ({ area, actionText, takeAction }) => {
  const { x, y, w, h } = area

  return (
    <div className="bg-white p-4 rounded-lg shadow font-semibold flex flex-col items-center">
      <h2 className="text-sm mb-1">Selecting {w * h} pixels</h2>
      <p className="text-gray-600">({x}, {y}) ({w} x {h})</p>
      {actionText && 
      <button
        onClick={takeAction}
        className="mt-2 py-1 px-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {actionText}
      </button>}
    </div>
  )
}

interface Props {}

const PixelMapComponent: React.FC<Props> = (props) => {
  // use ref to hold viewport map instance
  const mapRef = useRef<PixelMap | undefined>()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const [pointerPos, setPointerPos] = useState<PointData>({x: 100, y: 100})
  const [pointerPixel, setPointerPixel] = useState<PointData>({x: 0, y: 0})
  const [image, setImage] = useState<PixelImage>()

  const [selectArea, setSelectArea] = useState<PixelArea | undefined>()

  const [curScene, setCurScene] = useState<string>('')

  // action after select
  const action = useMemo(() => mapRef.current?.getAreaOperatable(selectArea), [selectArea])
  const actionText = useMemo(() => {
    if (!action) return ''
    if (action.mintable) return 'mint'
    if (action.uploadable) return 'image'
    if (action.editable) return 'edit'
    return ''
  }, [action])

  const [enableEdit, setEnableEdit] = useState(false)

  useEffect(() => {
    if (canvas && mapRef.current === undefined) {
      console.log('Create game')
      // const { vpmap } = createViewportMap(canvas, mockImages)
      const pixelMap = new PixelMap(canvas)
      pixelMap.addMainImages(mockImages)
      mapRef.current = pixelMap

      const vpmap = pixelMap.getView()

      // Setup images
      // setPixelToImage(mockImages)

      // Handle viewport events
      let shouldUpdatePointer = true
      vpmap.subscribe('mousemove', (e: CustomEvent<[number, number]>) => {
        const [x, y] = e.detail
        if (shouldUpdatePointer) setPointerPos({ x: x + 30, y })
      })

      vpmap.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
        const [x, y] = e.detail
        if (shouldUpdatePointer) {
          setPointerPixel({ x, y })
          const image = pixelMap.getImageFromPoint(vpmap.activeScene, x, y)
          setImage(image)
        }
      })

      // pixel select
      vpmap.subscribe('pixelselect', (e: CustomEvent<PixelArea>) => {
        const area = e.detail
        setSelectArea(area)
        shouldUpdatePointer = true
        console.log('Selected area:', area)
      })

      // select clear
      vpmap.subscribe('pixelselectclear', () => {
        setSelectArea(undefined)
        setEnableEdit(false)
        shouldUpdatePointer = true
      })

      // select end
      vpmap.subscribe('pixelselectend', () => {
        shouldUpdatePointer = false
      })

      // current scene
      vpmap.subscribe('sceneactivated', (event: CustomEvent) => {
        console.log('Scene activated:', event.detail)
        setCurScene(event.detail)
      })
    }
  }, [canvas])

  // when user click button
  const doAction = useCallback(() => {
    if (!action || !selectArea) return
    if (action.mintable) {
      // draw on the map
      const map = mapRef.current
      const view = map?.getView()
      if (map && view) {
        // const g = scene.drawColorArea(selectArea, 0x00ff00, 0.25)
        map.addOwnedPixels(selectArea)
        view.clearSelect()
      }
    } else if (action.uploadable) {
      fileInputRef.current?.click()
    } else if (action.editable) {
      setEnableEdit(true)
    }
  }, [selectArea, action])

  // upload image
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // clean input file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (!file) return

    const title = file.name
    const reader = new FileReader()
    reader.onload = async function(ev) {
      const map = mapRef.current
      const view = map?.getView()
      if (!map || !view || !selectArea) return

      map.addPixelImage(view.activeScene, {
        imageUrl: ev.target?.result as string,
        area: selectArea,
        title,
        subtitle: '',
        link: '',
      })

      setSelectArea({...selectArea})
      setEnableEdit(true)
    }
    reader.readAsDataURL(file)
  }, [selectArea])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />
      <div className='absolute' style={{top: pointerPos.y, left: pointerPos.x}}>
        { enableEdit && action?.editable ?
          <EditImage mapRef={mapRef} image={action.editable} /> :
          selectArea ?
          <SelectPixels area={selectArea} actionText={actionText} takeAction={doAction} /> :
          image ?
          <ImageInfo image={image} p={pointerPixel}/> :
          <PixelInfo x={pointerPixel.x} y={pointerPixel.y} />
        }
      </div>
      {curScene && curScene !== 'main' && <BackButton mapRef={mapRef} />}
    </>
  )
}

export default PixelMapComponent
