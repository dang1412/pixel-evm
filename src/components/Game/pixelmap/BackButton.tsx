import { useCallback } from 'react'
import { FaArrowLeft } from 'react-icons/fa'

import { PixelMap } from './PixelMap'

export const BackButton: React.FC<{ mapRef: React.RefObject<PixelMap | undefined> }> = ({ mapRef }) => {
  const goBack = useCallback(() => {
    mapRef.current?.getView().activate('main')
  }, [])

  return (
    <button
      onClick={goBack}
      className="text-lg absolute top-16 left-1/2 -translate-x-1/2 text-gray-800 hover:text-blue-800 px-3 py-1"
    >
      <FaArrowLeft />
    </button>
  )
}
