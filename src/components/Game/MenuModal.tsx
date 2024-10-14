import { useCallback, useState } from 'react'

interface Props {
  onStartServer: () => void
  onConnect: (addr: string) => void
  onClose: () => void
}

export const MenuModal: React.FC<Props> = ({ onClose, onConnect, onStartServer }) => {

  const [selectedJoin, setSelectedJoin] = useState(false)

  const [addrInput, setAddrInput] = useState('')

  const clickClose = useCallback(() => {
    if (selectedJoin) setSelectedJoin(false)
    else {
      onClose()
    }
  }, [selectedJoin])

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 w-full max-w-md max-h-full">
      <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <button
          type="button"
          className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center z-10"
          data-modal-hide="popup-modal"
          onClick={clickClose}
        >
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span className="sr-only">Close modal</span>
        </button>
        {/* <p className="text-center font-medium pt-4">Start or join a server</p> */}
        <div className="p-4 md:p-5 text-center">
          {/* <svg
            className="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>*/}
          {!selectedJoin && <div>
            <h3 className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">
              Start or join a server
            </h3>
            <button
              type="button"
              className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
              onClick={onStartServer}
            >
              Start server
            </button>
            <button
              type="button"
              className="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
              onClick={() => setSelectedJoin(true)}
            >
              Join a server
            </button>
          </div>}

          {selectedJoin && <div className="relative">
            <h3 className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">
              Enter address to connect
            </h3>
            <input
              className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
              placeholder="0x"
              value={addrInput}
              onChange={(e) => setAddrInput(e.target.value)}
            />
            <button
              className="text-white absolute end-2.5 bottom-2.5 bg-sky-700 hover:bg-sky-800 focus:ring-4 focus:ring-sky-300 font-medium rounded-lg text-sm px-4 py-2"
              onClick={() => onConnect(addrInput)}
            >
              Connect
            </button>
          </div>}
          
        </div>
      </div>
    </div>
  )
}
