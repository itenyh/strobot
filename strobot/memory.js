/**
 * Created by HJ on 2017/8/23.
 */

const consumeType = require('./config/game-config.json').consumeType

function Memory() {

    this.totalMoneySpend = 0
    this.round = 0
    this.history = []

    this.addGameResult = function (win, cost) {
        const newRecord = {
            cost: consumeType[cost],
            win: win,
            round: ++this.round
        }
        this.history.push(newRecord)
    }

}

module.exports = Memory