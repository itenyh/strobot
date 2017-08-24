/**
 * Created by HJ on 2017/8/23.
 */

const util = require('./util')
const net = require('./robotNet')
const Q = require('q')

const Egg = require('./eggpush')
const eggObj = new Egg()

module.exports.connect = () => {
    return net.asynReady()
}

module.exports.disconnect = () => {
    net.disconnect()
}

function pushNewEggs(eggConsumNum, cb) {
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

function catchEgg(consumeType, eggConsumNum, cb) {
    net.asynStartCatchEgg(consumeType).then(function (data) {
        const result = eggObj.consumEggList(eggConsumNum)
        cb(null, result)
    })
}

function dealCatchResult(result, cb) {

    if (result)
        net.asynEggAward({egg: eggObj.egg.eggData, bet: 20, eggGroup: eggObj.egg.eggGroup}).then(function (data) {
            cb(null, data)
        })
    else {
        cb(null, {beans: 0})
    }

}

function writeHistory_(history, cb) {

    console.log('写入中...')
    util.writeHis2File(history)
    console.log('写入完毕, 共写入 : ', history.length, ' 行数据')
    cb(null)

}

module.exports.writeHistory = Q.nbind(writeHistory_)

const asynPushNewEggs = Q.nbind(pushNewEggs)
const asynCatchEggs = Q.nbind(catchEgg)
const asynDealCatchResult = Q.nbind(dealCatchResult)

function doPlay(param) {

    return asynPushNewEggs(param.eggConsumNum).then(function () {
        return asynCatchEggs(param.consumeType, param.eggConsumNum)
    }).then(function (result) {
        return asynDealCatchResult(result)
    }).then(function (data) {
        return Q.resolve({win: data.beans})
    }).catch(function (data) {
         console.log('加蛋序列出现网络错误', data)
    })

}

module.exports.createPlay = (num, actionInterval, param, cb) => {

    //创建num个action
    const result = []
    for (let i = 0; i < num; i++) {
        result.push(doPlay)
    }

    return result.reduce(function (a, x, i) {
        return a.then(function (data) {
            return createTimeIntervalPromise(data, actionInterval)
        }).then(function (data) {
            if (i !== 0) {
                cb(data)
            }
            return x(param)
        })
    }, Q.resolve(1)).then(function (data) {
        cb(data)
    })

}

function timeIntervalPromise(data, timeInterval, cb) {

    setTimeout(function () {
        cb(null, data)
    }, timeInterval)

}

const createTimeIntervalPromise = Q.nbind(timeIntervalPromise)
