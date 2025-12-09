import React, { useCallback, useEffect, useState } from 'react'
import { FaTimes, FaFacebook, FaTelegram } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

import { PlayerState } from './types'
import { createShareImage } from './utils/createShareImage'
import { generateUploadUrl } from './api/generateUploadUrl'

interface Prop {
  players: PlayerState[]
  gameId: number
  round: number
  playerId: number
  onClose: () => void
}

export const ShareSocialModal: React.FC<Prop> = ({ players, gameId, round, playerId = 1, onClose }) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [shareContent, setShareContent] = useState<string>('🎮 Check out my Bomb Game results! 💣')

  useEffect(() => {
    // Generate the share image when modal opens
    console.log('Generating share image for players:', players)
    createShareImage(players, round, (dataUrl) => {
      setImageDataUrl(dataUrl)
    })
  }, [players, round])

  const uploadImage = useCallback(async () => {
    // if (!imageDataUrl) return
    // const link = document.createElement('a')
    // link.href = imageDataUrl
    // link.download = `bomb-game-results-${Date.now()}.png`
    // document.body.appendChild(link)
    // link.click()
    // document.body.removeChild(link)

    if (!imageDataUrl) return

    const name = `${gameId}-${round}-${playerId}-${Date.now()}.png`

    const uploadUrl = await generateUploadUrl(name, 'image/png')
    console.log('Generated upload URL:', uploadUrl)

    // Convert data URL to blob directly
    const res = await fetch(imageDataUrl)
    const blob = await res.blob()

    console.log('Blob size:', blob.size, 'Blob type:', blob.type)

    // Upload the image to S3
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
      },
      body: blob,
    })

    if (response.ok) {
      const publicUrl = uploadUrl.split('?')[0] // Remove query params to get public URL
      console.log('Image uploaded successfully. Public URL:', publicUrl)
      return name
    } else {
      const errorText = await response.text()
      console.error('Failed to upload image to S3. Status:', response.status)
      console.error('Error Body:', errorText)
    }

  }, [imageDataUrl, gameId, round, playerId])

  const handleShareFacebook = async () => {
    if (!imageDataUrl) {
      alert('Please wait for the image to generate')
      return
    }

    // Facebook doesn't support direct image upload via URL parameters
    // Download the image and prompt user to upload manually
    const img = uploadImage()
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(shareContent)
    
    setTimeout(() => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank')
    }, 500)
  }

  const handleShareX = useCallback(async () => {
    if (!imageDataUrl) {
      alert('Please wait for the image to generate')
      return
    }

    // X (Twitter) doesn't support direct image upload via URL
    // Download the image first, then open Twitter share
    // const name = `${gameId}-${round}-${playerId}.png`
    const name = await uploadImage()
    const shareUrl = `https://api.pixelonbase.com/bombshare/${gameId}?img=${name}&round=${round}&playerId=${playerId}`
    const text = encodeURIComponent(shareContent + '\n\n' + shareUrl)
    
    setTimeout(() => {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    }, 500)
  }, [imageDataUrl, shareContent, uploadImage])

  const handleShareTelegram = async () => {
    if (!imageDataUrl) {
      alert('Please wait for the image to generate')
      return
    }

    // Telegram doesn't support direct image upload via URL
    // Download the image first
    uploadImage()
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(shareContent)
    
    setTimeout(() => {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
    }, 500)
  }

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Game #{`${gameId} (round ${round})`}
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
          {/* Generated Image */}
          {imageDataUrl ? (
            <div className="w-full mb-4">
              <img
                src={imageDataUrl}
                alt="Game Results"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              <p className="text-gray-500 dark:text-gray-400">Generating image...</p>
            </div>
          )}

          {/* Share Content Textarea */}
          <div className="w-full mb-4">
            <textarea
              id="shareContent"
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your share message..."
            />
          </div>

          {/* Social Media Share Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleShareFacebook}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on Facebook"
            >
              <FaFacebook />
            </button>
            <button
              onClick={handleShareX}
              className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on X"
            >
              <FaXTwitter />
            </button>
            <button
              onClick={handleShareTelegram}
              className="flex-1 px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on Telegram"
            >
              <FaTelegram />
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 w-full">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 The image will be downloaded automatically. You can then upload it manually when sharing on social media along with your text!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
