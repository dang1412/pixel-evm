import React, { createContext, useReducer, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';

export enum ConnectionStatus {
  // Offer side
  INIT='INIT',
  OFFERING='OFFERING',
  OFFERED='OFFERED',
  ANSWER_RECEIVED='ANSWER_RECEIVED',

  // Answer side
  OFFER_RECEIVED='OFFER_RECEIVED',
  ANSWERING='ANSWERING',
  ANSWERED='ANSWERED',

  // Both sides
  CONNECTED= 'CONNECTED',
}

interface WebRTCState {
  addressList: string[]; // List of addresses
  statuses: {
    [addr: string]: ConnectionStatus
  }
}

type Action = 
  | { type: 'UPDATE_STATUS'; addr: string; status: ConnectionStatus }
  | { type: 'ADD_ADDR'; addr: string }

const initialState: WebRTCState = {
  addressList: [],
  statuses: {}
}

function reducer(state: WebRTCState, action: Action): WebRTCState {
  switch (action.type) {
    case 'UPDATE_STATUS': {
      const { addr, status } = action;
      return {
        ...state,
        statuses: {
          ...state.statuses,
          [addr]: status,
        }
      }
    }
    case 'ADD_ADDR': {
      const { addr } = action;
      if (state.addressList.includes(addr)) return state; // Prevent duplicates
      return {
        ...state,
        addressList: [...state.addressList, addr],
      }
    }
    default:
      return state
  }
}

const WebRTCContext = createContext<{
  state: WebRTCState
  createOrGetStream: () => Promise<MediaStream | undefined>
  toggleMicrophone: (enabled: boolean) => void
  dispatch: React.Dispatch<Action>
  isMicOn: boolean
}>({
  state: initialState,
  createOrGetStream: async () => undefined,
  toggleMicrophone: () => undefined,
  dispatch: () => undefined,
  isMicOn: false,
})

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const streamPromiseRef = useRef<Promise<MediaStream>>(undefined)
  const [isMicOn, setIsMicOn] = React.useState(false)

  const createOrGetStream = useCallback(async () => {
    const streamPromise = streamPromiseRef.current
    if (!streamPromise) {
      try {
        console.log('Requesting user media stream for WebRTC')
        streamPromiseRef.current = navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaStream = await streamPromiseRef.current
        toggleMicrophone(false)

        return mediaStream
      } catch (error) {
        console.error('Error accessing media devices.', error)
      }
    }

    return streamPromise
  }, [])

  const toggleMicrophone = useCallback(async (enabled: boolean) => {
    if (streamPromiseRef.current) {
      console.log('Setting microphone enabled:', enabled)
      const stream = await streamPromiseRef.current
      stream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
      setIsMicOn(enabled)
    }
  }, [])

  return (
    <WebRTCContext.Provider value={{ state, createOrGetStream, toggleMicrophone, isMicOn, dispatch }}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTC = () => useContext(WebRTCContext)
