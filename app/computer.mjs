import { Player } from './player.mjs'

export class Computer extends Player {
  // TODO: Add feature to allow two Computer players to play each other
  // TODO: Add feature to have the Computer have different skill levels
  constructor(playerInfo) {
    super(playerInfo)
  }
  get isComputer() {
    return super.isComputer
  }
  get isSmart() {
    return super.isSmart
  }
  takeTurn(game) {
    if (game) {
      // TODO: Add logic here to automatically pick a move to make
      let availableCells = game.getAvailableCells()
      if (availableCells.length > 0) {
        let cell = this.pickCell(game, availableCells)
        return game.doPlayerTurn(cell.x, cell.y, this)
      }
    }
  }
  pickCell(game, availableCells) {
    let cell = availableCells[Math.floor(Math.random() * availableCells.length)]
    if (this.isSmart) {
      let boardSize = Number(game.board.boardSize)
      if (availableCells.length < boardSize * boardSize - 1) {
        // don't bother for the first two moves
        while (cell) {
          for (let xOffset = -1; xOffset <= 1; xOffset++) {
            for (let yOffset = -1; yOffset <= 1; yOffset++) {
              if (cell.x + xOffset < 0) continue
              if (cell.x + xOffset >= boardSize) continue
              if (cell.y + yOffset < 0) continue
              if (cell.y + yOffset >= boardSize) continue
              let cellTest = game.board.getCell(cell.x + xOffset, cell.y + yOffset)
              if (cellTest && cellTest.boardLetter == this.boardLetter) {
                return cell
              }
            }
          }
          cell = availableCells[Math.floor(Math.random() * availableCells.length)]
        }
      }
    }
    return cell
  }
}
