'use strict'

const userConfig = require('./config/user-config.json')
let totalRobot = 0
let runningGmaeName = ''

module.exports.getRobotByNid = function (nid) {

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

    return PlayerRobot

}

module.exports.getGameNid = function () {

    return userConfig.game_nid

}

module.exports.getRobotNum = function () {

    return userConfig.robotNum

}

module.exports.robotLeave = function () {
    totalRobot -= 1
}

module.exports.robotEnter = function () {
    totalRobot += 1
}

module.exports.print = function () {
    logger.info('共有机器人 %s 在玩耍', totalRobot)
}
