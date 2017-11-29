/**
 * Created by HJ on 2017/8/23.
 */

require('../util/pomelo-cocos2d-js')
const Q = require('q')
const gameConfig = require('../config/game-config.json')
const Memory = require('./managerRobotMemory')
const Net = require('../util/net')
const robotfactory = require('../games/robotFactory')
const RobotsInfo = require('../managerRobot/robotsInfo')
global.robotsInfo = new RobotsInfo()

function ManagerRobotAction(nid) {

    const taskDealerManager = new TaskDealerManager()
    const memory = new Memory()
    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    let hasConnected = false

    this.disconnect = () => {
        net.disconnect()
    }

    this.stopAllRobots = () => {
        global.robotsInfo.stopAllRobots()
    }

    this.addListener = () => {

        pomelo.on('changeRoomInfo', function (data) {
            dealWithRoomInfoChange(data)
        })

        pomelo.on('addRoom', function (data) {
            addRobotIntoNewRoom(data)
        })

        pomelo.on('close', function (data) {
            // if (hasConnected) {
                logger.error('机器人【%s】 socket close , 原因: %s %s', 'managerRobot', data.code, data.reason)
            // }
        }.bind(this))

    }

    this.connect = Q.async(function* () {

        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        yield net.asynEnter(userLoginData.uid, userLoginData.token)
        hasConnected = true

    })

    this.enterGame = Q.async(function* () {

        const initRoomInfo = yield net.asynEnterGame(nid)
        memory.initialRoomInfo(initRoomInfo)

    })

    this.addRobotsIntoInitEmptyRooms = Q.async(function* () {

        const emptyRooms = memory.findInitEmptyRoom()
        for (roomCode of emptyRooms) {
            global.logger.info('初始化，向空房间 %s 加入机器人', roomCode)
            const taskDealer = taskDealerManager.getTaskDealer(roomCode)
            const task = new Task(taskDealer, roomCode, nid)
            taskDealer.setTask(task)
        }

    })

    const dealWithRoomInfoChange = function (data) {

        const result = memory.dealRoomInfoChange(data)
        const roomCode = result[result.length - 1]
        const taskDealer = taskDealerManager.getTaskDealer(roomCode)

        if (result[0]) { //新进入玩家
            // logger.info('有新玩家进入房间 roomCode: %s, 现在开始减少机器人生存时间', roomCode)
            // const task = new DeRobotHPTask(taskDealer, roomCode)
            // taskDealer.setTask(task)

        }
        else if (result[1]) { //空房间出现
            logger.info('有新的房间空出来 roomCode: %s, 现在开始加入机器人', roomCode)
            const task = new Task(taskDealer, roomCode, nid)
            taskDealer.setTask(task)
        }

    }

    const addRobotIntoNewRoom = function (data) {
        const newRoom = data['addRooms'][0]
        const roomCode = newRoom['roomCode']
        const taskDealer = taskDealerManager.getTaskDealer(roomCode)
        logger.info('有新的房间 roomCode: %s, 现在开始加入机器人', roomCode)
        const task = new Task(taskDealer, roomCode, nid)
        taskDealer.setTask(task)
    }


}

//每一个房间对应一个taskDealer
function TaskDealerManager() {

    const dealer = {}

    this.getTaskDealer = function (roomCode) {

        if (!dealer.hasOwnProperty(roomCode)) {
            dealer[roomCode] = new TaskDealer()
        }

        return dealer[roomCode]

    }

}

function TaskDealer() {

    let nextTask = null
    let currentTask = null

    this.setTask = function (task) {
        if (currentTask === null) {
            currentTask = task
            currentTask.fire()
        }
        else {
            nextTask = task
            currentTask.try2Finish()
        }
    }

    this.taskFinish = function () {
        currentTask = null
        if (nextTask !== null) {
            this.setTask(nextTask)
            nextTask = null
        }
    }

}

function DeRobotHPTask(taskDealer, roomCode) {

    this.fire = function () {

        Q.spawn(function* () {

            const robots = global.robotsInfo.getRobotRefsByRoomCode(roomCode)
            for (robot of robots) {

            }
            taskDealer.taskFinish()

        })

    }

    this.try2Finish = function () {}

}

function RemoveRobotNewPlayerTask(taskDealer, roomCode) {

    this.fire = function () {

        Q.spawn(function* () {

            const robot = global.robotsInfo.getPoorestInRoom(roomCode)
            yield robot.stop()
            logger.info('从房间 roomCode: %s 移除了一个机器人 %s , 任务完成', roomCode, robot.action.getId())
            taskDealer.taskFinish()

        })

    }

    this.try2Finish = function () {}

}

function Task(taskDealer, roomCode, nid) {

    let isContinueAdding = true
    var Random = require("random-js");
    var random = new Random(Random.engines.mt19937().autoSeed());

    this.getRandomAddedRobotNum = function () {
        return random.integer(2, 4)
    }

    this.getRandomAddedRobotIntervalMinuteInMill = function () {
        return random.integer(3, 5) * 60 * 1000
    }

    this.fire = function () {

        Q.spawn(function* () {

            const randomRobotNum = this.getRandomAddedRobotNum()
            logger.info('向空房间 %s 添加机器人 %s 个，任务开始！', roomCode, randomRobotNum)
            for (let i = 0;i < randomRobotNum;i++) {
                if (!isContinueAdding) { break }
                const robot = robotfactory.createRobot(roomCode, nid)
                robot.action.on('robotEnterGame', function () {
                    logger.info('机器人%s进入房间%s 事件', robot.action.getId(), roomCode)
                    global.robotsInfo.registerRef(robot.action.getUid(), robot)
                })
                robot.action.on('robotLeaveGame', function () {
                    logger.info('机器人%s离开房间%s 事件', robot.action.getId(), roomCode)
                    global.robotsInfo.removeRobot(roomCode, robot.action.getUid())
                })
                robot.run()
                const interval = this.getRandomAddedRobotIntervalMinuteInMill()
                yield Q.delay(interval)
            }

            logger.info('向空房间 %s 添加机器人，任务完成！', roomCode)
            taskDealer.taskFinish()

        }.bind(this))

    }

    this.try2Finish = function () {
        isContinueAdding = false
        logger.info('向空房间 %s 添加机器人，任务【打断】！', roomCode)
    }

}

module.exports = ManagerRobotAction
