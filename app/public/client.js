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
    showUserId(messageContent.clientId)
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

  if (messageContent.clients) {
    console.log(messageContent)
    showAvailableUsers(messageContent.clients)
  }
})

// Handle post events on websocket
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

document.getElementById('refreshUsers').onclick = () => {
  sendMessage({ type: 'command', content: 'get-users' })
}

const messageFeed = document.getElementById('messageFeed')

function addToFeed(message) {
  const messageElement = document.createElement('p')
  messageElement.textContent = `${message.type} -> ${message.content}`

  messageFeed.appendChild(messageElement)
}

function showAvailableUsers(users) {
  const headers = ['id', 'copy']

  const usersElement = document.getElementById('activeUsers')
  usersElement.innerHTML = ''

  const table = document.createElement('table')
  const header = table.createTHead()
  const headerRow = header.insertRow()

  headers.forEach((headerText) => {
    const headerCell = document.createElement('th')
    headerCell.textContent = headerText.toLocaleUpperCase()
    headerRow.appendChild(headerCell)
  })
  for (const user in users) {
    const row = table.insertRow()
    const cell = row.insertCell()
    cell.textContent = user

    const copyButton = document.createElement('button')
    copyButton.textContent = 'Copy'
    copyButton.onclick = () => {
      navigator.clipboard.writeText(user)
    }
    const copyCell = row.insertCell()
    copyCell.appendChild(copyButton)

    console.log(users[user])
  }

  usersElement.appendChild(table)
}

function showUserId(id) {
  const idElement = document.getElementById('personalId')
  idElement.textContent += id
  idElement.value = id
}
