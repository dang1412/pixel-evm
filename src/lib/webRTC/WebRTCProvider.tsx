import React, { createContext, useReducer, useContext, ReactNode, useCallback, useEffect } from 'react';

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
}>({
  state: initialState,
  createOrGetStream: async () => undefined,
  toggleMicrophone: () => undefined,
  dispatch: () => undefined,
})

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [stream, setStream] = React.useState<MediaStream | undefined>(undefined)

  const createOrGetStream = useCallback(async () => {
    if (!stream) {
      try {
        console.log('Requesting user media stream for WebRTC')
        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setStream(mediaStream)

        return mediaStream
      } catch (error) {
        console.error('Error accessing media devices.', error)
      }
    }

    return stream
  }, [stream])

  const toggleMicrophone = useCallback((enabled: boolean) => {
    if (stream) {
      console.log('Setting microphone enabled:', enabled)
      stream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }, [stream])

  useEffect(() => {
    // Mute microphone by default
    toggleMicrophone(false)
  }, [toggleMicrophone])

  return (
    <WebRTCContext.Provider value={{ state, createOrGetStream, toggleMicrophone, dispatch }}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTC = () => useContext(WebRTCContext)
