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
const games = []
const games2 = [
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
      message.players.forEach((player) => {
        player.id = client.id
      })
      games.push({ 
        id: uuid(),
        status: 'open', 
        players: message.players, 
        joinable: message.players.length != 2,
        boardSize: message.boardSize
      })
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
  const gameIndex = games.findIndex((game) => game.id == message.gameId)
  if (games[gameIndex].joinable) {
    let playerInfo = message.playerInfo
    playerInfo.id = client.id
    let game = games[gameIndex]
    game.players.push(playerInfo)
    game.joinable = game.players.length != 2
    game.players.forEach((player) => {
      let playerId = player.id
      if (playerId !== client.id) {
        clients[playerId].send(JSON.stringify({ content: `player: ${playerId} has joined your game!`, type: 'direct message' }))
      } else {
        clients[playerId].send(JSON.stringify({ content: `you have joined the game!`, type: 'direct message' }))
      }
      client.send(JSON.stringify({ games }))
      client.send(JSON.stringify({ 
        board: {
          action: 'create-game-board',
          boardSize: game.boardSize // TODO - Pull this from game object we create above
        }
      }))
    })
  } else {
    //TODO: Better error handling
    sendToClient(client, `Game: ${games[gameIndex].id} is not joinable`)
  }
}
