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
