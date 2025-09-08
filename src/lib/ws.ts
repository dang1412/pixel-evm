// client.ts
import WebSocket from "ws"
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
  ws.on("open", () => {
    console.log("✅ Connected to server");

    // Send a message to the server
    ws.send(JSON.stringify({ type: "hello", msg: "Hi from client 👋" }));
  })

  ws.on("message", (data: ArrayBuffer) => {
    try {
      const logs = decodeBoxClaimedEvents(data)
      console.log("📩 Received BoxClaimed events:", logs)
      if (logs.length === 0) return

      for (const log of logs) {
        console.log(`- User: ${log.user}, Position: ${log.position}, Token: ${log.token}`)
        globalEventBus.emit('boxClaimed', log)
      }
    } catch (error) {
      console.error("Failed to decode message:", error);
    }
    
  })

  ws.on("close", () => {
    console.log("❌ Disconnected from server");
  })

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  })
}
