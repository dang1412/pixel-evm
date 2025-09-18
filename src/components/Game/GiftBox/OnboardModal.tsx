"use client"

import { useEffect, useState } from "react"
import { FaInfo, FaTimes } from "react-icons/fa"
// import { X, Info } from "lucide-react"

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem("seen_onboarding")
    if (!seen) {
      setOpen(true)
    } else {
      setHasSeen(true)
    }
  }, [])

  const closeModal = () => {
    setOpen(false)
    localStorage.setItem("seen_onboarding", "true")
    setHasSeen(true)
  }

  return (
    <>
      {/* Info button (always visible after first close) */}
      {hasSeen && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition"
        >
          <FaInfo className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-2xl p-6 relative">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-3 text-center">
              🗺️ Welcome to PixelGame!
            </h2>

            {/* <p className="text-gray-700 mb-4 leading-relaxed">
              Click on the 🎁 gift boxes to collect tokens!
              <br />
              After each successful claim, you will have a cooldown ⏳
              (1,2,4,8... minutes).
              <br />
              Max 1000 boxes per day.
            </p> */}
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              Click on the 🎁 gift boxes to collect tokens!
              <br />
              Each successful claim gives you a random reward of <b>20–100 tokens</b> 🎉
              <br />
              After each claim, you will enter a cooldown ⏳ (1,2,4,8... minutes), reset after 0 UTC.
              <br />
              Max <b>1000 boxes per day</b>.
              <br />
              These tokens are the <b>official mainnet tokens</b> of the app 🚀 — early users
              are among the first to receive distribution!
            </p>

            {/* Demo video */}
            {/* https://drive.google.com/file/d/1nuNB7TOummb60qMGHpu4YNYR4l4Y8v9f/view?usp=sharing */}
            <div className="w-full aspect-video">
              <video
                // src="https://drive.google.com/uc?id=1nuNB7TOummb60qMGHpu4YNYR4l4Y8v9f" // 👉 đổi thành link video/gif của bạn
                src="/gift/pixel-gift-guide.mp4"
                className="w-full h-full rounded-lg border"
                // autoPlay
                // loop
                // muted
                controls
                playsInline
              />
              {/* <iframe
                className="w-full h-full rounded-lg border"
                src="https://www.youtube.com/embed/6J_Wow5DwKo?si=erEb7Bkj-8B9IQob"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe> */}
            </div>

            {/* <button
              onClick={closeModal}
              className="w-full bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 transition"
            >
              Got it!
            </button> */}
          </div>
        </div>
      )}
    </>
  )
}
