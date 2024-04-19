// Establish websocket connection with the given route
const socket = new WebSocket(`ws://localhost:3000`)

// Handle Socket events
socket.addEventListener('open', (event) => {
  console.log(
    `Client: WebSocket connection established on: -> ${event.currentTarget.url}`
  )
})

socket.addEventListener('message', (message) => {
  const messageContent = JSON.parse(message.data)
  if (messageContent.clientId) {
    socket.id = messageContent.clientId
    console.log('Received ID from the server:', socket.id)
  }

  if (messageContent.content) {
    console.log(
      `Client: WebSocket recieved message: -> ${JSON.stringify(
        message.data,
        null,
        2
      )}`
    )
    addToFeed(messageContent)
  }

  if (messageContent.games) {
    showAvailableGames(messageContent.games)
  }

  if (messageContent.board) {
    switch (messageContent.board.action) {
      case 'create-game-board': {
        createGameBoard(messageContent.board.boardSize)
        break
      }
      case 'update-game-board': {
        updateGameBoard(message)
        break
      }
    } 
  }   
})

//Handle post events on websocket
const sendMessage = (message) => {
  if (socket.readyState === WebSocket.OPEN) {
    message = JSON.stringify(message)
    console.log(`Client: WebSocket transmitting message: -> ${message}`)
    socket.send(message)
  }
}

// Setup Click event handlers
document.getElementById('sendMessage').onclick = () => {
  const message = document.getElementById('messageInput').value
  sendMessage({ type: 'message', content: message })
}

document.getElementById('sendDirectMessage').onclick = () => {
  const message = document.getElementById('messageInput').value
  const id = document.getElementById('clientId').value
  sendMessage({ type: 'direct-message', content: message, target: id })
}

document.getElementById('newGame').onclick = () => {
  let message = getGameInfo()
  message.type = 'command'
  message.content = 'start-new-game'
  sendMessage(message)
}

document.getElementById('refreshGames').onclick = () => {
  sendMessage({ type: 'command', content: 'refresh-games' })
}

const messageFeed = document.getElementById('messageFeed')

const addToFeed = (message) => {
  const messageElement = document.createElement('p')
  messageElement.textContent = `${message.type} -> ${message.content}`

  messageFeed.appendChild(messageElement)
}

const showAvailableGames = (games) => {
  const headers = ['id', 'status', 'players', 'joinable']

  const gamesElement = document.getElementById('availableGames')
  gamesElement.innerHTML = ''

  const table = document.createElement('table')
  const header = table.createTHead()
  const headerRow = header.insertRow()

  headers.forEach((headerText) => {
    const headerCell = document.createElement('th')
    headerCell.textContent = headerText.toLocaleUpperCase()
    headerRow.appendChild(headerCell)
  })

  games.forEach((game) => {
    const row = table.insertRow()
    let gameId = ''
    headers.forEach((header) => {
      const cell = row.insertCell()
      
      if (header === 'id') {
        gameId = cell.textContent = game[header]
      }

      if (header === 'status') {
        cell.textContent = game[header]
      }

      if (header === 'players') {
        console.log(game[header])
        cell.innerHTML = ''
        for (let player of game[header]) {
          cell.innerHTML += `<p>${player.name} (${player.id})</p>`
        }
      }

      if (header === 'joinable') {
        if (game['joinable']) {
          let joinSelector = document.createElement('select')
          joinSelector.className = 'join-selector-listbox'
          cell.appendChild(joinSelector)          
          let val0 = document.createElement('option')
          val0.value = ''
          val0.textContent = 'Join as...'
          val0.disabled = true
          val0.selected = true
          joinSelector.appendChild(val0)
          joinSelector.addEventListener("change", () => {
            sendMessage({ 
              type: 'command', 
              content: 'join-game',
              gameId,
              playerInfo: JSON.parse(joinSelector.value)
            })
          });
          joinSelector.addEventListener('focus', () => {
            let numItems = joinSelector.length
            for (let count = 1; count < numItems; count++) {
              joinSelector.options[1] = null;
            }
            let playerInfo = null
            if (playerInfo = getPlayerInfo(1)) {
              let val1 = document.createElement('option')
              val1.value = JSON.stringify(playerInfo)
              val1.textContent = playerInfo.name
              joinSelector.appendChild(val1)
            }
            if (playerInfo = getPlayerInfo(2)) {
              let val2 = document.createElement('option')
              val2.value = JSON.stringify(playerInfo)
              val2.textContent = playerInfo.name
              joinSelector.appendChild(val2)
            }
          })
        } else {
          cell.classList.add('not-joinable')
          cell.textContent = 'No'
        }
      }
    })
  })

  gamesElement.appendChild(table)
}

// TODO - add listener that updated name of add buttons

const createGameBoard = (size) => {
  let table = document.createElement('table')
  let headerRow = document.createElement('tr')
  let deadCorner = document.createElement('th')
  deadCorner.className = 'empty-corner-header'
  headerRow.appendChild(deadCorner)

  for (let col = 0; col < size; col++) {
    let headerCol = document.createElement('th')
    headerCol.className = 'top-header-cell'
    headerCol.textContent = `${String.fromCharCode('A'.charCodeAt(0) + col)}`
    headerRow.appendChild(headerCol)
  }
  table.appendChild(headerRow)

  for (let row = size; row > 0; row--) {
    let rowNode = document.createElement('tr')
    let verticalHeader = document.createElement('th')
    verticalHeader.textContent = row
    verticalHeader.className = 'side-header-cell'
    rowNode.appendChild(verticalHeader)

    for (let col = 0; col < size; col++) {
      let colNode = document.createElement('td')
      colNode.id = `${String.fromCharCode('A'.charCodeAt(0) + col)}${row}`
      colNode.classList.add('board-cell')
      colNode.classList.add('available')
      colNode.onclick = onGameBoardCellClick
      rowNode.appendChild(colNode)
    }

    table.appendChild(rowNode)
  }

  let gameBoardTable = document.getElementById('game-board-table')
  if (gameBoardTable) {
    gameBoardTable.remove()
  }

  table.id = 'game-board-table'
  document.getElementById('game-board-div').appendChild(table)
}

const updateGameBoard = (message) => {
  console.log("TODO: updateGameBoard")
}

const onGameBoardCellClick = (evt) => {
  let boardCell = evt.target
  console.log(`Click on ${boardCell.id}`)
}

const getPlayerInfo = (playerNumber) => {
  let playerInfo = null
  if (document.querySelector(`input[name="player-${playerNumber}-type"]:checked`).value > -1) {
    playerInfo = {
      name: document.getElementById(`player-${playerNumber}-name`).value,
      isComputer: document.querySelector(`input[name="player-${playerNumber}-type"]:checked`).value > 0,
      character: document.getElementById(`player-${playerNumber}-cell-letter`).value,
      colour: document.getElementById(`player-${playerNumber}-cell-color`).value,
      isSmart: document.querySelector(`input[name="player-${playerNumber}-type"]:checked`).value == 2
    }
  }
  return playerInfo
}

const getGameInfo = () => {
  let gameInfo = {
    boardSize: document.getElementById('board-size').value,
    players: []
  }
  let playerInfo = null
  if (playerInfo = getPlayerInfo(1)) {
    gameInfo.players.push(playerInfo)
  }
  if (playerInfo = getPlayerInfo(2)) {
    gameInfo.players.push(playerInfo)
  }
  return gameInfo
}
