import { IPFSHTTPClient, create } from 'ipfs-http-client'

// export const IPFS_ADDR = 'http://127.0.0.1:8080'
// export const IPFS_ADDR = 'http://172.19.240.1:5001'
const IPFS_GATEWAY = 'http://127.0.0.1:8080'
const IPFS_API = 'http://127.0.0.1:5001'

export class IPFSService {
  static instance: IPFSService
  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService()
    }

    return IPFSService.instance
  }

  private ipfs: IPFSHTTPClient

  constructor() {
    this.ipfs = create({ url: IPFS_API })
  }

  async add(data: Blob | string): Promise<string> {
    const { cid } = await this.ipfs.add(data)

    return cid.toString()
  }

  async fetch<T>(cid: string): Promise<T> {
    return fetch(`${IPFS_GATEWAY}/ipfs/${cid}`).then(res => res.json())
  }
}
