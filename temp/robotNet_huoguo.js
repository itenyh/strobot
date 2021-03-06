/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')

// '192.168.1.113'

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
        pomelo.request('gate.mainHandler.guest', function (data) {
            responseHandler(data, login, cb)
        })
    }
    
    function userLogin(id, cb) {
        pomelo.request('gate.mainHandler.login', {id:id}, function (data) {
            responseHandler(data, userLogin, cb)
        })
    }

    function enter(uid, token, cb) {
        pomelo.request('connector.entryHandler.entry', {uid:uid, token:token, isRobot: true}, function (data) {
            responseHandler(data, enter, cb)
        })
    }

    function realPlayerEnter(uid, token, cb) {
        pomelo.request('connector.entryHandler.entry', {uid:uid, token:token, isRobot: false}, function (data) {
            responseHandler(data, realPlayerEnter, cb)
        })
    }

    function enterGame(cb) {
        pomelo.request('hall.mainHandler.enterGame', {nid: '3'}, function (data) {
            responseHandler(data, enterGame, cb)
        })
    }

    function enterRoom(roomCode, cb) {
        pomelo.request('hall.gameHandler.enterRoom', {roomCode: roomCode}, function (data) {
            responseHandler(data, enterRoom, cb)
        })
    }

    function play(bets, cb) {
        pomelo.request('huoguo.mainHandler.bet', {'bets': bets}, function (data) {
            responseHandler(data, play, cb)
        })
    }

    function applyDealer(cb) {
        pomelo.request('huoguo.mainHandler.onBank', function (data) {
            responseHandler(data, applyDealer, cb)
        })
    }

    function offDealer(cb) {
        pomelo.request('huoguo.mainHandler.offBank', function (data) {
            responseHandler(data, offDealer, cb)
        })
    }

    function addMoney(uid, gold, cb) {
        pomelo.request('hall.userHandler.addGoldForRobot', {uid: uid, gold: gold}, function (data) {
            responseHandler(data, addMoney, cb)
        })
    }

    function getDealerInfo(cb) {
        pomelo.request('huoguo.mainHandler.dealerInfo', function (data) {
            responseHandler(data, getDealerInfo, cb)
        })
    }

    function addRoom(cb) {
        pomelo.request('hall.mainHandler.addGameRoom', {nid: '3'}, function (data) {
            responseHandler(data, addRoom, cb)
        })
    }

    function leaveRoom2Game(cb) {
        pomelo.request('hall.gameHandler.leaveRoom', function (data) {
            responseHandler(data, leaveRoom2Game, cb)
        })
    }

    function responseHandler(data, func, cb) {

        // console.log(data, func)

        if (data.code === 200) {
            // logger.info('%s 调用成功', func.name)
            cb(null, data)
        }
        else {
            // logger.error('网络调用失败: ' + func.name + ', ' +  JSON.stringify(data))
            cb('网络接口错误: ' + func.name + ', ' +  JSON.stringify(data))
            // cb(null, data)
        }

    }



    this.asynReady = Q.nbind(ready)
    this.asynLogin = Q.nbind(login)
    this.asynUserLogin = Q.nbind(userLogin)
    this.asynEnter = Q.nbind(enter)
    this.asynRealPlayer = Q.nbind(realPlayerEnter)
    this.asynEnterGame = Q.nbind(enterGame)
    this.asynEnterRoom = Q.nbind(enterRoom)
    this.asynGetDealerInfo = Q.nbind(getDealerInfo)
    this.asynPlay = Q.nbind(play)
    this.asynApplyDealer = Q.nbind(applyDealer)
    this.asynOffDealer = Q.nbind(offDealer)
    this.asynAddMoney = Q.nbind(addMoney)
    this.asynAddRoom = Q.nbind(addRoom)
    this.asynLeaveRoom2Game = Q.nbind(leaveRoom2Game)
    this.disconnect = pomelo.disconnect

}

module.exports = RobotNet