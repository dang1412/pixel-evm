// const IPFS_GATEWAY = 'http://127.0.0.1:8080'
// const IPFS_API = 'http://127.0.0.1:5001'

const IPFS_GATEWAY = 'https://red-frail-fox-939.mypinata.cloud'
const IPFS_API = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

// Pinata authen
const API_KEY = '748db10231c14fb30f15'
const API_SECRET = 'af4088e32e3fdf9087faf9d249776128be10e22b7f88c3554227ab942597aa7f'

export class IPFSService {
  static instance: IPFSService
  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService()
    }

    return IPFSService.instance
  }

  async add(data: string, name?: string): Promise<string> {
    const formData = new FormData()
    const blob = new Blob([data], { type: 'application/json' })
    formData.append('file', blob, name || Date.now().toString())

    const options = {
      method: 'POST',
      headers: {
        'pinata_api_key': API_KEY,
        'pinata_secret_api_key': API_SECRET,
      },
      body: formData
    }

    const rs = await fetch(IPFS_API, options)
      .then(response => response.json())

    return rs.IpfsHash
  }

  async fetch<T>(cid: string): Promise<T> {
    return fetch(`${IPFS_GATEWAY}/ipfs/${cid}`).then(res => res.json())
  }
}
