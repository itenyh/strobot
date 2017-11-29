/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')
const VavleRobot = require('./managerRobot/valveRobot')
global.logger = require('./util/logger')

// createRobot(1, '001')

createValvleRobot(1)
// createValvleRobot(2)
// createValvleRobot(7)
// createValvleRobot(10)

//往某个游戏某个房间添加机器人
function createRobot(nid, roomCode) {
    const factory = require('./games/robotFactory')
    const robot = factory.createRobot(roomCode, nid)
    robot.run()
}

//创建游戏管理机器人，管理机器人会自动添加游戏机器人
function createValvleRobot(nid) {

    let aliveVavleRobot = 0
    let uplimit = 100

    if (aliveVavleRobot == 0 && uplimit > 0) {
        uplimit -= 1
        const r = new VavleRobot(nid)
        r.action.on('robotStop', function () {
            aliveVavleRobot -= 1
            logger.error('管理机器人 %s 死亡，重开，剩余 %s ', nid, uplimit)
            createValvleRobot(nid)
        })
        aliveVavleRobot += 1
        r.run()
    }

}

//添加房间
function addRoom(num, nid) {

    return Q.async(function* () {
        const rf = require('./games/robotFactory')
        const rb = rf.createRobot('001', nid)
        yield rb.action.connect()
        yield rb.action.net.asynEnterGame(nid)
        const data = yield rb.action.net.asynAddRoom(num, nid)
        return data.addRooms
    })()

}