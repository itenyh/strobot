/**
 * Created by HJ on 2017/8/23.
 */

require('../util/pomelo-cocos2d-js')
const Q = require('q')
const gameConfig = require('../config/game-config.json')
const Memory = require('./valveRobotMemory')
const Net = require('../util/net')
const robotfactory = require('../games/robotFactory')
const ChainOperation = require('../util/chainOperation')
const EventEmitter = require('events')

function ValveRobotAction(nid) {

    const memory = new Memory()
    const pomelo = (new PP()).pomelo
    const net = new Net(pomelo)
    const event = new EventEmitter()

    this.disconnect = () => {
        net.disconnect()
    }

    this.addListener = () => {

        pomelo.on('close', function (data) {
            // if (hasConnected) {
            logger.error('【%s】管理机器人 => socket close , 原因: %s %s', nid, data.code, data.reason)
            // this.stop()
            // }
        }.bind(this))

        pomelo.on('io-error', function (data) {

            logger.error('【%s】管理机器人 => socket io-error , 原因: %s %s', nid, data.code, data.reason)
            this.stop()

        }.bind(this))

        pomelo.on('heartbeat timeout', function (data) {

            logger.error('【%s】管理机器人 => heartbeat timeout', nid)
            this.stop()

        }.bind(this))

    }

    this.on = function(eventName, data) {
        event.on(eventName, data)
    }

    this.emit = function(eventName, data) {
        event.emit(eventName, data)
    }

    this.connect = Q.async(function* () {

        yield net.asynReady({host: gameConfig.gameHost, port: gameConfig.gamePort})
        const loginData = yield net.asynLogin()
        const userLoginData = yield net.asynUserLogin(loginData.id)
        yield net.asynReady({host: userLoginData.server.host, port: userLoginData.server.port})
        yield net.asynEnter(userLoginData.uid, userLoginData.token)

    })

    this.enterGame = Q.async(function* () {

        yield net.asynEnterGame(nid)

    })

    this.detectRoomInfo = Q.async(function* () {

        while (true) {

            cancelExecutingMission()

            try {

                const roomInfoData = yield net.asynRoomsInfo(nid)
                const uplimitPerRoom = 6
                const incereaseRate = 0.1  //每次添加增长率
                const targetRate = 0.7  //目标上座率 最大为1
                const rooms = roomInfoData["infos"]
                const roomNum = rooms.length
                const capacity = roomNum * uplimitPerRoom
                let playerNum = 0
                const roomCodes = []
                for (room of rooms) {
                    playerNum += room["users"].length
                    roomCodes.push(room["roomCode"])
                }
                const occupancy = playerNum / capacity

                logger.info("【%s】管理机器人 => 总位置有 %s 个， 总上座人数 %s 个， 上座率 %s", nid, capacity, playerNum, occupancy)

                if (incereaseRate + occupancy <= targetRate) {
                    const willAddNum = Math.ceil(capacity * incereaseRate)
                    logger.info("【%s】管理机器人 => 添加新的机器人 %s 个， 添加后上座率可达 %s", nid, willAddNum, (willAddNum + playerNum) / capacity)
                    startAddRobotMission(nid, roomCodes, willAddNum)
                }
                else {
                    logger.info("【%s】管理机器人 => 不需要添加机器人", nid)
                }


            }

            catch (error) {

                logger.error('【%s】管理机器人 => detectRoomInfo error: %s', nid, error)
                this.stop()
                break

            }

            yield Q.delay(1000 * 60 * 3)

        }


    })
    
    function startAddRobotMission(nid, roomCodes, willAddNum) {

        var Random = require("random-js");
        var random = new Random(Random.engines.mt19937().autoSeed());

        memory.missionRef = ChainOperation.chain(willAddNum, 0, function* () {

            const index = random.integer(0, roomCodes.length - 1)
            const willAddRoomCode = roomCodes[index]
            logger.info("【%s】管理机器人 => 向房间 %s 添加新的机器人", nid, willAddRoomCode)
            const robot = robotfactory.createRobot(willAddRoomCode, nid)
            robot.run()
            let waitTime = (60 * 3 * 1000 / willAddNum)
            if (waitTime < 1000) { waitTime = 1000 }
            logger.info("【%s】管理机器人 => 下次添加新的机器人需等待 %ss", nid, waitTime / 1000)
            return waitTime

        }.bind(this))

    }

    function cancelExecutingMission() {

        if (memory.missionRef) {
            memory.missionRef.cancel()
            memory.missionRef = null
        }

    }

    function clear() {

        cancelExecutingMission()

    }

    this.stop = function () {

        clear()
        this.disconnect()
        logger.info("【%s】管理机器人 => stop", nid)
        this.emit('robotStop')

    }

}

module.exports = ValveRobotAction
