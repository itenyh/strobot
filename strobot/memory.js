/**
 * Created by HJ on 2017/8/23.
 */

const consumeType = {
    small: 20,
    middle: 100,
    large: 1000
}

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