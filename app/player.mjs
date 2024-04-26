export class Player {
  /**
   * Represents a player
   * @constructor
   * @param {{name: string, boardLetter: string, isComputer: bool}} playerInfo Describe a player object
   */
  constructor(playerInfo) {
    if (playerInfo) {
      this._name = playerInfo.name
      this._boardLetter = playerInfo.boardLetter
      this._isComputer = playerInfo.isComputer
      this._isSmart = playerInfo.isSmart
      this._cellColor = playerInfo.cellColor
      this._id = playerInfo.id || null
    }
  }
  get name() {
    return this._name
  }
  get boardLetter() {
    return this._boardLetter
  }
  get isComputer() {
    return this._isComputer
  }
  get cellColor() {
    return this._cellColor
  }
  get isSmart() {
    return this._isSmart
  }
  get id() {
    return this._id
  }

  takeTurn(game) {
    if (game) {
      // TODO: Add logic here to ask the player what they want to do
      let randX = Math.random() * game.board.dimension
      let randY = Math.random() * game.board.dimension
      game.doPlayerTurn(randX, randY, this)
    }
  }
}
