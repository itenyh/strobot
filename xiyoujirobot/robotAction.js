/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('./memory')
const gameConfig = require('../config/game-config.json')
const gameParams = require('./config/game-config.json')
const EventEmitter = require('events')

function RobotAction(net) {

    const memory = new Memory()
    const event = new EventEmitter()

    this.initMemeory = function (room) {
        memory.type = global.rules.getRandomType()
        memory.id = v1().replace(/-/g, '') + '-' + room + '-' + memory.type
        memory.roomCode = room
    }

    this.getId = function () {
        return memory.id
    }

    this.getUid = function () {
        return memory.uid
    }

    this.disconnect = () => {
        net.disconnect()
    }

    this.on = function (eventName, data) {
        event.on(eventName, data)
    }

    this.connect = Q.async(function* () {
        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        const userData = yield net.asynEnter(userLoginData.uid, userLoginData.token)
        const user = userData.user
        memory.uid = user.uid
        memory.id += '-' + user.nickname + '-' + memory.uid
    })

    this.enterGame = Q.async(function* () {
        yield net.asynEnterGame(gameParams.nid)
    })

    this.addInitMoney = Q.async(function* () {
        const newGold = global.rules.getGold(memory.type)
        logger.info('机器人 %s 加入金币： %s', this.getId(), newGold)
        yield addMoney(newGold)
    })

    this.enterRoom = Q.async(function* () {
        yield net.asynEnterRoom(memory.roomCode)
        logger.info('机器人 %s 成功进入房间： %s', this.getId(), memory.roomCode)
    })

    this.play = Q.async(function* () {

        let a = 1
        while (a) {
            // a = 0
            if (memory.isNotified2Leave) {
                return
            }

            const pay = caculatePay(memory.gold)
            if (pay) {
                yield net.asynGainedScatter()
                const result = yield net.asynPlayXiyouji(pay[0], pay[1])
                const totalWin = result.result.allTotalWin
                const profit = totalWin - pay[0] * pay[1]
                memory.gold += profit
                memory.profit += profit
                memory.round += 1

                logger.info('机器人 %s totalWin: %s 剩余金币：%s 到目前为止总利润: %s', this.getId(), totalWin, memory.gold, memory.profit)
                event.emit('round', [+this.getUid(), pay[0] * pay[1], memory.profit, memory.round])

                let waitTime = global.rules.getWait2PlayDurationSecondsInMill(totalWin > 0, memory.gold)
                yield Q.delay(waitTime)

            }
            else {
                if (!memory.addedMoney) {
                    logger.info('机器人 %s 剩余金币：%s 余额不足', this.getId(), memory.gold)
                    yield addMoney(global.rules.getGold(memory.type))
                    memory.addedMoney = true
                }
                else {
                    logger.info('机器人 %s 剩余金币：%s 余额不足, 已加过钱，不再加了', this.getId(), memory.gold)
                    break
                }

                break

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

    function addMoney(gold) {

        return Q.async(function* () {
            const result = yield net.asynAddMoney(memory.uid, gold)
            memory.gold = result.gold
        })()

    }


}

module.exports = RobotAction
