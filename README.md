# WebSocket POC

This project demonstrates a simple proof of concept for a WebSocket server built with Node.js and Express. The server is capable of accepting WebSocket connections and broadcasting messages to all connected clients.

## Getting Started

To get started with this project, clone the repository and install the dependencies.

```bash
git clone https://github.com/ryanjwise/websocket_example
cd websocket_poc
npm install
```

## Running the Server

To run the server, execute the following command:

```bash
npm start
```

## Linting the Code

To lint the project and automatically fix any linting errors, run:

```bash
bash npm run lint 
```

## Project Structure

- `app/`
  - `server.mjs`: The main server file where the WebSocket server is initialized.
  - `public/`: Contains static files that are served by the Express application.
    - `index.html`: The main HTML file that establishes a WebSocket connection when accessed via a web browser.
    - `client.js`: The JavaScript file included by `index.html` that handles the WebSocket client logic.


## WebSocket API
The WebSocket server listens on the following endpoint for incoming WebSocket connections:

```
ws://localhost:3000
```

## Contributing

Contributions to this project are welcome. Please feel free to submit issues, pull requests, or enhancements.

## License

This project is licensed under the CC0 License - see the [LICENSE](LICENSE) file for details.