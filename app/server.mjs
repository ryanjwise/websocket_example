import express from 'express'
import path from 'path'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 3000


// Create HTTP server
const app = express()
const server = createServer(app)
const games = [
  {status: 'open', players: ['John Doe', 'Jane Doe'], joinable: false},
  {status: 'open', players: ['Jane Smith'], joinable: true},
]

// Add WebsocketServer to the created HTTP server
const wss = new WebSocketServer({ server })

// Define websocket event handlers
wss.on('connection', (client) => {
  client.id = uuid()

  console.log(`Server: WebSocket connection established with ${client.id}`)
  client.send(JSON.stringify({ clientId: client.id, games }))
  
  client.on('message', (message) => {
    message = JSON.parse(message)
    console.log(`Server: WebSocket recieved message from ${client.id}: -> ${JSON.stringify(message, null, 2)}`)
    sendToClient(client, message)
    broadCast(message)
  })
  
  client.on('close', () => {
    console.log(`Server: WebSocket connection closed with ${client.id}`)
  })
})

// Enable serving files at the given path
app.use(express.static(path.resolve(__dirname, 'public')))

// Start listening on the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function sendToClient(client, message) {
  client.send(JSON.stringify({content: message, type: 'direct message'}))
}

function broadCast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({content: message, type: 'broadcast'}))
    }
  })
}