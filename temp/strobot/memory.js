/**
 * Created by HJ on 2017/8/23.
 */

const Egg = require('./eggpush')

function Memory() {

    this.eggObj = new Egg()

    this.totalMoney = 0
    this.bet = 0
    this.round = 0
    this.index = 0


}

module.exports = Memory