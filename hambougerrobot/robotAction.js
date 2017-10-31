/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const RobotAction = require('../a777robot/robotAction')

class HambougerRobotAction extends RobotAction {

    play() {
        return Q.async(function* () {

            while (true) {

                const pay = this.caculatePay(this.memory.gold)
                if (pay) {

                    logger.info('机器人 %s 玩一把汉堡 %s', this.getId(), Date.now())
                    const result = yield this.net.asynPlayHambouger(pay[0], pay[1])
                    const totalWin = result.totalWin
                    const profit = totalWin - pay[0] * pay[1]
                    this.memory.gold += profit
                    this.memory.profit += profit
                    this.memory.round += 1

                    logger.info('机器人 %s totalWin: %s 剩余金币：%s 到目前为止总利润: %s', this.getId(), totalWin, this.memory.gold, this.memory.profit)

                    const potData = yield this.net.asynQuery777JackPot()
                    this.emit('round', [+this.getUid(), pay[0] * pay[1], this.memory.profit, this.memory.round, potData.jackpotFund, potData.runningPool, potData.profitPool])

                    let waitTime = global.rules.getWait2PlayDurationSecondsInMill(totalWin > 0, this.memory.gold)
                    yield Q.delay(waitTime)

                }
                else {
                    if (!this.memory.addedMoney) {
                        logger.info('机器人 %s 剩余金币：%s 余额不足', this.getId(), this.memory.gold)
                        yield this.addMoney(global.rules.getGold(this.memory.type))
                        this.memory.addedMoney = true
                    }
                    else {
                        logger.info('机器人 %s 剩余金币：%s 余额不足, 已加过钱，不再加了', this.getId(), this.memory.gold)
                        break
                    }

                }

            }

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

    static createRobotAction() {
        const Memory = require('./memory')
        return new HambougerRobotAction(new Memory())
    }

}


module.exports = HambougerRobotAction
