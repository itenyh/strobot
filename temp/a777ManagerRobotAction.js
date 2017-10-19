/**
 * Created by HJ on 2017/8/23.
 */

const Q = require('q')
const PlayerRobot = require('../a777robot/robot')
const gameConfig = require('../a777robot/config/game-config.json')

function A777ManagerRobotAction(net, memory) {

    const taskDealerManager = new TaskDealerManager()

    this.disconnect = () => {
        net.disconnect()
    }

    this.connect = Q.async(function* () {

        yield net.asynReady({host: '192.168.1.105', port: '3010'})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        yield net.asynEnter(userLoginData.uid, userLoginData.token)
        const initRoomInfo = yield net.asynEnterGame()
        memory.initialRoomInfo(initRoomInfo)

    })

    this.dealWithRoomInfoChange = function (data) {

        const result = memory.dealRoomInfoChange(data)
        const roomCode = result[result.length - 1]
        const taskDealer = taskDealerManager.getTaskDealer(roomCode)

        if (result[0]) { //新进入玩家
            logger.info('有新玩家进入房间 roomCode: %s, 现在开始尝试移除机器人', roomCode)
            const task = new RemoveRobotNewPlayerTask(taskDealer, roomCode)
            taskDealer.setTask(task)
        }
        else if (result[1]) { //空房间出现
            logger.info('有新的房间空出来 roomCode: %s, 现在开始加入机器人', roomCode)
            const task = new Task(taskDealer, roomCode)
            taskDealer.setTask(task)
        }

    }

    this.addRobotIntoNewRoom = function (data) {
        const newRoom = data['addRooms'][0]
        const roomCode = newRoom['roomCode']
        const taskDealer = taskDealerManager.getTaskDealer(roomCode)
        logger.info('有新的房间 roomCode: %s, 现在开始加入机器人', roomCode)
        const task = new Task(taskDealer, roomCode)
        taskDealer.setTask(task)
    }

    const testException = Q.async(function* () {
        yield Q.delay(5000)
        throw 1
    })

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

function RemoveRobotNewPlayerTask(taskDealer, roomCode) {

    this.fire = function () {

        Q.spawn(function* () {

            const robot = global.robotsInfo.getPoorestInRoom(roomCode)
            yield robot.stop()
            logger.info('从房间 roomCode: %s 移除了一个机器人, 任务完成', roomCode)
            taskDealer.taskFinish()

        })

    }

    this.try2Finish = function () {}

}

function Task(taskDealer, roomCode) {

    let isContinueAdding = true

    this.fire = function () {

        Q.spawn(function* () {

            const randomRobotNum = global.a777Rules.getRandomAddedRobotNum()
            logger.info('向空房间 %s 添加机器人 %s 个，任务开始！', roomCode, randomRobotNum)
            for (let i = 0;i < randomRobotNum;i++) {
                if (!isContinueAdding) { break }
                const robot = new PlayerRobot(roomCode)
                robot.run()
                const interval = global.a777Rules.getRandomAddedRobotIntervalMinuteInMill()
                yield Q.delay(interval)
            }

            logger.info('向空房间 %s 添加机器人，任务完成！', roomCode)
            taskDealer.taskFinish()

        })

    }

    this.try2Finish = function () {
        isContinueAdding = false
        logger.info('向空房间 %s 添加机器人，任务【打断】！', roomCode)
    }

}

module.exports = A777ManagerRobotAction
