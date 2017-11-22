/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const _RobotAction = require('../a777robot/robotAction')

class RobotAction extends _RobotAction {

    playNetRequest(pay) {
        return Q.async(function* () {
            return yield this.net.asynPlayHambouger(pay[0], pay[1])
        }.bind(this))()
    }

    caculatePay(gold) {

        let finalbet = -1
        let finalline = -1

        const lineNums = [9, 15, 25]
        const bets = [5, 50, 250, 1000, 4000, 10000]
        const maxPay = gold * 0.95

        const lineNumsCat = lineNums.length
        const betsCat = bets.length

        for (let i = lineNumsCat - 1;i >= 0;i--) {
            for (let j = betsCat - 1;j >= 0;j--) {
                const tempPay = lineNums[i] * bets[j]
                if (tempPay <= maxPay) {
                    finalline = lineNums[i]
                    finalbet = bets[j]
                    return [finalline, finalbet]
                }
            }
        }

        return false

    }

}


module.exports = RobotAction
