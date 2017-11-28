/**
 * Created by HJ on 2017/8/24.
 */

const Q = require('q')

global.logger = require('./util/logger')

// const factory = require('./games/robotFactory')
// const robot = factory.createRobot('001', 1)
// robot.run()

const VavleRobot = require('./managerRobot/valveRobot')
// createValvleRobot(1)
// createValvleRobot(2)
// createValvleRobot(7)
// createValvleRobot(10)
startJob([1, 2, 7, 10])

    // const nid = 1
    // const robNum = 600
    // const uplimit = 6
    // const roomsNum = robNum / uplimit
    // const factory = require('./games/RobotFactory')
    // let totalRuning = 0
    // Q.spawn(function* () {
    //     const rooms = yield addRoom(roomsNum, nid)
    //     console.log("添加房间 : " + rooms.length)
    //     // for (room of rooms) {
    //     //     // console.log(roomCode, rooms)
    //     //     for (let i = 0; i < uplimit; i++) {
    //     //         yield Q.delay(500)
    //     //         const robot = factory.createRobot(room.roomCode, nid)
    //     //         robot.run()
    //     //         totalRuning += 1
    //     //         // robot.action.on('robotEnterGame', function () {
    //     //         //     totalRuning += 1
    //     //         // })
    //     //         robot.action.on('robotLeaveGame', function () {
    //     //             totalRuning -= 1
    //     //         })
    //     //     }
    //     // }
    // })
    // setInterval(function () {
    //     console.log("机器人总量 : " + totalRuning)
    // }, 5000)

function startJob(nids) {

    setTimeout(function () {
        createValvleRobot(nids.pop())
        if (nids.length > 0)
            startJob(nids)
    }, 2000)

}

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