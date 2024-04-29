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

function broadCastToGame(game, message) {
  const uniqePlayers = new Set(game.players.map((player) => player.id))
  console.log(`Broadcasting to ${uniqePlayers.size} players`)

  uniqePlayers.forEach((playerId) => {
    console.log(`Broadcasting to: ${playerId}`)
    clients[playerId].send(JSON.stringify(message))
  })
}

function broadCastGameListUpdate() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ games }))
    }
  })
}

function broadCastGameStart(game) {
  if (game.players.length == 2) {
    broadCastToGame(game, {
          board: {
            action: 'create-game-board',
            boardSize: game.boardSize,
            gameId: game.id,
            players: game.players,
          },
        })
    }

    if (game.players[0].isComputer) {
      takeTurn(clients[game.players[0].id])
    }
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
  broadCastGameListUpdate()
  broadCastGameStart(game)
}

function joinGame(client, message) {
  const gameIndex = getGameIndexFromId(message.gameId)
  if (games[gameIndex].joinable) {
    let playerInfo = message.playerInfo
    playerInfo.id = client.id
    let game = games[gameIndex]
    game.players.push(playerInfo)
    game.joinable = game.players.length != 2
    if (game.players.length == 2) {
      game.game = new Game(game.id, game.boardSize, ...game.players)
    }
    game.players.forEach((player) => {
      let playerId = player.id
      if (playerId !== client.id) {
        clients[playerId].send(
          JSON.stringify({
            content: `player: ${playerId} has joined your game!`,
            type: 'direct message',
          })
        )
      } else {
        clients[playerId].send(
          JSON.stringify({
            content: `you have joined the game!`,
            type: 'direct message',
          })
        )
      }
      broadCastGameListUpdate()
    })
    broadCastGameStart(game)
  } else {
    //TODO: Better error handling
    sendToClient(client, `Game: ${games[gameIndex].id} is not joinable`)
  }
}

async function takeTurn(client, message = null) {
  const cell = message?.data?.cell
  const gameIndex = getGameIndexFromPlayerId(client.id)
  // const gameIndex = getGameIndexFromId(message.data.gameId)
  const currentGame = games[gameIndex]
  const playerWhoTookATurn = currentGame.game.currentPlayer
  let nextPlayer = undefined

  if (currentGame && (!currentGame.status || !currentGame.status.gameOver)) {
    const delayMS = 10

    if (playerWhoTookATurn.isComputer) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      currentGame.status = playerWhoTookATurn.takeTurn(currentGame.game)
    } else if (cell && !playerWhoTookATurn.isComputer) {
      const { x, y } = cell
      console.log(`cell=${cell} x=${x}, y=${y}`)
      currentGame.status = currentGame.game.doPlayerTurn(
        x,
        y,
        currentGame.game.currentPlayer
      )
    }

    nextPlayer = currentGame.game.currentPlayer
    let message = {
      board: currentGame.game.board,
      turnMessage: currentGame.status.turnMessage,
      statusMessage: currentGame.status.message,
      currentPlayer: nextPlayer,
      playerWhoTookATurn,
    }
    console.log(message)
    message.board.action = 'update-game-board'
    setTimeout(() => {
      broadCastToGame(currentGame, message), delayMS
    })

    if (nextPlayer.isComputer) {
      takeTurn(client, message)
    }
  }
}

function getGameIndexFromPlayerId(playerId) {
  return games.findIndex((game) =>
    game.players.find((player) => player.id == playerId)
  )
}
function getGameIndexFromId(gameId) {
  return games.findIndex((game) => game.id == gameId)
}
