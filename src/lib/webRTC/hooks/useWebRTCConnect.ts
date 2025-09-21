import { useCallback, useEffect } from 'react'

import { WebRTCService } from '../WebRTCService'
import { IPFSService } from '../IPFSService'
import { ConnectionStatus, useWebRTC } from '../WebRTCProvider'

import useListenToMessage, { EventMessagePayload } from './useListenToMessage'
import useSendMessage from './useSendMessage'
import { useAccount } from 'wagmi'

const ipfs = IPFSService.getInstance();

const accountConnectServices: { [acc: string]: WebRTCService } = {};

export function getAccountConnectService(to: string) {
  return accountConnectServices[to] || null;
}

export function useWebRTCConnect(onMsg: (from: string, data: string | ArrayBuffer) => void) {

  const { address: account } = useAccount()

  // listen to messages from peers (offer or answer)
  const listenToMessage = useListenToMessage()
  const { sendMessage } = useSendMessage()

  const { dispatch } = useWebRTC()

  const createService = useCallback((to: string, isAnswering = false) => {
    dispatch({ type: 'ADD_ADDR', addr: to });
    return new WebRTCService({
      onLocalSDP: async (sdp) => {
        console.log('Local SDP:', sdp);
        // Here you would typically send the SDP to the other peer
        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: isAnswering ? ConnectionStatus.ANSWERING : ConnectionStatus.OFFERING,
        });
        // Upload to IPFS and get the CID
        const cid = await ipfs.add(sdp)
        console.log('IPFS CID:', cid);
        // Call contract with CID to send to other peer
        await sendMessage(to, cid);
        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: isAnswering ? ConnectionStatus.ANSWERED : ConnectionStatus.OFFERED,
        });
      },
      onMessage: (data) => {
        console.log('Received message:', data);
        onMsg(to, data)
        // dispatch({ type: 'ADD_MESSAGE', channel: to, message: {
        //   id: 0,
        //   text: data as string,
        //   sender: `${to.slice(0, 8)}...${to.slice(-4)}`,
        //   timestamp: Date.now(),
        // } });
      },
      onConnect: () => {
        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: ConnectionStatus.CONNECTED,
        });
        console.log('Connected to:', to);
        // Notify the app that we are connected
        // This could be a custom event or a state update
        onMsg(to, '_connected_')
      }
    });
  }, [sendMessage]);

  const onEventMessage = useCallback(async (e: EventMessagePayload) => {
    console.log('Received offer:', e);

    const sdp = await ipfs.fetch<RTCSessionDescriptionInit>(e.cid);

    if (!accountConnectServices[e.from]) {
      // received offer from a new address
      console.log('Got offer', sdp)
      dispatch({
        type: 'UPDATE_STATUS',
        addr: e.from,
        status: ConnectionStatus.OFFER_RECEIVED,
      });
      const service = createService(e.from, true);
      service.receiveOfferThenAnswer(sdp);

      accountConnectServices[e.from] = service;
    } else {
      // received answer after making offer
      console.log('Got answer', sdp)
      dispatch({
        type: 'UPDATE_STATUS',
        addr: e.from,
        status: ConnectionStatus.ANSWER_RECEIVED,
      });
      const service = accountConnectServices[e.from]
      service.receiveSDP(sdp)
    }
  }, [createService])

  // Start listening to offer (or answer) after logging in
  useEffect(() => {
    let unsub = () => {};
    if (!account) return unsub;

    (async () => {
      // unsub = await listenToMessage(onEventMessage);
    })()

    // Cleanup the subscription
    return unsub
  }, [account, listenToMessage, onEventMessage]);

  // Start offering connect to toAddr
  const offerConnect = useCallback(async (toAddr: string) => {
    // already connected or connecting
    if (accountConnectServices[toAddr]) return;

    dispatch({
      type: 'UPDATE_STATUS',
      addr: toAddr,
      status: ConnectionStatus.INIT,
    });

    const service = createService(toAddr);

    service.createChannel(`${toAddr}-chat`);
    service.createOffer();

    accountConnectServices[toAddr] = service;
  }, [createService]);

  return {
    offerConnect,
    getAccountConnectService,
  };
}
