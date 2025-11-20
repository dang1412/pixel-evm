import React, { useEffect, useRef, useState } from 'react'
import { FaTimes, FaCopy, FaCheck } from 'react-icons/fa'
import QRCode from 'qrcode'

interface HostQrProps {
  url: string
  onClose: () => void
}

/**
 * Renders a modal displaying a QR code for a given URL with copy functionality.
 * @param {object} props
 * @param {string} props.url - The URL to generate QR code for
 * @param {function} props.onClose - Function to call when the modal should be closed
 */
export const ShareHostQr: React.FC<HostQrProps> = ({ url, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error('QR Code generation error:', error)
        }
      )
    }
  }, [url])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Join Game
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full p-1"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <canvas ref={canvasRef} />
          </div>

          {/* URL Display */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors flex items-center gap-2"
                aria-label="Copy URL"
              >
                {copied ? (
                  <>
                    <FaCheck /> Copied
                  </>
                ) : (
                  <>
                    <FaCopy /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 w-full">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Scan the QR code or share the URL to let others join your game.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
