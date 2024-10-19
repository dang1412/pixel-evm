import { useMemo } from "react";

import { Address, RTCConnectState } from "@/lib/RTCConnectClients";
import { AddressesConnectStates } from "./hooks/useAdventure";
import clsx from "clsx";

interface Props {
  states: AddressesConnectStates;
  onClose: () => void;
}

const isDone = (state: RTCConnectState) => state === RTCConnectState.Connected;

export const ConnectingState: React.FC<Props> = ({ states, onClose }) => {
  const stateArr = useMemo(() => Object.entries(states), [states]);

  return (
    <div className="fixed bottom-12 p-3 flex flex-col w-full">
      {!!stateArr.length && (
        <div
          className="relative flex flex-col ml-auto w-full max-w-sm p-3 text-gray-500 bg-white rounded-lg shadow"
          role="alert"
        >
          {stateArr.map(([addr, state]) => (
            <div className={clsx("flex items-center")}>
              <div
                className={clsx(
                  "inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 rounded-lg",
                  { "bg-green-100": isDone(state) }
                )}
              >
                {isDone(state) ? (
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                )}
              </div>
              <div className="ms-3 text-sm overflow-hidden">
                <div className="font-medium text-ellipsis overflow-hidden">
                  {addr}
                </div>
                {!isDone(state) && <div className="text-sm">{state}</div>}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="absolute right-1 top-1 ms-auto bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
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
          </button>
        </div>
      )}
    </div>
  );
};
