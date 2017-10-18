/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const v1 = require('uuid/v1');
const Memory = require('../memory/memory')
const gameConfig = require('../config/game-config.json')

function RobotAction(net) {

    const memory = new Memory()

    this.initMemeory = function (room) {
        memory.type = global.rules.getRandomType()
        memory.id = v1().replace(/-/g, '') + '-' + room + '-' + memory.type
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

    this.connect = Q.async(function* () {

        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        const userData = yield net.asynEnter(userLoginData.uid, userLoginData.token)
        const user = userData.user
        memory.uid = user.uid
        memory.id += '-' + user.nickname
        yield net.asynEnterGame()
        yield addMoney()

    })

    this.enterRoom = Q.async(function* (roomCode) {
        yield (net.asynEnterRoom(roomCode))
        logger.info('机器人 %s 成功进入房间： %s', this.getId(), roomCode)
    })

    const play = Q.async(function* () {

        const betInfo = global.rules.getRandomBetElements(memory.type, memory.isLastBetWin, memory.gold)
        if (betInfo) {
            yield net.asynPlay(betInfo.bets)
            memory.betGoldthisTound = betInfo.total
        }
        else {

            if (!memory.addedMoney) {
                logger.info('机器人 %s 剩余金币：%s 余额不足', this.getId(), memory.gold)
                yield addMoney()
                memory.addedMoney = true
            }
            else {
                logger.info('机器人 %s 剩余金币：%s 余额不足, 已加过钱，不再加了', this.getId(), memory.gold)
                // break
            }

        }

    }.bind(this))

    this.dealWithPlayResult = function (data) {
        const totalWin = data.self
        const profit = totalWin - memory.betGoldthisTound
        memory.betGoldthisTound = 0
        memory.gold += profit
        memory.isLastBetWin = totalWin > 0
        memory.dealerRoundWin += profit
        logger.info('机器人 %s profit: %s, totalWin: %s 剩余金币：%s', this.getId(), profit, totalWin, memory.gold)
    }

    this.dealWithStartBetting = function () {

        Q.spawn(function* () {

            logger.info('机器人 %s =========== 开始新的一局 =========' , this.getId())

            const dealerData = yield net.asynGetDealerInfo()
            const dealer = dealerData.dealer
            const queue = dealerData.queue

            const isDealerSelf = (dealer.uid === memory.uid)
            const isDealerRobot = dealer.isRobot
            let isInQueue = false
            for (user of queue) {
                if (user.uid === memory.uid) {
                    isInQueue = true
                    break
                }
            }

            if (!memory.isDealer && isDealerSelf) {
                logger.info('机器人 %s 上庄成功!' , this.getId())
                memory.dealerRoundLimit = global.rules.getRandomOffDealerNum()
            }

            else if(memory.isDealer && !isDealerSelf) {
                logger.info('机器人 %s 下庄成功!' , this.getId())
                this.dealerRoundNum = 0
                this.dealerRoundWin = 0
                this.dealerRoundLimit = 0
            }

            memory.isDealer = isDealerSelf

            logger.info('机器人 %s 当前庄家状态 %s' , this.getId(), JSON.stringify(dealer))

            if (isInQueue) {
                logger.info('机器人 %s 已在上庄队列中' , this.getId())
            }

            if(!isDealerSelf && isDealerRobot && !isInQueue) {
                if (global.rules.isOnDealer(memory.type)) {
                    logger.info('机器人 %s 上庄', this.getId())
                    try {
                        yield net.asynApplyDealer()
                    }
                    catch (err) {
                        logger.info('机器人 %s 上庄 error : %s', this.getId(), err)
                    }
                }
            }

            if (!isDealerSelf) {
                logger.info('机器人 %s 押注', this.getId())
                if (!memory.isLastBetWin) {
                    yield play()
                }
                else {
                    logger.info('机器人 %s 上局赢了，这局不押' , this.getId())
                    memory.isLastBetWin = false
                }
            }

            else {
                logger.info('机器人 %s 庄家不押注', this.getId())
                memory.dealerRoundNum += 1
                if (global.rules.isOffDealer(memory.type, memory.dealerRoundNum, memory.dealerRoundLimit, memory.dealerRoundWin, memory.gold)) {
                    yield net.asynOffDealer()
                }
            }




        }.bind(this))

    }

    this.getRobotInfo = function () {
        return memory
    }

    this.leaveRoom2Game = Q.async(function* () {
        yield net.asynLeaveRoom2Game()
    })


    function addMoney() {

        if (memory.initGold === -1) {
            memory.initGold = global.rules.getRandomGold()
        }

        Q.spawn(function* () {
            logger.info('机器人 %s 加入金币：%s', memory.id, memory.initGold)
            const result = yield net.asynAddMoney(memory.uid, memory.initGold + memory.gold)
            memory.gold = result.gold
        })

    }


}

module.exports = RobotAction
