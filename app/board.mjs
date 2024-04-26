export class Board {
  constructor(boardSize) {
    // TODO: Boards must be square and must be an odd number > 1
    // TODO: Add feature to generate random board size
    // TODO: I wonder how hard it would be to do a 3D version?
    // NOTE: Like a threejs scene, or three dimensionsal board?
    if (!this.#validBoardSize(boardSize)) throw new Error('invalid boardSize')
    this._boardSize = boardSize
    this._cells = []
    for (let row = 0; row < this.height; row++) {
      let cols = []
      for (let col = 0; col < this.width; col++) {
        cols.push(null)
      }
      this._cells.push(cols)
    }
  }
  get boardSize() {
    return this._boardSize
  }
  get width() {
    return this._boardSize
  }
  get height() {
    return this._boardSize
  }
  get cells() {
    return this._cells
  }
  cellIndexValid(x, y) {
    return this._cells && x >= 0 && x < this.width && y >= 0 && y < this.height
  }
  getCell(x, y) {
    if (this.cellIndexValid(x, y)) {
      return this._cells[y][x]
    }
  }
  setCell(x, y, player) {
    if (this.cellIndexValid(x, y) && player) {
      this._cells[y][x] = player
    }
  }

  #validBoardSize(boardSize) {
    if (!boardSize) return false
    if (boardSize === 1) return false
    if (boardSize % 2 !== 1) return false
    return true
  }

  #buildBoardString(startChar, divideChar, endChar) {
    const center = '─'.repeat(3)
    return (
      startChar + Array.from({ length: this.boardSize - 1 }, () => `${center}${divideChar}`).join('') + center + endChar
    )
  }

  #buildBoardAlphaCoords() {
    return (
      ' ' +
      Array.from({ length: this.width }, (val, i) => `   ${String.fromCharCode('A'.charCodeAt(0) + i)}`).join('') +
      '\n'
    )
  }

  draw() {
    /*    A   B   C
        ┌───┬───┬───┐
      3 │ X │ X │   │
        ├───┼───┼───┤
      2 │ X │ O │ O │
        ├───┼───┼───┤
      1 │ X │   │ X │
        └───┴───┴───┘
    */
    const topLine = this.#buildBoardString('  ┌', '┬', '┐\n')
    const dividingLine = this.#buildBoardString('  ├', '┼', '┤\n')
    const bottomLine = this.#buildBoardString('  └', '┴', '┘')

    const board = this.cells
      .map((col, i) => {
        const row = col.map((cell) => `│ ${cell ? cell.boardLetter : ' '} `).join('') + '│'
        const prefix = `${this.height - i} `
        return prefix + row + (i !== this.width - 1 ? '\n' + dividingLine : '\n')
      })
      .join('')
    return this.#buildBoardAlphaCoords() + topLine + board + bottomLine
  }
}
