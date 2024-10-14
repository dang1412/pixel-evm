import { BrowserProvider, ContractEventPayload, JsonRpcSigner } from 'ethers'

import { RTCConnect, RTCConnect__factory } from '../../typechain-types'
import { RTCService } from './RTCService'
import { IPFSService } from './IPFSService'

export type Address = `0x${string}`

const RTC_CONTRACT_ADDR = '0xBaA0f5E2EcF36cE5c15261806CFCAf8877116Db0'

export class RTCConnectClients {
  signer: JsonRpcSigner | undefined
  contract: RTCConnect | undefined
  account: string | undefined

  services: {[k: Address]: RTCService} = {}
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

    this.account = await this.signer.getAddress()

    console.log('connected', this.account, network.name)
  }

  waitForConnect() {
    if (!this.account || !this.contract) return

    const contract = this.contract

    console.log('waitForConnect', this.account)

    // contract.on(contract.filters.OfferConnect, (e) => {

    // })

    // waiting for someone to offer connect to this 'addr'
    contract.on(contract.filters.OfferConnect(undefined, this.account), async (e: ContractEventPayload) => {
      // 'to' must equal to this.account
      console.log('Got connect offer', e.args.toArray())
      const [from, to, offerCID] = e.args.toArray() as [Address, Address, string]
      const rtcService = new RTCService(this.ipfsService, async (cid) => {
        // after uploading answer to IPFS and got the cid, answer the connect
        console.log('Answering onchain', from)
        await contract.answerConnect(from, cid)
        console.log('Answered onchain, waiting for accepting the answer', from)
      })

      rtcService.onMessage = (data) => {
        this.onReceiveData(from, data)
      }
      rtcService.onConnect = () => {
        this.onConnect(from)
      }

      //
      console.log('Answering', from, offerCID)
      const sdp = await this.fetchSDP(offerCID)
      rtcService.receiveOfferThenAnswer(sdp)

      this.services[from] = rtcService
    })
  }

  onReceiveData(addr: Address, data: ArrayBuffer | string) {}
  onConnect(addr: Address) {}

  offerConnectTo(addr: Address) {
    if (!this.account || !this.contract) return

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

    // onMessage
    rtcService.onMessage = (data) => {
      this.onReceiveData(addr, data)
    }
    // onConnect
    rtcService.onConnect = () => {
      this.onConnect(addr)
    }

    this.services[addr as Address] = rtcService

    // waiting for 'addr' to answer the offer
    contract.on(contract.filters['AnswerConnect(address,address,string)'](addr, this.account), async (e: ContractEventPayload) => {
      const [from, to, answeredCID] = e.args.toArray() as [string, string, string]
      const sdp = await this.fetchSDP(answeredCID)
      console.log('received', sdp)
      await rtcService.receiveSDP(sdp)
    })
  }

  private async fetchSDP(cid: string): Promise<RTCSessionDescriptionInit> {
    return this.ipfsService.fetch<RTCSessionDescriptionInit>(cid)
  }

  sendAll(data: string | ArrayBuffer) {
    for (const addr of Object.keys(this.services)) {
      // const service = this.services[addr as Address]
      // service.sendMessage(data)
      this.sendTo(addr as Address, data)
    }
  }

  sendTo(addr: Address, data: string | ArrayBuffer) {
    const service = this.services[addr]
    if (service) service.sendMessage(data)
  }
}
