

require('../util/pomelo-cocos2d-js')
const Q = require('q')

global.logger = require('../util/logger')
global.robotsInfo = require('../managerRobot/robotsInfo')
global.rules = require('./rules')
const Net = require('../util/net')
const RobotAction = require('./robotAction')
const PlayerRobot = require('./robot')
const util = require('../util/util')
const userConfig = require('./config/user-config.json')
let total = 0

const robotNum = userConfig.robotNum  //写6的倍数
const roomNum = robotNum / 6

Q.spawn(function* () {
    util.writeLine(['uid', 'pay', 'profit', 'round'])
    const roomCodes = yield addRoom(roomNum, '1')
    yield addRobot2Room(roomCodes)
})

function addRoom(num, nid) {

    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    const action = new RobotAction(net)

    return Q.async(function* () {
        yield action.connect()
        const data = yield net.asynAddRoom(num, nid)
        const addRooms = data.addRooms
        const roomCodes = []
        for (room of addRooms) {
            roomCodes.push(room.roomCode)
        }
        return roomCodes
    })()

}

function addRobot2Room(roomCodes) {

    return Q.async(function* () {
        for (roomCode of roomCodes) {
            const uplimit = 6
            for (let i = 0; i < uplimit; i++) {
                // console.log('机器人进入 ' + total)
                total += 1
                yield Q.delay(500)
                const robot = new PlayerRobot(roomCode)
                robot.run()
                robot.action.on('round', function (data) {
                    util.writeLine(data)
                })
            }
        }
    })()

}

