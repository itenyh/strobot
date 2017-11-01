/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('../util/logger')
global.robotsInfo = require('../managerRobot/robotsInfo')

const PlayerRobot = require('./robot')
const ManagerRobot = require('../managerRobot/manageRobot')

// const robot = new ManagerRobot('1')
// robot.run()

addRobot('001', 1)
// add2SixRoom()


function add2SixRoom() {

    for (let i = 1;i <= 6;i++) {

        const roomCode = "00" + i
        addRobot(roomCode, 6)
    }

}

function addRobot(roomCode, num) {

    // for (let i = 0;i < num;i++) {
    //     const robot = new PlayerRobot(roomCode)
    //     robot.run()
    // }

    return Q.async(function* () {
        for (let i = 0; i < num; i++) {
            yield Q.delay(1000)
            const robot = PlayerRobot.createRobot(roomCode)
            robot.run()
        }
    })()

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