import { useState } from 'react'

import { PixelImage } from '../types'
import { PixelMap } from './PixelMap'

interface EditImageProps {
  mapRef: React.RefObject<PixelMap | undefined>
  image: PixelImage
}

export const EditImage: React.FC<EditImageProps> = ({ mapRef, image }) => {
  const [title, setTitle] = useState(image.title)
  const [subtitle, setSubtitle] = useState(image.subtitle)
  const [link, setLink] = useState(image.link)

  const [scene] = useState(mapRef.current?.getView().activeScene)

  const handleUpdate = () => {
    // You may want to call a prop or context to update the image
    // For now, just log the updated values
    console.log('Update image:', { title, subtitle, link })

    image.title = title
    image.subtitle = subtitle
    image.link = link

    mapRef.current?.getView().clearSelect()
  }

  const handleRemove = () => {
    // You may want to call a prop or context to remove the image
    // For now, just log the removal
    console.log('Remove image:', image)
    mapRef.current?.getView().clearSelect()
    mapRef.current?.removePixelImage(scene || '', image)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-96 flex flex-col gap-3">
      <h2 className="text-lg font-bold mb-2">Edit Image</h2>
      <label className="text-sm font-semibold">Title</label>
      <input
        className="border rounded px-2 py-1 mb-2"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <label className="text-sm font-semibold">Description</label>
      <textarea
        className="border rounded px-2 py-1 mb-2"
        value={subtitle}
        onChange={e => setSubtitle(e.target.value)}
      />
      <label className="text-sm font-semibold">URL</label>
      <input
        className="border rounded px-2 py-1 mb-2"
        value={link}
        onChange={e => setLink(e.target.value)}
      />
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
          onClick={handleUpdate}
        >
          Update
        </button>
        <button
          className="flex-1 bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700"
          onClick={handleRemove}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
