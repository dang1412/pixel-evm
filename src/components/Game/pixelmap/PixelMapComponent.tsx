import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Assets, PointData } from 'pixi.js'
import { useAccount } from 'wagmi'

import { mockImages } from '../mock/images'
import { PixelImage, PixelArea } from '../types'

import { PixelMap } from './PixelMap'
import { EditImage } from './EditImage'
import { BackButton } from './BackButton'
import { useMintPixels } from './api/useMintPixels'
import { getMintedPixels } from './api/getMintedPixels'
import { getUserPixels } from './api/getUserPixels'
import { xyToPosition } from '../utils'
import { FaSpinner } from 'react-icons/fa'
import { useNotification } from '@/providers/NotificationProvider'

const PixelInfo: React.FC<{x: number, y: number, owner: string}> = ({x, y, owner}) => {
  const short = useMemo(() => {
    if (!owner) return ''
    return owner.slice(0, 6) + '...' + owner.slice(-4)
  }, [owner])

  return (
    <div className='bg-white p-2 shadow rounded-lg font-semibold'>
      <span className='text-gray-600'>({x}, {y})</span>
      {short && <p className='text-sm text-gray-600'>{short}</p>}
    </div>
  )
}

const ImageInfo: React.FC<{p: PointData, image: PixelImage}> = ({p, image}) => {
  const { title, subtitle, area } = image

  return (
    <div className="bg-white font-semibold rounded-lg shadow px-4 py-2 max-w-64">
      <span className="text-gray-600">({p.x}, {p.y})</span>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <div className="text-sm text-gray-800 font-semibold">
        <span>({area.x}, {area.y})</span>
        <span> ({area.w} x {area.h})</span>
      </div>
      <p className="text-gray-600">{subtitle}</p>
      <a href={image.link} target="_blank" className="text-xs text-blue-600 underline">{image.link}</a>
    </div>
  )
}

interface SelectPixelsProps {
  area: PixelArea
  actionText: string
  takeAction: () => void
  image?: PixelImage
}

const SelectPixels: React.FC<SelectPixelsProps> = ({ area, actionText, takeAction, image }) => {
  const { x, y, w, h } = area

  return (
    <div className="bg-white p-4 rounded-lg shadow font-semibold max-w-64">
      {!image && <h2 className="text-sm mb-1">Selecting {w * h} pixels</h2>}
      <p className="text-gray-600">({x}, {y}) ({w} x {h})</p>

      {image && <div>
        <h2 className="text-xl font-bold mb-1">{image.title}</h2>
        <div className="text-sm text-gray-800 font-semibold">
          <span>({image.area.x}, {image.area.y})</span>
          <span> ({image.area.w} x {image.area.h})</span>
        </div>
        <p className="text-gray-600">{image.subtitle}</p>
        <a href={image.link} target="_blank" className="text-xs text-blue-600 underline">{image.link}</a>
      </div>}

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
  const mapRef = useRef<PixelMap | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const [pointerPos, setPointerPos] = useState<PointData>({x: 100, y: 100})
  const [pointerPixel, setPointerPixel] = useState<PointData>({x: 0, y: 0})
  const [image, setImage] = useState<PixelImage>()

  const [selectArea, setSelectArea] = useState<PixelArea | undefined>()

  const [curScene, setCurScene] = useState<string>('')

  const [owner, setOwner] = useState<string>('')

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
        if (shouldUpdatePointer) {
          const [x, y] = e.detail
          setPointerPixel({ x, y })
          const image = pixelMap.getImageFromSceneXY(vpmap.activeScene, x, y)
          setImage(image)
          // update owner
          if (vpmap.activeScene === 'main') {
            const owner = pixelMap.getPixelOwner(x, y)
            setOwner(owner || '')
          } else {
            setOwner('')
          }
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

  const { mintPixels } = useMintPixels()

  const { owners, areas } = getMintedPixels()

  const { address } = useAccount()
  const userAreas = getUserPixels(address)

  useEffect(() => {
    const map = mapRef.current
    const view = map?.getView()
    if (map && view) {
      console.log('Load minted pixels:', areas, owners)

      areas.forEach((area, i) => {
        const owner = owners[i] || ''
        map.addPixels(area, owner)
      })
    }
  }, [areas, owners])

  useEffect(() => {
    const map = mapRef.current
    const view = map?.getView()
    if (map && view) {
      map.clearOwnedPixels()
      for (const area of userAreas) {
        // get top-left pixel
        const pixel = xyToPosition(area.x, area.y)
        map.addOwnedPixel(pixel)
      }
    }
  }, [userAreas])

  // when user click button
  const doAction = useCallback(async () => {
    if (!action || !selectArea || !address) return
    if (action.mintable) {
      // draw on the map
      const map = mapRef.current
      const view = map?.getView()
      if (map && view) {
        // mint
        try {

          await mintPixels(selectArea.x, selectArea.y, selectArea.w, selectArea.h)
          // update map
          const pixel = xyToPosition(selectArea.x, selectArea.y)
          map.addPixels(selectArea, address)
          map.addOwnedPixel(pixel)
          // clear select
          view.clearSelect()
        } catch (error) {
        } finally {}
      }
    } else if (action.uploadable) {
      fileInputRef.current?.click()
    } else if (action.editable) {
      setEnableEdit(true)
    }
  }, [selectArea, action, address, mintPixels])

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

  const { loading } = useNotification()

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
            <EditImage mapRef={mapRef} image={action?.editable} /> :
          selectArea ?
            <SelectPixels area={selectArea} actionText={actionText} takeAction={doAction} image={image} /> :
          image ?
            <ImageInfo image={image} p={pointerPixel}/> :
            <PixelInfo x={pointerPixel.x} y={pointerPixel.y} owner={owner} />
        }
      </div>
      <div className='absolute top-16 left-1/2 -translate-x-1/2'>
        {curScene && curScene !== 'main' && <BackButton map={mapRef.current} />}
      </div>

      {/* Loading */}
      <div className='w-full absolute top-16 flex items-center justify-center'>
        { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
      </div>
    </>
  )
}

export default PixelMapComponent
