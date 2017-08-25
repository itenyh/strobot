/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')

function RobotNet(pomelo_) {

    const pomelo = pomelo_

    function ready(param, cb) {

        pomelo.disconnect()
        pomelo.init({
            host: param.host,
            port: param.port
        }, function (socket) {
            cb(null)
        })

    }

    function login(cb) {

        pomelo.request('gate.loginHandler.visitorLogin', {visitorID: ''}, function (data) {
            // console.log('eggAward: ', data)
            responseHandler(data, login, cb)
        })

    }

    function enter(uid, token, cb) {

        pomelo.request('connector.entryHandler.entry', {uid: uid, token: token, eggID: '', agencylink:'', newPlayer:1}, function (data) {
            responseHandler(data, enter, cb)
        })

    }

    function pushEggArray(cb) {
        pomelo.request('hall.catchHandler.pushEggArray', {money:20}, function (data) {
            responseHandler(data, pushEggArray, cb)
        })
    }

    function startCatchEgg(consumeType, cb) {
        pomelo.request('hall.catchHandler.startCatchEgg', {consumeType: consumeType}, function (data) {
            // console.log('startCatchEgg: ', data)
            responseHandler(data, startCatchEgg, cb)
        })
    }

    function eggAward(params, cb) {

        pomelo.request('hall.catchHandler.eggAward', params, function (data) {
            // console.log('eggAward: ', data)
            responseHandler(data, eggAward, cb)
        })

    }

    function responseHandler(data, func, cb) {

        if (data.code === 200) {
            // logger.info('%s 调用成功', func.name)
            cb(null, data)
        }
        else {
            // logger.error('网络调用失败: ' + func.name + ', ' +  JSON.stringify(data))
            cb('网络接口错误: ' + func.name + ', ' +  JSON.stringify(data))
        }

    }

    this.asynReady = Q.nbind(ready)
    this.asynLogin = Q.nbind(login)
    this.asynEnter = Q.nbind(enter)
    this.asynPushEggArray = Q.nbind(pushEggArray)
    this.asynStartCatchEgg = Q.nbind(startCatchEgg)
    this.asynEggAward = Q.nbind(eggAward)
    this.disconnect = pomelo.disconnect

}

module.exports = RobotNet