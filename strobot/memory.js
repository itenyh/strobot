/**
 * Created by HJ on 2017/8/23.
 */

function Memory() {

    this.totalMoneySpend = 0
    this.round = 0
    this.history = []

    this.addGameResult = function (win, cost) {
        const newRecord = {
            cost: cost,
            win: win,
            round: ++this.round
        }
        this.history.push(newRecord)
    }

}

module.exports = Memory