/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('./memory')
const gameConfig = require('./config/game-config.json')

function RobotAction(net) {

    const memory = new Memory()

    this.initMemeory = function (room) {
        memory.id = v1().replace(/-/g, '') + '-' + room
        memory.type = global.a777Rules.getRandomType()
    }

    this.getId = function () {
        return memory.id
    }

    this.disconnect = () => {
        net.disconnect()
    }

    this.connect = Q.async(function* () {

        yield net.asynReady({host: '192.168.1.105', port: '3010'})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        const userData = yield net.asynEnter(userLoginData.uid, userLoginData.token)
        const user = userData.user
        memory.uid = user.uid
        yield net.asynEnterGame()
        yield addMoney(global.a777Rules.getGold(memory.type))
    })

    this.enterRoom = Q.async(function* (roomCode) {
        yield (net.asynEnterRoom(roomCode))
        logger.info('机器人 %s 成功进入房间： %s', this.getId(), roomCode)
    })

    this.play = Q.async(function* () {
        while (true) {

            if (memory.isNotified2Leave) {
                return
            }

            const pay = caculatePay(memory.gold)
            if (pay) {
                const result = yield net.asynPlay777(pay[0], pay[1])
                const totalWin = result.totalWin
                const profit = totalWin - pay[0] * pay[1]
                memory.gold += profit

                logger.info('机器人 %s totalWin: %s 剩余金币：%s', this.getId(), totalWin, memory.gold)

                let waitTime = global.a777Rules.getWait2PlayDurationSecondsInMill(totalWin > 0, memory.gold)
                yield Q.delay(waitTime)
            }
            else {

                if (!memory.addedMoney) {
                    logger.info('机器人 %s 剩余金币：%s 余额不足', this.getId(), memory.gold)
                    yield addMoney(global.a777Rules.getGold(memory.type))
                    memory.addedMoney = true
                }
                else {
                    logger.info('机器人 %s 剩余金币：%s 余额不足, 已加过钱，不再加了', this.getId(), memory.gold)
                    break
                }

            }

        }

    })

    this.getRobotInfo = function () {
        return memory
    }

    this.leaveRoom2Game = Q.async(function* () {
        yield net.asynLeaveRoom2Game()
    })

    function caculatePay(gold) {

        let finalbet = -1
        let finalline = -1

        const lineNums = [9, 15, 25]
        const bets = [5, 25, 50, 250]
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

    function addMoney(gold) {

        return Q.async(function* () {
            const result = yield net.asynAddMoney(memory.uid, gold)
            memory.gold = result.gold
        })()

    }


}

module.exports = RobotAction