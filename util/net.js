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

    function enterGame(nid, cb) {
        pomelo.request('hall.mainHandler.enterGame', {nid: nid}, function (data) {
            responseHandler(data, enterGame, cb)
        })
    }

    function enterRoom(roomCode, cb) {
        pomelo.request('hall.gameHandler.enterRoom', {roomCode: roomCode}, function (data) {
            responseHandler(data, enterRoom, cb)
        })
    }

    function addRoom(num, nid, cb) {
        pomelo.request('hall.mainHandler.addGameRoom', {num: num, nid: nid}, function (data) {
            responseHandler(data, addRoom, cb)
        })
    }

    function leaveRoom2Game(cb) {
        pomelo.request('hall.gameHandler.leaveRoom', function (data) {
            responseHandler(data, leaveRoom2Game, cb)
        })
    }

    function addMoney(uid, gold, cb) {
        pomelo.request('hall.userHandler.addGoldForRobot', {uid: uid, gold: gold}, function (data) {
            responseHandler(data, addMoney, cb)
        })
    }

    function tease(message, cb) {
        pomelo.request('hall.teaseHandler.tease', {message: message}, function (data) {
            responseHandler(data, tease, cb)
        })
    }
    
    function roomsInfo(nid, cb) {
        pomelo.request('hall.mainHandler.systemGameInfos', {nid: nid}, function (data) {
            responseHandler(data, roomsInfo, cb)
        })
    }

    //============ 火锅 ===========

    function playHuoGuo(bets, cb) {
        pomelo.request('huoguo.mainHandler.bet', {'bets': bets}, function (data) {
            responseHandler(data, playHuoGuo, cb)
        })
    }

    function applyHuoGuoDealer(cb) {
        pomelo.request('huoguo.mainHandler.onBank', function (data) {
            responseHandler(data, applyHuoGuoDealer, cb)
        })
    }

    function offHuoGuoDealer(cb) {
        pomelo.request('huoguo.mainHandler.offBank', function (data) {
            responseHandler(data, offHuoGuoDealer, cb)
        })
    }

    function getHuoGuoDealerInfo(cb) {
        pomelo.request('huoguo.mainHandler.dealerInfo', function (data) {
            responseHandler(data, getHuoGuoDealerInfo, cb)
        })
    }

    //============ 777 ===========

    function play777(lineNum, bet, cb) {
        // console.log(lineNum, bet)
        pomelo.request('games.slots777Handler.start', {lineNum: lineNum, bet: bet}, function (data) {
            responseHandler(data, play777, cb)
        })
    }

    //============= 汉堡 ============
    function playHanbouger(lineNum, bet, cb) {
        pomelo.request('games.hamburgerHandler.start', {lineNum: lineNum, bet: bet}, function (data) {
            responseHandler(data, playHanbouger, cb)
        })
    }

    //============= 西游记 ============
    function playXiyouji(lineNum, bet, cb) {
        pomelo.request('games.xiyoujiHandler.start', {lineNum: lineNum, bet: bet}, function (data) {
            responseHandler(data, playXiyouji, cb)
        })
    }

    function gainedScatter(cb) {
        pomelo.request('games.xiyoujiHandler.gainedScatter', function (data) {
            responseHandler(data, gainedScatter, cb)
        })
    }

    //============= 海盗 ============
    function playPirate(multiply, cb) {
        pomelo.request('games.pirateHandler.startPirate', {multiply: multiply, freespin: 0}, function (data) {
            responseHandler(data, playPirate, cb)
        })
    }

    //============= 太空夺宝 ============
    function playIndiana(betNum, betOdd, cb) {
        pomelo.request('games.indianaHandler.start', {betNum: betNum, betOdd: betOdd}, function (data) {
            responseHandler(data, playIndiana, cb)
        })
    }

    function initGame(cb) {
        pomelo.request('games.indianaHandler.initGame', function (data) {
            responseHandler(data, initGame, cb)
        })
    }

    //============ 奖池 =================
    function query777JackPot(cb) {
        pomelo.request('games.slots777Handler.jackpotFund', function (data) {
            responseHandler(data, query777JackPot, cb)
        })
    }

    function queryHambougerJackPot(cb) {
        pomelo.request('games.hamburgerHandler.jackpotFund', function (data) {
            responseHandler(data, queryHambougerJackPot, cb)
        })
    }

    function queryXiyoujiJackPot(cb) {
        pomelo.request('games.xiyoujiHandler.jackpotFund', function (data) {
            // console.log(data)
            responseHandler(data, queryXiyoujiJackPot, cb)
        })
    }

    function queryIndianaJackPot(cb) {
        pomelo.request('games.indianaHandler.jackpotFund', function (data) {
            responseHandler(data, queryIndianaJackPot, cb)
        })
    }

    // function playSlots(nid, lineNum, bet, cb) {
    //     if (nid === 1) {
    //         play777(lineNum, bet, cb)
    //     }
    //     else if (nid === 2) {
    //         playHanbouger(lineNum, bet, cb)
    //     }
    //     else if (nid === 7) {
    //         playXiyouji(lineNum, bet, cb)
    //     }
    // }

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

    this.asynAddRoom = Q.nbind(addRoom)
    this.asynLeaveRoom2Game = Q.nbind(leaveRoom2Game)
    this.asynAddMoney = Q.nbind(addMoney)

    this.asynTease = Q.nbind(tease)
    this.asynRoomsInfo = Q.nbind(roomsInfo)

    this.asynPlayHuoGuo = Q.nbind(playHuoGuo)
    this.asynApplyHuoGuoDealer = Q.nbind(applyHuoGuoDealer)
    this.asynGetHuoGuoDealerInfo = Q.nbind(getHuoGuoDealerInfo)
    this.asynOffHuoGuoDealer = Q.nbind(offHuoGuoDealer)

    this.asynPlay777 = Q.nbind(play777)
    this.asynPlayHambouger = Q.nbind(playHanbouger)
    this.asynPlayXiyouji = Q.nbind(playXiyouji)
    this.asynPlayPirate = Q.nbind(playPirate)
    // this.asynPlaySlots = Q.nbind(playSlots)
    this.asynGainedScatter = Q.nbind(gainedScatter)
    this.asynPlayIndiana = Q.nbind(playIndiana)
    this.asynInitGame = Q.nbind(initGame)

    this.asynQuery777JackPot = Q.nbind(query777JackPot)
    this.asynQueryHambougerJackPott = Q.nbind(queryHambougerJackPot)
    this.asynQueryXiyoujiJackPot = Q.nbind(queryXiyoujiJackPot)
    this.asynQueryIndianaJackPot = Q.nbind(queryIndianaJackPot)

    this.disconnect = pomelo.disconnect

}

module.exports = RobotNet