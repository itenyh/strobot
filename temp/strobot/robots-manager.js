/**
 * Created by HJ on 2017/8/24.
 */

const Robot = require('./robot')
const userRobotConfig = require('./config/user-config.json')
const gameConfig = require('./config/game-config.json')

const maxRobotNum = gameConfig.maxRobotNum
let currentRobotNum = 0
let currentRobotIndex = 1
let allRobotFinish = null

const allRobotConfigs = []
for (var robotC of userRobotConfig) {
    for (let i = 0;i < robotC.robotNum;i++) {
        allRobotConfigs.push(robotC)
    }
}

function createEnoughRobot() {

    while (currentRobotNum < maxRobotNum && allRobotConfigs.length > 0) {
        currentRobotNum++
        const config = allRobotConfigs.pop()
        const robot = new Robot(config)
        robot.setIndex(currentRobotIndex++)
        robot.afterStop = () => {
            robotDie()
        }
        robot.run()
    }

}

function robotDie() {

    if (allRobotConfigs.length === 0) {
        if (allRobotFinish) {
            allRobotFinish()
        }
    }

    else {
        currentRobotNum--
        createEnoughRobot()
    }

}

exports.init = (resolved) => {
    allRobotFinish = resolved
    createEnoughRobot()
}