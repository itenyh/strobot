
global.logger = require('../../../util/logger')
// //
// const Robot = require('../robot')
// const robot = new Robot('001')
// robot.run()

// const a = {
// 'a':1
// }
//
// console.log(a.hasOwnProperty('a'))

// if ([1]) {
//     console.log(1)
// }

// console.assert(1 == 2, 'fuck')
//
require('../../../util/pomelo-cocos2d-js')
const Q = require('q')
const Memory = require('../memory')
const RobotAction = require('../robotAction')
const Net = require('../../robotNet')

// addRobot('001')
addRoom()

function addRobot(roomCode) {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    const action = new RobotAction(net, new Memory())
    Q.spawn(function* () {
        yield action.connect()
        yield action.enterRoom(roomCode)
    })

}

function addRoom() {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    Q.spawn(function* () {
        yield net.asynReady({host: '192.168.1.105', port: '3010'})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        const userData = yield net.asynEnter(userLoginData.uid, userLoginData.token)
        const data = yield net.asynAddRoom()
        console.log(data)
    })

}
