export interface WebRTCServiceOptions {
  onLocalSDP: (sdp: string) => void
  onMessage: (data: string | ArrayBuffer) => void
  onConnect?: () => void
  onClose?: () => void
  onTrack?: (e: RTCTrackEvent) => void
}

export class WebRTCService {
  pc: RTCPeerConnection
  channel: RTCDataChannel | null = null
  private isClosed = false

  constructor(private options: WebRTCServiceOptions, private stream: MediaStream) {
    const pc = this.pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:relay1.expressturn.com:3480'
        },
        {
          urls: 'turn:relay1.expressturn.com:3480',
          username: '000000002080108438',
          credential: 'VA9EnnDbPrfP2Psi0HYMtx/QujA=',
        }
      ],
    })

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.log('Candidate', ev.candidate)
      } else {
        // send the local SDP (after creating offer or answer)
        this.options.onLocalSDP(JSON.stringify(pc.localDescription))
      }
    }

    pc.onicecandidateerror = (ev) => {
      console.log('Error', ev)
    }

    pc.ondatachannel = (e) => {
      const channel = e.channel
      console.log('channel created', channel)
      this.setupChannel(channel)
    }

    pc.ontrack = (e) => {
      console.log('ontrack', e.streams)
      this.options.onTrack?.(e)
    }

    // Monitor connection state changes to detect when peer closes browser
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState)
      if (pc.connectionState === 'disconnected' || 
          pc.connectionState === 'failed' || 
          pc.connectionState === 'closed') {
        console.log('Peer connection closed or failed')
        this.handleClose()
      }
    }

    // Additional monitoring via ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState)
      if (pc.iceConnectionState === 'disconnected' || 
          pc.iceConnectionState === 'failed' || 
          pc.iceConnectionState === 'closed') {
        console.log('ICE connection closed or failed')
        this.handleClose()
      }
    }
  }

  async createOffer() {
    await this.requestMediaStream()

    const offer = await this.pc.createOffer()
    console.log('offer', offer)
    await this.pc.setLocalDescription(offer)
  }

  // Call this function before creating offer or answer
  // so it could get the ICECandidate and update the local SDP after setLocalDescription
  private async requestMediaStream() {
    // Only request media stream once and reuse it
    if (!this.stream) {
      return
    }

    // Add the stream to the connection to use it in the offer/answer
    this.stream.getAudioTracks().forEach(track => this.pc.addTrack(track, this.stream))
  }

  /**
   * This function is for receiving SDP offer or answer
   * @param data 
   */
  async receiveSDP(sdp: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
  }

  /**
   * Receive offer then create an answer
   * @param offer 
   */
  async receiveOfferThenAnswer(offer: RTCSessionDescriptionInit) {
    await this.receiveSDP(offer)

    await this.requestMediaStream()

    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)
  }

  createChannel(name: string) {
    const channel = this.pc.createDataChannel(name)
    this.setupChannel(channel)
  }

  private setupChannel(channel: RTCDataChannel) {
    console.log('setupChannel', channel)
    const { onMessage, onConnect, onClose } = this.options
    this.channel = channel
    channel.onopen = () => {
      console.log('Channel opened', channel)
      if (onConnect) onConnect()
    }

    channel.onmessage = (e) => {
      console.log('onmessage', e.data)
      onMessage(e.data)
    }

    channel.onerror = (e) => {
      console.log('Channel error', e)
    }

    channel.onclose = () => {
      console.log('Channel closed', channel)
      this.handleClose()
    }
  }

  private handleClose() {
    if (this.isClosed) return
    this.isClosed = true
    
    if (this.options.onClose) {
      this.options.onClose()
    }
  }

  sendMessage(content: string | ArrayBuffer) {
    if (!this.channel) return

    this.channel.send(content as ArrayBuffer)
  }
}
