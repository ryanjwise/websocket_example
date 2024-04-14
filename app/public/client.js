// Establish websocket connection with the given route
const socket = new WebSocket(`ws://localhost:3000`)

// Handle Socket events
socket.addEventListener('open', (event) => {
  console.log(`Client: WebSocket connection established on: -> ${event.currentTarget.url}`)
})

socket.addEventListener('message', (message) => {
  console.log(
    `Client: WebSocket recieved message: -> ${JSON.stringify(message, null, 2)}`
  )
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