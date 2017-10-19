/**
 * Created by HJ on 2017/8/23.
 */

function Memory() {

    this.id = ''
    this.initGold = -1
    this.type = ''

    this.gold = 0
    this.isDealer = false
    this.betGoldthisTound = 0
    this.isLastBetWin = false
    this.continueWin = false
    this.addedMoney = false

    this.dealerRoundNum = 0
    this.dealerRoundWin = 0
    this.dealerRoundLimit = 0


}

// const m = new Memory()

module.exports = Memory
