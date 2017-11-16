
const Q = require('q')
global.logger = require('./util/logger')
const util = require('./util/util')
const robotConfig = require('./robotConfig')

var program = require('commander');

program
    .version('0.1.0')
    .option('-g, --game [name]', '要运行的游戏名')
    .option('-r, --robotNumbers <n>', '要运行的机器人数，最好是6的倍数，默认400人', parseInt)
    .option('-n, --names', '查看可运行的游戏名')
    .parse(process.argv);

const gameName = program.game
const game_nid = robotConfig.getGameNid()
const gameNid = game_nid[gameName]
const gameNames = program.names
const robotNumbers = program.robotNumbers

if (gameNames) {
    console.log(Object.keys(game_nid))
}

else if (gameNid) {
    Q.spawn(function* () {
        const robotNum = robotNumbers === undefined ? robotConfig.getRobotNum() : robotNumbers
        const roomNum = robotNum / 6
        util.writeLine(['uid', 'pay', 'profit', 'round', 'jackpotFund', 'runningPool', 'profitPool'], filename = './data/' + gameName + '.csv')
        const roomCodes = yield addRoom(roomNum, gameNid)
        yield addRobot2Room(roomCodes, gameNid, gameName)
    })
}

else {
    console.log('参数不正确')
}


function addRoom(num, nid) {

    require('./util/pomelo-cocos2d-js')
    const RobotAction = require('./games/a777robot/robotAction')
    const action = RobotAction.createRobotAction()

    return Q.async(function* () {
        yield action.connect()
        const data = yield action.net.asynAddRoom(num, nid)
        const addRooms = data.addRooms
        const roomCodes = []
        for (room of addRooms) {
            roomCodes.push(room.roomCode)
        }
        return roomCodes
    })()

}

function addRobot2Room(roomCodes, nid, outputfile) {

    const factory = require('./games/RobotFactory')

    return Q.async(function* () {
        for (roomCode of roomCodes) {
            const uplimit = 6
            for (let i = 0; i < uplimit; i++) {
                yield Q.delay(500)
                const robot = factory.createRobot(roomCode, nid)
                robot.run()
                robot.action.on('round', function (data) {
                    util.writeLine(data, filename = './data/' + outputfile + '.csv')
                })
                robot.action.on('robotEnterGame', function () {
                    robotConfig.robotEnter()
                    robotConfig.print()
                })
                robot.action.on('robotLeaveGame', function () {
                    robotConfig.robotLeave()
                    robotConfig.print()
                })

            }
        }
    })()

}