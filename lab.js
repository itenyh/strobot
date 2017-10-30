
const Q = require('q')
global.logger = require('./util/logger')
const util = require('./util/util')
const userConfig = require('./config/user-config.json')

const robotNum = userConfig.robotNum  //写6的倍数
const nid = userConfig.nid
const roomNum = robotNum / 6

Q.spawn(function* () {
    util.writeLine(['uid', 'pay', 'profit', 'round', 'jackpotFund', 'runningPool', 'profitPool'])
    const roomCodes = yield addRoom(roomNum, nid)
    yield addRobot2Room(roomCodes, nid)
})

function addRoom(num, nid) {

    require('./util/pomelo-cocos2d-js')
    const Net = require('./util/net')
    const RobotAction = require('./a777robot/robotAction')

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

function addRobot2Room(roomCodes, nid) {

    let PlayerRobot = null
    if (nid === 1) {
        PlayerRobot = require('./a777robot/robot')
    }
    else if (nid === 2) {
        PlayerRobot = require('./hambougerrobot/robot')
    }
    else if (nid === 3) {
        PlayerRobot = require('./hotpotrobot/robot')
    }
    else if (nid === 7) {
        PlayerRobot = require('./xiyoujirobot/robot')
    }

    return Q.async(function* () {
        for (roomCode of roomCodes) {
            const uplimit = 6
            for (let i = 0; i < uplimit; i++) {
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

