/**
 * Created by HJ on 2017/8/23.
 */

require('./pomelo-cocos2d-js')
const pomelo = createPomelo()
const Q = require('q')

function ready(cb) {

    pomelo.init({
        host: '192.168.1.218',
        port: 8100
    }, function (socket) {
        cb(null)
    })

}

function login(cb) {

    pomelo.request('gate.loginHandler.visitorLogin', {visitorID: ''}, function (data) {
        responseHandler(data, cb)
    })

}

function pushEggArray(cb) {
    pomelo.request('hall.catchHandler.pushEggArray', {money:20}, function (data) {
        responseHandler(data, cb)
    })
}

function startCatchEgg(consumeType, cb) {
    pomelo.request('hall.catchHandler.startCatchEgg', {consumeType: consumeType}, function (data) {
        responseHandler(data, cb)
    })
}

function eggAward(params, cb) {

    pomelo.request('hall.catchHandler.eggAward', params, function (data) {
        responseHandler(data, cb)
    })

}

function responseHandler(data, cb) {

    const code = data.code
    if (code === 200) {
        cb(null, data)
    }
    else {
        cb(data)
    }

}

exports.asynReady = Q.nbind(ready)
exports.asynLogin = Q.nbind(login)
exports.asynPushEggArray = Q.nbind(pushEggArray)
exports.asynStartCatchEgg = Q.nbind(startCatchEgg)
exports.asynEggAward = Q.nbind(eggAward)

