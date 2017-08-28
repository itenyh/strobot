/**
 * Created by HJ on 2017/8/23.
 */

const consumeType = require('./config/game-config.json').consumeType
const Egg = require('./eggpush')

function Memory() {

    this.eggObj = new Egg()

    this.totalMoney = 0
    this.bet = 0
    this.round = 0
    this.history = []
    this.index = 0

    this.addGameResult = function (index, win, cost) {
        const newRecord = {
            index: index,
            cost: consumeType[cost],
            win: win,
            round: this.round
        }
        this.history.push(newRecord)
    }

}

module.exports = Memory