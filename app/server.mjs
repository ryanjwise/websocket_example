import express from 'express'
import path from 'path'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = 3000


// Create HTTP server
const app = express()
const server = createServer(app)

// Add WebsocketServer to the created HTTP server
const wss = new WebSocketServer({ server })

// Define websocket event handlers
wss.on('connection', (ws) => {
  console.log('Server: WebSocket connection established')
  
  ws.on('message', (message) => {
    message = JSON.parse(message)
    console.log(`Server: WebSocket recieved message: -> ${JSON.stringify(message, null, 2)}`)
  })
  
  ws.on('close', () => {
    console.log('Server: WebSocket connection closed')
  })
})

// Enable serving files at the given path
app.use(express.static(path.resolve(__dirname, 'public')))

// Start listening on the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
