/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('../util/logger')
global.robotsInfo = require('../managerRobot/robotsInfo')
global.rules = require('./rules')

const PlayerRobot = require('./robot')
const ManagerRobot = require('../managerRobot/manageRobot')

const robot = new ManagerRobot('1', PlayerRobot)
robot.run()

// addRobot('001', 10)

function addRobot(roomCode, num) {

    for (let i = 0;i < num;i++) {

        const robot = new PlayerRobot(roomCode)
        robot.run()
        console.log(i)

    }
    // console.log(robot.action)
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