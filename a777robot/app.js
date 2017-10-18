/**
 * Created by HJ on 2017/8/24.
 */

global.logger = require('../util/logger')
global.robotsInfo = require('./robotsInfo')
global.a777Rules = require('./rules')

const PlayerRobot = require('./robot')
const ManagerRobot = require('./a777ManageRobot')

const robot = new ManagerRobot()
robot.run()


// const robot = new ManagerRobot()
// robot.run()

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