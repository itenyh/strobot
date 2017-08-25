/**
 * Created by HJ on 2017/8/23.
 */

const util = require('./util/util')
const Q = require('q')
const Net = require('./robotNet')

function RobotAction(pomelo) {

    const net = new Net(pomelo)

    this.connect = () => {
        return net.asynReady({host: '192.168.1.218', port: 8100}).then(function () {
            return net.asynLogin()
        }).then(function (data) {
            return net.asynReady({host: data.server.host, port: data.server.port}).thenResolve(data)
        }).then(function (data) {
            return net.asynEnter(data.uid, data.token)
        }).catch(function (reason) {
            return Q.reject('所在Action：connect， Action error reason: ' + JSON.stringify(reason))
        })
    }

    this.disconnect = () => {
        net.disconnect()
    }

    this.sendWork2Pipe = Q.nbind(sendWork2Pipe_)

    //非阻塞的动作
    function playOneTime(param, eggObj) {

        return asynPushNewEggs(param.eggConsumNum, eggObj).then(function () {
            return asynCatchEggs(param.consumeType, param.eggConsumNum, eggObj)
        }).then(function (all) {
            return asynDealCatchResult(all[0], param.bet, eggObj, all[1])
        }).then(function (data) {
            return Q.resolve({win: data.beans})
        }).catch(function (data) {
            logger.error(data)
        })

    }

    function pushNewEggs(eggConsumNum, eggObj, cb) {
        if (eggObj.eggArray.length < eggConsumNum) {
            return net.asynPushEggArray().then(function (data) {
                eggObj.addPushedEggs(data['eggArray'])
                cb(null)
            })
        }
        else {
            cb(null)
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

    const asynPushNewEggs = Q.nbind(pushNewEggs)
    const asynCatchEggs = Q.nbind(catchEgg)
    const asynDealCatchResult = Q.nbind(dealCatchResult)

    let index = 2
    this.promisePlay2Die = (actionInterval, param, eggObj, cb) => {

        const that = this
        return playOneTime(param, eggObj).then(function (data) {

            cb(data)

            if(index > 0) {
                index--
               return Q.delay(actionInterval).then(function () {
                    return that.promisePlay2Die(actionInterval, param, eggObj, cb)
                })
            }
            else {
                return Q.resolve(data)
            }
        })

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
