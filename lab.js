
const Q = require('q')
global.logger = require('./util/logger')
const util = require('./util/util')
const userConfig = require('./config/user-config.json')

var program = require('commander');

program
    .version('0.1.0')
    .option('-g, --game [name]', '要运行的游戏名')
    .option('-r, --robotNumbers <n>', '要运行的机器人数，最好是6的倍数，默认400人', parseInt)
    .option('-n, --names', '查看可运行的游戏名')
    .parse(process.argv);

const gameName = program.game
const game_nid = userConfig.game_nid
const gameNid = game_nid[gameName]
const gameNames = program.names
const robotNumbers = program.robotNumbers

if (gameNames) {
    console.log(Object.keys(game_nid))
}

else if (gameNid) {
    Q.spawn(function* () {
        const robotNum = robotNumbers === undefined ? userConfig.robotNum : robotNumbers
        const roomNum = robotNum / 6
        util.writeLine(['uid', 'pay', 'profit', 'round', 'jackpotFund', 'runningPool', 'profitPool'], filename = './data/' + gameName + '.csv')
        const roomCodes = yield addRoom(roomNum, gameNid)
        // console.log(roomCodes, gameNid)
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
    let PlayerRobot = null
    if (nid === 1) {
        PlayerRobot = require('./games/a777robot/robot')
    }
    else if (nid === 2) {
        PlayerRobot = require('./games/hambougerrobot/robot')
    }
    else if (nid === 3) {
        PlayerRobot = require('./games/hotpotrobot/robot')
    }
    else if (nid === 7) {
        PlayerRobot = require('./games/xiyoujirobot/robot')
    }
    else if (nid === 4) {
        PlayerRobot = require('./games/indianrobot/robot')
    }

    return Q.async(function* () {
        for (roomCode of roomCodes) {
            const uplimit = 6
            for (let i = 0; i < uplimit; i++) {
                yield Q.delay(500)
                const robot = PlayerRobot.createRobot(roomCode)
                robot.run()
                robot.action.on('round', function (data) {
                    util.writeLine(data, filename = './data/' + outputfile + '.csv')
                })
            }
        }
    })()

}


// function startPoolRecord(nid) {
//
//     require('./util/pomelo-cocos2d-js')
//     const Net = require('./util/net')
//     const RobotAction = require('./a777robot/robotAction')
//     const pomelo = (new PP()).pomelo
//     const net = new Net(pomelo)
//     const action = new RobotAction(net)
//
//     return Q.async(function* () {
//         yield action.connect()
//         yield net.asynEnterGame(nid)
//         while (true) {
//             const potData = yield net.asynQuery777JackPot()
//             util.writeLine([-1, -1, -1, -1, potData.jackpotFund, potData.runningPool, potData.profitPool, Date.now()])
//             yield Q.delay(1000 * 60 * 1)
//         }
//     })()
//
// }