import React, { createContext, useReducer, useContext, ReactNode } from 'react';

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
};

type Action = 
  | { type: 'UPDATE_STATUS'; addr: string; status: ConnectionStatus }
  | { type: 'ADD_ADDR'; addr: string }

const initialState: WebRTCState = {
  addressList: [],
  statuses: {}
};

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
      };
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
      return state;
  }
}

const WebRTCContext = createContext<{
  state: WebRTCState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

export const WebRTCProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <WebRTCContext.Provider value={{ state, dispatch }}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => useContext(WebRTCContext);
