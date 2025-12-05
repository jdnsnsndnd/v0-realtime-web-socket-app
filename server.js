const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { WebSocketServer } = require("ws")

const dev = process.env.NODE_ENV !== "production"
const hostname = "0.0.0.0"
const port = Number.parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  const wss = new WebSocketServer({
    server,
    path: "/api/ws",
  })

  // Track all connected clients
  const clients = new Set()

  wss.on("connection", (ws, req) => {
    const clientId = Math.random().toString(36).substring(7)
    console.log(`[WebSocket] New client connected: ${clientId}`)
    console.log(`[WebSocket] Total clients: ${clients.size + 1}`)

    clients.add(ws)

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "system",
        message: `مرحباً! تم الاتصال بنجاح. معرفك: ${clientId}`,
        clientId,
        timestamp: new Date().toISOString(),
      }),
    )

    // Broadcast to all clients that someone joined
    broadcast(
      {
        type: "system",
        message: `عميل جديد انضم (${clientId})`,
        clientCount: clients.size,
        timestamp: new Date().toISOString(),
      },
      ws,
    )

    // Handle incoming messages
    ws.on("message", (data) => {
      console.log(`[WebSocket] Message from ${clientId}:`, data.toString())

      try {
        // Try to parse as JSON
        let messageData
        try {
          messageData = JSON.parse(data.toString())
        } catch {
          // If not JSON, treat as plain text
          messageData = {
            type: "message",
            text: data.toString(),
          }
        }

        // Broadcast to all clients
        const broadcastData = {
          ...messageData,
          clientId,
          timestamp: new Date().toISOString(),
        }

        // Echo back to sender
        ws.send(
          JSON.stringify({
            type: "echo",
            message: `تم استلام رسالتك: ${messageData.text || data.toString()}`,
            original: broadcastData,
            timestamp: new Date().toISOString(),
          }),
        )

        // Broadcast to all other clients
        broadcast(broadcastData, ws)
      } catch (error) {
        console.error("[WebSocket] Error processing message:", error)
        ws.send(
          JSON.stringify({
            type: "error",
            message: "حدث خطأ في معالجة الرسالة",
            timestamp: new Date().toISOString(),
          }),
        )
      }
    })

    // Handle client disconnect
    ws.on("close", () => {
      console.log(`[WebSocket] Client disconnected: ${clientId}`)
      clients.delete(ws)

      broadcast({
        type: "system",
        message: `عميل غادر (${clientId})`,
        clientCount: clients.size,
        timestamp: new Date().toISOString(),
      })
    })

    // Handle errors
    ws.on("error", (error) => {
      console.error(`[WebSocket] Error from ${clientId}:`, error)
      clients.delete(ws)
    })

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping()
      } else {
        clearInterval(pingInterval)
      }
    }, 30000) // Every 30 seconds
  })

  // Broadcast function to send message to all clients except sender
  function broadcast(data, excludeClient = null) {
    const message = JSON.stringify(data)
    clients.forEach((client) => {
      if (client !== excludeClient && client.readyState === client.OPEN) {
        client.send(message)
      }
    })
  }

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/ws`)
  })
})
