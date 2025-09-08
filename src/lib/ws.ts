// client.ts
import { globalEventBus } from "./EventEmitter"

export interface BoxClaimedEventArgs {
  user: `0x${string}`
  position: number
  token: number
}

function decodeBoxClaimedEvents(buffer: ArrayBuffer): BoxClaimedEventArgs[] {
  const entrySize = 3
  const view = new DataView(buffer)
  const logs: BoxClaimedEventArgs[] = []
  const len = buffer.byteLength / entrySize

  for (let i = 0; i < len; i++) {
    const offset = i * entrySize
    const position = view.getUint16(offset)
    const token = view.getUint8(offset + 2)
    logs.push({ user: '0x', position, token }) // user is unknown here
  }

  return logs
}

export function listenToBoxClaimed() {
  const url = "ws://localhost:8080" // your ws server url
  const ws = new WebSocket(url)

  ws.onopen = () => {
    console.log("✅ Connected to server")

    // Send a message to the server
    ws.send(JSON.stringify({ type: "hello", msg: "Hi from browser 👋" }))
  }

  ws.onmessage = async (event) => {
    try {
      const buffer = await (event.data as Blob).arrayBuffer()
      const logs = decodeBoxClaimedEvents(buffer)
      console.log("📩 Received:", logs)
      for (const log of logs) {
        globalEventBus.emit('boxClaimed', log)
      }
    } catch (err) {
      console.error("Failed to parse message", err)
    }
  }

  ws.onclose = () => {
    console.log("❌ Disconnected from server")
  }

  ws.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err)
  }
}
