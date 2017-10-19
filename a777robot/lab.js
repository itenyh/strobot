

require('../util/pomelo-cocos2d-js')
const Q = require('q')

global.logger = require('../util/logger')
global.robotsInfo = require('../managerRobot/robotsInfo')
global.rules = require('./rules')
const Net = require('../util/net')
const RobotAction = require('./robotAction')
const PlayerRobot = require('./robot')


Q.spawn(function* () {
    const roomCodes = yield addRoom(1, '1')
    // console.log(roomCodes)
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
        console.log(roomCodes)
        return roomCodes
    })()

}

function addRobot2Room(roomCodes) {

    return Q.async(function* () {
        for (roomCode of roomCodes) {
            const uplimit = 6
            for (let i = 0; i < uplimit; i++) {
                const robot = new PlayerRobot(roomCode)
                robot.run()
            }
        }
    })()

}