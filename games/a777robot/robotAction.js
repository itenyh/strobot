/**
 * Created by HJ on 2017/8/23.
 */

require('../../util/pomelo-cocos2d-js')
const Q = require('q')
const gameConfig = require('../../config/game-config.json')
const EventEmitter = require('events')
const Net = require('../../util/net')
const Operation = require('../../util/chainOperation')

class RobotAction {

    constructor(memory, rules, nid) {
        this.memory = memory
        this.memory.nid = nid
        this.pomelo = (new PP()).pomelo
        this.net = new Net(this.pomelo)
        this.event = new EventEmitter()
        this.rules = rules
    }

    initMemeory(room) {
        this.memory.type = this.rules.getRandomType()
        this.memory.id = this.memory.nid + '-' + room
        this.memory.roomCode = room
        this.memory.entertime = (new Date()).getTime()
        this.memory.lifelong = this.rules.lifecreate()
    }

    addListener() {
        // this.pomelo.on('close', function (data) {
        //     logger.error('机器人【%s】 socket close , 原因: %s %s', this.getId(), data.code, data.reason)
        // }.bind(this))

        this.pomelo.on('io-error', function (data) {
            logger.error('【%s】游戏机器人 => socket io-error , 原因: %s %s', this.getId(), data.code, data.reason)
            this.stop()
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
            this.memory.id += '-' + user.nickname
        }.bind(this))()
    }

    enterGame() {
        return Q.async(function* () {
            yield this.net.asynEnterGame(this.memory.nid)
        }.bind(this))()
    }

    addInitMoney() {
        return Q.async(function* () {
            const newGold = this.rules.getGold(this.memory.type)
            logger.info('【%s】游戏机器人 => 加入金币： %s', this.getId(), newGold)
            yield this.addMoney(newGold)
        }.bind(this))()
    }

    enterRoom() {
        return Q.async(function* () {
            yield this.net.asynEnterRoom(this.memory.roomCode)
            logger.info('【%s】游戏机器人 => 成功进入房间： %s', this.getId(), this.memory.roomCode)
        }.bind(this))()
    }

    lifeCheck() {

        const op = new Operation(null, function (cb) {

            Q.spawn(function* () {

                if(this.rules.timeout(this.memory.entertime, this.memory.lifelong)) {
                    logger.info('【%s】游戏机器人 => 检查生命体征 => 超时，生命结束', this.getId())
                    this.stop()
                }
                else {
                    logger.info('【%s】游戏机器人 => 检查生命体征 => 生命体征平稳', this.getId())
                    cb(this.rules.lifeCheckInterval)
                }

            }.bind(this))

        }.bind(this))
        this.memory.lifeCheckTimerRef = op
        op.start(0)

    }

    tease() {

        const op = new Operation(null, function (cb) {

            Q.spawn(function* () {

                const teaseMsg = this.rules.getRandomTease(this.memory.tease)
                try {
                    yield this.net.asynTease(teaseMsg)
                    logger.info('【%s】游戏机器人 => 吐槽： %s', this.getId(), teaseMsg)
                }
                catch (err) {
                    logger.error('【%s】游戏机器人 => 吐槽异常 => %s', this.getId(), err)
                }
                cb(this.rules.getTeaseDurationSecondsInMill())

            }.bind(this))

        }.bind(this))
        this.memory.teaseTimerRef = op
        op.start(this.rules.getTeaseDurationSecondsInMill())

    }

    play() {

        const op = new Operation(null, function (cb) {

            Q.spawn(function* () {

                const pay = this.caculatePay(this.memory.gold)
                if (pay) {

                    logger.info('【%s】游戏机器人 => 玩一把 %s', this.getId(), Date.now())
                    try {
                        const result = yield this.net.asynPlay777(pay[0], pay[1])
                        const totalWin = result.totalWin
                        const profit = totalWin - pay[0] * pay[1]
                        this.memory.gold += profit
                        this.memory.profit += profit
                        this.memory.round += 1
                        this.memory.roundLeft -= 1

                        logger.info('【%s】游戏机器人 => totalWin: %s 剩余金币：%s 到目前为止总利润: %s 还能玩 %s 秒', this.getId(), totalWin, this.memory.gold, this.memory.profit, this.rules.timeleft(this.memory.entertime, this.memory.lifelong) / 1000)

                        // const potData = yield this.net.asynQuery777JackPot()
                        // this.emit('round', [+this.getUid(), pay[0] * pay[1], this.memory.profit, this.memory.round, potData.jackpotFund, potData.runningPool, potData.profitPool])

                        let waitTime = this.rules.getWait2PlayDurationSecondsInMill(totalWin > 0, this.memory.gold)
                        logger.info('【%s】游戏机器人 => 等待%s秒后 再次游戏', this.getId(), waitTime / 1000)
                        cb(waitTime)
                    }
                    catch (err) {
                        logger.error('【%s】游戏机器人 => 玩耍异常 => %s', this.getId(), err)
                        this.stop()
                    }

                }
                else {
                    if (!this.memory.addedMoney) {
                        logger.info('【%s】游戏机器人 => 剩余金币：%s 余额不足', this.getId(), this.memory.gold)
                        try {
                            yield this.addMoney(this.rules.getGold(this.memory.type))
                            this.memory.addedMoney = true
                            cb(0)
                        }
                        catch (err) {
                            logger.error('【%s】游戏机器人 => 加钱异常 => %s', this.getId(), err)
                            this.stop()
                        }
                    }
                    else {
                        logger.info('【%s】游戏机器人 => 剩余金币：%s 余额不足, 已加过钱，不再加了', this.getId(), this.memory.gold)
                        this.stop()
                    }

                }

            }.bind(this))

        }.bind(this))
        this.memory.playTimerRef = op
        op.start(0)

    }

    leaveRoom2Game() {
        return Q.async(function* () {
            yield this.net.asynLeaveRoom2Game()
        }.bind(this))()
    }

    clear () {
        if (this.memory.teaseTimerRef) {
            logger.info('【%s】游戏机器人 => 清理吐槽链式控制器 ', this.getId())
            this.memory.teaseTimerRef.cancel()
        }
        if (this.memory.playTimerRef) {
            logger.info('【%s】游戏机器人 => 清理游戏链式控制器 ', this.getId())
            this.memory.playTimerRef.cancel()
        }
        if (this.memory.lifeCheckTimerRef) {
            logger.info('【%s】游戏机器人 => 清理生命体征检测链式控制器 ', this.getId())
            this.memory.lifeCheckTimerRef.cancel()
        }
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

    stop() {

        this.clear()

        // try {
        //     yield this.leaveRoom2Game()
        // }
        // catch (reason) {
        //     logger.error('【%s】游戏机器人 => stop 退出房间失败 , 原因: %s', this.getId(), reason)
        // }

        this.disconnect()
        logger.info('【%s】游戏机器人 => stop ', this.getId())

    }


}

module.exports = RobotAction
