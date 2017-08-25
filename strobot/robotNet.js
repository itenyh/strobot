/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')

function RobotNet(pomelo_) {

    const pomelo = pomelo_

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
            // console.log('eggAward: ', data)
            responseHandler(data, cb)
        })

    }

    function pushEggArray(cb) {
        pomelo.request('hall.catchHandler.pushEggArray', {money:20}, function (data) {
            // console.log('eggAward: ', data)
            responseHandler(data, cb)
        })
    }

    function startCatchEgg(consumeType, cb) {
        pomelo.request('hall.catchHandler.startCatchEgg', {consumeType: consumeType}, function (data) {
            responseHandler(data, cb)
        })
    }

    function eggAward(params, cb) {

        console.log(params)
        pomelo.request('hall.catchHandler.eggAward', params, function (data) {
            console.log('eggAward: ', data)
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

    this.asynReady = Q.nbind(ready)
    this.asynLogin = Q.nbind(login)
    this.asynPushEggArray = Q.nbind(pushEggArray)
    this.asynStartCatchEgg = Q.nbind(startCatchEgg)
    this.asynEggAward = Q.nbind(eggAward)
    this.disconnect = pomelo.disconnect

}

module.exports = RobotNet