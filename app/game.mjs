import { Board } from './board.mjs'
import { createPlayer } from './app_helpers.mjs'

export class Game {
  /**
   * Creates a game object
   * @constructor
   * @param {int} boardSize The size of the playing board
   * @param {{name: string, boardLetter: string, isComputer: bool}} playerOneInfo Describe a player object
   * @param {{name: string, boardLetter: string, isComputer: bool}} playerTwoInfo Describe a player object
   */
  constructor(id, boardSize, playerOneInfo, playerTwoInfo) {
    if (boardSize && playerOneInfo && playerTwoInfo) {
      this._board = new Board(boardSize)
      this._players = [createPlayer(playerOneInfo), createPlayer(playerTwoInfo)]
      this._id = id
    }
    this._currentPlayerIdx = 0
  }
  get board() {
    return this._board
  }
  get players() {
    return this._players
  }
  get currentPlayer() {
    if (this._players) {
      return this._players[this._currentPlayerIdx]
    }
    return undefined
  }
  get id() {
    return this._id
  }
  doPlayerTurn(x, y, player) {
    if (player) {
      // TODO: validate and perform turn
      // TODO: validate that the player taking the turn is the same as the curent player
      // TODO: check for game status - win or draw
      // TODO: if we are moving on update the current player
      // TODO: console.log(`Putting ${player.boardLetter} on the board at [${x},${y}]`)
      // TODO: remove eslint-disable-line
      this.board.setCell(x, y, player)
      this._currentPlayerIdx = (this._currentPlayerIdx + 1) % 2
      let status = this.checkStatus(player)
      status.turnMessage = `${player.name} placed an ${player.boardLetter} at [${x},${y}]`
      return status
    }
  }

  getAvailableCells() {
    let availableCells = []
    for (let row = 0; row < this.board.boardSize; row++) {
      for (let col = 0; col < this.board.boardSize; col++) {
        if (!this.board.getCell(col, row)) {
          availableCells.push({
            x: col,
            y: row,
          })
        }
      }
    }
    return availableCells
  }

  checkStatus(player) {
    // TODO: Make this better, refactor it, dedupe it
    // NOTE: If we check after each move, we only need to check the current player

    let status = {
      gameOver: true,
      message: `${player.name} (${player.boardLetter}) Wins!`,
    }

    // check rows
    for (let row = 0; row < this.board.boardSize; row++) {
      player.count = 0
      for (let col = 0; col < this.board.boardSize; col++) {
        let cell = this.board.getCell(col, row)
        if (cell && cell.boardLetter == player.boardLetter) {
          player.count++
        }
      }
      if (this.board.boardSize == player.count) {
        // console.log(`col:${col}, row:${row}`)
        return status
      }
    }

    // check cols
    for (let col = 0; col < this.board.boardSize; col++) {
      player.count = 0
      for (let row = 0; row < this.board.boardSize; row++) {
        let cell = this.board.getCell(col, row)
        if (cell && cell.boardLetter == player.boardLetter) {
          player.count++
        }
      }
      if (this.board.boardSize == player.count) {
        return status
      }
    }

    // check upper-left to lower-right diagonal
    player.count = 0
    for (let col = 0, row = 0; col < this.board.boardSize; col++, row++) {
      let cell = this.board.getCell(col, row)
      if (cell && cell.boardLetter == player.boardLetter) {
        player.count++
      }
    }
    if (this.board.boardSize == player.count) {
      return status
    }

    // check lower-left to upper-right diagonal
    player.count = 0
    for (let col = 0, row = this.board.boardSize - 1; col < this.board.boardSize; col++, row--) {
      let cell = this.board.getCell(col, row)
      if (cell && cell.boardLetter == player.boardLetter) {
        player.count++
      }
    }
    if (this.board.boardSize == player.count) {
      return status
    }

    // game is a draw
    let availableCells = this.getAvailableCells()
    if (availableCells.length == 0) {
      status.message = 'Game is a Draw!'
      return status
    }

    return {
      gameOver: false,
      message: `Game In Progress`,
    }
  }
}
