import express from 'express'
import path from 'path'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = 3000

// Create HTTP server
const app = express()
const server = createServer(app)
//TODO: Add cleanup method when connections closed
//TODO: Add rejoin method when old connection rejoins
const clients = {}

// Add WebsocketServer to the created HTTP server
const wss = new WebSocketServer({ server })

// Define websocket event handlers
wss.on('connection', (client) => {
  const clientId = uuid()
  client.id = clientId
  clients[clientId] = client

  console.log(`Server: WebSocket connection established with ${client.id}`)
  client.send(JSON.stringify({ clientId: client.id, clients }))

  client.on('message', (message) => {
    message = JSON.parse(message)
    console.log(
      `Server: WebSocket recieved message from ${
        client.id
      }: -> ${JSON.stringify(message, null, 2)}`
    )
    handleMessage(client, message)
  })

  client.on('close', () => {
    console.log(`Server: WebSocket connection closed with ${client.id}`)
  })
})

function handleMessage(client, message) {
  switch (message.type) {
    case 'message':
      broadCast(message.content)
      break
    case 'direct-message':
      sendToClient(clients[message.target], message.content)
      break
    case 'command':
      if (message.content == 'get-users') {
        client.send(JSON.stringify({ clients }))
        break
      }
      break
    default:
      break
  }
}

// Enable serving files at the given path
app.use(express.static(path.resolve(__dirname, 'public')))

// Start listening on the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

function sendToClient(client, message) {
  client.send(JSON.stringify({ content: message, type: 'direct message' }))
}

function broadCast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ content: message, type: 'broadcast' }))
    }
  })
}
