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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-2xl p-6 relative" onClick={(e) => {e.stopPropagation()}}>
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-3 text-center border-b pb-2">
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
              After each claim, you will enter a <b>cooldown</b> ⏳ (1,2,4,8... minutes), reset after <b>0 UTC</b>.
              <br />
              Max <b>1000 boxes per day</b> in total, reset after <b>0 UTC</b>.
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
            
            <div className="text-gray-700 mt-4">
              About usecases and roadmap of the&nbsp;
              <a
                href="https://codetube.vn/pixel"
                target="_blank"
                className="text-blue-600 font-semibold hover:underline"
              >Pixel Game (PXG)</a> token.
            </div>

            <footer className="w-full border-t mt-4 pt-4 text-center text-sm text-gray-600">
              Farcaster{" "}
              <a
                href="https://farcaster.xyz/dang1412"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-semibold hover:underline"
              >
                @dang1412
              </a>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
