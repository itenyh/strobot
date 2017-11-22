/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('./util/logger')

// const factory = require('./games/RobotFactory')
// const robot = factory.createRobot('008', 1)
// robot.run()

const VavleRobot = require('./managerRobot/valveRobot')
let aliveVavleRobot = 0
let uplimit = 100
createValvleRobot()

// const ManagerRobot = require('./managerRobot/manageRobot')
// const robot = new ManagerRobot(1)
// robot.run()

// const robot1 = new ManagerRobot(2)
// robot1.run()
//
// const robot2 = new ManagerRobot(3)
// robot2.run()
//
// const robot3 = new ManagerRobot(7)
// robot3.run()

function createValvleRobot() {

    if (aliveVavleRobot == 0 && uplimit > 0) {
        uplimit -= 1
        const r = new VavleRobot(1)
        r.action.on('robotStop', function () {
            aliveVavleRobot -= 1
            logger.error('管理机器人死亡，重开，剩余 %s ', uplimit)
            createValvleRobot()
        })
        aliveVavleRobot += 1
        r.run()
    }

}

function add2SixRoom() {

    for (let i = 1;i <= 6;i++) {
        const roomCode = "00" + i
        addRobot(roomCode, 6)
    }

}

function addRobot(roomCode, num) {

    for (let i = 0;i < num;i++) {

        const robot = PlayerRobot.createRobot(roomCode)
        robot.run()

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