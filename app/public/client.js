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
    headers.forEach((header) => {
      const cell = row.insertCell()
      cell.textContent = game[header]

      if (header === 'players') {
        console.log(game[header])
        cell.textContent = game[header].map(player => ' ' + player.name + `(${player.id})`)
      }

      if (header === 'joinable') {
        cell.classList.add(game[header] ? 'joinable' : 'not-joinable')
        // TODO: Add Join button if yes
        cell.textContent = game[header] ? 'Yes' : 'No'
      }
    })
  })

  gamesElement.appendChild(table)
}

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

const getGameInfo = () => {
  let gameInfo = {
    boardSize: document.getElementById('board-size').value,
    players: []
  }
  if (document.querySelector('input[name="player-1-type"]:checked').value > -1) {
    gameInfo.players.push({
      name: document.getElementById('player-1-name').value,
      isComputer: document.querySelector('input[name="player-1-type"]:checked').value > 0,
      boardLetter: document.getElementById('player-1-cell-letter').value,
      cellColor: document.getElementById('player-1-cell-color').value,
      isSmart: document.querySelector('input[name="player-1-type"]:checked').value == 2,
    })
  }
  if (document.querySelector('input[name="player-2-type"]:checked').value > -1) {
    gameInfo.players.push({
      name: document.getElementById('player-2-name').value,
      isComputer: document.querySelector('input[name="player-2-type"]:checked').value > 0,
      boardLetter: document.getElementById('player-2-cell-letter').value,
      cellColor: document.getElementById('player-2-cell-color').value,
      isSmart: document.querySelector('input[name="player-2-type"]:checked').value == 2,
    })
  }
  return gameInfo
}
