/**
 * Created by HJ on 2017/8/24.
 */

global.logger = require('../util/logger')
global.robotsInfo = require('./robotsInfo')
global.rules = require('./rules')
require('../util/pomelo-cocos2d-js')

const Q = require('q')
const Net = require('./robotNet')
const gameConfig = require('./config/game-config.json')
const PlayerRobot = require('./robot/robot')
const ManagerRobot = require('./robot/manageRobot')

const robot = new ManagerRobot()
robot.run()
//
// addRoom()

// addRobot('007', 1)
// setTimeout(function () {
//     addPlayer('001')
// }, 3000)

function addRobot(roomCode, num) {

    for (let i = 0;i < num;i++) {

        const robot = new PlayerRobot(roomCode)
        robot.run()

        setTimeout(function () {
            robot.stop()
        }, 3000)

    }

}

function addRoom() {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    const action = new RobotAction(net, new Memory())
    Q.spawn(function* () {
        yield action.connect()
        const data = yield net.asynAddRoom()
        console.log(data)
    })

}


function addPlayer(roomCode) {
    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    Q.spawn(function* () {
        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        yield net.asynRealPlayer(userLoginData.uid, userLoginData.token)
        yield net.asynEnterGame()
        yield net.asynEnterRoom(roomCode)
        logger.info('真人成功进入房间： %s', roomCode)
    })
}