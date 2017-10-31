/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const gameConfig = require('../config/game-config.json')
const EventEmitter = require('events')
const Net = require('../util/net')

class RobotAction {

    constructor(memory) {
        this.memory = memory
        this.pomelo = (new PP()).pomelo;
        this.net = new Net(this.pomelo);
        this.event = new EventEmitter();
    }

    initMemeory(room) {
        this.memory.type = global.rules.getRandomType()
        this.memory.id = v1().replace(/-/g, '') + '-' + room + '-' + this.memory.type
        this.memory.roomCode = room
    }

    addListener() {
        this.pomelo.on('close', function (data) {
            logger.error('机器人【%s】 socket close , 原因: %s %s', this.getId(), data.code, data.reason)
        }.bind(this))

        this.pomelo.on('io-error', function (data) {
            logger.error('机器人【%s】 socket error , 原因: %s %s', this.getId(), data.code, data.reason)
        }.bind(this))
    }

    getId() {
        return this.memory.id
    }

    getUid() {
        return this.memory.uid
    }

    disconnect() {
        this.net.disconnect()
    }

    on(eventName, data) {
        this.event.on(eventName, data)
    }

    emit(eventName, data) {
        this.event.emit(eventName, data)
    }

    connect() {
        return Q.async(function* () {
            yield this.net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
            const loginData = yield this.net.asynLogin()
            const userLoginData = yield this.net.asynUserLogin(loginData.id)
            yield this.net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
            const userData = yield this.net.asynEnter(userLoginData.uid, userLoginData.token)
            const user = userData.user
            this.memory.uid = user.uid
            this.memory.id += '-' + user.nickname + '-' + this.memory.uid
        }.bind(this))()
    }

    enterGame() {
        return Q.async(function* () {
            yield this.net.asynEnterGame(this.memory.nid)
        }.bind(this))()
    }

    addInitMoney() {
        return Q.async(function* () {
            const newGold = global.rules.getGold(this.memory.type)
            logger.info('机器人 %s 加入金币： %s', this.getId(), newGold)
            yield this.addMoney(newGold)
        }.bind(this))()
    }

    enterRoom() {
        return Q.async(function* () {
            yield this.net.asynEnterRoom(this.memory.roomCode)
            logger.info('机器人 %s 成功进入房间： %s', this.getId(), this.memory.roomCode)
        }.bind(this))()
    }

    play() {
        return Q.async(function* () {

            while (true) {

                if (this.memory.isNotified2Leave) {
                    return
                }

                const pay = this.caculatePay(this.memory.gold)
                if (pay) {

                    logger.info('机器人 %s 玩一把 %s', this.getId(), Date.now())
                    const result = yield this.net.asynPlay777(pay[0], pay[1])
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

    leaveRoom2Game() {
        return Q.async(function* () {
            yield this.net.asynLeaveRoom2Game()
        }.bind(this))()
    }

    caculatePay(gold) {

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

    addMoney(gold) {

        return Q.async(function* () {
            const result = yield this.net.asynAddMoney(this.memory.uid, gold)
            this.memory.gold = result.gold
        }.bind(this))()

    }

    static createRobotAction() {
        const Memory = require('./memory')
        return new RobotAction(new Memory())
    }

}

module.exports = RobotAction
