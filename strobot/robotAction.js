/**
 * Created by HJ on 2017/8/23.
 */

require('./util/pomelo-cocos2d-js')

const util = require('./util/util')
const Q = require('q')
const Net = require('./robotNet')
const pipe = require('./file-writer-manager')
const gameConfig = require('./config/game-config.json')

function RobotAction() {

    const net = new Net((new PP()).pomelo)

    this.connect = () => {
        return net.asynReady({host: '192.168.1.218', port: 8100}).then(function () {
            return net.asynLogin()
        }).then(function (data) {
            return net.asynReady({host: data.server.host, port: data.server.port}).thenResolve(data)
        }).then(function (data) {
            return net.asynEnter(data.uid, data.token)
        }).catch(function (reason) {
            return Q.reject('所在 Action：connect， Action error reason: ' + JSON.stringify(reason))
        })
    }

    this.disconnect = () => {
        net.disconnect()
    }

    //非阻塞的动作
    function playOneTime(bet, consumeType, eggConsumNum, eggObj) {

        return asynPushNewEggs(eggConsumNum, eggObj).then(function () {
            return asynCatchEggs(consumeType, eggConsumNum, eggObj)
        }).then(function (all) {
            return asynDealCatchResult(all[0], bet, eggObj, all[1])
        }).then(function (data) {
            return Q.resolve({win: data.beans})
        }).catch(function (data) {
            logger.error(data)
        })

    }

    function asynPushNewEggs(eggConsumNum, eggObj) {
        if (eggObj.eggArray.length < eggConsumNum) {
            return Q.delay(gameConfig.interfaceRepeatInterval).then(function () {
                return net.asynPushEggArray().then(function (data) {
                    eggObj.addPushedEggs(data['eggArray'])
                    return asynPushNewEggs(eggConsumNum, eggObj)
                })
            })
        }
        else {
            return Q.resolve()
        }
    }

    function catchEgg(consumeType, eggConsumNum, eggObj, cb) {
        return net.asynStartCatchEgg(consumeType).then(function (data) {
            const result = eggObj.consumEggList(eggConsumNum)
            cb(null, [result, data])
        })
    }

    function dealCatchResult(result, bet, eggObj, data, cb) {

        if (result)
            return net.asynEggAward({
                egg: eggObj.egg.eggData,
                bet: bet,
                eggGroup: 'xxxx',
                boxMulti: 1,
                token: data.token
            }).then(function (data) {
                cb(null, data)
            }, function (reason) {
                cb({egg: eggObj.egg.eggData, bet: bet, eggGroup: eggObj.egg.eggGroup, boxMulti: 1, token: data.token})
            })
        else {
            cb(null, {beans: 0})
        }

    }

    function sendWork2Pipe_(history, pipe, cb) {

        pipe.pushWork(history)
        cb(null)

    }

    function sendEveryWork2Pipe_(data, memory, consumeType, cb) {

        if (data) {
            // memory.addGameResult(this.index, data.win, consumeType)
            pipe.pushHistory(memory.index, memory.round, data.win, consumeType)
            cb(null)
        }
        else {
            cb(null)
        }

    }

    this.sendWork2Pipe = Q.nbind(sendWork2Pipe_)
    const asynSendEveryWork2Pipe = Q.nbind(sendEveryWork2Pipe_)
    const asynCatchEggs = Q.nbind(catchEgg)
    const asynDealCatchResult = Q.nbind(dealCatchResult)

    this.promisePlay2Die = (actionInterval, memory, consumeType, eggConsumNum) => {

        const totalMoney = memory.totalMoney
        if (totalMoney < memory.bet) {
            return Q.resolve(null)
        }
        else {
            const that = this
            memory.round++
            return playOneTime(memory.bet, consumeType, eggConsumNum, memory.eggObj).then(function (data) {

                memory.totalMoney += (data.win - memory.bet)
                logger.info('机器人【%s】号 => ， 游戏完成, 收入: %s 支出：%s 返奖率：%s  总资产：%s 工作进度（%s把）',  memory.index, data.win, memory.bet, data.win / memory.bet, memory.totalMoney, memory.round)

                return asynSendEveryWork2Pipe(data, memory, consumeType).then(function () {
                    return Q.delay(actionInterval).then(function () {
                        return that.promisePlay2Die(actionInterval, memory, consumeType, eggConsumNum)
                    })
                })

            })
        }

    }

    this.createPlay = (actionInterval, playRound, param, eggObj, cb) => {

        const result = []
        for (let i = 0; i < playRound; i++) {
            result.push(playOneTime)
        }
        return result.reduce(function (a, x, i) {

            return a.then(function (data) {
                if (i !== 0) {
                    cb(data, i)
                    return Q.delay(actionInterval).then(function () {
                        return x(param, eggObj)
                    })
                }
                else {
                    return x(param, eggObj)
                }
            })

        }, Q.resolve()).then(function (data) {
            cb(data, playRound)
        })

    }

}
module.exports = RobotAction
