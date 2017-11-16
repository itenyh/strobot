'use strict'

const userConfig = require('./config/user-config.json')
let totalRobot = 0
let runningGmaeName = ''

module.exports.getRobotByNid = function (nid) {

    let PlayerRobot = null
    if (nid === 1) {
        PlayerRobot = require('./games/robot')
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

module.exports.getRobotActionByNid = function (nid) {

    let Action = null
    let Memory = null
    let Rules = null

    if (nid === 1) {
        Memory = require('./games/a777robot/memory')
        Rules = require('./games/a777robot/rules')
        Action = require('./games/a777robot/robotAction')
    }
    else if (nid === 2) {
        Memory = require('./games/hambougerrobot/memory')
        Rules = require('./games/hambougerrobot/rules')
        Action = require('./games/hambougerrobot/robotAction')
    }
    else if (nid === 3) {
        Memory = require('./games/hotpotrobot/memory')
        Rules = require('./games/hotpotrobot/rules')
        Action = require('./games/hotpotrobot/robotAction')
    }
    else if (nid === 7) {
        Memory = require('./games/xiyoujirobot/memory')
        Rules = require('./games/xiyoujirobot/rules')
        Action = require('./games/xiyoujirobot/robotAction')
    }
    else if (nid === 4) {
        Memory = require('./games/indianrobot/memory')
        Rules = require('./games/indianrobot/rules')
        Action = require('./games/indianrobot/robotAction')
    }

    return new Action(new Memory(), new Rules(), nid)

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
