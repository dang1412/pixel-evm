export interface WebRTCServiceOptions {
  onLocalSDP: (sdp: string) => void
  onMessage: (data: string | ArrayBuffer) => void
  onConnect?: () => void
  onClose?: () => void
}

export class WebRTCService {
  pc: RTCPeerConnection
  channel: RTCDataChannel | null = null

  constructor(private options: WebRTCServiceOptions) {
    const pc = this.pc = new RTCPeerConnection()

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
    // Request media stream to trigger permissions dialog (this is just for testing)
    const stream = await navigator.mediaDevices.getUserMedia({audio: true})
    // Add the stream to the connection to use it in the offer
    stream.getTracks().forEach(track => this.pc.addTrack(track, stream))
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
      if (onClose) onClose()
    }
  }

  sendMessage(content: string | ArrayBuffer) {
    if (!this.channel) return

    this.channel.send(content as ArrayBuffer)
  }
}
