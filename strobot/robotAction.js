/**
 * Created by HJ on 2017/8/23.
 */

const util = require('./util')
const Q = require('q')
const Net = require('./robotNet')

function RobotAction(pomelo) {

    const net = new Net(pomelo)

    this.connect = () => {
        return net.asynReady().then(function () {
            return net.asynLogin()
        })
    }

    this.disconnect = () => {
        net.disconnect()
    }

    this.sendWork2Pipe = Q.nbind(sendWork2Pipe_)

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
        net.asynStartCatchEgg(consumeType).then(function (data) {
            const result = eggObj.consumEggList(eggConsumNum)
            cb(null, [result, data])
        })
    }

    function dealCatchResult(result, eggObj, data, cb) {

        if (result)
            net.asynEggAward({egg: eggObj.egg.eggData, bet: 20, eggGroup: eggObj.egg.eggGroup, token: data.token}).then(function (data) {
                cb(null, data)
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

    function doPlay(param, eggObj) {

        return asynPushNewEggs(param.eggConsumNum, eggObj).then(function () {
            return asynCatchEggs(param.consumeType, param.eggConsumNum, eggObj)
        }).then(function (all) {
            return asynDealCatchResult(all[0], eggObj, all[1])
        }).then(function (data) {
            return Q.resolve({win: data.beans})
        }).catch(function (data) {
            console.log('加蛋序列出现网络错误', data)
        })

    }

    this.createPlay = (actionInterval, param, eggObj, cb) => {

        //创建num个action
        const result = []
        for (let i = 0; i < param.playRound; i++) {
            result.push(doPlay)
        }

        return result.reduce(function (a, x, i) {
            return a.then(function (data) {
                return createTimeIntervalPromise(data, actionInterval)
            }).then(function (data) {
                if (i !== 0) {
                    cb(data)
                }
                return x(param, eggObj)
            })
        }, Q.resolve(1)).then(function (data) {
            cb(data)
        })

    }

}
module.exports = RobotAction

function timeIntervalPromise(data, timeInterval, cb) {

    setTimeout(function () {
        cb(null, data)
    }, timeInterval)

}

const createTimeIntervalPromise = Q.nbind(timeIntervalPromise)


// function writeHistory_(history, cb) {
//
//     console.log('写入中...')
//     util.writeHis2File(history)
//     console.log('写入完毕, 共写入 : ', history.length, ' 行数据')
//     cb(null)
//
// }
//
// module.exports.writeHistory = Q.nbind(writeHistory_)