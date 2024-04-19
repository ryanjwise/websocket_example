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
const games = [
  {
    id: uuid(),
    status: 'open',
    players: [
      {
        id: uuid(),
        name: 'Alice Johnson',
        character: 'A',
        colour: '#c39bd3',
      },
      {
        id: uuid(),
        name: 'Bob Williams',
        character: 'B',
        colour: '#7dcea0',
      },
    ],
    state: [
      ['A', 'B', 'A'],
      ['', 'B', ''],
      ['', 'A', ''],
    ],
    joinable: false,
  },
  {
    id: uuid(),
    status: 'open',
    players: [
      {
        id: uuid(),
        name: 'Charlie Brown',
        character: 'C',
        colour: '#5499c7',
      },
    ],
    state: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    joinable: true,
  },
]

// Add WebsocketServer to the created HTTP server
const wss = new WebSocketServer({ server })

// Define websocket event handlers
wss.on('connection', (client) => {
  const clientId = uuid()
  client.id = clientId
  clients[clientId] = client

  console.log(`Server: WebSocket connection established with ${client.id}`)
  client.send(JSON.stringify({ clientId: client.id, games }))

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
      handleCommand(client, message)
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

function handleCommand(client, message) {
  switch (message.content) {
    case 'start-new-game':
      games.push({ status: 'open', players: [client.id], joinable: true })
      client.send(JSON.stringify({ games }))
      client.send(JSON.stringify({ 
        board: {
          action: 'create-game-board',
          boardSize: message.boardSize // TODO - Pull this from game object we create above
        }
      }))
      break

    case 'join-game':
      joinGame(client, message)
      break

    case 'refresh-games':
      client.send(JSON.stringify({ games }))
      break
    default:
      //TODO: Better error handling
      sendToClient(client, 'bad command')
  }
}

function joinGame(client, message) {
  const gameIndex = games.findIndex((game) => game.id == message.data.gameId)
  if (games[gameIndex].joinable) {
    games[gameIndex].players.push(client.id)
    games[gameIndex].players.forEach((playerId) => {
      if (playerId !== client.id) {
        sendToClient(playerId, `player: ${client.id} has joined your game!`)
      } else {
        sendToClient(playerId, `you have joined the game!`)
      }
      clients[playerId].send(JSON.stringify({ game: games.gameIndex }))
    })
  } else {
    //TODO: Better error handling
    sendToClient(client, `Game: ${games[gameIndex].id} is not joinable`)
  }
}
