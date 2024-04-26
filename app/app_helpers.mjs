import { Computer } from './computer.mjs'
import { Player } from './player.mjs'

/**
 * Create a player object
 * @param {{name: string, boardLetter: string, isComputer: bool}} playerInfo Describe a player object
 */
export function createPlayer(playerInfo) {
  if (playerInfo && playerInfo.isComputer) {
    return new Computer(playerInfo)
  } else if (playerInfo && playerInfo.id) {
    return new Player(playerInfo)
  }

  throw new Error('bad player info object')
}
