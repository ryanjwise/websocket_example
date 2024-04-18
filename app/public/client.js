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
      `Client: WebSocket recieved message: -> ${JSON.stringify(message.data, null, 2)}`
    )
    addToFeed(messageContent)
  }

  if (messageContent.games) {
    showAvailableGames(messageContent.games)
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
  sendMessage(message)
}

const messageFeed = document.getElementById('messageFeed')

const addToFeed = (message) => {
  const messageElement = document.createElement('p')
  messageElement.textContent = `${message.type} -> ${message.content}`

  messageFeed.appendChild(messageElement)
}

const showAvailableGames = (games) => {
  const headers = ['status', 'players', 'joinable'];
  
  const gamesElement = document.getElementById('availableGames')
  gamesElement.innerHTML = '';

  const table = document.createElement('table');
  const header = table.createTHead();
  const headerRow = header.insertRow();

  headers.forEach(headerText => {
    const headerCell = document.createElement('th');
    headerCell.textContent = headerText.toLocaleUpperCase();
    headerRow.appendChild(headerCell);
  });

  games.forEach(game => {
    const row = table.insertRow();
    headers.forEach(header => {
      const cell = row.insertCell();
      cell.textContent = game[header];

      if(header === "joinable"){
        cell.classList.add(game[header] ? 'joinable' : 'not-joinable')
        // TODO: Add Join button if yes
        cell.textContent = game[header] ? 'Yes' : 'No'
      }
    });
  });

  gamesElement.appendChild(table)
}