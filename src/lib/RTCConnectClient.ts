import { BrowserProvider, ContractEventPayload, JsonRpcSigner } from 'ethers'

import { RTCConnect, RTCConnect__factory } from '../../typechain-types'
import { RTCService } from './RTCService'
import { IPFSService } from './IPFSService'

const RTC_CONTRACT_ADDR = '0xBaA0f5E2EcF36cE5c15261806CFCAf8877116Db0'

export class RTCConnectClients {
  signer: JsonRpcSigner | undefined
  contract: RTCConnect | undefined

  services: {[k: string]: RTCService} = {}
  ipfsService: IPFSService

  constructor() {
    this.ipfsService = new IPFSService()
  }

  async connectWallet() {
    const rawProvider = (window as any).ethereum
    await rawProvider.request({ method: 'eth_requestAccounts' })
    const provider = new BrowserProvider(rawProvider)
    this.signer = await provider.getSigner()
    this.contract = RTCConnect__factory.connect(RTC_CONTRACT_ADDR, this.signer)

    const network = await provider.getNetwork()

    console.log('connected', await this.signer.getAddress(), network.name)
  }

  async waitForConnect() {
    if (!this.signer || !this.contract) return

    const contract = this.contract

    const addr = await this.signer.getAddress()

    console.log('waitForConnect', addr)

    // contract.on(contract.filters.OfferConnect, (e) => {

    // })

    // waiting for someone to offer connect to this 'addr'
    contract.on(contract.filters.OfferConnect(undefined, addr), async (e: ContractEventPayload) => {
      // 'to' must equal to 'addr'
      console.log('Got connect offer', e.args.toArray())
      const [from, to, offerCID] = e.args.toArray() as [string, string, string]
      const rtcService = new RTCService(this.ipfsService, async (cid) => {
        // after uploading answer to IPFS and got the cid, answer the connect
        console.log('Answering onchain', from)
        await contract.answerConnect(from, cid)
        console.log('Answered onchain, waiting for accepting the answer', from)
      })

      //
      console.log('Answering', from, offerCID)
      const sdp = await this.fetchSDP(offerCID)
      rtcService.receiveOfferThenAnswer(sdp)

      this.services[from] = rtcService
    })
  }

  async offerConnectTo(addr: string) {
    if (!this.signer || !this.contract) return

    const contract = this.contract

    const rtcService = new RTCService(this.ipfsService, async (cid) => {
      // after uploading answer to IPFS and got the cid, answer the connect
      console.log('Offering onchain', addr)
      await contract.offerConnect(addr, cid)
      console.log('Offered onchain, waiting for the answer', addr, cid)
    })

    // create channel
    rtcService.createChannel('myChannel')
    // create offer
    rtcService.createOffer()

    this.services[addr] = rtcService

    const currentAddr = await this.signer.getAddress()

    // waiting for 'addr' to answer the offer
    contract.on(contract.filters['AnswerConnect(address,address,string)'](addr, currentAddr), async (e: ContractEventPayload) => {
      const [from, to, answeredCID] = e.args.toArray() as [string, string, string]
      const sdp = await this.fetchSDP(answeredCID)
      console.log('received', sdp)
      await rtcService.receiveSDP(sdp)
    })
  }

  private async fetchSDP(cid: string): Promise<RTCSessionDescriptionInit> {
    return this.ipfsService.fetch<RTCSessionDescriptionInit>(cid)
  }

  sendAll(val: string) {
    for (const addr of Object.keys(this.services)) {
      const service = this.services[addr]
      service.sendMessage(val)
    }
  }
}
