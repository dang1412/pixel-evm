// const IPFS_GATEWAY = 'http://127.0.0.1:8080'
// const IPFS_API = 'http://127.0.0.1:5001'

const IPFS_GATEWAY = 'https://red-frail-fox-939.mypinata.cloud'
const IPFS_API = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

// Pinata authen
const API_KEY = '748db10231c14fb30f15'
const API_SECRET = 'af4088e32e3fdf9087faf9d249776128be10e22b7f88c3554227ab942597aa7f'
const headers = {
  'pinata_api_key': API_KEY,
  'pinata_secret_api_key': API_SECRET,
  'Content-Type': 'application/json',
}

export class IPFSService {
  static instance: IPFSService
  static getInstance(): IPFSService {
    if (!IPFSService.instance) {
      IPFSService.instance = new IPFSService()
    }

    return IPFSService.instance
  }

  async add(data: string): Promise<string> {
    const options = {
      method: 'POST',
      headers,
      body: data
    }

    const rs = await fetch(IPFS_API, options)
      .then(response => response.json())

    return rs.IpfsHash
  }

  async fetch<T>(cid: string): Promise<T> {
    return fetch(`${IPFS_GATEWAY}/ipfs/${cid}`).then(res => res.json())
  }
}

// API Key: 748db10231c14fb30f15
// API Secret: af4088e32e3fdf9087faf9d249776128be10e22b7f88c3554227ab942597aa7f
// JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0OWEwZWQ4Yy04NGY1LTQ4ZGUtOTRlNi0wOTMyNWQ4N2E5ZjIiLCJlbWFpbCI6ImR0dHVuZzE0MTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijc0OGRiMTAyMzFjMTRmYjMwZjE1Iiwic2NvcGVkS2V5U2VjcmV0IjoiYWY0MDg4ZTMyZTNmZGY5MDg3ZmFmOWQyNDk3NzYxMjhiZTEwZTIyYjdmODhjMzU1NDIyN2FiOTQyNTk3YWE3ZiIsImV4cCI6MTc2MDMyMjAxOH0.qNCcCDllLeYK6e9rqwEgjzRREWZClnTJPO2xbMpkGxw

// API Key: 8fab725ebdfe5a25b63d
// API Secret: bf12c3f1b5058e36cf2667d2312b80ae422f7df711532473fa6e2ed1d13332ee
// JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0OWEwZWQ4Yy04NGY1LTQ4ZGUtOTRlNi0wOTMyNWQ4N2E5ZjIiLCJlbWFpbCI6ImR0dHVuZzE0MTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjhmYWI3MjVlYmRmZTVhMjViNjNkIiwic2NvcGVkS2V5U2VjcmV0IjoiYmYxMmMzZjFiNTA1OGUzNmNmMjY2N2QyMzEyYjgwYWU0MjJmN2RmNzExNTMyNDczZmE2ZTJlZDFkMTMzMzJlZSIsImV4cCI6MTc2MDMzNDY4MH0.M5UYNURxG2RDf-NL_Pn7YYmbvmIal7a1OspRHwtXAFg