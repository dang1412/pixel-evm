import React, { useCallback, useEffect, useState } from 'react'
import { FaTimes, FaFacebook, FaTelegram, FaCopy, FaSpinner } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

import { useNotification } from '@/providers/NotificationProvider'
import { PlayerState } from './types'
import { createShareImage } from './utils/createShareImage'
import { getLocalTimeString } from './utils/localTimeString'
import { generateUploadUrl } from './api/generateUploadUrl'

interface Prop {
  players: PlayerState[]
  gameId: number
  round: number
  playerId: number
  onClose: () => void
}

const shareImageMemo: { [key: string]: string } = {}

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

function generateShareContent(players: PlayerState[], round: number, playerId = 1): string {
  const timeStr = new Date().toLocaleString('en-US')
  const player = players.find(p => p.id === playerId)
  const names = players.filter(p => p.id !== playerId).map(p => p.name || `Player ${p.id}`).join(', ')
  if (player) {
    const { name, score } = player
    return `🎮 ${name} scored ${score} (round ${round}), in a Bomb game with ${names} 💣\n (${timeStr}) Watch the full recorded game here!`
  }

  return `🎮 (${timeStr}) Bomb Game Results ${names}- round ${round} 💣\n Watch the full recorded game here!`
}

export const ShareSocialModal: React.FC<Prop> = ({ players, gameId, round, playerId = 1, onClose }) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [shareContent, setShareContent] = useState<string>(generateShareContent(players, round, playerId))
  const [shareUrl, setShareUrl] = useState<string>('')

  // useNotification to show loading state
  const { loading, setLoading, notify } = useNotification()

  useEffect(() => {
    // Generate the share image when modal opens
    console.log('Generating share image for players:', players)
    createShareImage(players, round, (dataUrl) => {
      setImageDataUrl(dataUrl)
    })
  }, [players, round])

  const getOrUploadImage = useCallback(async () => {
    const key = `${gameId}-${round}-${playerId}`
    if (shareImageMemo[key]) {
      console.log('Using cached upload for key:', key)
      return shareImageMemo[key]
    }

    if (!imageDataUrl) return

    setLoading(true)
    console.log('Uploading image for key:', key)
    // Get time string: YYYYMMDDTHHMMSS
    const timeStr = getLocalTimeString()
    const name = `${key}-${timeStr}.png`

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

    setLoading(false)

    if (response.ok) {
      const publicUrl = uploadUrl.split('?')[0] // Remove query params to get public URL
      console.log('Image uploaded successfully. Public URL:', publicUrl)
      shareImageMemo[key] = name
      return name
    } else {
      const errorText = await response.text()
      console.error('Failed to upload image to S3. Status:', response.status)
      console.error('Error Body:', errorText)
    }

  }, [imageDataUrl, gameId, round, playerId])

  const getShareUrl = useCallback((name: string) => {
    return `https://api.pixelonbase.com/bombshare/${gameId}?img=${name}&round=${round}&playerId=${playerId}`
  }, [gameId, round, playerId])

  const handleShareFacebook = useCallback(async () => {
    if (!imageDataUrl) {
      notify('Please wait for the image to generate', 'error')
      return
    }

    const name = await getOrUploadImage()
    if (!name) return
    const shareUrl = getShareUrl(name)
    setShareUrl(shareUrl)
    const url = encodeURIComponent(shareUrl)

    // Copy text to clipboard since Facebook doesn't support pre-filling quote anymore
    try {
      await navigator.clipboard.writeText(shareContent)
      notify('Message copied! Paste it on Facebook.', 'success')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }

    console.log('Opening Facebook share dialog with URL:', shareUrl)
    
    setTimeout(() => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }, 500)
  }, [imageDataUrl, shareContent, getOrUploadImage, getShareUrl])

  const handleShareX = useCallback(async () => {
    if (!imageDataUrl) {
      notify('Please wait for the image to generate', 'error')
      return
    }

    // X (Twitter) doesn't support direct image upload via URL
    // Download the image first, then open Twitter share
    // const name = `${gameId}-${round}-${playerId}.png`
    const name = await getOrUploadImage()
    if (!name) return
    const shareUrl = getShareUrl(name)
    setShareUrl(shareUrl)
    const text = encodeURIComponent(shareContent + '\n\n' + shareUrl)
    
    setTimeout(() => {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    }, 500)
  }, [imageDataUrl, shareContent, getOrUploadImage, getShareUrl])

  const handleShareTelegram = async () => {
    if (!imageDataUrl) {
      notify('Please wait for the image to generate', 'error')
      return
    }

    // Telegram doesn't support direct image upload via URL
    // Download the image first
    getOrUploadImage()
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(shareContent)
    
    setTimeout(() => {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
    }, 500)
  }

  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify('URL copied to clipboard!', 'success')
    } catch (err) {
      console.error('Failed to copy URL: ', err)
      notify('Failed to copy URL', 'error')
    }
  }, [shareUrl, notify])

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
            Game #{`${gameId} (Round ${round})`}
            {loading && <FaSpinner className='animate-spin text-blue-500 mr-1 inline' /> }
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
              rows={3}
              className="w-full px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your share message..."
            />
          </div>

          {/* Social Media Share Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleShareFacebook}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on Facebook"
            >
              <FaFacebook />
            </button>
            <button
              onClick={handleShareX}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on X"
            >
              <FaXTwitter />
            </button>
            <button
              onClick={handleShareTelegram}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-colors flex items-center justify-center gap-2"
              aria-label="Share on Telegram"
            >
              <FaTelegram />
            </button>
          </div>

          {/* Display shareUrl */}
          {shareUrl && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700 w-full flex items-center justify-between gap-2">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex-1">
                {shareUrl}
              </p>
              <button
                onClick={handleCopyUrl}
                className="p-2 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors"
                title="Copy URL"
              >
                <FaCopy />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
