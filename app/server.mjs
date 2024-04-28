import express from 'express'
import path from 'path'
import { WebSocket, WebSocketServer } from 'ws'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { Game } from './game.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = 3000

// Create HTTP server
const app = express()
const server = createServer(app)
//TODO: Add cleanup method when connections closed
//TODO: Add rejoin method when old connection rejoins
const clients = {}
const games = []

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
      startNewGame(client, message)
      break

    case 'join-game':
      joinGame(client, message)
      break

    case 'take-turn':
      takeTurn(client, message)
      break

    case 'refresh-games':
      client.send(JSON.stringify({ games }))
      break
    default:
      //TODO: Better error handling
      sendToClient(client, 'bad command')
  }
}

function startNewGame(client, message) {
  message.players.forEach((player) => {
    player.id = client.id
  })

  const game = { 
    id: uuid(),
    status: 'open', 
    players: message.players, 
    joinable: message.players.length != 2,
    boardSize: message.boardSize,
  }
  // TODO: Remove and resolve once local play working
  if (message.players.length == 2) {
    game.game = new Game(game.id, message.boardSize, ...message.players)
  }

  games.push(game)
  client.send(JSON.stringify({ games }))
  client.send(JSON.stringify({ 
    board: {
      action: 'create-game-board',
      boardSize: message.boardSize, // TODO - Pull this from game object we create above,
      gameId: game.id,
    }
  }))
}

function joinGame(client, message) {
  const gameIndex = getGameIndexFromId(message.data.gameId)
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

function takeTurn(client, message) {
  const cell = message.data.cell
  const gameIndex = getGameIndexFromPlayerId(client.id)
  // const gameIndex = getGameIndexFromId(message.data.gameId)
  const currentGame = games[gameIndex]

  if (currentGame && (!currentGame.status || !currentGame.status.gameOver)) {
    const delayMS = 10

    const playerWhoTookATurn = currentGame.game.currentPlayer
    if (playerWhoTookATurn.isComputer) {
      currentGame.status = playerWhoTookATurn.takeTurn(currentGame.game)
    } else if (cell && !playerWhoTookATurn.isComputer) {
      const { x, y } = cell
      currentGame.status = currentGame.game.doPlayerTurn(x, y, currentGame.game.currentPlayer)
    }

    let message = {
      board: currentGame.game.board,
      turnMessage: currentGame.status.turnMessage,
      statusMessage: currentGame.status.message,
      currentPlayer: currentGame.game.currentPlayer,
      playerWhoTookATurn,
    }
    message.board.action = 'update-game-board'
    setTimeout(() => {
      client.send(JSON.stringify(message))
    }, delayMS)
  }
}

function getGameIndexFromPlayerId(playerId) {
  return games.findIndex((game) => game.players.find((player) => player.id == playerId))
}
function getGameIndexFromId(gameId) {
  return games.findIndex((game) => game.id == gameId)
}
